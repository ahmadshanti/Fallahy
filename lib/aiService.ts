/**
 * Typed client for Rwan's Python AI & Data Service (services/ai-service).
 * Contract: services/ai-service/API_CONTRACTS.md
 *
 * Each call has a `available` companion that returns `false` until the user
 * sets EXPO_PUBLIC_AI_SERVICE_URL (or the default local server is reachable).
 * Every endpoint already has a DEMO fallback on the server side, so calling
 * any of these is safe even without Anthropic / Azure keys configured.
 */
import Constants from 'expo-constants';

type Extra = { aiServiceUrl?: string };
const BASE_URL = ((Constants.expoConfig?.extra ?? {}) as Extra).aiServiceUrl || '';

export const aiServiceConfigured = !!BASE_URL;
export const aiServiceUrl = BASE_URL;

async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE_URL) throw new Error('AI service not configured');
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AI service ${path} → ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

// ---------- 1) AI CHAT ----------
export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}
export interface ChatReply {
  reply: string;
  transfer_to_whatsapp: boolean;
  source: 'claude' | 'demo';
}
export function aiChat(
  message: string,
  role: 'buyer' | 'farmer' = 'buyer',
  history?: ChatTurn[]
): Promise<ChatReply> {
  return getJSON<ChatReply>('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, role, history: history ?? null }),
  });
}

// ---------- 2) VOICE TRANSCRIBE ----------
export interface TranscribeResult {
  text: string;
  source: 'azure' | 'demo';
}
export async function voiceTranscribe(fileUri: string, mimeType = 'audio/wav'): Promise<TranscribeResult> {
  if (!BASE_URL) throw new Error('AI service not configured');
  const form = new FormData();
  // React Native FormData append() with a uri/name/type triple.
  form.append('audio', { uri: fileUri, name: 'audio.wav', type: mimeType } as any);
  const res = await fetch(`${BASE_URL}/api/voice/transcribe`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`transcribe ${res.status}`);
  return res.json();
}

// ---------- 3) VOICE PARSE PRODUCT ----------
export interface ParsedProduct {
  name: string | null;
  price: number | null;
  quantity: number | null;
  unit: string;
  source: 'claude' | 'demo';
}
export function voiceParseProduct(text: string): Promise<ParsedProduct> {
  return getJSON<ParsedProduct>('/api/voice/parse-product', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

// ---------- 4) VOICE PARSE ORDER ----------
export interface ParsedOrder {
  items: { name: string; quantity: number; unit: string }[];
  source: 'claude' | 'demo';
}
export function voiceParseOrder(text: string): Promise<ParsedOrder> {
  return getJSON<ParsedOrder>('/api/voice/parse-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

// ---------- 5) NEARBY FARMERS ----------
export interface ApiFarmer {
  id: string;
  name: string;
  city: string;
  region: string;
  rating: number;
  verified: boolean;
  lat: number;
  lng: number;
  distance_km: number;
  travel_minutes: number | null;
  products: Array<{
    id: string;
    name: string;
    name_en: string;
    market_price: number;
    fallahy_price: number;
    unit: string;
    quantity: number;
    harvest_date: string;
    organic: boolean;
    category: string;
  }>;
}
export interface NearbyFarmersResponse {
  count: number;
  source: 'azure' | 'haversine';
  farmers: ApiFarmer[];
}
export function nearbyFarmers(
  lat: number,
  lng: number,
  radiusKm = 50,
  crop?: string
): Promise<NearbyFarmersResponse> {
  const qs = new URLSearchParams({ lat: String(lat), lng: String(lng), radius_km: String(radiusKm) });
  if (crop) qs.set('crop', crop);
  return getJSON<NearbyFarmersResponse>(`/api/maps/nearby-farmers?${qs.toString()}`);
}

// ---------- 6) PRICE COMPARISON ----------
export interface PriceComparison {
  crop: string;
  name_en: string;
  market_price: number;
  fallahy_price: number;
  saved: number;
  savings_percent: number;
  message: string;
  error?: string;
}
export function priceComparison(crop: string): Promise<PriceComparison> {
  return getJSON<PriceComparison>(`/api/analytics/price-comparison?crop=${encodeURIComponent(crop)}`);
}

// ---------- 7) PRICE TICKER ----------
export interface PriceTickerItem {
  crop: string;
  name_en: string;
  price: number;
  change: number;
  direction: 'up' | 'down' | 'flat';
}
export function priceTicker(): Promise<{ ticker: PriceTickerItem[] }> {
  return getJSON('/api/analytics/price-ticker');
}

// ---------- 8) PRICE TREND ----------
export interface PriceTrend {
  crop: string;
  name_en: string;
  series: { date: string; market: number; fallahy: number }[];
  avg_market: number;
  avg_fallahy: number;
}
export function priceTrend(crop: string): Promise<PriceTrend> {
  return getJSON<PriceTrend>(`/api/analytics/price-trend?crop=${encodeURIComponent(crop)}`);
}

// ---------- 9) FARMER DASHBOARD ----------
export interface FarmerDashboard {
  farmer_id: string;
  farmer_name: string;
  rating: number;
  product_count: number;
  estimated_daily_revenue: number;
  best_sellers: { name: string; fallahy_price: number }[];
  smart_alerts: string[];
  error?: string;
}
export function farmerDashboard(farmerId: string): Promise<FarmerDashboard> {
  return getJSON<FarmerDashboard>(`/api/analytics/farmer-dashboard?farmer_id=${encodeURIComponent(farmerId)}`);
}
