import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const airQualityApi = {
  getCurrentAirQuality: async () => {
    const response = await axios.get(`${API}/current-air-quality`);
    return response.data;
  },

  getNo2Forecast: async (hours = 24) => {
    const response = await axios.get(`${API}/forecast/no2?hours=${hours}`);
    return response.data;
  },

  getO3Forecast: async (hours = 24) => {
    const response = await axios.get(`${API}/forecast/o3?hours=${hours}`);
    return response.data;
  },

  getHotspots: async () => {
    const response = await axios.get(`${API}/hotspots`);
    return response.data;
  },

  getWeather: async () => {
    const response = await axios.get(`${API}/weather`);
    return response.data;
  },

  getAlerts: async () => {
    const response = await axios.get(`${API}/alerts`);
    return response.data;
  },

  getHistoricalData: async () => {
    const response = await axios.get(`${API}/historical`);
    return response.data;
  },

  getInsightsMonthly: async (months = 36) => {
    const response = await axios.get(`${API}/insights/monthly?months=${months}`);
    return response.data;
  },

  getInsightsWeekly: async (weeks = 12) => {
    const response = await axios.get(`${API}/insights/weekly?weeks=${weeks}`);
    return response.data;
  },

  getInsightsDaily: async (days = 30) => {
    const response = await axios.get(`${API}/insights/daily?days=${days}`);
    return response.data;
  },

  getSeasonalPatterns: async () => {
    const response = await axios.get(`${API}/seasonal-patterns`);
    return response.data;
  }
};