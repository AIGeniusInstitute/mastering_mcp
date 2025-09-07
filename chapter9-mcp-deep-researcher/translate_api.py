import os
from pprint import pprint

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

# Load environment variables
load_dotenv()

llm = ChatOpenAI(
    model=os.environ['Doubao_Seed_16_Flash'],
    api_key=os.environ['OPENAI_API_KEY'],
    base_url=os.environ['OPENAI_BASE_URL'],
)

def translate_text(text, target_language='zh') -> str:
    """
    Translate text to a specified language using OpenAI's GPT-3.5-turbo model.
    Args:
        text (str): The text to be translated.
        target_language (str): The target language code (e.g., 'zh' for Chinese).
    Returns:
        str: The translated text.
    """
    prompt = f"Translate the following text to {target_language}:\n\n{text}"
    response = llm.invoke(prompt)
    return response.content.strip()


if __name__ == '__main__':
    q = 'Model Context Protocol'

    # results = search_by_serpapi(q)
    results = translate_text(q)

    pprint(results)
