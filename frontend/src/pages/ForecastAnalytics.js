import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { airQualityApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatTime } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Download } from 'lucide-react';

export default function ForecastAnalytics() {
  const [no2Data, setNo2Data] = useState([]);
  const [o3Data, setO3Data] = useState([]);
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('combined'); // 'combined', 'no2', 'o3'

  useEffect(() => {
    fetchForecastData();
  }, [hours]);

  const fetchForecastData = async () => {
    try {
      setLoading(true);
      const [no2Response, o3Response] = await Promise.all([
        airQualityApi.getNo2Forecast(hours),
        airQualityApi.getO3Forecast(hours)
      ]);

      const formattedNo2 = no2Response.data.map(point => ({
        time: formatTime(point.timestamp),
        NO2: point.value,
        confidence: point.confidence
      }));

      const formattedO3 = o3Response.data.map(point => ({
        time: formatTime(point.timestamp),
        O3: point.value,
        confidence: point.confidence
      }));

      setNo2Data(formattedNo2);
      setO3Data(formattedO3);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch forecast data');
      setLoading(false);
    }
  };

  const combinedData = no2Data.map((item, index) => ({
    time: item.time,
    NO2: item.NO2,
    O3: o3Data[index]?.O3 || 0
  }));

  const exportData = () => {
    const dataStr = JSON.stringify(combinedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `forecast-data-${hours}h.json`;
    link.click();
    toast.success('Data exported successfully');
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
        <h1 className="text-4xl sm:text-5xl font-bold font-outfit mb-2">Forecast Analytics</h1>
        <p className="text-muted-foreground text-lg">
          AI-powered hourly predictions for NO₂ and O₃ levels
        </p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass dark:glass rounded-2xl p-6 mb-6 border shadow-xl"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Forecast Period:</span>
              <Button
                variant={hours === 24 ? "default" : "outline"}
                size="sm"
                onClick={() => setHours(24)}
                data-testid="24h-toggle"
              >
                24 Hours
              </Button>
              <Button
                variant={hours === 48 ? "default" : "outline"}
                size="sm"
                onClick={() => setHours(48)}
                data-testid="48h-toggle"
              >
                48 Hours
              </Button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">View:</span>
              <Button
                variant={viewMode === 'combined' ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode('combined')}
                data-testid="combined-view"
              >
                Combined
              </Button>
              <Button
                variant={viewMode === 'no2' ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode('no2')}
                data-testid="no2-view"
              >
                NO₂ Only
              </Button>
              <Button
                variant={viewMode === 'o3' ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode('o3')}
                data-testid="o3-view"
              >
                O₃ Only
              </Button>
            </div>
          </div>

          {/* Accessible Data Actions */}
          <div className="flex items-center gap-2 flex-wrap border-t pt-4">
            <span className="text-sm font-medium text-muted-foreground">Data Actions:</span>
            
            {/* Modal to view data in table format */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="w-4 h-4" />
                  View Data Table
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-outfit">Forecast Data - {hours} Hours</DialogTitle>
                  <DialogDescription>
                    Detailed tabular view of NO₂ and O₃ forecast data with timestamps
                  </DialogDescription>
                </DialogHeader>
                
                <div className="mt-4">
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold">Time</TableHead>
                          <TableHead className="font-bold text-right">NO₂ (µg/m³)</TableHead>
                          <TableHead className="font-bold text-right">O₃ (µg/m³)</TableHead>
                          <TableHead className="font-bold text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {combinedData.map((row, index) => (
                          <TableRow key={index} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{row.time}</TableCell>
                            <TableCell className="text-right font-mono">{row.NO2.toFixed(1)}</TableCell>
                            <TableCell className="text-right font-mono">{row.O3.toFixed(1)}</TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              {(row.NO2 + row.O3).toFixed(1)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2">Summary Statistics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">NO₂ Average: </span>
                        <span className="font-mono font-bold">
                          {(combinedData.reduce((sum, d) => sum + d.NO2, 0) / combinedData.length).toFixed(1)} µg/m³
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">O₃ Average: </span>
                        <span className="font-mono font-bold">
                          {(combinedData.reduce((sum, d) => sum + d.O3, 0) / combinedData.length).toFixed(1)} µg/m³
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">NO₂ Peak: </span>
                        <span className="font-mono font-bold">
                          {Math.max(...combinedData.map(d => d.NO2)).toFixed(1)} µg/m³
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">O₃ Peak: </span>
                        <span className="font-mono font-bold">
                          {Math.max(...combinedData.map(d => d.O3)).toFixed(1)} µg/m³
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" className="gap-2" onClick={exportData}>
              <Download className="w-4 h-4" />
              Export JSON
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass dark:glass rounded-2xl p-8 border shadow-xl"
        data-testid="forecast-chart"
      >
        {viewMode === 'combined' && (
          <ResponsiveContainer width="100%" height={480}>
            <AreaChart data={combinedData} margin={{ bottom: 60, left: 10, right: 10, top: 10 }}>
              <defs>
                <linearGradient id="colorNO2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF7E00" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#FF7E00" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorO3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E400" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#00E400" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="time" 
                stroke="#94a3b8" 
                style={{ fontSize: '11px' }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval="preserveStartEnd"
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(12px)'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="NO2" 
                stroke="#FF7E00" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorNO2)" 
                name="NO₂ (µg/m³)"
              />
              <Area 
                type="monotone" 
                dataKey="O3" 
                stroke="#00E400" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorO3)" 
                name="O₃ (µg/m³)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {viewMode === 'no2' && (
          <ResponsiveContainer width="100%" height={480}>
            <LineChart data={no2Data} margin={{ bottom: 60, left: 10, right: 10, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="time" 
                stroke="#94a3b8" 
                style={{ fontSize: '11px' }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval="preserveStartEnd"
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="NO2" 
                stroke="#FF7E00" 
                strokeWidth={3}
                dot={{ fill: '#FF7E00', r: 4 }}
                activeDot={{ r: 6 }}
                name="NO₂ (µg/m³)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {viewMode === 'o3' && (
          <ResponsiveContainer width="100%" height={480}>
            <LineChart data={o3Data} margin={{ bottom: 60, left: 10, right: 10, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="time" 
                stroke="#94a3b8" 
                style={{ fontSize: '11px' }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval="preserveStartEnd"
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="O3" 
                stroke="#00E400" 
                strokeWidth={3}
                dot={{ fill: '#00E400', r: 4 }}
                activeDot={{ r: 6 }}
                name="O₃ (µg/m³)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass dark:glass rounded-2xl p-6 border shadow-xl"
          data-testid="no2-summary"
        >
          <h3 className="text-lg font-bold font-outfit mb-4">NO₂ Forecast Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Peak Value</span>
              <span className="font-mono font-bold">
                {Math.max(...no2Data.map(d => d.NO2)).toFixed(1)} µg/m³
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Average</span>
              <span className="font-mono font-bold">
                {(no2Data.reduce((sum, d) => sum + d.NO2, 0) / no2Data.length).toFixed(1)} µg/m³
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Confidence</span>
              <span className="font-mono font-bold">85%</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass dark:glass rounded-2xl p-6 border shadow-xl"
          data-testid="o3-summary"
        >
          <h3 className="text-lg font-bold font-outfit mb-4">O₃ Forecast Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Peak Value</span>
              <span className="font-mono font-bold">
                {Math.max(...o3Data.map(d => d.O3)).toFixed(1)} µg/m³
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Average</span>
              <span className="font-mono font-bold">
                {(o3Data.reduce((sum, d) => sum + d.O3, 0) / o3Data.length).toFixed(1)} µg/m³
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Confidence</span>
              <span className="font-mono font-bold">85%</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}