
# tests for the config_loader module.

from pathlib import Path
from src.config_loader import load_config

import pytest


def test_load_config_loads_valid_file():

    config = load_config()
    
    assert config is not None
    assert isinstance(config, dict)
    
    assert 'providers' in config['llm']
    assert 'query_runner' in config


def test_load_config_handles_missing_file():
    config_path = Path('non_existent.yaml')
    with pytest.raises(FileNotFoundError):
        load_config(config_path)


def test_load_config_contains_expected_values():
    path = Path('tests/test_config.yaml')
    config = load_config(path)
    
    assert 'defaults' in config['llm']['providers']
    assert 'max_tokens' in config['llm']
    
    
    max_tokens = config['llm']['max_tokens']
    assert isinstance(max_tokens, int)
    assert max_tokens > 0
