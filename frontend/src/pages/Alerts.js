import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { airQualityApi } from '@/lib/api';
import { toast } from 'sonner';
import { AlertTriangle, Info, AlertCircle, CheckCircle2, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    fetchAlerts();
    checkNotificationPermission();
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await airQualityApi.getAlerts();
      setAlerts(data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch alerts');
      setLoading(false);
    }
  };

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        toast.success('Notifications enabled!');
        new Notification('Delhi AQI Alerts', {
          body: 'You will now receive air quality alerts',
          icon: '/favicon.ico'
        });
      } else {
        toast.error('Notification permission denied');
      }
    } else {
      toast.error('Notifications not supported in this browser');
    }
  };

  const getSeverityConfig = (severity) => {
    const configs = {
      'info': {
        icon: Info,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30'
      },
      'warning': {
        icon: AlertCircle,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30'
      },
      'danger': {
        icon: AlertTriangle,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30'
      }
    };
    return configs[severity] || configs['info'];
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="glass dark:glass rounded-2xl p-8 h-96 animate-pulse" />
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
        <h1 className="text-4xl sm:text-5xl font-bold font-outfit mb-2">Alerts & Recommendations</h1>
        <p className="text-muted-foreground text-lg">
          Real-time pollution alerts and health guidelines
        </p>
      </motion.div>

      {/* Notification Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass dark:glass rounded-2xl p-6 mb-6 border shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {notificationsEnabled ? (
              <Bell className="w-5 h-5 text-green-500" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <h3 className="font-semibold">Browser Notifications</h3>
              <p className="text-sm text-muted-foreground">
                {notificationsEnabled 
                  ? 'You\'re receiving air quality alerts' 
                  : 'Enable notifications to get real-time alerts'}
              </p>
            </div>
          </div>
          {!notificationsEnabled && (
            <Button 
              onClick={requestNotificationPermission}
              data-testid="enable-notifications-btn"
            >
              Enable Notifications
            </Button>
          )}
        </div>
      </motion.div>

      {/* Active Alerts */}
      <div className="space-y-6">
        {alerts.map((alert, index) => {
          const config = getSeverityConfig(alert.severity);
          const Icon = config.icon;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={`glass dark:glass rounded-2xl p-6 border-2 ${config.border} shadow-xl`}
              data-testid={`alert-${index}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold font-outfit mb-1">{alert.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${config.bg} ${config.color}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-4">{alert.message}</p>
                  
                  {alert.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {alert.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-foreground mt-0.5">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* General Guidelines */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass dark:glass rounded-2xl p-8 mt-8 border shadow-xl"
      >
        <h2 className="text-2xl font-bold font-outfit mb-6">General Health Guidelines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-aqi-good" />
              Good Air Quality (0-50)
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-foreground font-semibold mt-0.5">•</span>
                <span>Ideal for all outdoor activities</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-foreground font-semibold mt-0.5">•</span>
                <span>Perfect time for exercise and sports</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-foreground font-semibold mt-0.5">•</span>
                <span>Open windows for fresh air circulation</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-aqi-moderate" />
              Moderate (101-200)
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-foreground font-semibold mt-0.5">•</span>
                <span>Sensitive groups should limit prolonged outdoor activity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-foreground font-semibold mt-0.5">•</span>
                <span>Children and elderly should take breaks during exercise</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-foreground font-semibold mt-0.5">•</span>
                <span>Consider indoor activities during peak hours</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-aqi-poor" />
              Poor (201-300)
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-foreground font-semibold mt-0.5">•</span>
                <span>Avoid prolonged outdoor exertion</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-foreground font-semibold mt-0.5">•</span>
                <span>Wear N95 masks when going outside</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-foreground font-semibold mt-0.5">•</span>
                <span>Keep windows closed, use air purifiers</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-aqi-severe" />
              Severe (401-500)
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-foreground font-semibold mt-0.5">•</span>
                <span>Stay indoors at all times</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-foreground font-semibold mt-0.5">•</span>
                <span>Use air purifiers and keep all windows closed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-foreground font-semibold mt-0.5">•</span>
                <span>Consult doctor if experiencing respiratory issues</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}