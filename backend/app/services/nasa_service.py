"""
NASA POWER API Service
======================
NASA POWER API থেকে North Bengal এর climate/weather data নিয়ে আসে।

API Docs: https://power.larc.nasa.gov/docs/services/api/
কোনো API key লাগে না (public access)।

North Bengal জেলা coordinates:
  - Rangpur   : lat=25.7439, lon=89.2752
  - Rajshahi  : lat=24.3636, lon=88.6241
  - Dinajpur  : lat=25.6279, lon=88.6338
  - Bogura    : lat=24.8465, lon=89.3773
  - Sylhet    : lat=24.8949, lon=91.8687
"""

import httpx
from datetime import date, timedelta
from typing import Optional
from app.config import settings


# North Bengal জেলা coordinate map
DISTRICT_COORDS: dict[str, tuple[float, float]] = {
    "rangpur":  (25.7439, 89.2752),
    "rajshahi": (24.3636, 88.6241),
    "dinajpur": (25.6279, 88.6338),
    "bogura":   (24.8465, 89.3773),
    "sylhet":   (24.8949, 91.8687),
    "default":  (settings.NORTH_BENGAL_LAT, settings.NORTH_BENGAL_LON),
}

# আমরা যে parameters নেবো NASA থেকে
NASA_PARAMETERS = ",".join([
    "T2M",        # 2-meter temperature (°C)
    "T2M_MAX",    # Max temp
    "T2M_MIN",    # Min temp
    "PRECTOTCORR",# Precipitation (mm/day)
    "RH2M",       # Relative humidity (%)
    "ALLSKY_SFC_SW_DWN",  # Solar radiation (kWh/m²/day)
    "WS2M",       # Wind speed (m/s)
    "GWETROOT",   # Root zone wetness (0–1)
])


async def fetch_nasa_power_data(
    district: str = "default",
    start: Optional[date] = None,
    end:   Optional[date] = None,
) -> dict:
    """
    NASA POWER API call করে daily climate data নিয়ে আসে।
    Default: গত ৩০ দিনের data।
    """
    if end is None:
        end = date.today() - timedelta(days=1)   # আজকের data আসে না, তাই -1
    if start is None:
        start = end - timedelta(days=30)

    lat, lon = DISTRICT_COORDS.get(district.lower(), DISTRICT_COORDS["default"])

    params = {
        "parameters": NASA_PARAMETERS,
        "community":  "AG",               # Agriculture community
        "longitude":  lon,
        "latitude":   lat,
        "start":      start.strftime("%Y%m%d"),
        "end":        end.strftime("%Y%m%d"),
        "format":     "JSON",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(settings.NASA_POWER_BASE_URL, params=params)
        response.raise_for_status()
        raw = response.json()

    # NASA response থেকে শুধু দরকারি data বের করি
    props = raw["properties"]["parameter"]
    dates = list(props["T2M"].keys())

    records = []
    for d in dates:
        records.append({
            "date":           d,
            "temp_avg":       props["T2M"].get(d),
            "temp_max":       props["T2M_MAX"].get(d),
            "temp_min":       props["T2M_MIN"].get(d),
            "precipitation":  props["PRECTOTCORR"].get(d),
            "humidity":       props["RH2M"].get(d),
            "solar_rad":      props["ALLSKY_SFC_SW_DWN"].get(d),
            "wind_speed":     props["WS2M"].get(d),
            "soil_moisture":  props["GWETROOT"].get(d),
        })

    return {
        "district":   district,
        "latitude":   lat,
        "longitude":  lon,
        "start_date": str(start),
        "end_date":   str(end),
        "total_days": len(records),
        "data":       records,
    }


def get_summary_stats(data: list[dict]) -> dict:
    """Daily data থেকে summary statistics বের করে।"""
    if not data:
        return {}

    def avg(key):
        vals = [r[key] for r in data if r[key] is not None and r[key] != -999]
        return round(sum(vals) / len(vals), 2) if vals else None

    def total(key):
        vals = [r[key] for r in data if r[key] is not None and r[key] != -999]
        return round(sum(vals), 2) if vals else None

    return {
        "avg_temperature":    avg("temp_avg"),
        "max_temperature":    max((r["temp_max"] for r in data if r["temp_max"] and r["temp_max"] != -999), default=None),
        "min_temperature":    min((r["temp_min"] for r in data if r["temp_min"] and r["temp_min"] != -999), default=None),
        "total_precipitation":total("precipitation"),
        "avg_humidity":       avg("humidity"),
        "avg_solar_radiation":avg("solar_rad"),
        "avg_wind_speed":     avg("wind_speed"),
        "avg_soil_moisture":  avg("soil_moisture"),
    }
