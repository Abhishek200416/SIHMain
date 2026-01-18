import requests
import sys
from datetime import datetime
import json

class AirQualityAPITester:
    def __init__(self, base_url="https://breathesafe-delhi.preview.emergentagent.com"):
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