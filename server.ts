import express from "express";
import fs from "fs";
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

/**
 * Converts raw 16-bit Mono 24kHz PCM base64 audio from Gemini TTS directly into a playable WAV Data URI
 * without any background music.
 */
function createWavDataUriFromPcm(
  base64Pcm: string,
  sampleRate: number = 24000,
  _raga?: ClassicalRaga
): string {
  const pcmBuffer = Buffer.from(base64Pcm, "base64");
  const len = pcmBuffer.length;
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

  const wavBuffer = Buffer.concat([header, pcmBuffer]);
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
    const assetsPath = path.join(distPath, "assets");

    // Disable weak mtime-based ETags because Cloud Run Buildpacks zeroes all file mtimes to 1980-01-01,
    // which otherwise causes every deployment's index.html (1052 bytes) to share the exact same ETag.
    app.set("etag", false);

    app.use(
      "/assets",
      express.static(assetsPath, {
        etag: false,
        lastModified: false,
        maxAge: "1h",
      })
    );

    // Fallback if a mobile browser or CDN edge has an older index.html cached and requests a previous hash
    // (e.g. /assets/index-OLDHASH.js or /assets/index-OLDHASH.css)
    app.get("/assets/:filename", (req, res) => {
      try {
        const requested = req.params.filename || "";
        const files = fs.existsSync(assetsPath) ? fs.readdirSync(assetsPath) : [];
        if (requested.endsWith(".js")) {
          const currentJs = files.find((f) => f.startsWith("index-") && f.endsWith(".js")) || files.find((f) => f.endsWith(".js"));
          if (currentJs) {
            res.setHeader("Content-Type", "application/javascript; charset=utf-8");
            res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
            res.setHeader("CDN-Cache-Control", "no-store");
            return res.sendFile(path.join(assetsPath, currentJs));
          }
        } else if (requested.endsWith(".css")) {
          const currentCss = files.find((f) => f.startsWith("index-") && f.endsWith(".css")) || files.find((f) => f.endsWith(".css"));
          if (currentCss) {
            res.setHeader("Content-Type", "text/css; charset=utf-8");
            res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
            res.setHeader("CDN-Cache-Control", "no-store");
            return res.sendFile(path.join(assetsPath, currentCss));
          }
        }
      } catch (e) {
        console.error("Asset fallback error:", e);
      }
      res.status(404).end();
    });

    app.use(
      express.static(distPath, {
        index: false,
        etag: false,
        lastModified: false,
      })
    );

    app.get("*", (_req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      res.setHeader("CDN-Cache-Control", "no-store");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
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
