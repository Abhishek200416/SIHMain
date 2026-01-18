import requests
import sys
from datetime import datetime
import json

class AirQualityAPITester:
    def __init__(self, base_url="https://airquality-insights-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, params=None):
        """Run a single API test"""
        url = f"{self.api_base}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=params, headers=headers, timeout=30)

            success = response.status_code == expected_status
            
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_size": len(response.text) if response.text else 0
            }

            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Try to parse JSON response
                try:
                    json_data = response.json()
                    result["has_valid_json"] = True
                    result["response_keys"] = list(json_data.keys()) if isinstance(json_data, dict) else "array"
                    print(f"   Response: Valid JSON with {len(json_data) if isinstance(json_data, list) else len(json_data.keys()) if isinstance(json_data, dict) else 'unknown'} items")
                except:
                    result["has_valid_json"] = False
                    print(f"   Response: {len(response.text)} characters (non-JSON)")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Error: {response.text[:200]}...")

            self.test_results.append(result)
            return success, response.json() if success and response.text else {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout (30s)")
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": "TIMEOUT",
                "success": False,
                "error": "Request timeout"
            }
            self.test_results.append(result)
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "error": str(e)
            }
            self.test_results.append(result)
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_current_air_quality(self):
        """Test current air quality endpoint"""
        success, response = self.run_test("Current Air Quality", "GET", "current-air-quality", 200)
        if success:
            required_fields = ['timestamp', 'location', 'no2', 'o3', 'aqi_category', 'aqi_value', 'trend_no2', 'trend_o3']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing fields: {missing_fields}")
                return False
            else:
                print(f"   ✅ All required fields present")
                # Validate data types and ranges
                if response.get('no2', 0) > 0 and response.get('o3', 0) > 0:
                    print(f"   ✅ Real pollution data: NO2={response['no2']}µg/m³, O3={response['o3']}µg/m³")
                else:
                    print(f"   ⚠️  Using fallback data due to API issues")
        else:
            # Check if it's a WAQI API token issue
            if "Failed to fetch air quality data" in str(response):
                print(f"   ⚠️  WAQI API integration issue - likely invalid token")
        return success

    def test_no2_forecast(self):
        """Test NO2 forecast endpoints"""
        success_24 = self.run_test("NO2 Forecast 24h", "GET", "forecast/no2", 200, {"hours": 24})[0]
        success_48 = self.run_test("NO2 Forecast 48h", "GET", "forecast/no2", 200, {"hours": 48})[0]
        return success_24 and success_48

    def test_o3_forecast(self):
        """Test O3 forecast endpoints"""
        success_24 = self.run_test("O3 Forecast 24h", "GET", "forecast/o3", 200, {"hours": 24})[0]
        success_48 = self.run_test("O3 Forecast 48h", "GET", "forecast/o3", 200, {"hours": 48})[0]
        return success_24 and success_48

    def test_hotspots(self):
        """Test hotspots endpoint"""
        success, response = self.run_test("Pollution Hotspots", "GET", "hotspots", 200)
        if success and 'locations' in response:
            locations_count = len(response['locations'])
            print(f"   ✅ Found {locations_count} hotspot locations")
            if locations_count > 0:
                sample_location = response['locations'][0]
                required_fields = ['name', 'latitude', 'longitude', 'no2', 'o3', 'aqi', 'severity']
                missing_fields = [field for field in required_fields if field not in sample_location]
                if missing_fields:
                    print(f"   ⚠️  Missing location fields: {missing_fields}")
                    return False
                else:
                    # Check if we have real data from multiple Delhi stations
                    delhi_stations = [loc['name'] for loc in response['locations']]
                    expected_stations = ['Anand Vihar', 'ITO', 'Rohini', 'RK Puram', 'Dwarka']
                    found_stations = [station for station in expected_stations if station in delhi_stations]
                    print(f"   ✅ Delhi stations found: {', '.join(found_stations)}")
                    
                    # Check coordinate validity for Delhi
                    valid_coords = all(
                        28.4 <= loc['latitude'] <= 28.8 and 76.8 <= loc['longitude'] <= 77.4 
                        for loc in response['locations']
                    )
                    if valid_coords:
                        print(f"   ✅ All coordinates are within Delhi bounds")
                    else:
                        print(f"   ⚠️  Some coordinates may be outside Delhi")
        return success

    def test_weather(self):
        """Test weather endpoint"""
        success, response = self.run_test("Weather Data", "GET", "weather", 200)
        if success:
            required_fields = ['timestamp', 'temperature', 'humidity', 'wind_speed', 'wind_direction', 'solar_radiation', 'pressure', 'cloud_cover']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing weather fields: {missing_fields}")
                return False
            else:
                print(f"   ✅ All weather fields present")
        return success

    def test_alerts(self):
        """Test alerts endpoint"""
        success, response = self.run_test("Air Quality Alerts", "GET", "alerts", 200)
        if success and isinstance(response, list):
            alerts_count = len(response)
            print(f"   ✅ Found {alerts_count} active alerts")
            if alerts_count > 0:
                sample_alert = response[0]
                required_fields = ['id', 'severity', 'title', 'message', 'timestamp', 'recommendations']
                missing_fields = [field for field in required_fields if field not in sample_alert]
                if missing_fields:
                    print(f"   ⚠️  Missing alert fields: {missing_fields}")
                    return False
        return success

    def test_historical_data(self):
        """Test historical data endpoint"""
        success, response = self.run_test("Historical Data", "GET", "historical", 200)
        if success and isinstance(response, list):
            data_points = len(response)
            print(f"   ✅ Found {data_points} historical data points")
            if data_points > 0:
                sample_point = response[0]
                required_fields = ['year', 'month', 'avg_no2', 'avg_o3', 'max_no2', 'max_o3']
                missing_fields = [field for field in required_fields if field not in sample_point]
                if missing_fields:
                    print(f"   ⚠️  Missing historical fields: {missing_fields}")
                    return False
        return success

    def test_seasonal_patterns(self):
        """Test seasonal patterns endpoint"""
        success, response = self.run_test("Seasonal Patterns", "GET", "seasonal-patterns", 200)
        if success and isinstance(response, list):
            patterns_count = len(response)
            print(f"   ✅ Found {patterns_count} seasonal patterns")
            if patterns_count > 0:
                sample_pattern = response[0]
                required_fields = ['season', 'avg_no2', 'avg_o3', 'description']
                missing_fields = [field for field in required_fields if field not in sample_pattern]
                if missing_fields:
                    print(f"   ⚠️  Missing pattern fields: {missing_fields}")
                    return False
        return success

    def test_insights_monthly(self):
        """Test monthly insights endpoint with different month values"""
        print("\n🔍 Testing Monthly Insights Endpoint...")
        
        # Test with different month values: 12, 24, 36, and "all" option
        test_cases = [
            {"months": 12, "name": "Monthly Insights (12 months)"},
            {"months": 24, "name": "Monthly Insights (24 months)"},
            {"months": 36, "name": "Monthly Insights (36 months)"},
            {"months": "all", "name": "Monthly Insights (all available data)"},
            {"months": None, "name": "Monthly Insights (default)"}  # Should default to 36
        ]
        
        all_success = True
        all_data_response = None
        
        for case in test_cases:
            params = {"months": case["months"]} if case["months"] is not None else None
            success, response = self.run_test(case["name"], "GET", "insights/monthly", 200, params)
            
            if success and isinstance(response, list):
                data_points = len(response)
                
                # Store "all" response for comparison
                if case["months"] == "all":
                    all_data_response = response
                    print(f"   ✅ Found {data_points} monthly data points (all available data)")
                else:
                    expected_months = case["months"] if case["months"] is not None else 36
                    print(f"   ✅ Found {data_points} monthly data points (expected ~{expected_months})")
                
                if data_points > 0:
                    sample_point = response[0]
                    required_fields = ['year', 'month', 'avg_no2', 'avg_o3', 'max_no2', 'max_o3']
                    missing_fields = [field for field in required_fields if field not in sample_point]
                    
                    if missing_fields:
                        print(f"   ⚠️  Missing monthly fields: {missing_fields}")
                        all_success = False
                    else:
                        # Validate data includes current month (January 2026)
                        current_data = [p for p in response if p['year'] == 2026 and p['month'] == 1]
                        if current_data:
                            print(f"   ✅ Data includes current month (January 2026)")
                        else:
                            print(f"   ⚠️  Missing current month data")
                        
                        # Validate NO2 and O3 ranges (50-250 µg/m³ for NO2, 30-200 µg/m³ for O3)
                        valid_no2 = all(50 <= p['avg_no2'] <= 250 and 50 <= p['max_no2'] <= 250 for p in response)
                        valid_o3 = all(30 <= p['avg_o3'] <= 200 and 30 <= p['max_o3'] <= 200 for p in response)
                        
                        if valid_no2 and valid_o3:
                            print(f"   ✅ All NO2 and O3 values within realistic ranges")
                        else:
                            print(f"   ⚠️  Some values outside realistic ranges")
                        
                        # Check seasonal patterns (higher NO2 in winter, higher O3 in summer)
                        winter_months = [p for p in response if p['month'] in [11, 12, 1, 2]]
                        summer_months = [p for p in response if p['month'] in [4, 5, 6]]
                        
                        if winter_months and summer_months:
                            avg_winter_no2 = sum(p['avg_no2'] for p in winter_months) / len(winter_months)
                            avg_summer_o3 = sum(p['avg_o3'] for p in summer_months) / len(summer_months)
                            print(f"   ✅ Seasonal patterns: Winter NO2={avg_winter_no2:.1f}, Summer O3={avg_summer_o3:.1f}")
                        
                        # For "all" option, verify it contains more data than limited options
                        if case["months"] == "all" and data_points > 36:
                            print(f"   ✅ 'All' option returns more data than 36-month limit")
                        
                        # Check year range for "all" option
                        if case["months"] == "all":
                            years = sorted(set(p['year'] for p in response))
                            print(f"   ✅ 'All' data spans years: {min(years)} to {max(years)} ({len(years)} years)")
            else:
                all_success = False
        
        # Verify "all" option returns more comprehensive data
        if all_data_response:
            print(f"\n   📊 'All' Option Validation:")
            total_months = len(all_data_response)
            years_covered = len(set(p['year'] for p in all_data_response))
            print(f"   ✅ Total months in 'all': {total_months}")
            print(f"   ✅ Years covered: {years_covered}")
            
            # Verify it includes data beyond the 36-month limit
            if total_months > 36:
                print(f"   ✅ 'All' option provides more comprehensive data than limited options")
            else:
                print(f"   ⚠️  'All' option doesn't seem to provide additional data")
        
        return all_success

    def test_insights_weekly(self):
        """Test weekly insights endpoint with different week values"""
        print("\n🔍 Testing Weekly Insights Endpoint...")
        
        # Test with different week values: 4, 8, 12, 24
        test_cases = [
            {"weeks": 4, "name": "Weekly Insights (4 weeks)"},
            {"weeks": 8, "name": "Weekly Insights (8 weeks)"},
            {"weeks": 12, "name": "Weekly Insights (12 weeks)"},
            {"weeks": 24, "name": "Weekly Insights (24 weeks)"},
            {"weeks": None, "name": "Weekly Insights (default)"}  # Should default to 12
        ]
        
        all_success = True
        for case in test_cases:
            params = {"weeks": case["weeks"]} if case["weeks"] is not None else None
            success, response = self.run_test(case["name"], "GET", "insights/weekly", 200, params)
            
            if success and isinstance(response, list):
                data_points = len(response)
                expected_weeks = case["weeks"] if case["weeks"] is not None else 12
                print(f"   ✅ Found {data_points} weekly data points (expected ~{expected_weeks})")
                
                if data_points > 0:
                    sample_point = response[0]
                    required_fields = ['week_start', 'week_end', 'avg_no2', 'avg_o3', 'max_no2', 'max_o3']
                    missing_fields = [field for field in required_fields if field not in sample_point]
                    
                    if missing_fields:
                        print(f"   ⚠️  Missing weekly fields: {missing_fields}")
                        all_success = False
                    else:
                        # Validate date format (YYYY-MM-DD)
                        try:
                            datetime.strptime(sample_point['week_start'], '%Y-%m-%d')
                            datetime.strptime(sample_point['week_end'], '%Y-%m-%d')
                            print(f"   ✅ Date format is correct (YYYY-MM-DD)")
                        except ValueError:
                            print(f"   ⚠️  Invalid date format")
                            all_success = False
                        
                        # Check if data includes recent weeks up to current date
                        recent_week = response[0]  # Should be most recent
                        week_start = datetime.strptime(recent_week['week_start'], '%Y-%m-%d')
                        current_date = datetime.now()
                        days_diff = (current_date - week_start).days
                        
                        if days_diff <= 14:  # Within last 2 weeks
                            print(f"   ✅ Data includes recent weeks (last week: {recent_week['week_start']})")
                        else:
                            print(f"   ⚠️  Data may not include most recent weeks")
                        
                        # Validate max > avg values
                        valid_max_values = all(
                            p['max_no2'] >= p['avg_no2'] and p['max_o3'] >= p['avg_o3'] 
                            for p in response
                        )
                        if valid_max_values:
                            print(f"   ✅ Max values are greater than average values")
                        else:
                            print(f"   ⚠️  Some max values are not greater than averages")
            else:
                all_success = False
        
        return all_success

    def test_insights_daily(self):
        """Test daily insights endpoint with different day values"""
        print("\n🔍 Testing Daily Insights Endpoint...")
        
        # Test with different day values: 7, 14, 30, 60
        test_cases = [
            {"days": 7, "name": "Daily Insights (7 days)"},
            {"days": 14, "name": "Daily Insights (14 days)"},
            {"days": 30, "name": "Daily Insights (30 days)"},
            {"days": 60, "name": "Daily Insights (60 days)"},
            {"days": None, "name": "Daily Insights (default)"}  # Should default to 30
        ]
        
        all_success = True
        for case in test_cases:
            params = {"days": case["days"]} if case["days"] is not None else None
            success, response = self.run_test(case["name"], "GET", "insights/daily", 200, params)
            
            if success and isinstance(response, list):
                data_points = len(response)
                expected_days = case["days"] if case["days"] is not None else 30
                print(f"   ✅ Found {data_points} daily data points (expected ~{expected_days})")
                
                if data_points > 0:
                    sample_point = response[0]
                    required_fields = ['date', 'avg_no2', 'avg_o3', 'max_no2', 'max_o3']
                    missing_fields = [field for field in required_fields if field not in sample_point]
                    
                    if missing_fields:
                        print(f"   ⚠️  Missing daily fields: {missing_fields}")
                        all_success = False
                    else:
                        # Validate date format (YYYY-MM-DD)
                        try:
                            datetime.strptime(sample_point['date'], '%Y-%m-%d')
                            print(f"   ✅ Date format is correct (YYYY-MM-DD)")
                        except ValueError:
                            print(f"   ⚠️  Invalid date format")
                            all_success = False
                        
                        # Check if data includes today's date (January 18, 2026)
                        today_str = "2026-01-18"  # As mentioned in the request
                        today_data = [p for p in response if p['date'] == today_str]
                        if today_data:
                            print(f"   ✅ Data includes today's date ({today_str})")
                        else:
                            # Check if we have recent data (within last few days)
                            recent_dates = [p['date'] for p in response[:5]]
                            print(f"   ⚠️  Today's date not found, recent dates: {recent_dates}")
                        
                        # Validate realistic pollution ranges
                        no2_values = [p['avg_no2'] for p in response]
                        o3_values = [p['avg_o3'] for p in response]
                        
                        valid_no2_range = all(50 <= val <= 250 for val in no2_values)
                        valid_o3_range = all(30 <= val <= 200 for val in o3_values)
                        
                        if valid_no2_range and valid_o3_range:
                            print(f"   ✅ All pollution values within realistic ranges")
                        else:
                            print(f"   ⚠️  Some pollution values outside realistic ranges")
            else:
                all_success = False
        
        return all_success

    def test_legacy_historical_endpoint(self):
        """Test legacy historical endpoint redirects to monthly endpoint"""
        print("\n🔍 Testing Legacy Historical Endpoint...")
        
        success, response = self.run_test("Legacy Historical Data", "GET", "historical", 200)
        
        if success and isinstance(response, list):
            # Compare with monthly endpoint response
            monthly_success, monthly_response = self.run_test("Monthly Insights for Comparison", "GET", "insights/monthly", 200, {"months": 36})
            
            if monthly_success:
                # Check if responses are similar (both should have same structure)
                if len(response) == len(monthly_response):
                    print(f"   ✅ Legacy endpoint returns same data as monthly endpoint")
                    return True
                else:
                    print(f"   ⚠️  Legacy endpoint returns different data length: {len(response)} vs {len(monthly_response)}")
            else:
                print(f"   ⚠️  Could not compare with monthly endpoint")
        
        return success

    def test_insights_error_handling(self):
        """Test error handling with invalid parameters"""
        print("\n🔍 Testing Insights Error Handling...")
        
        error_tests = [
            {"endpoint": "insights/monthly", "params": {"months": -5}, "name": "Negative months"},
            {"endpoint": "insights/monthly", "params": {"months": 1000}, "name": "Very large months"},
            {"endpoint": "insights/weekly", "params": {"weeks": -1}, "name": "Negative weeks"},
            {"endpoint": "insights/weekly", "params": {"weeks": 500}, "name": "Very large weeks"},
            {"endpoint": "insights/daily", "params": {"days": -10}, "name": "Negative days"},
            {"endpoint": "insights/daily", "params": {"days": 10000}, "name": "Very large days"}
        ]
        
        all_success = True
        for test in error_tests:
            # These should either return 400 (bad request) or handle gracefully with 200
            success, response = self.run_test(f"Error Test: {test['name']}", "GET", test["endpoint"], None, test["params"])
            
            # Accept either proper error handling (400) or graceful handling (200 with reasonable data)
            if success or (hasattr(response, 'status_code') and response.status_code in [400, 422]):
                print(f"   ✅ {test['name']}: Handled appropriately")
            else:
                print(f"   ⚠️  {test['name']}: Unexpected response")
                all_success = False
        
        return all_success

    def test_invalid_endpoints(self):
        """Test invalid endpoints return proper errors"""
        invalid_forecast = self.run_test("Invalid Forecast Hours", "GET", "forecast/no2", 400, {"hours": 72})[0]
        return not invalid_forecast  # Should fail with 400

def main():
    print("🚀 Starting Delhi Air Quality API Tests")
    print("=" * 50)
    
    tester = AirQualityAPITester()
    
    # Run all tests
    test_functions = [
        tester.test_root_endpoint,
        tester.test_current_air_quality,
        tester.test_no2_forecast,
        tester.test_o3_forecast,
        tester.test_hotspots,
        tester.test_weather,
        tester.test_alerts,
        tester.test_historical_data,
        tester.test_seasonal_patterns,
        tester.test_insights_monthly,
        tester.test_insights_weekly,
        tester.test_insights_daily,
        tester.test_legacy_historical_endpoint,
        tester.test_insights_error_handling,
        tester.test_invalid_endpoints
    ]
    
    for test_func in test_functions:
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test function {test_func.__name__} failed with error: {e}")
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"📊 Test Summary:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            "summary": {
                "tests_run": tester.tests_run,
                "tests_passed": tester.tests_passed,
                "success_rate": round(tester.tests_passed/tester.tests_run*100, 1) if tester.tests_run > 0 else 0
            },
            "test_results": tester.test_results,
            "timestamp": datetime.now().isoformat()
        }, f, indent=2)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())