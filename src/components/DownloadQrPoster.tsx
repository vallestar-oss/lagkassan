"use client";

import { toFilename } from "@/lib/utils";

type Props = {
  qrDataUrl: string;
  collectionTitle: string;
  teamName: string;
  amountLabel: string;
  shareUrl: string;
};

// A4-ish portrait, sized to look right printed and pinned on a wall.
const CANVAS_W = 800;
const CANVAS_H = 1132;

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function DownloadQrPoster({ qrDataUrl, collectionTitle, teamName, amountLabel, shareUrl }: Props) {
  async function handleDownload() {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.textAlign = "center";

    ctx.fillStyle = "#6B6860";
    ctx.font = "600 24px sans-serif";
    ctx.fillText(teamName.toUpperCase(), CANVAS_W / 2, 110);

    ctx.fillStyle = "#1A1917";
    ctx.font = "bold 52px sans-serif";
    const titleLines = wrapText(ctx, collectionTitle, CANVAS_W - 120);
    let y = 190;
    for (const line of titleLines) {
      ctx.fillText(line, CANVAS_W / 2, y);
      y += 62;
    }

    ctx.fillStyle = "#6B6860";
    ctx.font = "32px sans-serif";
    ctx.fillText(amountLabel, CANVAS_W / 2, y + 24);

    const qrImg = new Image();
    await new Promise<void>((resolve, reject) => {
      qrImg.onload = () => resolve();
      qrImg.onerror = () => reject(new Error("QR image failed to load"));
      qrImg.src = qrDataUrl;
    });

    const qrSize = 460;
    const qrX = (CANVAS_W - qrSize) / 2;
    const qrY = y + 90;
    ctx.strokeStyle = "#E5E3DF";
    ctx.lineWidth = 2;
    ctx.strokeRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48);
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    const afterQrY = qrY + qrSize + 70;
    ctx.fillStyle = "#1D6EE8";
    ctx.font = "bold 36px sans-serif";
    ctx.fillText("Skanna för att betala", CANVAS_W / 2, afterQrY);

    ctx.fillStyle = "#6B6860";
    ctx.font = "22px sans-serif";
    ctx.fillText(shareUrl.replace(/^https?:\/\//, ""), CANVAS_W / 2, afterQrY + 42);

    ctx.fillStyle = "#6B6860";
    ctx.font = "600 18px sans-serif";
    ctx.fillText("Lagkassan", CANVAS_W / 2, CANVAS_H - 50);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${toFilename(collectionTitle)}-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="text-[11px] text-accent hover:underline text-center max-w-[88px]"
    >
      Ladda ner
    </button>
  );
}
