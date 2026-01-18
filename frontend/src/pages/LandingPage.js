import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Activity, TrendingUp, Map, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import Footer from '@/components/Footer';

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      icon: Activity,
      title: 'Real-Time Monitoring',
      description: 'Live NO₂ and O₃ levels updated continuously for Delhi NCR'
    },
    {
      icon: TrendingUp,
      title: 'AI-Powered Forecasts',
      description: '24-48 hour predictions with 85%+ accuracy using machine learning'
    },
    {
      icon: Map,
      title: 'Pollution Hotspots',
      description: 'Interactive maps showing area-wise air quality across Delhi'
    },
    {
      icon: Shield,
      title: 'Health Recommendations',
      description: 'Personalized alerts and safety guidelines based on current AQI'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Theme Toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed top-6 right-6 z-50"
      >
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full glass dark:glass border-white/20"
          data-testid="landing-theme-toggle"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </motion.div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-aqi-good/10 via-background to-aqi-moderate/10" />
        
        {/* Animated Glows */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 100, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-aqi-good/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -100, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-aqi-moderate/20 rounded-full blur-3xl"
        />

        {/* Floating Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              y: [0, -30, 0],
              x: [0, i % 2 === 0 ? 20 : -20, 0],
            }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              delay: i * 0.5
            }}
            className="absolute w-2 h-2 bg-primary/50 rounded-full blur-sm"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`
            }}
          />
        ))}

        <div className="relative container mx-auto px-4 lg:px-8 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="inline-block mb-6 px-4 py-2 rounded-full glass dark:glass border border-white/20"
            >
              <p className="text-sm font-medium">Real-Time Air Quality Intelligence</p>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black font-outfit tracking-tight mb-6"
            >
              Breathe Aware,
              <br />
              <motion.span
                initial={{ backgroundPosition: "0% 50%" }}
                animate={{ backgroundPosition: "100% 50%" }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-aqi-good via-aqi-moderate to-aqi-good bg-[length:200%_auto]"
              >
                Live Better
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              Advanced pollution forecasting and spatial intelligence for Delhi. 
              Monitor NO₂ & O₃ levels, predict air quality trends, and make informed decisions.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/dashboard">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    className="gap-2 px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all relative overflow-hidden group"
                    data-testid="open-dashboard-btn"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-aqi-good to-aqi-moderate opacity-0 group-hover:opacity-20"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    Open Dashboard
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </motion.div>
              </Link>
              <Link to="/map">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 px-8 py-6 text-lg rounded-full"
                    data-testid="view-hotspots-btn"
                  >
                    <Map className="w-5 h-5" />
                    View Hotspots
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.h2
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-bold font-outfit mb-4"
            >
              Why Delhi AQI?
            </motion.h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive air quality monitoring powered by satellite data and AI forecasting
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="glass dark:glass rounded-2xl p-6 border hover:border-primary/50 transition-all shadow-xl relative overflow-hidden group"
                  data-testid={`feature-card-${index}`}
                >
                  {/* Hover gradient effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-aqi-good/10 to-aqi-moderate/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={false}
                  />
                  
                  <div className="relative z-10">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-aqi-good to-aqi-moderate flex items-center justify-center mb-4 shadow-lg"
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold font-outfit mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>

                  {/* Floating particle effect on hover */}
                  <motion.div
                    className="absolute -top-2 -right-2 w-8 h-8 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0, 0.5, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass dark:glass rounded-3xl p-12 lg:p-16 text-center border shadow-2xl"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-outfit mb-6">
              Start Monitoring Air Quality Today
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get instant access to real-time pollution data, forecasts, and personalized health recommendations.
            </p>
            <Link to="/dashboard">
              <Button
                size="lg"
                className="gap-2 px-10 py-6 text-lg font-semibold rounded-full"
                data-testid="get-started-btn"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}