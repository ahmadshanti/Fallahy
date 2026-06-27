import Constants from 'expo-constants';

type Extra = { replicateToken?: string };
const REPLICATE_TOKEN = ((Constants.expoConfig?.extra ?? {}) as Extra).replicateToken;

export const replicateConfigured = !!REPLICATE_TOKEN;

// Use the model-slug endpoint so we don't have to pin a version SHA.
// flux-schnell: fast, cheap, photoreal-good for trees / plants.
const MODEL_OWNER = 'black-forest-labs';
const MODEL_NAME = 'flux-schnell';

interface PredictionResponse {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string[] | string | null;
  error?: string | null;
}

function pickOutputUrl(output: PredictionResponse['output']): string | null {
  if (!output) return null;
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output.length > 0) return output[0];
  return null;
}

async function postPrediction(prompt: string): Promise<PredictionResponse> {
  if (!REPLICATE_TOKEN) throw new Error('Replicate token missing');
  const res = await fetch(
    `https://api.replicate.com/v1/models/${MODEL_OWNER}/${MODEL_NAME}/predictions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REPLICATE_TOKEN}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=30',
      },
      body: JSON.stringify({
        input: {
          prompt,
          aspect_ratio: '4:5',
          output_format: 'webp',
          num_inference_steps: 4,
          go_fast: true,
        },
      }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Replicate error ${res.status}: ${text}`);
  }
  return res.json();
}

async function getPrediction(id: string): Promise<PredictionResponse> {
  const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
    headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Replicate poll error ${res.status}`);
  return res.json();
}

export async function generateTreeImage(treeName: string, season: string): Promise<string> {
  const prompt = `A beautiful ${treeName} tree in a Palestinian orchard, ${season} season, photorealistic, soft natural light, ground-level wide shot, vibrant foliage, no people, no text, no watermark, high detail`;
  let prediction = await postPrediction(prompt);
  const start = Date.now();
  while (
    prediction.status !== 'succeeded' &&
    prediction.status !== 'failed' &&
    prediction.status !== 'canceled'
  ) {
    if (Date.now() - start > 60_000) throw new Error('Replicate timeout');
    await new Promise((r) => setTimeout(r, 1500));
    prediction = await getPrediction(prediction.id);
  }
  if (prediction.status !== 'succeeded') {
    throw new Error(prediction.error || 'Generation failed');
  }
  const url = pickOutputUrl(prediction.output);
  if (!url) throw new Error('No image URL in Replicate output');
  return url;
}
