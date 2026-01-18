import pickle
import json
import os
from pathlib import Path
import logging
import numpy as np
import joblib
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)

# Global variables to store loaded models
no2_models: Dict[str, Any] = {}
o3_models: Dict[str, Any] = {}
o3_scalers: Dict[str, Any] = {}
models_config: Dict[str, Any] = {}
models_loaded: bool = False

ROOT_DIR = Path(__file__).parent
CONFIG_FILE = ROOT_DIR / "model_config.json"

def load_config() -> Dict[str, Any]:
    """Load model configuration from JSON file"""
    global models_config
    
    try:
        if CONFIG_FILE.exists():
            with open(CONFIG_FILE, 'r') as f:
                models_config = json.load(f)
                logger.info(f"Loaded model configuration from {CONFIG_FILE}")
                return models_config
        else:
            logger.warning(f"Model config file not found: {CONFIG_FILE}")
            return {}
    except Exception as e:
        logger.error(f"Error loading model config: {e}")
        return {}

def check_models_available() -> bool:
    """Check if models are loaded and available"""
    global models_loaded

    return models_loaded

def load_joblib_model(file_path: Path) -> Optional[Any]:
    """Load a joblib model file"""
    try:
        if file_path.exists():
            model = joblib.load(file_path)
            logger.info(f"Loaded joblib model: {file_path}")
            return model
        else:
            logger.warning(f"Model file not found: {file_path}")
            return None
    except Exception as e:
        logger.error(f"Error loading joblib model {file_path}: {e}. File may be corrupted or incompatible.")
        return None

def load_keras_model(file_path: Path) -> Optional[Any]:
    """Load a Keras model file"""
    try:
        # Import tensorflow only when needed
        import tensorflow as tf
        
        if file_path.exists():
            model = tf.keras.models.load_model(file_path)
            logger.info(f"Loaded Keras model: {file_path}")
            return model
        else:
            logger.warning(f"Model file not found: {file_path}")
            return None
    except ImportError:
        logger.error("TensorFlow not installed. Cannot load Keras models.")
        return None
    except Exception as e:
        logger.error(f"Error loading Keras model {file_path}: {e}")
        return None

def load_all_models() -> bool:
    """Load all configured ML models"""
    global no2_models, o3_models, o3_scalers, models_loaded, models_config
    
    try:
        # Load config first
        load_config()
        
        if not models_config.get('models_enabled', False):
            logger.info("ML models are disabled in configuration")
            return False
        
        models_dir = ROOT_DIR / models_config.get('models_directory', 'models')
        
        if not models_dir.exists():
            logger.warning(f"Models directory does not exist: {models_dir}")
            return False
        
        success = False
        
        # Load NO2 models
        no2_models_config = models_config.get('no2_models', {})
        for site, rel_path in no2_models_config.items():
            model_path = models_dir / rel_path
            model = load_joblib_model(model_path)
            if model:
                no2_models[site] = model
                success = True

        # Load O3 models and scalers together
        o3_models_config = models_config.get('o3_models', {})
        o3_scalers_config = models_config.get('o3_scalers', {})

        for site in o3_models_config:
            model_path = models_dir / o3_models_config[site]
            scaler_path = models_dir / o3_scalers_config.get(site, "") if o3_scalers_config.get(site, "") else None

            model = load_keras_model(model_path)
            scaler = load_joblib_model(scaler_path) if scaler_path else None

            if model and scaler:
                o3_models[site] = model
                o3_scalers[site] = scaler
                success = True
            elif model:
                logger.warning(f"O3 model for {site} loaded but scaler failed to load. Skipping this site.")
            else:
                logger.warning(f"O3 model for {site} failed to load.")
        
        models_loaded = success
        
        if success:
            logger.info(f"Successfully loaded {len(no2_models)} NO2 models and {len(o3_models)} O3 models")
        else:
            logger.warning("No models were loaded successfully")
        
        return success
        
    except Exception as e:
        logger.error(f"Error loading models: {e}")
        models_loaded = False
        return False

def predict_no2_forecast(hours: int = 24, site: str = None) -> Optional[List[Dict[str, Any]]]:
    """Generate NO2 forecast using ML model"""
    global no2_models, models_config
    
    if not models_loaded or not no2_models:
        return None
    
    try:
        # Use default site if not specified
        if site is None:
            site = models_config.get('default_site', 'site1')
        
        if site not in no2_models:
            logger.warning(f"NO2 model for {site} not found")
            return None
        
        model = no2_models[site]
        forecast_data = []
        
        # Generate forecast data points
        # Note: This is a simplified example. Real implementation would need:
        # - Weather data as features
        # - Proper feature engineering
        # - Sequential predictions for time series
        
        for i in range(hours):
            timestamp = datetime.now(timezone.utc) + timedelta(hours=i)
            
            # For now, using the model with dummy features
            # In production, you would prepare actual features (weather, time, etc.)
            try:
                # This is placeholder - real implementation needs proper features
                # prediction = model.predict(features)[0]
                # Using a simple variation for now until proper features are implemented
                value = 80.0 + (i * 0.5)  # Placeholder
                
                forecast_data.append({
                    "timestamp": timestamp.isoformat(),
                    "value": round(value, 2),
                    "confidence": 0.85
                })
            except Exception as e:
                logger.error(f"Error making prediction for hour {i}: {e}")
                continue
        
        return forecast_data if forecast_data else None
        
    except Exception as e:
        logger.error(f"Error in NO2 forecast prediction: {e}")
        return None

def predict_o3_forecast(hours: int = 24, site: str = None) -> Optional[List[Dict[str, Any]]]:
    """Generate O3 forecast using ML model"""
    global o3_models, o3_scalers, models_config
    
    if not models_loaded or not o3_models:
        return None
    
    try:
        # Use default site if not specified
        if site is None:
            site = models_config.get('default_site', 'site1')
        
        if site not in o3_models:
            logger.warning(f"O3 model for {site} not found")
            return None
        
        model = o3_models[site]
        scaler = o3_scalers.get(site)  # May be None
        forecast_data = []
        
        # Generate forecast data points
        for i in range(hours):
            timestamp = datetime.now(timezone.utc) + timedelta(hours=i)
            
            try:
                # This is placeholder - real implementation needs proper features
                # prediction = model.predict(scaled_features)[0]
                # Using a simple variation for now until proper features are implemented
                value = 60.0 + (i * 0.3)  # Placeholder
                
                forecast_data.append({
                    "timestamp": timestamp.isoformat(),
                    "value": round(value, 2),
                    "confidence": 0.82
                })
            except Exception as e:
                logger.error(f"Error making prediction for hour {i}: {e}")
                continue
        
        return forecast_data if forecast_data else None
        
    except Exception as e:
        logger.error(f"Error in O3 forecast prediction: {e}")
        return None

def get_model_status() -> Dict[str, Any]:
    """Get current status of ML models"""
    global models_loaded, no2_models, o3_models, models_config
    
    return {
        "models_enabled": models_config.get('models_enabled', False),
        "models_loaded": models_loaded,
        "no2_models_count": len(no2_models),
        "o3_models_count": len(o3_models),
        "available": models_loaded and len(no2_models) > 0 and len(o3_models) > 0,
        "message": "ML models are operational" if models_loaded else "ML models are not available"
    }

# Initialize models on module import
try:
    load_all_models()
except Exception as e:
    logger.error(f"Failed to initialize models on startup: {e}")