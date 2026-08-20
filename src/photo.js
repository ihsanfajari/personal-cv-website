// Postcard/photo mode: re-renders the current frame, stamps a small
// watermark plate (name + link) and downloads the result as a PNG.
// The race page passes a finish time as `bigLine` to turn it into a result card.

const NAME_LINE = 'IHSAN FAJARI · OFF-ROAD CV';
const LINK_LINE = 'linkedin.com/in/ihsanfajari';

export function capturePostcard(renderer, scene, camera, opts = {}) {
  const nameLine = opts.nameLine ?? NAME_LINE;
  const linkLine = opts.linkLine ?? LINK_LINE;
  const bigLine = opts.bigLine ?? null;
  const fileName = opts.fileName ?? 'ihsan-fajari-offroad-cv.png';

  // the WebGL buffer isn't preserved between frames, so render right before reading
  renderer.render(scene, camera);
  const src = renderer.domElement;

  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(src, 0, 0);

  // watermark plate, scaled with the shot so it reads the same at any resolution
  const s = Math.max(1, c.width / 1280);
  const bigFont = `600 ${52 * s}px "IBM Plex Mono", Consolas, monospace`;
  const nameFont = `800 ${19 * s}px "Work Sans", "Segoe UI", Arial, sans-serif`;
  const linkFont = `600 ${13 * s}px "IBM Plex Mono", Consolas, monospace`;

  ctx.font = bigFont;
  const bigW = bigLine ? ctx.measureText(bigLine).width : 0;
  ctx.font = nameFont;
  const nameW = ctx.measureText(nameLine).width;
  ctx.font = linkFont;
  const linkW = ctx.measureText(linkLine).width;

  const padX = 16 * s, padY = 12 * s, gap = 5 * s, margin = 20 * s;
  const bigH = bigLine ? 56 * s + gap * 2 : 0;
  const w = Math.max(bigW, nameW, linkW) + padX * 2;
  const h = bigH + 19 * s + 14 * s + gap + padY * 2;
  const x = margin, y = c.height - margin - h;

  // Rally Roadbook plate: slight tilt + hard offset shadow, like the HUD chrome
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(-0.021);
  ctx.translate(-(x + w / 2), -(y + h / 2));

  ctx.beginPath();
  ctx.roundRect(x + 3 * s, y + 3 * s, w, h, 10 * s);
  ctx.fillStyle = 'rgba(32,20,10,0.9)';
  ctx.fill();

  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10 * s);
  ctx.fillStyle = '#fffaf0';
  ctx.fill();
  ctx.lineWidth = 2 * s;
  ctx.strokeStyle = '#202e3d';
  ctx.stroke();

  ctx.textBaseline = 'top';
  let cursorY = y + padY;

  if (bigLine) {
    ctx.font = bigFont;
    ctx.fillStyle = '#202e3d';
    ctx.fillText(bigLine, x + padX, cursorY);
    cursorY += 56 * s + gap;
    ctx.beginPath();
    ctx.moveTo(x + padX, cursorY);
    ctx.lineTo(x + w - padX, cursorY);
    ctx.lineWidth = 1.5 * s;
    ctx.strokeStyle = 'rgba(32,46,61,0.34)';
    ctx.stroke();
    cursorY += gap;
  }

  ctx.fillStyle = '#202e3d';
  ctx.font = nameFont;
  ctx.fillText(nameLine, x + padX, cursorY);
  ctx.font = linkFont;
  ctx.fillStyle = '#c8492e';
  ctx.fillText(linkLine, x + padX, cursorY + 19 * s + gap);
  ctx.restore();

  const a = document.createElement('a');
  a.href = c.toDataURL('image/png');
  a.download = fileName;
  a.click();
  return a.href;
}
