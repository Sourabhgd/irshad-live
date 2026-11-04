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

/**
 * Wraps raw PCM data (16-bit Mono 24kHz) in a WAV header to make it a valid audio data URI.
 */
function createWavDataUriFromPcm(base64Pcm: string, sampleRate: number = 24000): string {
  const binaryString = Buffer.from(base64Pcm, "base64");
  const len = binaryString.length;
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

  const wavBuffer = Buffer.concat([header, binaryString]);
  return `data:audio/wav;base64,${wavBuffer.toString("base64")}`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

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
      const { base64Image, mimeType = "image/jpeg" } = req.body;
      if (!base64Image) {
        return res.status(400).json({ error: "base64Image is required" });
      }

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
      res.json(parsed);
    } catch (error: any) {
      console.error("API /api/generate-poetry Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate poetry" });
    }
  });

  // Voice Generation endpoint
  app.post("/api/generate-voice", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "text is required" });
      }

      const ai = getAiClient();
      const model = "gemini-3.1-flash-tts-preview";

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

      const stagedScript = lastPart
        ? `[First half — Recite at a measured, unhurried, slightly slower tempo (-10% speed). Infuse with deep, heartfelt dramatic passion and dignified emotional inflection. Take a brief natural pause at every comma:]
${firstHalfWithPauses}

[Brief natural breath]

[Second half — Transition into a noticeably heavier, deeper, more weighted baritone resonance (+10% heavier). Read slightly louder than the first half, with profound gravitas and passionate, stirring revelation. Take a brief natural pause at every comma:]
${lastPartWithPauses}`
        : addCommaPauses(text);

      const recitationPrompt = `You are a revered, seasoned Urdu poet reciting at an intimate Mushaira with rich dramatic inflection and solemn gravitas.

PERFORMANCE DIRECTIVES (STRICT):
1. MEASURED TEMPO (-10% SLOWER):
   - Deliver the recitation at an unhurried, measured, deliberate tempo, approximately 10% slower than normal. Let each poetic phrase breathe with weight, dignity, and resonance.

2. BALANCED DRAMATIC INFLECTION (TEMPERED EMOTION):
   - Deliver with heartfelt dramatic passion and evocative soul, but tempered slightly (10% less fiery/frantic) to maintain dignified poise and classical poetic gravitas.

3. HEAVIER SECOND HALF TRANSITION:
   - In the second half, transition your voice into a noticeably heavier (10% deeper, weightier), more resonant baritone timbre.
   - Deliver the second half SLIGHTLY LOUDER than the first half, culminating in a powerful, passionate emotional revelation that resonates deeply.

4. DO NOT REPEAT ANY LINES:
   - Read the poem straight through in a single pass from start to finish without repeating any lines or words.

5. LITTLE PAUSE AT EVERY COMMA:
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
              prebuiltVoiceConfig: { voiceName: "Charon" },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        throw new Error("No audio returned by speech model");
      }

      const audioUri = createWavDataUriFromPcm(base64Audio, 24000);
      res.json({ audioUrl: audioUri });
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
