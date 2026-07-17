// Postcard/photo mode: re-renders the current frame, stamps a small
// watermark plate (name + link) and downloads the result as a PNG.

const NAME_LINE = '🚙 IHSAN FAJARI · OFF-ROAD CV';
const LINK_LINE = 'linkedin.com/in/ihsanfajari';

export function capturePostcard(renderer, scene, camera) {
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
  const nameFont = `800 ${19 * s}px "Segoe UI", Arial, sans-serif`;
  const linkFont = `600 ${14 * s}px "Segoe UI", Arial, sans-serif`;
  ctx.font = nameFont;
  const nameW = ctx.measureText(NAME_LINE).width;
  ctx.font = linkFont;
  const linkW = ctx.measureText(LINK_LINE).width;

  const padX = 16 * s, padY = 12 * s, gap = 5 * s, margin = 18 * s;
  const w = Math.max(nameW, linkW) + padX * 2;
  const h = 19 * s + 14 * s + gap + padY * 2;
  const x = margin, y = c.height - margin - h;

  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12 * s);
  ctx.fillStyle = 'rgba(255,253,246,0.92)';
  ctx.fill();
  ctx.lineWidth = 2 * s;
  ctx.strokeStyle = 'rgba(29,43,58,0.85)';
  ctx.stroke();

  ctx.fillStyle = '#1d2b3a';
  ctx.textBaseline = 'top';
  ctx.font = nameFont;
  ctx.fillText(NAME_LINE, x + padX, y + padY);
  ctx.font = linkFont;
  ctx.fillStyle = '#e6482e';
  ctx.fillText(LINK_LINE, x + padX, y + padY + 19 * s + gap);

  const a = document.createElement('a');
  a.href = c.toDataURL('image/png');
  a.download = 'ihsan-fajari-offroad-cv.png';
  a.click();
  return a.href;
}
