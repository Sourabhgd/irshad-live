export interface PoetryResult {
  poem: string;
  sherUrdu: string;
  sherHindi: string;
  title: string;
  raga?: SitarRaga;
}

export type VoiceGender = 'male' | 'female';
export type VoiceStyle = 'Master Poet' | 'Dawn melody' | 'Mystic Soul';
export type SitarRaga = 'Rag Yaman' | 'Rag Darbari' | 'Rag Malkauns';

export const SITAR_RAGAS: SitarRaga[] = ['Rag Yaman', 'Rag Darbari', 'Rag Malkauns'];

export function pickNextRaga(previousRaga: SitarRaga | null): SitarRaga {
  const candidates = previousRaga
    ? SITAR_RAGAS.filter((r) => r !== previousRaga)
    : SITAR_RAGAS;
  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx];
}

async function postJsonWithWarmupRetry<T>(url: string, payload: unknown, retries = 3): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    const trimmed = rawText.trim();

    // If the container proxy returned an HTML warmup/gateway page while the dev server was restarting, retry
    if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      throw new Error('The server is warming up. Please click Irshad again in a moment.');
    }

    let data: any;
    try {
      data = JSON.parse(trimmed);
    } catch {
      throw new Error(`Unexpected server response (status ${response.status}). Please try again.`);
    }

    if (!response.ok) {
      throw new Error(data?.error || `Request failed with status ${response.status}`);
    }

    return data as T;
  }

  throw new Error('Request failed after retries. Please try again.');
}

export async function generatePoetry(base64Image: string, mimeType: string, previousRaga?: SitarRaga | null): Promise<PoetryResult> {
  return postJsonWithWarmupRetry<PoetryResult>('/api/generate-poetry', {
    base64Image,
    mimeType,
    previousRaga,
  });
}

export async function generateVoice(
  text: string,
  gender: VoiceGender = 'male',
  style: VoiceStyle = 'Master Poet',
  raga: SitarRaga = 'Rag Yaman'
): Promise<string> {
  const data = await postJsonWithWarmupRetry<{ audioUrl: string }>('/api/generate-voice', {
    text,
    gender,
    style,
    raga,
  });
  return data.audioUrl;
}


