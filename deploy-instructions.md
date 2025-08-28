# DigitalOcean Deployment Instructions

## Environment Variables Setup

### Step 1: Add Environment Variables in DigitalOcean
1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Select your app: `coral-app-adar7`
3. Navigate to **Settings** → **Environment Variables**
4. Add the following environment variable:

| Key | Value | Scope |
|-----|-------|-------|
| `GOOGLE_MAPS_API_KEY` | `AIzaSyA1r8V5FSaYFvmS8FwnGxA6DwXhnHUvHUc` | Backend Component |

### Step 2: Redeploy
1. After adding the environment variable, click **Deploy**
2. Wait for deployment to complete
3. Test the autocomplete functionality

## Frontend Environment Configuration

### For Local Development:
```properties
VITE_API_URL=http://localhost:8080
```

### For Production:
```properties
VITE_API_URL=https://coral-app-adar7.ondigitalocean.app
```

## Testing the Fix

### Local Testing:
1. Backend: `cd backend && node server.js`
2. Frontend: `cd frontend && npm run dev`
3. Open: http://localhost:5173

### Production Testing:
1. Ensure environment variables are set in DigitalOcean
2. Redeploy the app
3. Test autocomplete at: https://coral-app-adar7.ondigitalocean.app

## API Endpoints that require GOOGLE_MAPS_API_KEY:
- `/api/autocomplete` - Address autocomplete suggestions
- `/api/reverse-geocode` - Convert coordinates to addresses  
- `/api/place-details` - Get detailed place information
- `/google-maps/place/:id` - Get place details by ID

## Troubleshooting:
- If autocomplete still fails, check browser developer console
- Verify environment variable is properly set in DigitalOcean
- Ensure the API key has proper permissions for Places API and Geocoding API
