# Where to see Rwan's work

Rwan built **a separate Python (FastAPI) service** that exposes 9 AI / data
endpoints the React Native app now calls over HTTP. Her code is intentionally
**not** merged into the RN source tree — that's the right call, because:

- It runs on its own URL (locally `http://localhost:8000`, in production a
  Render URL like `https://fallahy-ai-service.onrender.com`).
- It holds the Anthropic / Azure keys server-side, never in the mobile binary.
- The mobile app just `fetch()`'s each endpoint.

Everything she wrote is now in **`services/ai-service/`** (root of the repo).

## See it running in 30 seconds

```bash
cd services/ai-service
python3.11 -m venv .venv         # already created on this machine
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --reload --port 8000
```

Then open **http://localhost:8000/docs** — Swagger UI lists every endpoint with
a "Try it out" button so you can hit them from the browser without writing any
code.

Quick sanity checks (in another terminal while the server is up):

```bash
curl http://localhost:8000/                                                # health
curl 'http://localhost:8000/api/analytics/price-ticker'                    # live ticker
curl 'http://localhost:8000/api/analytics/price-comparison?crop=بندورة'    # market vs Fallahy
curl 'http://localhost:8000/api/analytics/farmer-dashboard?farmer_id=F001' # alerts + best sellers
```

> ✅ I've already verified all of these return real JSON on this machine.
> Without API keys the service runs in **DEMO mode** with curated data; with
> keys the same endpoints call Claude / Azure for real.

## What lives in `services/ai-service/`

| File | What it does |
|---|---|
| `main.py` | FastAPI app + the 9 endpoint routes |
| `claude_chat.py` | `/api/ai/chat` — Claude with separate buyer / farmer system prompts; replies that start with `[TRANSFER]` flag the app to hand off to WhatsApp |
| `voice.py` | Azure Speech transcription + Claude-based parsing of farmer speech into a product, and buyer speech into a cart |
| `maps.py` | Haversine "nearby farmers" with optional Azure Maps travel time |
| `analytics.py` | Price comparison, price ticker, price trend, farmer dashboard with a demand-signal heuristic |
| `config.py` | Reads `ANTHROPIC_API_KEY`, `AZURE_SPEECH_KEY`, `AZURE_MAPS_KEY` from `.env` |
| `farmers.json` | 6 real Palestinian / Jordanian farmers with coordinates + product catalog |
| `prices.json` | 14-day price history for 4 crops, powers the ticker + trend chart |
| `README.md` | Her Arabic explainer |
| `API_CONTRACTS.md` | Input/output spec for every endpoint |
| `DEPLOY.md` | Step-by-step Render deploy guide |
| `render.yaml`, `Procfile`, `runtime.txt` | One-click deploy config |

## Where her work shows up inside the app

I wired five integrations on top of the contract she defined. Each one falls
back gracefully when the service isn't reachable — the app never crashes if
her server is off.

1. **Buyer home → floating "✨" button** (`components/buyer/AIHelperModal.tsx`)
   Tap it to open a Claude-powered chat in a modal. Suggestion chips for the
   first turn. Calls `POST /api/ai/chat`.

2. **Buyer home → price ticker** (`hooks/useSavings.ts` → `usePriceTicker`)
   Now prefers `GET /api/analytics/price-ticker` when the service is up so the
   up/down arrows are real day-over-day deltas from `prices.json`.

3. **Product detail → live price block** (`app/(buyer)/product/[id].tsx`)
   On open, calls `GET /api/analytics/price-comparison?crop={product.name}`.
   If a match is found, the market price, Fallahy price and "وفّرت X%" badge
   update to the live values and a small "سعر حي من خدمة التحليلات" note
   appears underneath.

4. **Farmer dashboard → metrics + smart alerts** (`hooks/useEarnings.ts` →
   `useFarmerMetrics`). When the service is up, the dashboard pulls
   `GET /api/analytics/farmer-dashboard?farmer_id=…` and surfaces her
   demand-signal alerts ("الطلب على بندورة مرتفع — السعر صاعد، فكّر تزيد الكمية.")
   plus best-sellers + estimated daily revenue.

5. **Farmer add-product → "Quick fill" button** (`app/(farmer)/add-product.tsx`)
   Calls `POST /api/voice/parse-product` with a sample Arabic phrase
   ("ضيف بندورة بلدية كيلو بثلاث شيكل…") and uses her Claude parser to fill
   name / price / quantity automatically.

Endpoints intentionally **not wired yet** (her service exposes them; we can
wire them whenever you want):
- `/api/voice/transcribe` — needs a real `expo-av` Recording flow; the client
  is ready (`voiceTranscribe` in `lib/aiService.ts`).
- `/api/voice/parse-order` — same; ready to wire into the home search mic.
- `/api/maps/nearby-farmers` — currently using Supabase + city filter; can be
  swapped to her endpoint once the buyer has device location.
- `/api/analytics/price-trend` — perfect for a chart on product detail or the
  farmer earnings screen.

## How the RN app finds her service

The URL lives in **`.env`** under `EXPO_PUBLIC_AI_SERVICE_URL`. Default is
`http://localhost:8000`. After deploying her service to Render, change just
that one line and restart Metro:

```
EXPO_PUBLIC_AI_SERVICE_URL=https://fallahy-ai-service.onrender.com
```

The typed JS client is at **`lib/aiService.ts`** — one function per endpoint
with proper TypeScript types matching `services/ai-service/API_CONTRACTS.md`.

## Deploying her service for the demo

She included everything Render needs. Follow `services/ai-service/DEPLOY.md`
end-to-end — it walks you through pushing to GitHub, connecting Render, and
pasting the API keys. Free tier; first request after 15 min idle takes ~30 s
to wake (warm it up before your demo).
