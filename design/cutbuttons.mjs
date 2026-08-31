import sharp from 'sharp';

async function cutout(src, region, outPath, size, opts = {}) {
  const { satMax = 70, lightMin = 170 } = opts;
  const { data, info } = await sharp(src)
    .extract(region)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = 4;
  const idx = (x, y) => (y * W + x) * C;
  const isBg = (x, y) => {
    const i = idx(x, y);
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return mx - mn <= satMax && mx >= lightMin;
  };
  const visited = new Uint8Array(W * H);
  const stack = [];
  const push = (x, y) => {
    if (x >= 0 && x < W && y >= 0 && y < H && !visited[y * W + x]) { visited[y * W + x] = 1; stack.push(x, y); }
  };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (stack.length) {
    const y = stack.pop(), x = stack.pop();
    if (!isBg(x, y)) continue;
    data[idx(x, y) + 3] = 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .trim({ threshold: 1 })
    .resize(size, size, { fit: 'inside' })
    .png()
    .toFile(outPath);
  console.log('wrote', outPath);
}

// run button (green runner) and reroll (yellow flower)
await cutout('elements.png', { left: 660, top: 850, width: 158, height: 160 }, 'out/btn-run.png', 160);
await cutout('elements.png', { left: 1012, top: 842, width: 192, height: 180 }, 'out/btn-reroll.png', 160);
