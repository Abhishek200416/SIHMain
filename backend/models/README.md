# ML Models Directory

This directory should contain the trained ML models for air quality forecasting.

## Required Files

### NO2 Models (Pickle format - .pkl)
- `no2_model_site1.pkl`
- `no2_model_site2.pkl`
- `no2_model_site3.pkl`
- `no2_model_site4.pkl`
- `no2_model_site5.pkl`
- `no2_model_site6.pkl`
- `no2_model_site7.pkl`

### O3 Models (Keras format - .keras)
- `o3_model_site1.keras`
- `o3_model_site2.keras`
- `o3_model_site3.keras`
- `o3_model_site4.keras`
- `o3_model_site5.keras`
- `o3_model_site6.keras`
- `o3_model_site7.keras`

### O3 Scalers (Pickle format - .pkl)
- `o3_scaler_site1.pkl`
- `o3_scaler_site2.pkl`
- `o3_scaler_site3.pkl`
- `o3_scaler_site4.pkl`
- `o3_scaler_site5.pkl`
- `o3_scaler_site6.pkl`
- `o3_scaler_site7.pkl`

## How to Upload Models

1. Copy your model files from your local machine to this directory
2. Ensure file names match exactly as listed above
3. Update `/app/backend/model_config.json` if you need to change file paths
4. Set `models_enabled: true` in `model_config.json`
5. Restart the backend: `sudo supervisorctl restart backend`

## Configuration

Edit `/app/backend/model_config.json` to configure:
- Model file paths
- Default site selection
- Enable/disable ML models

## Current Status

Models are currently **DISABLED** (`models_enabled: false` in config).

Once you upload the models, set `models_enabled: true` to activate them.
