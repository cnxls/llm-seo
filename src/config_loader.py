from pathlib import Path
import os
import yaml
from dotenv import load_dotenv

load_dotenv()

CONFIG_PATH = Path(__file__).resolve().parent.parent / "config.yaml"

def load_config():
    with CONFIG_PATH.open("r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)

CONFIG = load_config()

def get_provider_config(name=None):
    cfg = CONFIG["llm"]
    provider = name or cfg["default_provider"]
    return cfg["providers"][provider]
