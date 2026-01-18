"""
OpenAQ API Integration for Historical Air Quality Data
Fetches real NO2 and O3 data for Delhi from OpenAQ v3 API
"""
import httpx
import os
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional
import logging
from collections import defaultdict
import asyncio

logger = logging.getLogger(__name__)

OPENAQ_API_KEY = os.environ.get('OPENAQ_API_KEY', '')
OPENAQ_BASE_URL = "https://api.openaq.org/v3"

# Delhi coordinates (approximate center)
DELHI_LAT = 28.6139
DELHI_LON = 77.2090
DELHI_RADIUS = 50000  # 50km radius to cover Delhi NCR


async def fetch_delhi_sensors(parameter: str) -> List[int]:
    """
    Fetch sensor IDs for a specific parameter in Delhi
    
    Args:
        parameter: 'no2' or 'o3'
    
    Returns:
        List of sensor IDs
    """
    try:
        headers = {
            'X-API-Key': OPENAQ_API_KEY,
            'Accept': 'application/json'
        }
        
        params = {
            'country': 'IN',
            'city': 'Delhi',
            'parameter': parameter,
            'limit': 100
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{OPENAQ_BASE_URL}/locations",
                params=params,
                headers=headers
            )
            response.raise_for_status()
            data = response.json()
            
            # Extract sensor IDs from locations
            sensor_ids = []
            for location in data.get('results', []):
                for sensor in location.get('sensors', []):
                    if sensor.get('parameter', {}).get('name', '').lower() == parameter.lower():
                        sensor_ids.append(sensor['id'])
            
            logger.info(f"Found {len(sensor_ids)} {parameter} sensors in Delhi")
            return sensor_ids[:5]  # Limit to first 5 sensors to avoid too many requests
            
    except httpx.HTTPError as e:
        logger.error(f"OpenAQ API error fetching sensors for {parameter}: {e}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error fetching sensors: {e}")
        return []


async def fetch_sensor_measurements(
    sensor_id: int,
    date_from: str,
    date_to: str,
    limit: int = 10000
) -> List[Dict]:
    """
    Fetch measurements from a specific sensor
    
    Args:
        sensor_id: Sensor ID
        date_from: Start date in ISO format
        date_to: End date in ISO format
        limit: Max number of records
    
    Returns:
        List of measurement dictionaries
    """
    try:
        headers = {
            'X-API-Key': OPENAQ_API_KEY,
            'Accept': 'application/json'
        }
        
        params = {
            'datetime_from': f"{date_from}T00:00:00Z",
            'datetime_to': f"{date_to}T23:59:59Z",
            'limit': limit
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{OPENAQ_BASE_URL}/sensors/{sensor_id}/measurements",
                params=params,
                headers=headers
            )
            response.raise_for_status()
            data = response.json()
            
            results = data.get('results', [])
            logger.info(f"Fetched {len(results)} measurements from sensor {sensor_id}")
            return results
            
    except httpx.HTTPError as e:
        logger.error(f"OpenAQ API error for sensor {sensor_id}: {e}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error fetching measurements: {e}")
        return []


async def fetch_openaq_measurements(
    parameter: str,
    date_from: str,
    date_to: str
) -> List[Dict]:
    """
    Fetch measurements from OpenAQ v3 API for Delhi
    
    Args:
        parameter: 'no2' or 'o3'
        date_from: Start date in ISO format (YYYY-MM-DD)
        date_to: End date in ISO format (YYYY-MM-DD)
    
    Returns:
        List of measurement dictionaries
    """
    try:
        # First, get sensor IDs for the parameter in Delhi
        sensor_ids = await fetch_delhi_sensors(parameter)
        
        if not sensor_ids:
            logger.warning(f"No sensors found for {parameter} in Delhi")
            return []
        
        # Fetch measurements from all sensors in parallel
        all_measurements = []
        tasks = [
            fetch_sensor_measurements(sensor_id, date_from, date_to)
            for sensor_id in sensor_ids
        ]
        
        results = await asyncio.gather(*tasks)
        
        for measurements in results:
            all_measurements.extend(measurements)
        
        logger.info(f"Total {len(all_measurements)} {parameter} measurements fetched")
        return all_measurements
        
    except Exception as e:
        logger.error(f"Error fetching {parameter} measurements: {e}")
        return []


def aggregate_to_daily(measurements: List[Dict]) -> Dict[str, Dict]:
    """
    Aggregate hourly measurements to daily averages
    
    Returns:
        Dict with date as key and {'avg': float, 'max': float, 'count': int}
    """
    daily_data = defaultdict(lambda: {'values': [], 'max': 0})
    
    for m in measurements:
        try:
            # Parse datetime from v3 API format
            datetime_obj = m.get('datetime', {})
            if isinstance(datetime_obj, dict):
                dt_str = datetime_obj.get('utc', '') or datetime_obj.get('local', '')
            else:
                dt_str = str(datetime_obj)
            
            if not dt_str:
                continue
                
            dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
            date_str = dt.strftime('%Y-%m-%d')
            
            value = float(m.get('value', 0))
            if value > 0:  # Only include positive values
                daily_data[date_str]['values'].append(value)
                daily_data[date_str]['max'] = max(daily_data[date_str]['max'], value)
        except (KeyError, ValueError, TypeError) as e:
            logger.debug(f"Error parsing measurement: {e}")
            continue
    
    # Calculate averages
    result = {}
    for date, data in daily_data.items():
        if data['values']:
            result[date] = {
                'avg': sum(data['values']) / len(data['values']),
                'max': data['max'],
                'count': len(data['values'])
            }
    
    return result


def aggregate_to_weekly(daily_data: Dict[str, Dict]) -> List[Dict]:
    """
    Aggregate daily data to weekly averages
    
    Returns:
        List of dicts with week_start, week_end, avg_value, max_value
    """
    if not daily_data:
        return []
    
    # Sort dates
    sorted_dates = sorted(daily_data.keys())
    
    weekly_data = []
    current_week_start = None
    current_week_values = []
    current_week_max = 0
    
    for date_str in sorted_dates:
        date = datetime.strptime(date_str, '%Y-%m-%d')
        
        if current_week_start is None:
            current_week_start = date
        
        # Check if we've moved to a new week (7 days)
        days_diff = (date - current_week_start).days
        
        if days_diff >= 7:
            # Save current week
            if current_week_values:
                weekly_data.append({
                    'week_start': current_week_start.strftime('%Y-%m-%d'),
                    'week_end': (current_week_start + timedelta(days=6)).strftime('%Y-%m-%d'),
                    'avg': sum(current_week_values) / len(current_week_values),
                    'max': current_week_max,
                    'count': len(current_week_values)
                })
            
            # Start new week
            current_week_start = date
            current_week_values = []
            current_week_max = 0
        
        current_week_values.append(daily_data[date_str]['avg'])
        current_week_max = max(current_week_max, daily_data[date_str]['max'])
    
    # Add final week
    if current_week_values:
        weekly_data.append({
            'week_start': current_week_start.strftime('%Y-%m-%d'),
            'week_end': (current_week_start + timedelta(days=6)).strftime('%Y-%m-%d'),
            'avg': sum(current_week_values) / len(current_week_values),
            'max': current_week_max,
            'count': len(current_week_values)
        })
    
    return weekly_data


def aggregate_to_monthly(daily_data: Dict[str, Dict]) -> Dict[str, Dict]:
    """
    Aggregate daily data to monthly averages
    
    Returns:
        Dict with 'YYYY-MM' as key and aggregated data
    """
    monthly_data = defaultdict(lambda: {'values': [], 'max': 0})
    
    for date_str, data in daily_data.items():
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d')
            month_key = date.strftime('%Y-%m')
            
            monthly_data[month_key]['values'].append(data['avg'])
            monthly_data[month_key]['max'] = max(monthly_data[month_key]['max'], data['max'])
        except (ValueError, KeyError) as e:
            logger.warning(f"Error aggregating monthly data: {e}")
            continue
    
    # Calculate monthly averages
    result = {}
    for month, data in monthly_data.items():
        if data['values']:
            result[month] = {
                'avg': sum(data['values']) / len(data['values']),
                'max': data['max'],
                'count': len(data['values'])
            }
    
    return result


async def get_historical_data_monthly(months: int = 36) -> List[Dict]:
    """
    Get monthly aggregated historical data for NO2 and O3
    
    Args:
        months: Number of months to fetch (default 36)
    
    Returns:
        List of dicts with year, month, avg_no2, avg_o3, max_no2, max_o3
    """
    # Calculate date range
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=months * 30)
    
    date_from = start_date.strftime('%Y-%m-%d')
    date_to = end_date.strftime('%Y-%m-%d')
    
    logger.info(f"Fetching OpenAQ data from {date_from} to {date_to}")
    
    # Fetch NO2 and O3 data in parallel
    no2_measurements, o3_measurements = await asyncio.gather(
        fetch_openaq_measurements('no2', date_from, date_to),
        fetch_openaq_measurements('o3', date_from, date_to)
    )
    
    # If no data from OpenAQ, return empty list (will use fallback)
    if not no2_measurements and not o3_measurements:
        logger.warning("No data received from OpenAQ API")
        return []
    
    # Aggregate to daily
    no2_daily = aggregate_to_daily(no2_measurements)
    o3_daily = aggregate_to_daily(o3_measurements)
    
    # Aggregate to monthly
    no2_monthly = aggregate_to_monthly(no2_daily)
    o3_monthly = aggregate_to_monthly(o3_daily)
    
    # Combine data
    all_months = set(no2_monthly.keys()) | set(o3_monthly.keys())
    
    result = []
    for month_key in sorted(all_months):
        try:
            year, month = map(int, month_key.split('-'))
            
            no2_data = no2_monthly.get(month_key, {'avg': 0, 'max': 0})
            o3_data = o3_monthly.get(month_key, {'avg': 0, 'max': 0})
            
            result.append({
                'year': year,
                'month': month,
                'avg_no2': round(no2_data['avg'], 2),
                'avg_o3': round(o3_data['avg'], 2),
                'max_no2': round(no2_data['max'], 2),
                'max_o3': round(o3_data['max'], 2)
            })
        except (ValueError, KeyError) as e:
            logger.warning(f"Error processing month {month_key}: {e}")
            continue
    
    return result


async def get_historical_data_weekly(weeks: int = 12) -> List[Dict]:
    """
    Get weekly aggregated historical data for NO2 and O3
    
    Args:
        weeks: Number of weeks to fetch (default 12)
    
    Returns:
        List of dicts with week_start, week_end, avg_no2, avg_o3
    """
    # Calculate date range
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(weeks=weeks)
    
    date_from = start_date.strftime('%Y-%m-%d')
    date_to = end_date.strftime('%Y-%m-%d')
    
    logger.info(f"Fetching OpenAQ weekly data from {date_from} to {date_to}")
    
    # Fetch NO2 and O3 data in parallel
    no2_measurements, o3_measurements = await asyncio.gather(
        fetch_openaq_measurements('no2', date_from, date_to),
        fetch_openaq_measurements('o3', date_from, date_to)
    )
    
    if not no2_measurements and not o3_measurements:
        logger.warning("No data received from OpenAQ API")
        return []
    
    # Aggregate to daily first
    no2_daily = aggregate_to_daily(no2_measurements)
    o3_daily = aggregate_to_daily(o3_measurements)
    
    # Aggregate to weekly
    no2_weekly = aggregate_to_weekly(no2_daily)
    o3_weekly = aggregate_to_weekly(o3_daily)
    
    # Combine data
    result = []
    
    # Create a map for easier lookup
    o3_map = {w['week_start']: w for w in o3_weekly}
    
    for no2_week in no2_weekly:
        week_start = no2_week['week_start']
        o3_week = o3_map.get(week_start, {'avg': 0, 'max': 0})
        
        result.append({
            'week_start': week_start,
            'week_end': no2_week['week_end'],
            'avg_no2': round(no2_week['avg'], 2),
            'avg_o3': round(o3_week['avg'], 2),
            'max_no2': round(no2_week['max'], 2),
            'max_o3': round(o3_week['max'], 2)
        })
    
    return result


async def get_historical_data_daily(days: int = 30) -> List[Dict]:
    """
    Get daily historical data for NO2 and O3
    
    Args:
        days: Number of days to fetch (default 30)
    
    Returns:
        List of dicts with date, avg_no2, avg_o3, max_no2, max_o3
    """
    # Calculate date range
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    date_from = start_date.strftime('%Y-%m-%d')
    date_to = end_date.strftime('%Y-%m-%d')
    
    logger.info(f"Fetching OpenAQ daily data from {date_from} to {date_to}")
    
    # Fetch NO2 and O3 data in parallel
    no2_measurements, o3_measurements = await asyncio.gather(
        fetch_openaq_measurements('no2', date_from, date_to),
        fetch_openaq_measurements('o3', date_from, date_to)
    )
    
    if not no2_measurements and not o3_measurements:
        logger.warning("No data received from OpenAQ API")
        return []
    
    # Aggregate to daily
    no2_daily = aggregate_to_daily(no2_measurements)
    o3_daily = aggregate_to_daily(o3_measurements)
    
    # Combine data
    all_dates = sorted(set(no2_daily.keys()) | set(o3_daily.keys()))
    
    result = []
    for date_str in all_dates:
        no2_data = no2_daily.get(date_str, {'avg': 0, 'max': 0})
        o3_data = o3_daily.get(date_str, {'avg': 0, 'max': 0})
        
        result.append({
            'date': date_str,
            'avg_no2': round(no2_data['avg'], 2),
            'avg_o3': round(o3_data['avg'], 2),
            'max_no2': round(no2_data['max'], 2),
            'max_o3': round(o3_data['max'], 2)
        })
    
    return result
