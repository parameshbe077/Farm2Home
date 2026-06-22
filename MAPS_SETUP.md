# Maps setup (OpenStreetMap + Google)

Farm2Home uses a **free map display** with **Google** for search and geocoding:

| Feature | Service |
|---------|---------|
| Map display | **OpenStreetMap** + Leaflet (free) |
| Address search (checkout) | **OpenStreetMap Nominatim** (free, default) or **Google Places** (optional, needs billing) |
| Geocoding / reverse geocoding | **OpenStreetMap Nominatim** (free fallback) or **Google Geocoding API** |
| Delivery tracking map | **OpenStreetMap** (farm → delivery pin) |

## 1. Default (free — no billing)

**Works out of the box** with no Google setup:

- Address search → OpenStreetMap Nominatim (via your server)
- Map pin / locate → OpenStreetMap geocoding
- Map display → Leaflet + OpenStreetMap tiles

Restart `npm run dev` after pulling updates.

---

## 2. Optional Google setup (needs billing)

Google **requires a billing account** even for free tier. Without billing, Places autocomplete shows **!** errors.

To use Google Places instead of OSM search:

1. [Google Cloud Console](https://console.cloud.google.com/) → enable:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
2. **Link billing** (Billing → add account — ~$200/month free Maps credit)
3. Add to `client/.env`:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your-key
   VITE_USE_GOOGLE_PLACES=true
   ```
4. Add to `server/.env`:
   ```env
   GOOGLE_MAPS_API_KEY=your-key
   ```

If Google fails, the server **automatically falls back** to OpenStreetMap geocoding.

---

## 3. Google Cloud setup (optional)

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. **APIs & Services → Library** — enable **all three**:
   - **Maps JavaScript API** ← required for address search (easy to miss)
   - **Places API**
   - **Geocoding API**
4. **Billing** — link a billing account (Google gives ~$200/month free Maps credit; small stores usually stay free)
5. **APIs & Services → Credentials** — use your API key

### Restrict the API key (recommended)

Create **two keys** (best) or one key with both restrictions:

**Browser key** (client — checkout search):

- Application restriction: **HTTP referrers**
- Add: `http://localhost:5173/*`, `https://your-app.vercel.app/*`
- API restriction: **Places API** only

**Server key** (backend — geocode when pin is moved):

- Application restriction: **IP addresses** (your Render/Railway server IP) or none for local dev
- API restriction: **Geocoding API** only

## 2. Environment variables

**`client/.env`**

```env
VITE_GOOGLE_MAPS_API_KEY=your-browser-api-key
VITE_FARM_LAT=9.9252
VITE_FARM_LNG=78.1198
VITE_FARM_NAME=Farm2Home
```

Set `VITE_FARM_LAT` / `VITE_FARM_LNG` to your actual farm coordinates (right-click on Google Maps → coordinates).

**`server/.env`**

```env
GOOGLE_MAPS_API_KEY=your-server-api-key
```

Restart both client and server after changing env files.

## 3. Where maps appear

- **Checkout (cart)** — Google Places search + OSM map to pin delivery location
- **Track order** — OSM map showing farm 🌾 → delivery 📍
- **Admin orders** — same delivery route map per order

## 4. Without Google API keys

- Checkout still works with manual address fields
- Map pin + “Locate on map” need `GOOGLE_MAPS_API_KEY` on the server
- Address autocomplete needs `VITE_GOOGLE_MAPS_API_KEY` on the client

## 5. Deploy (Vercel + Render)

Add the same variables in each host’s **Environment Variables** dashboard — do not commit `.env` files.

| Host | Variables |
|------|-----------|
| Vercel (client) | All `VITE_*` including `VITE_GOOGLE_MAPS_API_KEY` |
| Render (server) | `GOOGLE_MAPS_API_KEY` |

## 6. Billing note

Google Maps Platform has a **monthly free credit**. For a small local store, usage is usually within free tier. Monitor usage in Google Cloud Console.
