import logging
from typing import Optional, Tuple, Dict, Any
from openai import AsyncOpenAI, OpenAIError, RateLimitError
from anthropic import AsyncAnthropic, APIError, RateLimitError as AnthropicRateLimitError
from google import genai
from google.api_core import exceptions as google_exceptions
import asyncio as aio
from src.config_loader import get_provider_config, load_api_key

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class LLMClientError(Exception):
    pass


class APIKeyMissingError(LLMClientError):
    pass


class ProviderNotFoundError(LLMClientError):
    pass

def build_client(name: Optional[str] = None) -> Optional[Tuple[str, Any]]:
    
    provider_name = name
    
    if not provider_name:
        logger.error("No provider name provided")
        return None
    
    try:
        if provider_name == "openai":
            api_key = load_api_key("openai")
            logger.info("Building OpenAI client")
            return "openai", AsyncOpenAI(api_key=api_key)
        
        elif provider_name == "anthropic":
            api_key = load_api_key("anthropic")
            logger.info("Building Anthropic client")
            return "anthropic", AsyncAnthropic(api_key=api_key)
        
        elif provider_name == "google":
            api_key = load_api_key("google")
            logger.info("Building Google Gemini client")
            return "google", genai.Client(api_key=api_key).aio
        
        else:
            raise ProviderNotFoundError(f"Provider '{provider_name}' is not supported")
        
    except KeyError as e:
        logger.error(f"Configuration error for {provider_name}: {e}")
        raise LLMClientError(f"Invalid configuration for {provider_name}")
    except Exception as e:
        logger.error(f"Error building client for {provider_name}: {e}")
        raise


async def call_with_retry(
    func,
    max_retries: int = 3,
    initial_delay: float = 2.0,
    backoff_factor: float = 2.0
) -> Any:
    

    delay = initial_delay
    last_exception = None
    
    for attempt in range(max_retries):
        try:
            return await func()
        
        except (RateLimitError, AnthropicRateLimitError, google_exceptions.ResourceExhausted) as e:
            last_exception = e
            if attempt < max_retries - 1:
                logger.warning(
                    f"Rate limit hit (attempt {attempt + 1}/{max_retries}). "
                    f"Retrying in {delay:.1f}s..."
                )
                await aio.sleep(delay)
                delay *= backoff_factor
            else:
                logger.error(f"Rate limit exceeded after {max_retries} attempts")
        
        except Exception as e:
            logger.error(f"Unexpected error: {type(e).__name__}: {e}")
            raise
    
    raise last_exception


async def ask_openai(client: AsyncOpenAI, question: str, model: str) -> Dict[str, Any]:
    async def _call():
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": question}
            ],
            max_tokens=get_provider_config("openai").get("max_tokens", 512),
            temperature=get_provider_config("openai").get("temperature", 0.7)
        )
        return response
    
    try:
        logger.info(f"Calling OpenAI with model: {model}")
        response = await call_with_retry(_call)
        
        result = {
            "text": response.choices[0].message.content,
            "model": response.model,
            "tokens": {
                "input": response.usage.prompt_tokens,
                "output": response.usage.completion_tokens,
                "total": response.usage.total_tokens
            }
        }
        logger.info(f"OpenAI response received ({result['tokens']['total']} tokens)")
        return result
    
    except OpenAIError as e:
        logger.error(f"OpenAI API error: {e}")
        raise
    except Exception as e:
        logger.error(f"Error calling OpenAI: {e}")
        raise


async def ask_anthropic(client: AsyncAnthropic, question: str, model: str) -> Dict[str, Any]:
    
    async def _call():
        response = await client.messages.create(
            model=model,
            max_tokens=get_provider_config("anthropic").get("max_tokens", 512),
            messages=[
                {
                    "role": "user",
                    "content": question
                }
            ]
        )
        return response
    
    try:
        logger.info(f"Calling Anthropic with model: {model}")
        response =  await call_with_retry(_call)
        
        result = {
            "text": response.content[0].text,
            "model": response.model,
            "tokens": {
                "input": response.usage.input_tokens,
                "output": response.usage.output_tokens,
                "total": response.usage.input_tokens + response.usage.output_tokens
            }
        }
        logger.info(f"Anthropic response received ({result['tokens']['total']} tokens)")
        return result
    
    except APIError as e:
        logger.error(f"Anthropic API error: {e}")
        raise
    except Exception as e:
        logger.error(f"Error calling Anthropic: {e}")
        raise


async def ask_google(client: genai.Client, question: str, model: str) -> Dict[str, Any]:
    
    async def _call():
        response = await client.models.generate_content(
            model=model,
            contents=question
        )
        return response
    
    try:
        logger.info(f"Calling Google Gemini with model: {model}")
        response = await call_with_retry(_call)
        
        result = {
            "text": response.text,
            "model": model,
            "tokens": {
                "input": getattr(response.usage_metadata, 'prompt_token_count', 0),
                "output": getattr(response.usage_metadata, 'candidates_token_count', 0),
                "total": getattr(response.usage_metadata, 'total_token_count', 0)
            }
        }
        logger.info(f"Google response received ({result['tokens']['total']} tokens)")
        return result
    
    except google_exceptions.GoogleAPIError as e:
        logger.error(f"Google API error: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error calling Google: {e}")
        raise

async def ask_provider(provider_name: str, question: str) -> Optional[Dict[str, Any]]:
    
    try:
        built = build_client(provider_name)
        
        if not built:
            logger.error(f"Failed to build {provider_name}")
            return None
        
        provider_key, client = built
        model = get_provider_config(provider_key)["model"]
        
        if provider_key == "openai":
            return await ask_openai(client, question, model)
        elif provider_key == "anthropic":
            return await ask_anthropic(client, question, model)
        elif provider_key == "google":
            return await ask_google(client, question, model)
    
    except Exception as e:
        logger.error(f"Error asking {provider_name}: {e}")
        return None


async def ask_all_providers(question: str) -> Dict[str, Optional[Dict[str, Any]]]:
    

    responses = await aio.gather(
    ask_provider("openai", question),
    ask_provider("anthropic", question),
    ask_provider("google", question)
    )

    

    return {
    "openai": responses[0],
    "anthropic": responses[1],
    "google": responses[2]
    }
