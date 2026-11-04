/**
 * Client-side 9:16 (1080x1920) Video Story Generator with Poet Recitation Audio.
 * Synthesizes an animated Instagram/WhatsApp video story with audio recitation,
 * dynamic audio waveform reactivity, slow cinematic zoom, and crisp Urdu/Hindi couplets.
 */

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const rawParagraphs = text.split('\n');
  const resultLines: string[] = [];

  for (const para of rawParagraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    const words = trimmed.split(/\s+/);
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        resultLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      resultLines.push(currentLine);
    }
  }
  return resultLines;
}

export interface VideoStoryResult {
  blob: Blob;
  videoUrl: string;
  mimeType: string;
  extension: 'mp4' | 'webm';
  durationSeconds: number;
}

export async function generateSherStoryVideo(
  imgSrc: string,
  sherUrdu: string,
  sherHindi: string,
  audioUrl: string,
  onProgress?: (progress: number, label: string) => void
): Promise<VideoStoryResult> {
  // Ensure fonts are loaded
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue even if font ready promise rejects
    }
  }

  onProgress?.(5, 'Preparing image and audio...');

  // 1. Load image
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = (err) => reject(new Error('Failed to load image for story video: ' + err));
    el.src = imgSrc;
  });

  // 2. Fetch and decode audio
  onProgress?.(15, 'Decoding poet recitation audio...');
  const audioResponse = await fetch(audioUrl);
  const audioArrayBuffer = await audioResponse.arrayBuffer();

  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();
  const audioBuffer = await audioCtx.decodeAudioData(audioArrayBuffer);

  const duration = Math.min(audioBuffer.duration + 1.2, 30); // add 1.2s graceful post-roll, max 30s

  // 3. Setup canvas (1080x1920)
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // 4. Setup Web Audio graph for recording
  const audioDest = audioCtx.createMediaStreamDestination();
  const sourceNode = audioCtx.createBufferSource();
  sourceNode.buffer = audioBuffer;

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 64;
  const frequencyData = new Uint8Array(analyser.frequencyBinCount);

  sourceNode.connect(analyser);
  analyser.connect(audioDest);

  // 5. Setup MediaRecorder with cross-browser MIME negotiation
  const canvasStream = canvas.captureStream(30);
  const audioTracks = audioDest.stream.getAudioTracks();

  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioTracks,
  ]);

  let selectedMimeType = 'video/webm';
  let extension: 'mp4' | 'webm' = 'webm';

  if (typeof MediaRecorder !== 'undefined') {
    if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2')) {
      selectedMimeType = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2';
      extension = 'mp4';
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      selectedMimeType = 'video/mp4';
      extension = 'mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
      selectedMimeType = 'video/webm;codecs=vp9,opus';
      extension = 'webm';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
      selectedMimeType = 'video/webm;codecs=vp8,opus';
      extension = 'webm';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      selectedMimeType = 'video/webm';
      extension = 'webm';
    }
  }

  const recordedChunks: Blob[] = [];
  const recorder = new MediaRecorder(combinedStream, {
    mimeType: selectedMimeType,
    videoBitsPerSecond: 4500000, // Crisp 1080p bitrate
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  onProgress?.(25, 'Composing poetic video frames...');

  return new Promise<VideoStoryResult>((resolve, reject) => {
    let animationFrameId: number;
    const startTime = performance.now();

    recorder.onstop = () => {
      cancelAnimationFrame(animationFrameId);
      audioCtx.close().catch(() => {});

      const finalBlob = new Blob(recordedChunks, { type: selectedMimeType });
      const videoUrl = URL.createObjectURL(finalBlob);

      onProgress?.(100, 'Video ready!');
      resolve({
        blob: finalBlob,
        videoUrl,
        mimeType: selectedMimeType,
        extension,
        durationSeconds: duration,
      });
    };

    recorder.onerror = (err) => {
      cancelAnimationFrame(animationFrameId);
      audioCtx.close().catch(() => {});
      reject(err);
    };

    // Precalculate bottom-aligned text layout and coordinates once
    // Generous spacing between Urdu Nastaliq descenders and Hindi Devanagari ascenders
    const watermarkY = 1835;
    const visualizerY = watermarkY - 36;
    const gapHindiVisualizer = 48;
    const hindiLineHeight = 56;
    const gapUrduHindi = 84; // Prevents any overlap between Nastaliq glyphs and Devanagari matras
    const urduLineHeight = 88;

    ctx.font = 'bold 44px "Noto Nastaliq Urdu", serif';
    const urduLines = wrapCanvasText(ctx, sherUrdu, 940);
    ctx.font = '600 33px "Noto Serif Devanagari", serif';
    const hindiLines = wrapCanvasText(ctx, sherHindi, 940);

    const hindiEndY = visualizerY - gapHindiVisualizer;
    const hindiStartY = hindiEndY - (hindiLines.length - 1) * hindiLineHeight;

    const urduEndY = hindiStartY - gapUrduHindi;
    const urduStartY = urduEndY - (urduLines.length - 1) * urduLineHeight;

    // Frame rendering loop
    const renderFrame = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const progressFraction = Math.min(elapsed / duration, 1);

      onProgress?.(
        Math.min(25 + Math.round(progressFraction * 70), 96),
        `Rendering video (${Math.round(elapsed)}s / ${Math.round(duration)}s)...`
      );

      // Get current audio energy for the subtle visual sound pulsation
      analyser.getByteFrequencyData(frequencyData);
      let avgEnergy = 0;
      for (let i = 0; i < 8; i++) {
        avgEnergy += frequencyData[i];
      }
      avgEnergy = avgEnergy / (8 * 255); // 0.0 to 1.0

      // 1. Draw base photo with slow, elegant cinematic zoom (1.00 -> 1.03)
      const zoom = 1.0 + progressFraction * 0.035;
      const baseScale = Math.max(1080 / img.width, 1920 / img.height);
      const currentScale = baseScale * zoom;
      const currentW = img.width * currentScale;
      const currentH = img.height * currentScale;

      const x = (1080 - currentW) / 2;
      const baseOffY = (1920 - img.height * baseScale) * 0.3;
      const y = Math.min(0, baseOffY - (currentH - img.height * baseScale) * 0.2);

      ctx.clearRect(0, 0, 1080, 1920);
      ctx.drawImage(img, x, y, currentW, currentH);

      // 2. White band starting from bottom 2/3rd (y ~ 1160px down to 1920px)
      const bandStartY = 1160;

      // Feathered entry
      const featherGrad = ctx.createLinearGradient(0, bandStartY - 120, 0, bandStartY);
      featherGrad.addColorStop(0, 'rgba(255, 255, 255, 0.00)');
      featherGrad.addColorStop(1, 'rgba(255, 255, 255, 0.20)');
      ctx.fillStyle = featherGrad;
      ctx.fillRect(0, bandStartY - 120, 1080, 120);

      // Main white gradient band
      const bandGrad = ctx.createLinearGradient(0, bandStartY, 0, 1920);
      bandGrad.addColorStop(0, 'rgba(255, 255, 255, 0.20)');
      bandGrad.addColorStop(0.18, 'rgba(255, 255, 255, 0.75)');
      bandGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.96)');
      bandGrad.addColorStop(0.48, 'rgba(255, 255, 255, 1.00)');
      bandGrad.addColorStop(1.00, 'rgba(255, 255, 255, 1.00)');

      ctx.fillStyle = bandGrad;
      ctx.fillRect(0, bandStartY, 1080, 1920 - bandStartY);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 3. Draw Urdu Sher (bottom-aligned) in logo color #81314A
      ctx.fillStyle = '#81314A';
      ctx.font = 'bold 44px "Noto Nastaliq Urdu", serif';
      let currentUrduY = urduStartY;
      for (const line of urduLines) {
        ctx.fillText(line, 540, currentUrduY);
        currentUrduY += urduLineHeight;
      }

      // 4. Draw Hindi Sher (bottom-aligned) in logo color #81314A
      ctx.fillStyle = '#81314A';
      ctx.font = '600 33px "Noto Serif Devanagari", serif';
      let currentHindiY = hindiStartY;
      for (const line of hindiLines) {
        ctx.fillText(line, 540, currentHindiY);
        currentHindiY += hindiLineHeight;
      }

      // 5. Poetic Audio Visualizer: 7 delicate rhythmic sound bars right above the watermark
      const barCount = 7;
      const barWidth = 4;
      const barGap = 6;
      const totalWidth = barCount * barWidth + (barCount - 1) * barGap;
      const startX = 540 - totalWidth / 2;

      for (let b = 0; b < barCount; b++) {
        const freqIndex = (b * 2) % frequencyData.length;
        const normalized = (frequencyData[freqIndex] || 0) / 255;
        // Harmonic rhythm
        const wave = Math.sin(elapsed * 4 + b * 0.8) * 0.25 + 0.35;
        const barHeight = Math.max(4, (normalized * 0.7 + wave * 0.3) * 26);

        ctx.fillStyle = `rgba(129, 49, 74, ${0.45 + normalized * 0.45})`;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(
            startX + b * (barWidth + barGap),
            visualizerY - barHeight / 2,
            barWidth,
            barHeight,
            2
          );
          ctx.fill();
        } else {
          ctx.fillRect(
            startX + b * (barWidth + barGap),
            visualizerY - barHeight / 2,
            barWidth,
            barHeight
          );
        }
      }

      // 6. Watermark solely: "irshad.live" in logo color #81314A at the bottom
      ctx.fillStyle = '#81314A';
      ctx.font = '600 28px "Inter", sans-serif';
      ctx.fillText('irshad.live', 540, watermarkY);

      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(renderFrame);
      } else {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }
    };

    // Start recorder and playback
    recorder.start(250);
    sourceNode.start(0);
    animationFrameId = requestAnimationFrame(renderFrame);
  });
}
