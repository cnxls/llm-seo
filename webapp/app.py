import asyncio
import json as json_module

from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse, StreamingResponse
from pathlib import Path
from pydantic import BaseModel
from typing import Optional

from . import data_loader
from . import run_manager
from src.queries_generator import generate_all_queries

app = FastAPI(title="LLM SEO Monitor")


class BrandsUpdate(BaseModel):
    target: dict
    competitors: list


class TemplatesUpdate(BaseModel):
    metadata: dict
    placeholders: dict
    templates: dict


class RunStart(BaseModel):
    query_ids: Optional[list] = None


class ConfigSave(BaseModel):
    name: str
    brands: dict
    templates: dict


class ConfigDelete(BaseModel):
    name: str

TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))


@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/runs")
async def get_runs():
    return data_loader.list_runs()


@app.post("/api/runs/start")
async def start_run(data: RunStart = RunStart()):
    if run_manager.active_run["running"]:
        return JSONResponse({"error": "A run is already active"}, status_code=409)
    asyncio.create_task(run_manager.execute_run(data.query_ids))
    return {"status": "started"}


@app.get("/api/runs/active")
async def active_run_stream():
    async def event_generator():
        started = False
        while True:
            state = run_manager.active_run
            data = json_module.dumps(state)
            yield f"data: {data}\n\n"
            if state["running"]:
                started = True
            if started and not state["running"]:
                break
            await asyncio.sleep(1)
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/api/runs/stop")
async def stop_run():
    if not run_manager.active_run["running"]:
        return JSONResponse({"error": "No active run"}, status_code=404)
    run_manager.active_run["cancel_requested"] = True
    return {"status": "stopping"}


@app.post("/api/queries/preview")
async def preview_queries():
    queries = generate_all_queries()
    return {"queries": queries, "total": len(queries)}


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


@app.get("/api/configs")
async def list_configs():
    return data_loader.list_configs()


@app.get("/api/configs/{name}")
async def get_config(name: str):
    config = data_loader.load_config_by_name(name)
    if not config:
        return JSONResponse({"error": "Config not found"}, status_code=404)
    return config


@app.post("/api/configs")
async def save_config(data: ConfigSave):
    data_loader.save_config(data.name, data.brands, data.templates)
    return {"status": "ok"}


@app.delete("/api/configs/{name}")
async def delete_config(name: str):
    data_loader.delete_config(name)
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("webapp.app:app", host="127.0.0.1", port=8000, reload=True)
