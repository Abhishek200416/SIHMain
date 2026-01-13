import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Layout from "@/components/Layout";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import ForecastAnalytics from "@/pages/ForecastAnalytics";
import HotspotMap from "@/pages/HotspotMap";
import SeasonalInsights from "@/pages/SeasonalInsights";
import Weather from "@/pages/Weather";
import Alerts from "@/pages/Alerts";
import { Toaster } from "@/components/ui/sonner";
import "@/App.css";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/forecast" element={<ForecastAnalytics />} />
            <Route path="/map" element={<HotspotMap />} />
            <Route path="/insights" element={<SeasonalInsights />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/alerts" element={<Alerts />} />
          </Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;