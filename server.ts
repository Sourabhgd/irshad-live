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

type SitarRaga = "Rag Yaman" | "Rag Darbari" | "Rag Malkauns";
const SITAR_RAGAS: SitarRaga[] = ["Rag Yaman", "Rag Darbari", "Rag Malkauns"];
let lastSelectedRaga: SitarRaga | null = null;

function selectNonRepeatingRaga(previousRaga?: string | null): SitarRaga {
  const prev =
    previousRaga && SITAR_RAGAS.includes(previousRaga as SitarRaga)
      ? (previousRaga as SitarRaga)
      : lastSelectedRaga;
  const candidates = prev ? SITAR_RAGAS.filter((r) => r !== prev) : SITAR_RAGAS;
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  lastSelectedRaga = chosen;
  return chosen;
}

interface SitarNote {
  startFreq: number;
  endFreq: number;
  durSec: number;
  vel: number;
  andolanHz?: number; // Slow microtonal oscillation characteristic of Rag Darbari
  andolanDepth?: number;
}

function getRagaConfiguration(raga: SitarRaga): {
  droneFreqs: number[];
  phraseNotes: SitarNote[];
} {
  // Tonic Sa = D4 (293.66 Hz), Lower Sa = D3 (146.83 Hz)
  if (raga === "Rag Darbari") {
    // Rag Darbari Kanada: Sa, Re, Komal Ga (with slow Andolan), Ma, Pa, Komal Dha (with slow Andolan), Komal Ni
    // Frequencies (D=Sa): D3=146.83, A3(Pa)=220.0, Bb3(komal Dha)=233.08, C4(komal Ni)=261.63,
    // D4(Sa)=293.66, E4(Re)=329.63, F4(komal Ga)=349.23, G4(Ma)=392.00, A4(Pa)=440.00, Bb4(komal Dha)=466.16, C5(komal Ni)=523.25
    return {
      droneFreqs: [146.83, 220.0, 293.66], // Sa3 - Pa3 - Sa4
      phraseNotes: [
        { startFreq: 329.63, endFreq: 349.23, durSec: 1.9, vel: 0.9, andolanHz: 2.3, andolanDepth: 0.014 }, // Re -> komal Ga (Darbari Andolan)
        { startFreq: 349.23, endFreq: 329.63, durSec: 1.65, vel: 0.85, andolanHz: 2.2, andolanDepth: 0.012 }, // komal Ga -> Re
        { startFreq: 329.63, endFreq: 293.66, durSec: 1.75, vel: 0.88 }, // Re -> Sa
        { startFreq: 233.08, endFreq: 261.63, durSec: 1.85, vel: 0.82, andolanHz: 2.1, andolanDepth: 0.013 }, // mandra komal Dha -> komal Ni
        { startFreq: 261.63, endFreq: 293.66, durSec: 1.95, vel: 0.9 }, // komal Ni -> Sa
        { startFreq: 392.0, endFreq: 440.0, durSec: 1.7, vel: 0.86 }, // Ma -> Pa
        { startFreq: 466.16, endFreq: 440.0, durSec: 1.9, vel: 0.88, andolanHz: 2.3, andolanDepth: 0.014 }, // komal Dha (Andolan) -> Pa
        { startFreq: 392.0, endFreq: 349.23, durSec: 1.85, vel: 0.85, andolanHz: 2.2, andolanDepth: 0.013 }, // Ma -> komal Ga
        { startFreq: 329.63, endFreq: 293.66, durSec: 2.1, vel: 0.9 }, // Re -> Sa (Vakra resolution)
      ],
    };
  }

  if (raga === "Rag Malkauns") {
    // Rag Malkauns: Pentatonic (Audav-Audav) omitting Re and Pa: Sa, Komal Ga, Shuddha Ma, Komal Dha, Komal Ni
    // Tanpura tuned to Sa - Ma - Sa: D3=146.83, G3(Ma)=196.00, D4(Sa)=293.66
    // Notes: Bb3(komal Dha)=233.08, C4(komal Ni)=261.63, D4(Sa)=293.66, F4(komal Ga)=349.23, G4(Ma)=392.00, Bb4(komal Dha)=466.16, C5(komal Ni)=523.25
    return {
      droneFreqs: [146.83, 196.0, 293.66], // Sa3 - Ma3 - Sa4 (classic Malkauns Tanpura tuning)
      phraseNotes: [
        { startFreq: 392.0, endFreq: 349.23, durSec: 1.85, vel: 0.9, andolanHz: 2.6, andolanDepth: 0.009 }, // Ma -> komal Ga
        { startFreq: 349.23, endFreq: 293.66, durSec: 1.75, vel: 0.86 }, // komal Ga -> Sa
        { startFreq: 233.08, endFreq: 261.63, durSec: 1.65, vel: 0.82 }, // mandra komal Dha -> komal Ni
        { startFreq: 261.63, endFreq: 293.66, durSec: 1.9, vel: 0.9 }, // komal Ni -> Sa
        { startFreq: 293.66, endFreq: 392.0, durSec: 1.8, vel: 0.88 }, // Sa -> Ma (Vadi swara meend)
        { startFreq: 392.0, endFreq: 466.16, durSec: 1.75, vel: 0.85 }, // Ma -> komal Dha
        { startFreq: 523.25, endFreq: 466.16, durSec: 1.7, vel: 0.84 }, // komal Ni -> komal Dha
        { startFreq: 466.16, endFreq: 392.0, durSec: 1.85, vel: 0.88 }, // komal Dha -> Ma
        { startFreq: 349.23, endFreq: 293.66, durSec: 2.1, vel: 0.9 }, // komal Ga -> Sa
      ],
    };
  }

  // Default: Rag Yaman (Kalyan Thaat — Ni, Re, Ga, Teevra Ma, Pa, Dha, Ni, Sa)
  // Notes (D=Sa): C#4(Ni3)=277.18, D4(Sa)=293.66, E4(Re)=329.63, F#4(Ga)=369.99, G#4(Teevra Ma)=415.30, A4(Pa)=440.00, B4(Dha)=493.88
  return {
    droneFreqs: [146.83, 220.0, 293.66], // Sa3 - Pa3 - Sa4
    phraseNotes: [
      { startFreq: 277.18, endFreq: 329.63, durSec: 1.65, vel: 0.9 }, // Ni3 -> Re4
      { startFreq: 329.63, endFreq: 369.99, durSec: 1.85, vel: 0.88 }, // Re4 -> Ga4
      { startFreq: 415.3, endFreq: 440.0, durSec: 1.75, vel: 0.85 }, // Teevra Ma4 -> Pa4
      { startFreq: 493.88, endFreq: 440.0, durSec: 1.8, vel: 0.86 }, // Dha4 -> Pa4
      { startFreq: 415.3, endFreq: 369.99, durSec: 1.7, vel: 0.84 }, // Teevra Ma4 -> Ga4
      { startFreq: 369.99, endFreq: 329.63, durSec: 1.65, vel: 0.85 }, // Ga4 -> Re4
      { startFreq: 277.18, endFreq: 293.66, durSec: 2.1, vel: 0.9 }, // Ni3 -> Sa4
    ],
  };
}

/**
 * Synthesizes a mellow, acoustic Hindustani Sitar Alaap in the selected Raga
 * (Rag Yaman, Rag Darbari, or Rag Malkauns) with subtle sympathetic strings (Taraf)
 * and mixes it softly behind the 16-bit Mono 24kHz voice PCM at 30% of the voice volume.
 */
function createWavDataUriFromPcm(
  base64Pcm: string,
  sampleRate: number = 24000,
  raga: SitarRaga = "Rag Yaman"
): string {
  const voiceBuf = Buffer.from(base64Pcm, "base64");
  const voiceSamplesCount = Math.floor(voiceBuf.length / 2);

  // Add a brief 0.6s mellow Sitar intro and 1.2s outro tail around the voice
  const introSamples = Math.floor(sampleRate * 0.6);
  const outroSamples = Math.floor(sampleRate * 1.2);
  const totalSamples = introSamples + voiceSamplesCount + outroSamples;

  const voiceFloat = new Float32Array(totalSamples);
  let voiceSumSq = 0;
  let activeVoiceCount = 0;
  let voicePeak = 0;

  for (let i = 0; i < voiceSamplesCount; i++) {
    const s = voiceBuf.readInt16LE(i * 2) / 32768;
    voiceFloat[introSamples + i] = s;
    const abs = Math.abs(s);
    if (abs > voicePeak) voicePeak = abs;
    if (abs > 0.015) {
      voiceSumSq += s * s;
      activeVoiceCount++;
    }
  }

  const voiceRms = activeVoiceCount > 0 ? Math.sqrt(voiceSumSq / activeVoiceCount) : 0.18;

  const { droneFreqs, phraseNotes } = getRagaConfiguration(raga);
  const sitarFloat = new Float32Array(totalSamples);

  // Subtle warm Tanpura sympathetic resonance tuned specifically to the Raga
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    let drone = 0;
    for (let d = 0; d < droneFreqs.length; d++) {
      const f = droneFreqs[d];
      const lfo = 0.75 + 0.25 * Math.sin(2 * Math.PI * (0.18 + d * 0.07) * t + d);
      drone +=
        lfo *
        (0.55 * Math.sin(2 * Math.PI * f * t) +
          0.28 * Math.sin(2 * Math.PI * f * 2 * t + 0.4) +
          0.12 * Math.sin(2 * Math.PI * f * 3 * t + 1.1));
    }
    sitarFloat[i] = drone * 0.08;
  }

  let cursorSample = 0;
  let noteIdx = 0;
  while (cursorSample < totalSamples) {
    const note = phraseNotes[noteIdx % phraseNotes.length];
    const noteSamples = Math.floor(note.durSec * sampleRate);
    let phase = 0;
    let sympPhase = 0;

    for (let j = 0; j < noteSamples && cursorSample + j < totalSamples; j++) {
      const localT = j / sampleRate;
      const progress = j / noteSamples;

      // Smooth S-curve pitch glide (Meend) between startFreq and endFreq
      const glide =
        progress < 0.2
          ? 0
          : progress > 0.75
            ? 1
            : 0.5 - 0.5 * Math.cos(((progress - 0.2) / 0.55) * Math.PI);

      const vibratoHz = note.andolanHz || 4.8;
      const vibratoDepth = note.andolanDepth || 0.0035;
      const vibrato = Math.sin(2 * Math.PI * vibratoHz * localT) * vibratoDepth * Math.min(1, localT * 1.5);
      const instFreq = (note.startFreq + (note.endFreq - note.startFreq) * glide) * (1 + vibrato);

      phase += (2 * Math.PI * instFreq) / sampleRate;
      sympPhase += (2 * Math.PI * (instFreq * 2)) / sampleRate;

      // Soft pluck attack (25ms) + natural woody string decay
      const attack = Math.min(1, localT / 0.025);
      const bodyEnv = Math.exp(-localT * 1.65);
      const jawariEnv = Math.exp(-localT * 3.1);

      // Mellow Sitar harmonic series with subtle Jawari bridge warmth
      const jawariMod = 0.35 * jawariEnv * Math.sin(phase * 2);
      const pluckWave =
        0.52 * Math.sin(phase + jawariMod) +
        0.26 * Math.sin(phase * 2 + 0.3) * Math.exp(-localT * 2.0) +
        0.13 * Math.sin(phase * 3 + 0.8) * jawariEnv +
        0.06 * Math.sin(phase * 4 + 1.4) * Math.exp(-localT * 4.2) +
        0.04 * Math.sin(sympPhase) * Math.exp(-localT * 1.2); // Taraf sympathetic glow

      sitarFloat[cursorSample + j] += pluckWave * attack * bodyEnv * note.vel;
    }

    // Overlap slightly so sympathetic resonance continues smoothly between plucks
    cursorSample += Math.floor(noteSamples * 0.88);
    noteIdx++;
  }

  // Warm 1-pole low-pass filter (~1900 Hz cutoff) so the Sitar stays mellow and gentle behind the voice
  const rc = 1 / (2 * Math.PI * 1900);
  const dt = 1 / sampleRate;
  const alpha = dt / (rc + dt);
  let prevFiltered = 0;
  let sitarSumSq = 0;

  for (let i = 0; i < totalSamples; i++) {
    prevFiltered = prevFiltered + alpha * (sitarFloat[i] - prevFiltered);
    sitarFloat[i] = prevFiltered;
    sitarSumSq += prevFiltered * prevFiltered;
  }

  const sitarRms = Math.sqrt(sitarSumSq / Math.max(1, totalSamples)) || 0.1;
  // Set Sitar volume to 30% of the voice volume
  const targetSitarRms = voiceRms * 0.30;
  const sitarGain = targetSitarRms / sitarRms;

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
    const s = sitarFloat[i] * sitarGain * env;

    // Combine voice (100%) + mellow Sitar (30% of voice volume) with soft clipping protection
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

      const selectedRaga: SitarRaga =
        raga && SITAR_RAGAS.includes(raga as SitarRaga)
          ? (raga as SitarRaga)
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
