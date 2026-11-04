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

        // 2. White band starting from bottom 2/3rd (starting at y ~ 1160px down to 1920px)
        // Alpha ranging from 20% (0.2) at the top to 100% (1.0) at the bottom
        const bandStartY = 1160;

        // Feathered entry above the band for seamless visual fade
        const featherGrad = ctx.createLinearGradient(0, bandStartY - 120, 0, bandStartY);
        featherGrad.addColorStop(0, 'rgba(255, 255, 255, 0.00)');
        featherGrad.addColorStop(1, 'rgba(255, 255, 255, 0.20)');
        ctx.fillStyle = featherGrad;
        ctx.fillRect(0, bandStartY - 120, 1080, 120);

        // Main white band with alpha ramping up to solid white for high text contrast
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

        // 3. Bottom-aligned layout calculation
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

        // Draw Urdu Sher (bottom-aligned)
        ctx.fillStyle = '#81314A';
        ctx.font = 'bold 44px "Noto Nastaliq Urdu", serif';
        let currentUrduY = urduStartY;
        for (const line of urduLines) {
          ctx.fillText(line, 540, currentUrduY);
          currentUrduY += urduLineHeight;
        }

        // Draw Hindi Sher (bottom-aligned)
        ctx.fillStyle = '#81314A';
        ctx.font = '600 33px "Noto Serif Devanagari", serif';
        let currentHindiY = hindiStartY;
        for (const line of hindiLines) {
          ctx.fillText(line, 540, currentHindiY);
          currentHindiY += hindiLineHeight;
        }

        // Draw Watermark solely: "irshad.live" at the bottom
        ctx.fillStyle = '#81314A';
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
