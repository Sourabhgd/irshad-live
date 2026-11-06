import express from "express";
import path from "path";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing. Please set it in AI Studio settings.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

type ClassicalRaga = "Rag Yaman" | "Rag Darbari" | "Rag Malkauns";
const CLASSICAL_RAGAS: ClassicalRaga[] = ["Rag Yaman", "Rag Darbari", "Rag Malkauns"];
let lastSelectedRaga: ClassicalRaga | null = null;

function selectNonRepeatingRaga(previousRaga?: string | null): ClassicalRaga {
  const prev =
    previousRaga && CLASSICAL_RAGAS.includes(previousRaga as ClassicalRaga)
      ? (previousRaga as ClassicalRaga)
      : lastSelectedRaga;
  const candidates = prev ? CLASSICAL_RAGAS.filter((r) => r !== prev) : CLASSICAL_RAGAS;
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  lastSelectedRaga = chosen;
  return chosen;
}

interface SantoorStroke {
  freq: number;
  durSec: number;
  vel: number;
  // Optional secondary Kalam mallet rebound strikes (offset in seconds, relative velocity)
  rebounds?: Array<{ offsetSec: number; relVel: number }>;
}

function getSantoorRagaConfiguration(raga: ClassicalRaga): {
  droneFreqs: number[];
  strokes: SantoorStroke[];
} {
  // Tonic Sa = D4 (293.66 Hz), Lower Sa = D3 (146.83 Hz), Upper Sa = D5 (587.33 Hz)
  if (raga === "Rag Darbari") {
    // Rag Darbari Kanada on Santoor: Sa, Re, Komal Ga, Ma, Pa, Komal Dha, Komal Ni
    // Delicate Kalam mallet tremolos on Komal Ga (349.23 Hz) and Komal Dha (466.16 Hz)
    return {
      droneFreqs: [146.83, 220.0, 293.66], // Sa3 - Pa3 - Sa4
      strokes: [
        { freq: 293.66, durSec: 0.95, vel: 0.85, rebounds: [{ offsetSec: 0.24, relVel: 0.55 }] }, // Sa4
        { freq: 329.63, durSec: 0.9, vel: 0.88, rebounds: [{ offsetSec: 0.22, relVel: 0.5 }] }, // Re4
        {
          freq: 349.23,
          durSec: 1.45,
          vel: 0.92,
          rebounds: [
            { offsetSec: 0.19, relVel: 0.68 },
            { offsetSec: 0.38, relVel: 0.48 },
            { offsetSec: 0.58, relVel: 0.32 },
          ],
        }, // Komal Ga4 (soft Kalam tremolo)
        { freq: 329.63, durSec: 0.85, vel: 0.82 }, // Re4
        { freq: 293.66, durSec: 1.25, vel: 0.9, rebounds: [{ offsetSec: 0.25, relVel: 0.55 }] }, // Sa4
        { freq: 233.08, durSec: 0.95, vel: 0.8, rebounds: [{ offsetSec: 0.22, relVel: 0.5 }] }, // Mandra Komal Dha3
        { freq: 261.63, durSec: 0.95, vel: 0.84, rebounds: [{ offsetSec: 0.22, relVel: 0.5 }] }, // Mandra Komal Ni3
        { freq: 293.66, durSec: 1.2, vel: 0.9 }, // Sa4
        { freq: 392.0, durSec: 0.9, vel: 0.86 }, // Ma4
        { freq: 440.0, durSec: 1.05, vel: 0.9, rebounds: [{ offsetSec: 0.23, relVel: 0.55 }] }, // Pa4
        {
          freq: 466.16,
          durSec: 1.4,
          vel: 0.9,
          rebounds: [
            { offsetSec: 0.19, relVel: 0.65 },
            { offsetSec: 0.38, relVel: 0.45 },
          ],
        }, // Komal Dha4 (Kalam tremolo)
        { freq: 440.0, durSec: 0.95, vel: 0.85 }, // Pa4
        { freq: 392.0, durSec: 0.9, vel: 0.84 }, // Ma4
        { freq: 349.23, durSec: 1.1, vel: 0.88, rebounds: [{ offsetSec: 0.21, relVel: 0.55 }] }, // Komal Ga4
        { freq: 329.63, durSec: 0.9, vel: 0.84 }, // Re4
        { freq: 293.66, durSec: 1.5, vel: 0.92, rebounds: [{ offsetSec: 0.26, relVel: 0.55 }] }, // Sa4
      ],
    };
  }

  if (raga === "Rag Malkauns") {
    // Rag Malkauns on Santoor: Pentatonic (Audav-Audav) omitting Re and Pa: Sa, Komal Ga, Ma, Komal Dha, Komal Ni
    return {
      droneFreqs: [146.83, 196.0, 293.66], // Sa3 - Ma3 - Sa4
      strokes: [
        { freq: 261.63, durSec: 0.95, vel: 0.82, rebounds: [{ offsetSec: 0.23, relVel: 0.5 }] }, // Mandra Komal Ni3
        { freq: 293.66, durSec: 1.15, vel: 0.9, rebounds: [{ offsetSec: 0.24, relVel: 0.58 }] }, // Sa4
        { freq: 349.23, durSec: 1.05, vel: 0.88, rebounds: [{ offsetSec: 0.22, relVel: 0.52 }] }, // Komal Ga4
        {
          freq: 392.0,
          durSec: 1.45,
          vel: 0.94,
          rebounds: [
            { offsetSec: 0.2, relVel: 0.65 },
            { offsetSec: 0.41, relVel: 0.44 },
          ],
        }, // Ma4 (Vadi swara on Santoor)
        { freq: 349.23, durSec: 0.95, vel: 0.85 }, // Komal Ga4
        { freq: 293.66, durSec: 1.25, vel: 0.9, rebounds: [{ offsetSec: 0.25, relVel: 0.52 }] }, // Sa4
        { freq: 392.0, durSec: 0.95, vel: 0.88 }, // Ma4
        { freq: 466.16, durSec: 1.05, vel: 0.9, rebounds: [{ offsetSec: 0.22, relVel: 0.55 }] }, // Komal Dha4
        { freq: 523.25, durSec: 1.05, vel: 0.88, rebounds: [{ offsetSec: 0.22, relVel: 0.52 }] }, // Komal Ni4
        { freq: 587.33, durSec: 1.35, vel: 0.92, rebounds: [{ offsetSec: 0.21, relVel: 0.6 }, { offsetSec: 0.42, relVel: 0.38 }] }, // Taar Sa5
        { freq: 523.25, durSec: 0.9, vel: 0.85 }, // Komal Ni4
        { freq: 466.16, durSec: 0.95, vel: 0.86 }, // Komal Dha4
        { freq: 392.0, durSec: 1.15, vel: 0.9, rebounds: [{ offsetSec: 0.23, relVel: 0.55 }] }, // Ma4
        { freq: 349.23, durSec: 0.95, vel: 0.85 }, // Komal Ga4
        { freq: 293.66, durSec: 1.5, vel: 0.92, rebounds: [{ offsetSec: 0.26, relVel: 0.55 }] }, // Sa4
      ],
    };
  }

  // Default: Rag Yaman on Santoor (Ni, Re, Ga, Teevra Ma, Pa, Dha, Ni, Sa)
  return {
    droneFreqs: [146.83, 220.0, 293.66], // Sa3 - Pa3 - Sa4
    strokes: [
      { freq: 277.18, durSec: 0.9, vel: 0.84, rebounds: [{ offsetSec: 0.22, relVel: 0.5 }] }, // Ni3
      { freq: 329.63, durSec: 0.95, vel: 0.88, rebounds: [{ offsetSec: 0.22, relVel: 0.52 }] }, // Re4
      {
        freq: 369.99,
        durSec: 1.4,
        vel: 0.94,
        rebounds: [
          { offsetSec: 0.2, relVel: 0.66 },
          { offsetSec: 0.4, relVel: 0.44 },
        ],
      }, // Ga4 (Vadi swara Kalam cascade)
      { freq: 329.63, durSec: 0.9, vel: 0.85 }, // Re4
      { freq: 293.66, durSec: 1.25, vel: 0.9, rebounds: [{ offsetSec: 0.25, relVel: 0.55 }] }, // Sa4
      { freq: 415.3, durSec: 0.95, vel: 0.86, rebounds: [{ offsetSec: 0.22, relVel: 0.5 }] }, // Teevra Ma4
      { freq: 440.0, durSec: 1.15, vel: 0.92, rebounds: [{ offsetSec: 0.22, relVel: 0.58 }] }, // Pa4
      { freq: 493.88, durSec: 1.0, vel: 0.88 }, // Dha4
      { freq: 554.37, durSec: 1.0, vel: 0.88, rebounds: [{ offsetSec: 0.21, relVel: 0.52 }] }, // Ni4
      { freq: 587.33, durSec: 1.35, vel: 0.92, rebounds: [{ offsetSec: 0.2, relVel: 0.6 }, { offsetSec: 0.4, relVel: 0.38 }] }, // Taar Sa5
      { freq: 493.88, durSec: 0.9, vel: 0.85 }, // Dha4
      { freq: 440.0, durSec: 0.95, vel: 0.88 }, // Pa4
      { freq: 415.3, durSec: 0.9, vel: 0.84 }, // Teevra Ma4
      { freq: 369.99, durSec: 1.1, vel: 0.9, rebounds: [{ offsetSec: 0.22, relVel: 0.55 }] }, // Ga4
      { freq: 329.63, durSec: 0.9, vel: 0.85 }, // Re4
      { freq: 293.66, durSec: 1.5, vel: 0.92, rebounds: [{ offsetSec: 0.26, relVel: 0.55 }] }, // Sa4
    ],
  };
}

/**
 * Helper that renders a single Santoor walnut-mallet (Kalam) strike on a 3-string unison course
 * into the target buffer with authentic shimmering string chorus and long resonant sustain.
 */
function addSantoorMalletStrike(
  buf: Float32Array,
  startSample: number,
  freq: number,
  velocity: number,
  sampleRate: number
) {
  // Each Santoor strike rings out for ~2.6 seconds across the wooden soundbox
  const ringSamples = Math.floor(2.6 * sampleRate);
  // 3 unison strings per bridge course with subtle natural micro-detuning for Santoor shimmer
  const f1 = freq * 0.9989;
  const f2 = freq;
  const f3 = freq * 1.0011;
  // Slightly stretched overtone ratios typical of tensioned steel/brass dulcimer strings
  const fOct = freq * 2.0005;
  const f3rd = freq * 3.0018;
  const f4th = freq * 4.004;

  const endSample = Math.min(buf.length, startSample + ringSamples);
  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / sampleRate;

    // Fast, crisp 4ms wooden Kalam mallet attack
    const attack = Math.min(1, t / 0.004);
    // Long, shimmering fundamental sustain + faster-decaying bright mallet harmonics
    const fundEnv = Math.exp(-t * 1.45);
    const octEnv = Math.exp(-t * 2.6);
    const bellEnv = Math.exp(-t * 5.8);
    const transientEnv = Math.exp(-t * 28.0);

    // 3-string unison course chorus
    const courseFundamental =
      0.34 * Math.sin(2 * Math.PI * f1 * t) +
      0.36 * Math.sin(2 * Math.PI * f2 * t + 0.2) +
      0.30 * Math.sin(2 * Math.PI * f3 * t + 0.5);

    // Shimmering harmonic overtones + subtle wooden Kalam strike click
    const overtones =
      0.32 * Math.sin(2 * Math.PI * fOct * t + 0.4) * octEnv +
      0.16 * Math.sin(2 * Math.PI * f3rd * t + 0.9) * bellEnv +
      0.07 * Math.sin(2 * Math.PI * f4th * t + 1.5) * transientEnv +
      0.05 * Math.sin(2 * Math.PI * (freq * 5.5) * t) * transientEnv;

    const sample = (courseFundamental * fundEnv * 0.68 + overtones) * attack * velocity;
    buf[i] += sample;
  }
}

/**
 * Synthesizes a mellow, crystalline Hindustani Santoor Alaap in the selected Raga
 * (Rag Yaman, Rag Darbari, or Rag Malkauns) with 3-string unison courses and Kalam mallet rebounds,
 * and mixes it softly behind the 16-bit Mono 24kHz voice PCM at 30% of the voice volume.
 */
function createWavDataUriFromPcm(
  base64Pcm: string,
  sampleRate: number = 24000,
  raga: ClassicalRaga = "Rag Yaman"
): string {
  const voiceBuf = Buffer.from(base64Pcm, "base64");
  const voiceSamplesCount = Math.floor(voiceBuf.length / 2);

  // Add a brief 0.6s mellow Santoor intro and 1.2s outro tail around the voice
  const introSamples = Math.floor(sampleRate * 0.6);
  const outroSamples = Math.floor(sampleRate * 1.2);
  const totalSamples = introSamples + voiceSamplesCount + outroSamples;

  const voiceFloat = new Float32Array(totalSamples);
  let voiceSumSq = 0;
  let activeVoiceCount = 0;

  for (let i = 0; i < voiceSamplesCount; i++) {
    const s = voiceBuf.readInt16LE(i * 2) / 32768;
    voiceFloat[introSamples + i] = s;
    const abs = Math.abs(s);
    if (abs > 0.015) {
      voiceSumSq += s * s;
      activeVoiceCount++;
    }
  }

  const voiceRms = activeVoiceCount > 0 ? Math.sqrt(voiceSumSq / activeVoiceCount) : 0.18;

  const { droneFreqs, strokes } = getSantoorRagaConfiguration(raga);
  const santoorFloat = new Float32Array(totalSamples);

  // Soft sympathetic open-string resonance bed tuned to the Raga (Sa - Pa/Ma - Sa)
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    let symp = 0;
    for (let d = 0; d < droneFreqs.length; d++) {
      const f = droneFreqs[d];
      const shimmer = 0.8 + 0.2 * Math.sin(2 * Math.PI * (0.22 + d * 0.08) * t + d);
      symp +=
        shimmer *
        (0.6 * Math.sin(2 * Math.PI * f * t) +
          0.25 * Math.sin(2 * Math.PI * f * 2 * t + 0.5));
    }
    santoorFloat[i] = symp * 0.045;
  }

  // Schedule Santoor Kalam mallet strokes and cascading rebounds across the timeline
  let cursorSample = 0;
  let strokeIdx = 0;
  while (cursorSample < totalSamples) {
    const stroke = strokes[strokeIdx % strokes.length];
    // Primary Kalam mallet strike
    addSantoorMalletStrike(santoorFloat, cursorSample, stroke.freq, stroke.vel, sampleRate);

    // Rebounding Kalam mallet strikes (characteristic Santoor tremolo/bounce)
    if (stroke.rebounds) {
      for (const reb of stroke.rebounds) {
        const rebSample = cursorSample + Math.floor(reb.offsetSec * sampleRate);
        if (rebSample < totalSamples) {
          addSantoorMalletStrike(
            santoorFloat,
            rebSample,
            stroke.freq,
            stroke.vel * reb.relVel,
            sampleRate
          );
        }
      }
    }

    cursorSample += Math.floor(stroke.durSec * sampleRate);
    strokeIdx++;
  }

  // Gentle warm low-pass filter (~3400 Hz cutoff) to preserve the Santoor's crystalline bell shimmer while keeping it mellow behind the voice
  const rc = 1 / (2 * Math.PI * 3400);
  const dt = 1 / sampleRate;
  const alpha = dt / (rc + dt);
  let prevFiltered = 0;
  let santoorSumSq = 0;

  for (let i = 0; i < totalSamples; i++) {
    prevFiltered = prevFiltered + alpha * (santoorFloat[i] - prevFiltered);
    santoorFloat[i] = prevFiltered;
    santoorSumSq += prevFiltered * prevFiltered;
  }

  const santoorRms = Math.sqrt(santoorSumSq / Math.max(1, totalSamples)) || 0.1;
  // Set Santoor volume to 30% of the voice volume
  const targetSantoorRms = voiceRms * 0.30;
  const santoorGain = targetSantoorRms / santoorRms;

  const fadeInSamples = Math.floor(sampleRate * 0.5);
  const fadeOutSamples = Math.floor(sampleRate * 1.1);

  const mixedPcmBuffer = Buffer.alloc(totalSamples * 2);
  for (let i = 0; i < totalSamples; i++) {
    let env = 1.0;
    if (i < fadeInSamples) {
      env = i / fadeInSamples;
    } else if (i > totalSamples - fadeOutSamples) {
      env = (totalSamples - i) / fadeOutSamples;
    }

    const v = voiceFloat[i];
    const s = santoorFloat[i] * santoorGain * env;

    // Combine voice (100%) + mellow Santoor (30% of voice volume) with soft clipping protection
    let mixed = v + s;
    if (mixed > 0.98) {
      mixed = 0.98 + 0.02 * Math.tanh((mixed - 0.98) / 0.02);
    } else if (mixed < -0.98) {
      mixed = -0.98 + 0.02 * Math.tanh((mixed + 0.98) / 0.02);
    }

    const intSample = Math.max(-32768, Math.min(32767, Math.round(mixed * 32767)));
    mixedPcmBuffer.writeInt16LE(intSample, i * 2);
  }

  const len = mixedPcmBuffer.length;
  const header = Buffer.alloc(44);

  // RIFF identifier
  header.write("RIFF", 0);
  // File length
  header.writeUInt32LE(36 + len, 4);
  // WAVE identifier
  header.write("WAVE", 8);
  // fmt chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 is PCM)
  header.writeUInt16LE(1, 22); // NumChannels (1 is Mono)
  header.writeUInt32LE(sampleRate, 24); // SampleRate
  header.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  header.writeUInt16LE(2, 32); // BlockAlign
  header.writeUInt16LE(16, 34); // BitsPerSample
  // data chunk
  header.write("data", 36);
  header.writeUInt32LE(len, 40);

  const wavBuffer = Buffer.concat([header, mixedPcmBuffer]);
  return `data:audio/wav;base64,${wavBuffer.toString("base64")}`;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "25mb" }));

  // Health check route
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Google AdSense verification crawler endpoint
  app.get("/ads.txt", (_req, res) => {
    res.type("text/plain").sendFile(path.join(process.cwd(), "public", "ads.txt"));
  });

  // Privacy Policy for Google AdSense compliance & verification
  app.get(["/privacy", "/privacy-policy"], (_req, res) => {
    res.sendFile(path.join(process.cwd(), "public", "privacy.html"));
  });

  // Poetry Generation endpoint
  app.post("/api/generate-poetry", async (req, res) => {
    try {
      const { base64Image, mimeType = "image/jpeg", previousRaga = null } = req.body;
      if (!base64Image) {
        return res.status(400).json({ error: "base64Image is required" });
      }

      const assignedRaga = selectNonRepeatingRaga(previousRaga);

      const ai = getAiClient();
      const model = "gemini-3.6-flash";

      const systemInstruction = `You are a world-class Urdu and Hindi poet, master of poignant modern lyrical and free-verse Nazm poetry. 
Your poetry is surreal, abstract, reflective, and uses deep metaphors of nature, time, silence, and everyday objects (like "khaali botal", "geeli dhoop", "thanda suraj").

When provided with an image:
1. Title: Create a short, poetic title (3-4 words) in Hindi (Devanagari) script.
2. Poem: Write a soulful poem (Nazm) in an evocative, reflective style (Hindi/Urdu mix) using Hindi (Devanagari) script. Use evocative, abstract metaphors. (80-120 words).
3. Sher (Urdu Script): Write one evocative Sher (couplet) that captures the absolute soul of the image in pure Urdu script.
4. Sher (Hindi Script): Provide the same Sher in Devanagari (Hindi) script.

Format the output as JSON with keys: "title", "poem", "sherUrdu", "sherHindi".`;

      const prompt = "Irshaad. Look at this image and breathe soul into it through evocative poetry and an evocative Sher.";

      const cleanedBase64 = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;

      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanedBase64,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              poem: { type: Type.STRING },
              sherUrdu: { type: Type.STRING },
              sherHindi: { type: Type.STRING },
            },
            required: ["title", "poem", "sherUrdu", "sherHindi"],
          },
        },
      });

      if (!response.text) {
        throw new Error("No poetry response received from AI model");
      }

      const parsed = JSON.parse(response.text.trim());
      res.json({ ...parsed, raga: assignedRaga });
    } catch (error: any) {
      console.error("API /api/generate-poetry Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate poetry" });
    }
  });

  // Voice Generation endpoint
  app.post("/api/generate-voice", async (req, res) => {
    try {
      const { text, gender = "male", style = "Master Poet", raga } = req.body;
      if (!text) {
        return res.status(400).json({ error: "text is required" });
      }

      const selectedRaga: ClassicalRaga =
        raga && CLASSICAL_RAGAS.includes(raga as ClassicalRaga)
          ? (raga as ClassicalRaga)
          : lastSelectedRaga || selectNonRepeatingRaga(null);

      const ai = getAiClient();
      const model = "gemini-3.1-flash-tts-preview";

      const normalizedGender = String(gender).toLowerCase() === "female" ? "female" : "male";

      // Select prebuilt voice based on gender and style
      let voiceName = "Charon";
      if (normalizedGender === "female") {
        if (style === "Dawn melody") {
          voiceName = "Zephyr";
        } else {
          voiceName = "Kore";
        }
      } else {
        if (style === "Dawn melody") {
          voiceName = "Puck";
        } else {
          voiceName = "Charon";
        }
      }

      // Split poem into first half and last part (do not repeat lines)
      const rawLines = text
        .split('\n')
        .map((l: string) => l.trim())
        .filter(Boolean);

      let firstHalf = '';
      let lastPart = '';

      if (rawLines.length >= 2) {
        firstHalf = rawLines.slice(0, -1).join('\n');
        lastPart = rawLines[rawLines.length - 1];
      } else if (text.includes('،')) {
        const parts = text.split('،').map((s: string) => s.trim()).filter(Boolean);
        firstHalf = parts[0];
        lastPart = parts.slice(1).join('، ');
      } else if (text.includes(',')) {
        const parts = text.split(',').map((s: string) => s.trim()).filter(Boolean);
        firstHalf = parts[0];
        lastPart = parts.slice(1).join(', ');
      } else {
        firstHalf = text;
        lastPart = '';
      }

      // Add a little pause at every comma
      const addCommaPauses = (str: string) =>
        str.replace(/،/g, '، ... ').replace(/,/g, ', ... ');

      const firstHalfWithPauses = addCommaPauses(firstHalf);
      const lastPartWithPauses = addCommaPauses(lastPart);

      const styleDirectives: Record<string, { persona: string; firstHalfNote: string; secondHalfNote: string }> = {
        "Master Poet": {
          persona: `You are a revered, seasoned ${normalizedGender} Urdu poet reciting at an intimate Mushaira with rich dramatic inflection and solemn gravitas.`,
          firstHalfNote: "First half — Recite at a measured, unhurried, slightly slower tempo (-10% speed). Infuse with deep, heartfelt dramatic passion and dignified emotional inflection. Take a brief natural pause at every comma:",
          secondHalfNote: "Second half — Transition into a noticeably heavier, deeper, more weighted resonance (+10% heavier). Read slightly louder than the first half, with profound gravitas and passionate, stirring revelation. Take a brief natural pause at every comma:",
        },
        "Dawn melody": {
          persona: `You are a serene, lyrical ${normalizedGender} poet reciting at daybreak, with a voice as gentle, musical, and luminous as the morning breeze.`,
          firstHalfNote: "First half — Recite with soft, flowing, melodic grace and tender emotional warmth. Let each phrase glide gently with a natural breath at every comma:",
          secondHalfNote: "Second half — Blossom with warm, radiant, uplifting lyricism and heartfelt tenderness that lingers softly in the air. Take a gentle pause at every comma:",
        },
        "Mystic Soul": {
          persona: `You are a contemplative ${normalizedGender} Sufi mystic reciting in sacred stillness, where every word is an inward prayer and spiritual awakening.`,
          firstHalfNote: "First half — Recite at a meditative, unhurried, soulful tempo steeped in spiritual longing and tranquil depth. Pause mindfully at every comma:",
          secondHalfNote: "Second half — Deepen into a transcendent, soul-stirring resonance filled with quiet ecstasy and inner peace. Take a brief pause at every comma:",
        },
      };

      const selectedDirective = styleDirectives[style] || styleDirectives["Master Poet"];

      const stagedScript = lastPart
        ? `[${selectedDirective.firstHalfNote}]
${firstHalfWithPauses}

[Brief natural breath]

[${selectedDirective.secondHalfNote}]
${lastPartWithPauses}`
        : addCommaPauses(text);

      const recitationPrompt = `${selectedDirective.persona}

PERFORMANCE DIRECTIVES (STRICT):
1. STYLE & PERSONA (${style.toUpperCase()} - ${normalizedGender.toUpperCase()} VOICE):
   - Embody the "${style}" recitation style authentically.
   - Deliver at an unhurried, measured, deliberate tempo so each poetic phrase breathes with weight and beauty.

2. EMOTIONAL ARC & SECOND HALF TRANSITION:
   - Follow the first-half and second-half expressive transition notes faithfully.

3. DO NOT REPEAT ANY LINES:
   - Read the poem straight through in a single pass from start to finish without repeating any lines or words.

4. LITTLE PAUSE AT EVERY COMMA:
   - Insert a short, gentle natural pause at every comma.

Recite this poem:
${stagedScript}`;

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            parts: [
              {
                text: recitationPrompt,
              },
            ],
          },
        ],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        throw new Error("No audio returned by speech model");
      }

      const audioUri = createWavDataUriFromPcm(base64Audio, 24000, selectedRaga);
      res.json({ audioUrl: audioUri, raga: selectedRaga });
    } catch (error: any) {
      console.error("API /api/generate-voice Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate voice" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM received, closing server...");
    server.close(() => {
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error("Fatal error during server startup:", err);
  process.exit(1);
});
