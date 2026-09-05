from firecrawl import Firecrawl
from firecrawl.v2.types import SearchData
from study_guide_llm.configs import FIRECRAWL_API_KEY
from study_guide_llm.agents.tools import SearchResult

app = Firecrawl(api_key=FIRECRAWL_API_KEY)

results : SearchData = app.search(
    query="Roadmap for AI in 2026",
    limit=2,
    sources=["web", "news"]
)

web_results : list[SearchResult] = [SearchResult(title=i.title, url=i.url, category="web") for i in results.web]
news_results : list[SearchResult] = [SearchResult(title=i.title, url=i.url, category="news") for i in results.news]

results = web_results + news_results

for i in results:
    print("Title : ", i.title)
    print("URL : ", i.url)
    print("Category : ", i.category)
    print("="*15)
