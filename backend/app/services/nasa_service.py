"""
NASA POWER API Service
======================
NASA POWER API থেকে Bangladesh এর কৃষি অঞ্চলের climate/weather data নিয়ে আসে।

API Docs: https://power.larc.nasa.gov/docs/services/api/
Public access (no API key required).

আঞ্চলিক জেলা Coordinates:
  North Bengal (Rangpur & Rajshahi Divisions):
    - Bogura   : lat=24.8465, lon=89.3773 (Central agricultural hub)
    - Rangpur  : lat=25.7439, lon=89.2752 (Tista basin)
    - Dinajpur : lat=25.6279, lon=88.6338 (Northern plains)
    - Rajshahi : lat=24.3636, lon=88.6241 (High Barind tract)

  Northeastern Region (Surma Basin):
    - Sylhet   : lat=24.8949, lon=91.8687
"""

import httpx
from datetime import date, timedelta
from typing import Optional
from app.config import settings


# Bangladesh জেলা coordinate map
# North Bengal districts + Northeastern monitoring zone
DISTRICT_COORDS: dict[str, tuple[float, float]] = {
    "bogura":   (24.8465, 89.3773),
    "bogra":    (24.8465, 89.3773),  # Common spelling alias
    "rangpur":  (25.7439, 89.2752),
    "dinajpur": (25.6279, 88.6338),
    "rajshahi": (24.3636, 88.6241),
    "sylhet":   (24.8949, 91.8687),  # Northeastern Bangladesh
    "default":  (settings.NORTH_BENGAL_LAT, settings.NORTH_BENGAL_LON),
}

# Regional groupings for metadata queries
REGIONAL_DISTRICTS = {
    "North Bengal": ["bogura", "rangpur", "dinajpur", "rajshahi"],
    "Northeastern Bangladesh": ["sylhet"],
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


def find_nearest_district(lat: float, lon: float) -> tuple[str, float]:
    """Finds closest known monitoring district to given coordinates (returns district, distance_km)."""
    import math
    min_dist = float("inf")
    closest = "bogura"
    R = 6371.0  # Earth radius in km
    lat_r, lon_r = math.radians(lat), math.radians(lon)
    for dist_name, (d_lat, d_lon) in DISTRICT_COORDS.items():
        if dist_name in ("bogra", "default"):
            continue
        d_lat_r, d_lon_r = math.radians(d_lat), math.radians(d_lon)
        dlat = d_lat_r - lat_r
        dlon = d_lon_r - lon_r
        a = math.sin(dlat / 2)**2 + math.cos(lat_r) * math.cos(d_lat_r) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        dist_km = R * c
        if dist_km < min_dist:
            min_dist = dist_km
            closest = dist_name
    return closest, round(min_dist, 1)


def validate_coordinates(lat: Optional[float], lon: Optional[float]) -> tuple[Optional[float], Optional[float]]:
    """Validates latitude and longitude ranges."""
    if lat is None and lon is None:
        return None, None
    if (lat is None) != (lon is None):
        raise ValueError("Both latitude and longitude must be provided together.")
    try:
        lat_f = float(lat)
        lon_f = float(lon)
    except (ValueError, TypeError):
        raise ValueError(f"Invalid coordinate format. Lat: {lat}, Lon: {lon}")

    if not (-90.0 <= lat_f <= 90.0):
        raise ValueError(f"Latitude {lat_f} is out of bounds (-90.0 to +90.0)")
    if not (-180.0 <= lon_f <= 180.0):
        raise ValueError(f"Longitude {lon_f} is out of bounds (-180.0 to +180.0)")

    return round(lat_f, 4), round(lon_f, 4)


async def fetch_nasa_power_data(
    district: Optional[str] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    start: Optional[date] = None,
    end:   Optional[date] = None,
) -> dict:
    """
    NASA POWER API call করে daily climate data নিয়ে আসে।
    Accepts:
      - district: Bangladesh monitoring district name (bogura, rangpur, etc.)
      or
      - lat + lon: Specific geographic coordinates
    Default: গত ৩০ দিনের data (NASA processing latency 2-3 দিন সমন্বয় করে)।
    """
    if end is None:
        # NASA POWER daily agroclimate observations typically have 2-3 days latency
        end = date.today() - timedelta(days=3)
    if start is None:
        start = end - timedelta(days=30)
    elif start > end:
        start, end = end, start

    # Coordinate vs District resolution
    is_custom_coords = False
    if lat is not None and lon is not None:
        valid_lat, valid_lon = validate_coordinates(lat, lon)
        actual_lat, actual_lon = valid_lat, valid_lon
        nearest_dist, dist_km = find_nearest_district(actual_lat, actual_lon)
        norm_district = f"coords_{actual_lat:.4f}_{actual_lon:.4f}"
        display_name = f"Point ({actual_lat:.4f}°N, {actual_lon:.4f}°E) [~{dist_km} km from {nearest_dist.title()}]"
        is_custom_coords = True
    elif district:
        norm_district = district.lower().strip()
        if norm_district not in DISTRICT_COORDS:
            norm_district = "default"
        actual_lat, actual_lon = DISTRICT_COORDS.get(norm_district, DISTRICT_COORDS["default"])
        nearest_dist = norm_district.replace("bogra", "bogura")
        display_name = norm_district.replace("bogra", "bogura").title()
    else:
        norm_district = "bogura"
        actual_lat, actual_lon = DISTRICT_COORDS["bogura"]
        nearest_dist = "bogura"
        display_name = "Bogura"

    params = {
        "parameters": NASA_PARAMETERS,
        "community":  "AG",               # Agriculture community
        "longitude":  actual_lon,
        "latitude":   actual_lat,
        "start":      start.strftime("%Y%m%d"),
        "end":        end.strftime("%Y%m%d"),
        "format":     "JSON",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(settings.NASA_POWER_BASE_URL, params=params)
        response.raise_for_status()
        raw = response.json()

    props = raw["properties"]["parameter"]
    dates = list(props.get("T2M", {}).keys())

    def clean_val(val):
        if val is None or val == -999 or val == -999.0:
            return None
        return val

    records = []
    for d in dates:
        formatted_date = f"{d[:4]}-{d[4:6]}-{d[6:]}" if len(d) == 8 else d
        records.append({
            "date":           formatted_date,
            "temp_avg":       clean_val(props["T2M"].get(d)),
            "temp_max":       clean_val(props["T2M_MAX"].get(d)),
            "temp_min":       clean_val(props["T2M_MIN"].get(d)),
            "precipitation":  clean_val(props["PRECTOTCORR"].get(d)),
            "humidity":       clean_val(props["RH2M"].get(d)),
            "solar_rad":      clean_val(props["ALLSKY_SFC_SW_DWN"].get(d)),
            "wind_speed":     clean_val(props["WS2M"].get(d)),
            "soil_moisture":  clean_val(props["GWETROOT"].get(d)),
        })

    return {
        "district":         norm_district,
        "display_name":     display_name,
        "latitude":         actual_lat,
        "longitude":        actual_lon,
        "is_custom_coords": is_custom_coords,
        "nearest_district": nearest_dist.title(),
        "start_date":       str(start),
        "end_date":         str(end),
        "total_days":       len(records),
        "source":           "NASA POWER (Prediction Of Worldwide Energy Resources) Daily Agroclimatology",
        "data":             records,
    }


def get_summary_stats(data: list[dict]) -> dict:
    """Daily data থেকে summary statistics বের করে।"""
    if not data:
        return {}

    def avg(key):
        vals = [r[key] for r in data if r.get(key) is not None and r[key] != -999]
        return round(sum(vals) / len(vals), 2) if vals else None

    def total(key):
        vals = [r[key] for r in data if r.get(key) is not None and r[key] != -999]
        return round(sum(vals), 2) if vals else None

    valid_max = [r["temp_max"] for r in data if r.get("temp_max") is not None and r["temp_max"] != -999]
    valid_min = [r["temp_min"] for r in data if r.get("temp_min") is not None and r["temp_min"] != -999]

    return {
        "avg_temperature":    avg("temp_avg"),
        "max_temperature":    round(max(valid_max), 2) if valid_max else None,
        "min_temperature":    round(min(valid_min), 2) if valid_min else None,
        "total_precipitation":total("precipitation"),
        "avg_humidity":       avg("humidity"),
        "avg_solar_radiation":avg("solar_rad"),
        "avg_wind_speed":     avg("wind_speed"),
        "avg_soil_moisture":  avg("soil_moisture"),
    }
