import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { airQualityApi } from '@/lib/api';
import { toast } from 'sonner';
import { Snowflake, Sun, CloudRain, Wind, Calendar, Clock } from 'lucide-react';

export default function SeasonalInsights() {
  const [historicalData, setHistoricalData] = useState([]);
  const [seasonalPatterns, setSeasonalPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [timeRange, setTimeRange] = useState('months'); // 'months', 'weeks', 'days'
  const [timeRangeValue, setTimeRangeValue] = useState({
    months: 36,
    weeks: 12,
    days: 30
  });

  useEffect(() => {
    fetchData();
  }, [timeRange, timeRangeValue]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let historicalPromise;
      
      if (timeRange === 'months') {
        historicalPromise = airQualityApi.getInsightsMonthly(timeRangeValue.months);
      } else if (timeRange === 'weeks') {
        historicalPromise = airQualityApi.getInsightsWeekly(timeRangeValue.weeks);
      } else {
        historicalPromise = airQualityApi.getInsightsDaily(timeRangeValue.days);
      }
      
      const [historical, seasonal] = await Promise.all([
        historicalPromise,
        airQualityApi.getSeasonalPatterns()
      ]);
      
      setHistoricalData(historical);
      setSeasonalPatterns(seasonal);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch insights data');
      setLoading(false);
    }
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Format data based on time range
  const formatChartData = () => {
    if (timeRange === 'months') {
      return historicalData
        .filter(d => d.year === selectedYear)
        .map(d => ({
          label: monthNames[d.month - 1],
          'NO₂': d.avg_no2,
          'O₃': d.avg_o3
        }));
    } else if (timeRange === 'weeks') {
      return historicalData.map(d => {
        const startDate = new Date(d.week_start);
        return {
          label: `${startDate.getMonth() + 1}/${startDate.getDate()}`,
          'NO₂': d.avg_no2,
          'O₃': d.avg_o3
        };
      }).reverse();
    } else {
      return historicalData.map(d => {
        const date = new Date(d.date);
        return {
          label: `${date.getMonth() + 1}/${date.getDate()}`,
          'NO₂': d.avg_no2,
          'O₃': d.avg_o3
        };
      }).reverse();
    }
  };

  const chartData = formatChartData();
  const availableYears = timeRange === 'months' 
    ? [...new Set(historicalData.map(d => d.year))].sort((a, b) => b - a)
    : [];

  const seasonIcons = {
    'Winter (Dec-Feb)': Snowflake,
    'Spring (Mar-May)': Wind,
    'Summer (Jun-Aug)': Sun,
    'Autumn (Sep-Nov)': CloudRain
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="glass dark:glass rounded-2xl p-8 h-96 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 overflow-x-hidden max-w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl sm:text-5xl font-bold font-outfit mb-2">Seasonal Insights</h1>
        <p className="text-muted-foreground text-lg">
          Historical trends and seasonal patterns over the past 5 years
        </p>
      </motion.div>

      {/* Year Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass dark:glass rounded-2xl p-6 mb-6 border shadow-xl"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium mr-2">Select Year:</span>
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedYear === year
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background/50 hover:bg-background/80'
              }`}
              data-testid={`year-${year}`}
            >
              {year}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Historical Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass dark:glass rounded-2xl p-8 mb-6 border shadow-xl"
        data-testid="historical-chart"
      >
        <h2 className="text-2xl font-bold font-outfit mb-6">Monthly Trends - {selectedYear}</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={yearlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} label={{ value: 'µg/m³', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px'
              }}
            />
            <Legend />
            <Bar dataKey="NO₂" fill="#FF7E00" name="NO₂ (µg/m³)" />
            <Bar dataKey="O₃" fill="#00E400" name="O₃ (µg/m³)" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Seasonal Patterns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-bold font-outfit mb-6">Seasonal Patterns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {seasonalPatterns.map((pattern, index) => {
            const Icon = seasonIcons[pattern.season] || Wind;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="glass dark:glass rounded-2xl p-6 border hover:border-white/30 transition-all shadow-xl"
                data-testid={`season-${index}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-aqi-good to-aqi-moderate flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold font-outfit mb-3">{pattern.season}</h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-background/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Avg NO₂</p>
                        <p className="text-lg font-mono font-bold">{pattern.avg_no2.toFixed(1)}</p>
                      </div>
                      <div className="bg-background/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Avg O₃</p>
                        <p className="text-lg font-mono font-bold">{pattern.avg_o3.toFixed(1)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{pattern.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Key Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass dark:glass rounded-2xl p-8 mt-6 border shadow-xl"
      >
        <h2 className="text-2xl font-bold font-outfit mb-6">Key Insights</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-aqi-poor mt-2 flex-shrink-0" />
            <p className="text-muted-foreground">
              <strong className="text-foreground">Winter NO₂ Spike:</strong> November to February consistently shows the highest NO₂ levels due to low wind speeds, temperature inversion, and increased biomass burning.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-aqi-moderate mt-2 flex-shrink-0" />
            <p className="text-muted-foreground">
              <strong className="text-foreground">Summer O₃ Peak:</strong> April to June experiences maximum O₃ formation due to high temperatures and intense solar radiation.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-aqi-good mt-2 flex-shrink-0" />
            <p className="text-muted-foreground">
              <strong className="text-foreground">Monsoon Relief:</strong> July and August generally see improved air quality due to rainfall and increased wind speeds.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-aqi-severe mt-2 flex-shrink-0" />
            <p className="text-muted-foreground">
              <strong className="text-foreground">Stubble Burning Impact:</strong> October-November shows sharp increases in pollution due to agricultural residue burning in neighboring states.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}