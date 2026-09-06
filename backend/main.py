from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from backend.config import (
    ALLOWED_ORIGINS,
    DATA_SOURCES,
    DEFAULT_PAGE_SIZE,
)
from backend.schemas import WeatherReportsResponse
from backend.services.weather_service import weather_service
from backend.sources.registry import SOURCE_ADAPTERS


app = FastAPI(title="National Weather Analytics API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "weather-api",
    }


@app.get("/api/sources/health")
def source_health():
    metadata = weather_service.source.get_metadata()
    healthy = weather_service.source.health_check()

    return {
        "status": "healthy" if healthy else "unavailable",
        "source": metadata,
        "healthy": healthy,
    }


@app.get("/api/config/event-types")
def get_event_types():
    from backend.config import EVENT_TYPES

    return {
        "data": EVENT_TYPES,
    }


@app.get("/api/config/trust-levels")
def get_trust_levels():
    from backend.config import TRUST_LEVELS

    return {
        "data": TRUST_LEVELS,
    }


@app.get("/api/sources")
def get_sources():
    sources = []

    for source_config in DATA_SOURCES:
        source_mode = source_config["mode"]
        source_entry = SOURCE_ADAPTERS.get(source_mode)

        if source_entry is None:
            sources.append(
                {
                    **source_config,
                    "configured": False,
                    "healthy": False,
                    "status": "configuration_error",
                }
            )
            continue

        adapter = source_entry["adapter"]

        metadata = adapter.get_metadata()
        healthy = adapter.health_check()

        if healthy:
            status = "healthy"
        elif metadata.get("configured") is False:
            status = "not_configured"
        else:
            status = "unavailable"

        sources.append(
            {
                **source_config,
                "configured": metadata.get("configured", False),
                "healthy": healthy,
                "status": status,
            }
        )

    return {
        "data": sources,
    }


@app.get(
    "/api/weather-reports",
    response_model=WeatherReportsResponse,
)
def get_weather_reports(
    page: int = Query(1, ge=1),
    pageSize: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=100),
    event_type: str | None = None,
    state: str | None = None,
):
    try:
        reports = weather_service.get_reports()

    except RuntimeError as exc:
        error_code = str(exc)

        if error_code == "SOURCE_UNAVAILABLE":
            raise HTTPException(
                status_code=503,
                detail={
                    "code": "SOURCE_UNAVAILABLE",
                    "message": "Weather data source is unavailable",
                },
            ) from exc

        raise HTTPException(
            status_code=500,
            detail={
                "code": "PROCESSING_ERROR",
                "message": "Weather data processing failed",
            },
        ) from exc

    if event_type:
        reports = [
            report
            for report in reports
            if report.get("event_type") == event_type
        ]

    if state:
        reports = [
            report
            for report in reports
            if report.get("state") == state
        ]

    total = len(reports)

    start = (page - 1) * pageSize
    end = start + pageSize

    paginated_reports = reports[start:end]

    total_pages = (total + pageSize - 1) // pageSize

    return {
        "data": paginated_reports,
        "pagination": {
            "page": page,
            "pageSize": pageSize,
            "total": total,
            "totalPages": total_pages,
        },
    }