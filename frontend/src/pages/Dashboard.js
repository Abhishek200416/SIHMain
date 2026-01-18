import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus, Wind, Eye, RefreshCw, Sparkles } from 'lucide-react';
import { airQualityApi } from '@/lib/api';
import { getAQIColor, formatTime } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [currentData, setCurrentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCurrentData();
    const interval = setInterval(fetchCurrentData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchCurrentData = async (manual = false) => {
    try {
      if (manual) setRefreshing(true);
      const data = await airQualityApi.getCurrentAirQuality();
      setCurrentData(data);
      setLoading(false);
      if (manual) {
        toast.success('Data refreshed successfully');
        setRefreshing(false);
      }
    } catch (error) {
      toast.error('Failed to fetch air quality data');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === 'rising') return <ArrowUp className="w-5 h-5" />;
    if (trend === 'falling') return <ArrowDown className="w-5 h-5" />;
    return <Minus className="w-5 h-5" />;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="glass dark:glass rounded-2xl p-6 h-48"
            >
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-foreground/10 rounded w-3/4"></div>
                <div className="h-8 bg-foreground/10 rounded w-1/2"></div>
                <div className="h-4 bg-foreground/10 rounded w-full"></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentData) return null;

  const aqiColor = getAQIColor(currentData.aqi_category);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 relative">
      {/* Animated Background Elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-aqi-good/20 to-aqi-moderate/20 rounded-full blur-3xl pointer-events-none"
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl sm:text-5xl font-bold font-outfit">Live Dashboard</h1>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-6 h-6 text-aqi-good" />
            </motion.div>
          </div>
          <p className="text-muted-foreground text-lg">
            Real-time air quality data for Delhi • Updated {formatTime(currentData.timestamp)}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchCurrentData(true)}
          disabled={refreshing}
          className="rounded-full"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </motion.div>

      {/* Bento Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {/* Main AQI Card - Spans 2 columns */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="md:col-span-2 md:row-span-2 glass dark:glass rounded-2xl p-8 border hover:border-primary/50 transition-all shadow-xl relative overflow-hidden"
          data-testid="aqi-main-card"
        >
          {/* Animated glow effect */}
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className={`absolute -top-20 -right-20 w-40 h-40 ${aqiColor.bg} rounded-full blur-3xl`}
          />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">Air Quality Index</p>
                <motion.h2
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="text-6xl font-black font-mono"
                >
                  {currentData.aqi_value}
                </motion.h2>
              </div>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.8 }}
                className={`px-4 py-2 rounded-full ${aqiColor.bg} bg-opacity-20 border-2 ${aqiColor.bg}`}
              >
                <p className={`text-sm font-bold ${aqiColor.text}`}>{currentData.aqi_category}</p>
              </motion.div>
            </div>
            
            <div className="space-y-4">
              <motion.div
                whileHover={{ x: 5 }}
                className="flex items-center justify-between p-4 rounded-xl bg-background/50 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <Wind className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">Location</span>
                </div>
                <span className="font-mono text-sm">{currentData.location}</span>
              </motion.div>
              
              <motion.div
                whileHover={{ x: 5 }}
                className="flex items-center justify-between p-4 rounded-xl bg-background/50 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">Status</span>
                </div>
                <span className={`font-semibold ${aqiColor.text}`}>
                  {currentData.aqi_category}
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* NO2 Card */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="glass dark:glass rounded-2xl p-6 border hover:border-primary/50 transition-all shadow-xl relative overflow-hidden"
          data-testid="no2-card"
        >
          <motion.div
            animate={{
              opacity: [0.05, 0.15, 0.05]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"
          />
          
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Nitrogen Dioxide</p>
            <div className="flex items-baseline gap-2 mb-4">
              <motion.h3
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl font-black font-mono"
              >
                {currentData.no2.toFixed(1)}
              </motion.h3>
              <span className="text-sm text-muted-foreground">µg/m³</span>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2"
            >
              <div className={`p-1.5 rounded-lg ${currentData.trend_no2 === 'rising' ? 'bg-red-500/20 text-red-500' : currentData.trend_no2 === 'falling' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
                {getTrendIcon(currentData.trend_no2)}
              </div>
              <span className="text-sm capitalize">{currentData.trend_no2}</span>
            </motion.div>
          </div>
        </motion.div>

        {/* O3 Card */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="glass dark:glass rounded-2xl p-6 border hover:border-primary/50 transition-all shadow-xl relative overflow-hidden"
          data-testid="o3-card"
        >
          <motion.div
            animate={{
              opacity: [0.05, 0.15, 0.05]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-cyan-500/20"
          />
          
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Ozone</p>
            <div className="flex items-baseline gap-2 mb-4">
              <motion.h3
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl font-black font-mono"
              >
                {currentData.o3.toFixed(1)}
              </motion.h3>
              <span className="text-sm text-muted-foreground">µg/m³</span>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2"
            >
              <div className={`p-1.5 rounded-lg ${currentData.trend_o3 === 'rising' ? 'bg-red-500/20 text-red-500' : currentData.trend_o3 === 'falling' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
                {getTrendIcon(currentData.trend_o3)}
              </div>
              <span className="text-sm capitalize">{currentData.trend_o3}</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          className="md:col-span-2 glass dark:glass rounded-2xl p-6 border hover:border-primary/50 transition-all shadow-xl"
          data-testid="info-card"
        >
          <h3 className="text-lg font-bold font-outfit mb-4 flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              💚
            </motion.div>
            Health Impact
          </h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-muted-foreground leading-relaxed"
          >
            {currentData.aqi_category === 'Good' && 'Air quality is satisfactory. Ideal for outdoor activities.'}
            {currentData.aqi_category === 'Satisfactory' && 'Air quality is acceptable. Enjoy outdoor activities.'}
            {currentData.aqi_category === 'Moderate' && 'Sensitive individuals should limit prolonged outdoor exposure.'}
            {currentData.aqi_category === 'Poor' && 'Everyone should reduce prolonged outdoor exertion. Wear masks.'}
            {currentData.aqi_category === 'Very Poor' && 'Avoid outdoor activities. Use N95 masks if necessary to go outside.'}
            {currentData.aqi_category === 'Severe' && 'Health alert: Stay indoors. Use air purifiers and keep windows closed.'}
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}