from pathlib import Path
import os
import json
import yaml
from dotenv import load_dotenv

# Load .env file if it exists 
load_dotenv()

CONFIG_PATH = Path(__file__).resolve().parent.parent / "config.yaml"
SAVED_CONFIGS_PATH = Path(__file__).resolve().parent.parent / "data" / "entries" / "configs"

def load_config(config_path = None):
    config_path = config_path or CONFIG_PATH
    try:
        with config_path.open("r", encoding="utf-8") as fh:
            return yaml.safe_load(fh)
    except FileNotFoundError:
        raise FileNotFoundError(f"Config not found at {config_path}")

CONFIG = load_config()

def get_provider_config(name=None):
  
    cfg = CONFIG["llm"]
    provider = name or cfg["default_provider"]
    return cfg["providers"][provider]

def load_api_key(provider_name: str) -> str:
    
    # Get the environment variable name from config
    try:
        provider_config = get_provider_config(provider_name)
        env_var_name = provider_config.get("api_key_env")

        if not env_var_name:
            raise ValueError(
                f"No 'api_key_env' in config.yaml for '{provider_name}'"
            )
    except KeyError:
        raise ValueError(f" '{provider_name}' not found in config.yaml")

    # Try to get the API key from environment
    api_key = os.environ.get(env_var_name)

    if api_key and api_key.strip():
        return api_key.strip()

    raise ValueError(
        f"Missing API key for {provider_name}.\n"
        f"Expected environment variable: {env_var_name}\n\n"
        f"To fix this:\n"
        f"  1. Create a .env file in your project root\n"
        f"  2. Add this line: {env_var_name}=your_api_key_here\n"
        f"  3. Get your API key from the provider's dashboard\n\n"
        f"Alternatively, set it as an environment variable:\n"
        f"  - Windows (PowerShell): $env:{env_var_name}='your_api_key_here'\n"
        f"  - Mac/Linux: export {env_var_name}='your_api_key_here'"
    )


def load_brand_config(saved_config_path=None):
    base = Path(saved_config_path) if saved_config_path else SAVED_CONFIGS_PATH
    files = [f for f in base.iterdir() if f.suffix == ".json"]
    if not files:
        raise FileNotFoundError(f"No saved configs found in {base}")
    latest = max(files, key=lambda f: f.stat().st_mtime)
    with latest.open("r", encoding="utf-8") as fh:
        return json.load(fh)
