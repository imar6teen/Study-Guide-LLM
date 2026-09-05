from firecrawl import Firecrawl
from firecrawl.v2.types import ScrapeData
from study_guide_llm.configs import FIRECRAWL_API_KEY

app = Firecrawl(api_key=FIRECRAWL_API_KEY)

results : ScrapeData = app.scrape(
    "https://roadmap.sh/machine-learning",
    formats=[
        "markdown"
    ],
)

print(results.markdown)