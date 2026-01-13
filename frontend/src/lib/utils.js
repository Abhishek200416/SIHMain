import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const getAQIColor = (category) => {
  const colors = {
    'Good': { bg: 'bg-aqi-good', text: 'text-aqi-good', neon: 'text-aqi-goodNeon' },
    'Satisfactory': { bg: 'bg-aqi-satisfactory', text: 'text-aqi-satisfactory', neon: 'text-aqi-satisfactoryNeon' },
    'Moderate': { bg: 'bg-aqi-moderate', text: 'text-aqi-moderate', neon: 'text-aqi-moderateNeon' },
    'Poor': { bg: 'bg-aqi-poor', text: 'text-aqi-poor', neon: 'text-aqi-poorNeon' },
    'Very Poor': { bg: 'bg-aqi-veryPoor', text: 'text-aqi-veryPoor', neon: 'text-aqi-veryPoorNeon' },
    'Severe': { bg: 'bg-aqi-severe', text: 'text-aqi-severe', neon: 'text-aqi-severeNeon' }
  };
  return colors[category] || colors['Good'];
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'short', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  });
};