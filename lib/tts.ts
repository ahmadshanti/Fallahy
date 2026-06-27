import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { File, Paths } from 'expo-file-system';
import Constants from 'expo-constants';
import { Language } from './i18n';

type Extra = {
  azureSpeechKey?: string;
  azureSpeechRegion?: string;
  elevenLabsKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const AZURE_KEY = extra.azureSpeechKey;
const AZURE_REGION = extra.azureSpeechRegion;
const ELEVEN_KEY = extra.elevenLabsKey;

export type TTSProvider = 'azure' | 'elevenlabs' | 'native';

const VOICE_BY_LANG: Record<Language, string> = {
  ar: 'ar-PS-LailaNeural',
  en: 'en-US-JennyNeural',
};

const NATIVE_LANG_TAG: Record<Language, string> = {
  ar: 'ar-SA',
  en: 'en-US',
};

function buildSSML(text: string, language: Language): string {
  const voice = VOICE_BY_LANG[language];
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  const xmlLang = language === 'ar' ? 'ar-PS' : 'en-US';
  return `<speak version='1.0' xml:lang='${xmlLang}'><voice name='${voice}'>${escaped}</voice></speak>`;
}

async function fetchAzureAudio(text: string, language: Language): Promise<string> {
  if (!AZURE_KEY || !AZURE_REGION) {
    throw new Error('Azure Speech credentials missing.');
  }
  const url = `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_KEY,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'fallahy-app',
    },
    body: buildSSML(text, language),
  });
  if (!res.ok) throw new Error(`Azure TTS failed: ${res.status}`);
  const buffer = await res.arrayBuffer();
  return saveAudioToCache(buffer);
}

async function fetchElevenLabsAudio(text: string, _language: Language): Promise<string> {
  if (!ELEVEN_KEY) throw new Error('ElevenLabs credentials missing.');
  const voiceId = '21m00Tcm4TlvDq8ikWAM';
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVEN_KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.5 },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs TTS failed: ${res.status}`);
  const buffer = await res.arrayBuffer();
  return saveAudioToCache(buffer);
}

async function saveAudioToCache(buffer: ArrayBuffer): Promise<string> {
  const filename = `tts-${Date.now()}.mp3`;
  const file = new File(Paths.cache, filename);
  file.write(new Uint8Array(buffer));
  return file.uri;
}

/**
 * Returns the provider that's actually usable right now.
 * Falls back to the OS native TTS via expo-speech when no cloud keys are set,
 * so the Listen button always works for the demo.
 */
export function resolveProvider(prefer: TTSProvider = 'azure'): TTSProvider {
  if (prefer === 'azure' && AZURE_KEY && AZURE_REGION) return 'azure';
  if (prefer === 'elevenlabs' && ELEVEN_KEY) return 'elevenlabs';
  if (AZURE_KEY && AZURE_REGION) return 'azure';
  if (ELEVEN_KEY) return 'elevenlabs';
  return 'native';
}

export const ttsAvailable = (_prefer: TTSProvider = 'azure'): boolean => true; // native is always available

export interface UseTTSResult {
  speak: (text: string) => Promise<void>;
  stop: () => Promise<void>;
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  provider: TTSProvider;
}

export function useTTS(language: Language, prefer: TTSProvider = 'azure'): UseTTSResult {
  const [isLoading, setLoading] = useState(false);
  const [isPlaying, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const provider = resolveProvider(prefer);

  const cleanup = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {
        // ignore
      }
      soundRef.current = null;
    }
    Speech.stop();
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const stop = useCallback(async () => {
    await cleanup();
    setPlaying(false);
  }, [cleanup]);

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setError(null);
      setLoading(true);
      await cleanup();
      try {
        if (provider === 'native') {
          setLoading(false);
          setPlaying(true);
          Speech.speak(text, {
            language: NATIVE_LANG_TAG[language],
            rate: language === 'ar' ? 0.95 : 1.0,
            onDone: () => setPlaying(false),
            onStopped: () => setPlaying(false),
            onError: () => setPlaying(false),
          });
          return;
        }
        const uri =
          provider === 'azure'
            ? await fetchAzureAudio(text, language)
            : await fetchElevenLabsAudio(text, language);
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync({ uri });
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if ('didJustFinish' in status && status.didJustFinish) {
            setPlaying(false);
          }
        });
        setPlaying(true);
        await sound.playAsync();
      } catch (err: any) {
        setError(err?.message || 'TTS failed');
        // Last-resort: try native if a cloud call blew up.
        try {
          setPlaying(true);
          Speech.speak(text, {
            language: NATIVE_LANG_TAG[language],
            onDone: () => setPlaying(false),
            onStopped: () => setPlaying(false),
            onError: () => setPlaying(false),
          });
        } catch {
          setPlaying(false);
        }
      } finally {
        setLoading(false);
      }
    },
    [cleanup, language, provider]
  );

  return { speak, stop, isLoading, isPlaying, error, provider };
}
