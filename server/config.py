import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    db_path: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "run_page",
        "data.db",
    )
    api_key: str = "dev-key-change-me"
    default_user_id: str = "default"

    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    qwen_api_key: str = ""
    qwen_base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"

    tier1_model: str = "deepseek-chat"
    tier2_model: str = "deepseek-reasoner"
    tier3_model: str = "qwen-max"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
