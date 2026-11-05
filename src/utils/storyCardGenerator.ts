/**
 * Utility to generate high-resolution (1080x1920, 9:16) Instagram Story / WhatsApp Status
 * visual cards with the user's vision image and the reflective Urdu & Hindi Sher.
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

export async function generateSherStoryCard(
  imgSrc: string,
  sherUrdu: string,
  sherHindi: string
): Promise<string> {
  // Wait for web fonts (Noto Nastaliq Urdu, Noto Serif Devanagari) to be ready
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue even if font ready promise rejects
    }
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return reject(new Error('Canvas 2D context not available'));
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // 1. Draw base image with "cover" fit on 9:16 canvas
        const scale = Math.max(1080 / img.width, 1920 / img.height);
        const x = (1080 - img.width * scale) / 2;
        // Position image slightly top/center weighted so main focal point stays visible
        const y = Math.min(0, (1920 - img.height * scale) * 0.3);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        // 2. Layout calculations: Bottom-aligned
        // Sequence: Urdu couplet -> Hindi couplet -> irshad.live watermark
        const watermarkY = 1835;
        const gapHindiWatermark = 58;
        const hindiLineHeight = 56;
        const gapUrduHindi = 84; // Prevents any overlap between Nastaliq glyphs and Devanagari matras
        const urduLineHeight = 88;

        ctx.font = '600 33px "Noto Serif Devanagari", serif';
        const hindiLines = wrapCanvasText(ctx, sherHindi, 940);

        ctx.font = 'bold 44px "Noto Nastaliq Urdu", serif';
        const urduLines = wrapCanvasText(ctx, sherUrdu, 940);

        const hindiEndY = watermarkY - gapHindiWatermark;
        const hindiStartY = hindiEndY - (hindiLines.length - 1) * hindiLineHeight;

        const urduEndY = hindiStartY - gapUrduHindi;
        const urduStartY = urduEndY - (urduLines.length - 1) * urduLineHeight;

        // 3. Black background for the text: alpha starting from 20% (0.20) to 100% (1.00) at the bottom
        const textTop = urduStartY - 70;
        const bandStartY = Math.min(1150, textTop - 60);

        // Feathered soft transition above the band
        const featherGrad = ctx.createLinearGradient(0, bandStartY - 140, 0, bandStartY);
        featherGrad.addColorStop(0, 'rgba(0, 0, 0, 0.00)');
        featherGrad.addColorStop(1, 'rgba(0, 0, 0, 0.20)');
        ctx.fillStyle = featherGrad;
        ctx.fillRect(0, bandStartY - 140, 1080, 140);

        // Main black gradient: alpha starting from 20% (0.20) at top to 100% (1.00) at bottom
        const bandGrad = ctx.createLinearGradient(0, bandStartY, 0, 1920);
        bandGrad.addColorStop(0, 'rgba(0, 0, 0, 0.20)');
        bandGrad.addColorStop(1, 'rgba(0, 0, 0, 1.00)');

        ctx.fillStyle = bandGrad;
        ctx.fillRect(0, bandStartY, 1080, 1920 - bandStartY);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 4. Draw Urdu Sher in #C8718D
        ctx.fillStyle = '#C8718D';
        ctx.font = 'bold 44px "Noto Nastaliq Urdu", serif';
        let currentUrduY = urduStartY;
        for (const line of urduLines) {
          ctx.fillText(line, 540, currentUrduY);
          currentUrduY += urduLineHeight;
        }

        // 5. Draw Hindi Sher in #C8718D
        ctx.fillStyle = '#C8718D';
        ctx.font = '600 33px "Noto Serif Devanagari", serif';
        let currentHindiY = hindiStartY;
        for (const line of hindiLines) {
          ctx.fillText(line, 540, currentHindiY);
          currentHindiY += hindiLineHeight;
        }

        // 6. Draw Watermark solely: "irshad.live" matching the app header background (#F5F2ED)
        ctx.fillStyle = '#F5F2ED';
        ctx.font = '600 28px "Inter", sans-serif';
        ctx.fillText('irshad.live', 540, watermarkY);

        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => reject(err);
    img.src = imgSrc;
  });
}
