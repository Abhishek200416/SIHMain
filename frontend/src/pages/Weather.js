import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { airQualityApi } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Sun, 
  Gauge, 
  Cloud,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export default function Weather() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchWeather = async () => {
    try {
      const data = await airQualityApi.getWeather();
      setWeatherData(data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch weather data');
      setLoading(false);
    }
  };

  const getWindDirection = (degrees) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const weatherCards = weatherData ? [
    {
      icon: Thermometer,
      label: 'Temperature',
      value: `${weatherData.temperature.toFixed(1)}°C`,
      impact: 'Higher temperatures increase O₃ formation through photochemical reactions.',
      trend: weatherData.temperature > 30 ? 'up' : weatherData.temperature < 15 ? 'down' : null
    },
    {
      icon: Droplets,
      label: 'Humidity',
      value: `${weatherData.humidity.toFixed(0)}%`,
      impact: 'High humidity can enhance secondary pollutant formation and visibility reduction.',
      trend: weatherData.humidity > 70 ? 'up' : weatherData.humidity < 30 ? 'down' : null
    },
    {
      icon: Wind,
      label: 'Wind Speed',
      value: `${weatherData.wind_speed.toFixed(1)} km/h`,
      subtitle: getWindDirection(weatherData.wind_direction),
      impact: 'Strong winds help disperse pollutants, while calm conditions lead to accumulation.',
      trend: weatherData.wind_speed > 15 ? 'up' : weatherData.wind_speed < 5 ? 'down' : null
    },
    {
      icon: Sun,
      label: 'Solar Radiation',
      value: `${weatherData.solar_radiation.toFixed(0)} W/m²`,
      impact: 'Intense solar radiation drives O₃ production during daylight hours.',
      trend: weatherData.solar_radiation > 600 ? 'up' : weatherData.solar_radiation < 100 ? 'down' : null
    },
    {
      icon: Gauge,
      label: 'Pressure',
      value: `${weatherData.pressure.toFixed(0)} hPa`,
      impact: 'Low pressure systems can trap pollutants near the surface.',
      trend: weatherData.pressure > 1020 ? 'up' : weatherData.pressure < 1000 ? 'down' : null
    },
    {
      icon: Cloud,
      label: 'Cloud Cover',
      value: `${weatherData.cloud_cover.toFixed(0)}%`,
      impact: 'Cloud cover affects solar radiation and temperature, influencing O₃ formation.',
      trend: weatherData.cloud_cover > 70 ? 'up' : weatherData.cloud_cover < 20 ? 'down' : null
    }
  ] : [];

  if (loading) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass dark:glass rounded-2xl p-6 h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl sm:text-5xl font-bold font-outfit mb-2">Weather & Meteorology</h1>
        <p className="text-muted-foreground text-lg">
          Current meteorological conditions and their impact on air quality
        </p>
      </motion.div>

      {/* Weather Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {weatherCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="glass dark:glass rounded-2xl p-6 border hover:border-white/30 transition-all shadow-xl"
              data-testid={`weather-card-${index}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-aqi-good to-aqi-moderate flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">{card.label}</p>
                    {card.subtitle && (
                      <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
                    )}
                  </div>
                </div>
                {card.trend && (
                  <div className={`p-1.5 rounded-lg ${
                    card.trend === 'up' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'
                  }`}>
                    {card.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                )}
              </div>
              
              <h3 className="text-3xl font-black font-mono mb-4">{card.value}</h3>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {card.impact}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Explanatory Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass dark:glass rounded-2xl p-8 mt-8 border shadow-xl"
      >
        <h2 className="text-2xl font-bold font-outfit mb-6">How Weather Affects Air Quality</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-aqi-moderate" />
              NO₂ Formation & Dispersion
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-foreground font-semibold mt-0.5">•</span>
                <span><strong className="text-foreground">Temperature Inversion:</strong> Traps NO₂ near the surface during winter mornings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-foreground font-semibold mt-0.5">•</span>
                <span><strong className="text-foreground">Wind Speed:</strong> Disperses pollutants; calm conditions worsen air quality</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-foreground font-semibold mt-0.5">•</span>
                <span><strong className="text-foreground">Humidity:</strong> Affects chemical reactions and visibility</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-aqi-good" />
              O₃ Photochemical Formation
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-foreground font-semibold mt-0.5">•</span>
                <span><strong className="text-foreground">Solar Radiation:</strong> Drives photochemical reactions that produce O₃</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-foreground font-semibold mt-0.5">•</span>
                <span><strong className="text-foreground">Temperature:</strong> Higher temps accelerate O₃ formation reactions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-foreground font-semibold mt-0.5">•</span>
                <span><strong className="text-foreground">Cloud Cover:</strong> Reduces solar radiation, lowering O₃ production</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}