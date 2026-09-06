from pydantic import BaseModel


class WeatherReport(BaseModel):
    id: str
    text: str
    timestamp: str
    source: str
    event_type: str
    trust_score: str

    latitude: float | None = None
    longitude: float | None = None
    state: str | None = None
    has_photo: bool = False

    station_id: str | None = None
    observation_type: str | None = None
    value: float | str | None = None
    unit: str | None = None


class Pagination(BaseModel):
    page: int
    pageSize: int
    total: int
    totalPages: int


class WeatherReportsResponse(BaseModel):
    data: list[WeatherReport]
    pagination: Pagination