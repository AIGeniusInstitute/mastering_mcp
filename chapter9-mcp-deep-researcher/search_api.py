import json
import os
from pprint import pprint

import serpapi
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

serpapi_key = os.environ["SERPAPI_KEY"]
tavily_api_key = os.environ["TAVILY_API_KEY"]


def search_by_tavily(q) -> str:
    import requests

    url = "https://api.tavily.com/search"

    payload = {
        "query": q,
        "topic": "general",
        "search_depth": "basic",
        "chunks_per_source": 3,
        "max_results": 2,
        "time_range": None,
        "days": 7,
        "include_answer": True,
        "include_raw_content": True,
        "include_images": False,
        "include_image_descriptions": False,
        "include_domains": [],
        "exclude_domains": [],
        "country": None
    }
    headers = {
        "Authorization": f"Bearer {tavily_api_key}",
        "Content-Type": "application/json"
    }

    response = requests.request("POST", url, json=payload, headers=headers)

    print(response.text)

    return response.text


def search_by_serpapi(q) -> str:
    params = {
        # 搜索关键词
        "q": q,
        # 获取API密钥（需在SerpAPI官网: https://serpapi.com/ 注册免费账号）
        "api_key": serpapi_key,
        "engine": "google",  # 搜索引擎类型
        "google_domain": "google.com",
        "gl": "us",
        "hl": "en"
    }

    # https://serpapi.com/search-api
    results = serpapi.search(params)

    pprint(results)

    return json.dumps(results.data)


if __name__ == '__main__':
    q = 'Model Context Protocol'

    # results = search_by_serpapi(q)
    results = search_by_tavily(q)

    pprint(results)
