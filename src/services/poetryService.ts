export interface PoetryResult {
  poem: string;
  sherUrdu: string;
  sherHindi: string;
  title: string;
}

export async function generatePoetry(base64Image: string, mimeType: string): Promise<PoetryResult> {
  const response = await fetch('/api/generate-poetry', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base64Image,
      mimeType,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
    throw new Error(errorData.error || `Poetry generation failed with status ${response.status}`);
  }

  return response.json();
}

export async function generateVoice(text: string): Promise<string> {
  const response = await fetch('/api/generate-voice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
    throw new Error(errorData.error || `Voice generation failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.audioUrl;
}
