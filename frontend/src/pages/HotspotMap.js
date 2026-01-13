import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { airQualityApi } from '@/lib/api';
import { getAQIColor } from '@/lib/utils';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';

function MapUpdater({ locations }) {
  const map = useMap();
  
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = locations.map(loc => [loc.latitude, loc.longitude]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);
  
  return null;
}

export default function HotspotMap() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const mapRef = useRef(null);

  useEffect(() => {
    fetchHotspots();
  }, []);

  const fetchHotspots = async () => {
    try {
      const data = await airQualityApi.getHotspots();
      setLocations(data.locations);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch hotspot data');
      setLoading(false);
    }
  };

  const getMarkerColor = (severity) => {
    const colors = {
      'good': '#00E400',
      'satisfactory': '#FFFF00',
      'moderate': '#FF7E00',
      'poor': '#FF0000',
      'very poor': '#8F3F97',
      'severe': '#7E0023'
    };
    return colors[severity.toLowerCase()] || '#00E400';
  };

  const filteredLocations = selectedSeverity === 'all' 
    ? locations 
    : locations.filter(loc => loc.severity.toLowerCase() === selectedSeverity.toLowerCase());

  const severityOptions = [
    { value: 'all', label: 'All Locations', count: locations.length },
    { value: 'good', label: 'Good', count: locations.filter(l => l.severity.toLowerCase() === 'good').length },
    { value: 'satisfactory', label: 'Satisfactory', count: locations.filter(l => l.severity.toLowerCase() === 'satisfactory').length },
    { value: 'moderate', label: 'Moderate', count: locations.filter(l => l.severity.toLowerCase() === 'moderate').length },
    { value: 'poor', label: 'Poor', count: locations.filter(l => l.severity.toLowerCase() === 'poor').length }
  ];

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
        <h1 className="text-4xl sm:text-5xl font-bold font-outfit mb-2">Pollution Hotspots</h1>
        <p className="text-muted-foreground text-lg">
          Area-wise air quality across Delhi NCR
        </p>
      </motion.div>

      {/* Filter Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass dark:glass rounded-2xl p-6 mb-6 border shadow-xl"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium mr-2">Filter by severity:</span>
          {severityOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedSeverity(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedSeverity === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background/50 hover:bg-background/80'
              }`}
              data-testid={`filter-${option.value}`}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>
      </motion.div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass dark:glass rounded-2xl p-4 border shadow-xl overflow-hidden"
        data-testid="hotspot-map"
      >
        <div className="h-[600px] rounded-xl overflow-hidden">
          <MapContainer
            center={[28.6139, 77.2090]}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <MapUpdater locations={filteredLocations} />
            {filteredLocations.map((location, index) => (
              <CircleMarker
                key={index}
                center={[location.latitude, location.longitude]}
                radius={12}
                fillColor={getMarkerColor(location.severity)}
                color={getMarkerColor(location.severity)}
                weight={2}
                opacity={0.8}
                fillOpacity={0.6}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-bold text-lg mb-2">{location.name}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">AQI:</span>
                        <span className="font-bold">{location.aqi}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">NO₂:</span>
                        <span className="font-mono">{location.no2.toFixed(1)} µg/m³</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">O₃:</span>
                        <span className="font-mono">{location.o3.toFixed(1)} µg/m³</span>
                      </div>
                      <div className="mt-2 pt-2 border-t">
                        <span 
                          className="inline-block px-2 py-1 rounded text-xs font-semibold"
                          style={{ 
                            backgroundColor: getMarkerColor(location.severity) + '20',
                            color: getMarkerColor(location.severity)
                          }}
                        >
                          {location.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass dark:glass rounded-2xl p-6 mt-6 border shadow-xl"
      >
        <h3 className="text-lg font-bold font-outfit mb-4">AQI Scale</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { label: 'Good', color: '#00E400', range: '0-50' },
            { label: 'Satisfactory', color: '#FFFF00', range: '51-100' },
            { label: 'Moderate', color: '#FF7E00', range: '101-200' },
            { label: 'Poor', color: '#FF0000', range: '201-300' },
            { label: 'Very Poor', color: '#8F3F97', range: '301-400' },
            { label: 'Severe', color: '#7E0023', range: '401-500' }
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.range}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}