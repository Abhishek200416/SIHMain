# Example: How to Configure ML Models

## Current Configuration (Default)

The models are configured to be in the `/app/backend/models/` directory.

```json
{
  "models_directory": "/app/backend/models",
  "no2_models": {
    "site1": "models/no2_model_site1.pkl",
    "site2": "models/no2_model_site2.pkl",
    ...
  },
  "o3_models": {
    "site1": "models/o3_model_site1.keras",
    ...
  },
  "o3_scalers": {
    "site1": "models/o3_scaler_site1.pkl",
    ...
  },
  "default_site": "site1",
  "models_enabled": false
}
```

## To Enable Models

1. **Upload all 21 model files** to `/app/backend/models/`:
   - 7 NO₂ models (.pkl files)
   - 7 O₃ models (.keras files)
   - 7 O₃ scalers (.pkl files)

2. **Edit `/app/backend/model_config.json`:**
   ```bash
   nano /app/backend/model_config.json
   ```
   
   Change this line:
   ```json
   "models_enabled": false
   ```
   
   To:
   ```json
   "models_enabled": true
   ```
   
   Save the file (Ctrl+O, Enter, Ctrl+X)

3. **Restart the backend:**
   ```bash
   sudo supervisorctl restart backend
   ```

4. **Verify models are loaded:**
   ```bash
   curl http://localhost:8001/api/models/status
   ```
   
   You should see:
   ```json
   {
     "models_enabled": true,
     "models_loaded": true,
     "no2_models_count": 7,
     "o3_models_count": 7,
     "available": true,
     "message": "ML models are operational"
   }
   ```

## Alternative: Custom Paths

If you want to store models in a different location, update the paths in `model_config.json`:

```json
{
  "models_directory": "/custom/path/to/models",
  "no2_models": {
    "site1": "/custom/path/to/models/no2_model_site1.pkl",
    ...
  },
  ...
}
```

Then restart backend.

## Selecting Default Site

The `default_site` setting determines which site's model is used for predictions:

```json
"default_site": "site1"
```

Valid values: `"site1"`, `"site2"`, `"site3"`, `"site4"`, `"site5"`, `"site6"`, `"site7"`

Change this value and restart backend to use a different site's models.
