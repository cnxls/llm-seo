from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse
from pathlib import Path
from pydantic import BaseModel

from . import data_loader

app = FastAPI(title="LLM SEO Monitor")


class BrandsUpdate(BaseModel):
    target: dict
    competitors: list


class TemplatesUpdate(BaseModel):
    metadata: dict
    placeholders: dict
    templates: dict

TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))


@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/runs")
async def get_runs():
    return data_loader.list_runs()


@app.get("/api/brands")
async def get_brands():
    return data_loader.load_brands()


@app.get("/api/runs/{run_name}/summary")
async def get_summary(run_name: str):
    analysis = data_loader.load_analysis(run_name)
    brands = data_loader.load_brands()
    return {
        "brands": data_loader.get_brand_summary(analysis),
        "target": brands["target"],
        "total_results": len(analysis),
    }


@app.get("/api/runs/{run_name}/providers")
async def get_providers(run_name: str):
    analysis = data_loader.load_analysis(run_name)
    brands = data_loader.load_brands()
    return data_loader.get_provider_comparison(analysis, brands["target"])


@app.get("/api/runs/{run_name}/categories")
async def get_categories(run_name: str):
    analysis = data_loader.load_analysis(run_name)
    brands = data_loader.load_brands()
    return data_loader.get_category_performance(analysis, brands["target"])


@app.get("/api/runs/{run_name}/queries")
async def get_queries(run_name: str):
    analysis = data_loader.load_analysis(run_name)
    return data_loader.get_query_details(analysis, run_name)


@app.get("/api/brands/raw")
async def get_brands_raw():
    return data_loader.load_brands_raw()


@app.put("/api/brands")
async def update_brands(data: BrandsUpdate):
    data_loader.save_brands(data.model_dump())
    return {"status": "ok"}


@app.get("/api/templates")
async def get_templates():
    return data_loader.load_templates()


@app.put("/api/templates")
async def update_templates(data: TemplatesUpdate):
    data_loader.save_templates(data.model_dump())
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("webapp.app:app", host="127.0.0.1", port=8000, reload=True)
