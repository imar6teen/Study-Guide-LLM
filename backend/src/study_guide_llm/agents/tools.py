from langchain.tools import tool
from firecrawl import Firecrawl
from firecrawl.types import SearchData, ScrapeData
from study_guide_llm.configs import FIRECRAWL_API_KEY
from pydantic import BaseModel
from typing import Literal
import time

class SearchResult(BaseModel):
    title : str
    url : str
    category : Literal["web", "news"]

app = Firecrawl(api_key=FIRECRAWL_API_KEY)

@tool(description="Web search tool.")
def web_search(query: str, limit : int = 5) -> list[SearchResult]:
    """Web search tool."""
    results : SearchData = app.search(
        query=query,
        limit=limit,
        sources=["web", "news"]
    )

    web_results : list[SearchResult] = [SearchResult(title=i.title, url=i.url, category="web") for i in results.web]
    news_results : list[SearchResult] = [SearchResult(title=i.title, url=i.url, category="news") for i in results.news]

    return web_results + news_results

SCRAPE_CACHE : dict[str, dict] = {
    "https://roadmap.sh/machine-learning" : {
        "markdown" : "blabla",
        "timestamp" : 93939
    }
} 

@tool(description="Web scraper tool.")
def web_scraper(url : str) -> str:
    """Web scraper tool."""

    try:
        if url in SCRAPE_CACHE and (time.time() - SCRAPE_CACHE[url]["timestamp"]) < 60 * 60 * 24:
            print(f"CACHE HIT : {url}")
            return SCRAPE_CACHE[url]["markdown"]

        print(f"CACHE MISS : {url}")
        result : ScrapeData = app.scrape(
            url=url,
            formats=[
                "markdown",
            ]
        )
        
        SCRAPE_CACHE[url] = {
            "markdown" : result,
            "timestamp" : time.time()
        }
        return result.markdown
    except Exception as e:
        return "Some error occured while scraping the url. choose another URL instead."
