function line(x1, y1, x2, y2, kind) {
  return `<line class="${kind}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
}

export function drawChart(container, { bars, levels, showLevels, active, format, label, terminal }) {
  const width = Math.max(230, container.clientWidth);
  const height = terminal ? (width < 570 ? 360 : 425) : 340;
  const right = width - 77;
  const top = 20;
  const bottom = height - 37;
  const left = 14;
  const visible = bars.slice(-(width < 450 ? 26 : 42));
  const rangeValues = visible.flatMap(bar => [bar.low, bar.high]);
  if (showLevels) rangeValues.push(levels.confirmation, levels.invalidation);
  const low = Math.min(...rangeValues);
  const high = Math.max(...rangeValues);
  const padding = (high - low) * .11;
  const priceY = price => top + (high + padding - price) / (high - low + padding * 2) * (bottom - top);
  const step = (right - left) / visible.length;
  const bodyWidth = Math.max(2.3, Math.min(11, step * .59));
  const xAt = i => left + (i + .5) * step;
  const utc = value => new Date(value).toISOString();
  const axis = Array.from({ length: 6 }, (_, i) => {
    const value = high + padding - (high - low + padding * 2) * i / 5;
    const y = priceY(value);
    return `${line(left, y, right, y, 'axis')}<text x="${right + 8}" y="${y + 4}">${format(value)}</text>`;
  }).join('');
  const timeAxis = [...new Set([0, Math.floor(visible.length * .34), Math.floor(visible.length * .68)])].map(i => {
    const x = xAt(i);
    const stamp = utc(visible[i].end);
    const label = visible[1].end - visible[0].end < 14_400_000 ? stamp.slice(11, 16) : stamp.slice(5, 10);
    return `${line(x, top, x, bottom, 'axis')}<text x="${x + 3}" y="${bottom + 22}">${label}</text>`;
  }).join('');
  const candles = visible.map((bar, i) => {
    const x = xAt(i);
    const y = Math.min(priceY(bar.open), priceY(bar.close));
    const kind = bar.close >= bar.open ? 'up' : 'down';
    return `${line(x, priceY(bar.high), x, priceY(bar.low), kind)}
      <rect class="${kind}" x="${x - bodyWidth / 2}" y="${y}" width="${bodyWidth}" height="${Math.max(1.3, Math.abs(priceY(bar.open) - priceY(bar.close)))}"/>`;
  }).join('');
  const last = bars.at(-1);
  const lastY = priceY(last.close);
  const overlays = showLevels ? [levels.confirmation, levels.invalidation].map(value =>
    line(left, priceY(value), right, priceY(value), 'level')).join('') : '';
  const activePosition = active - (bars.length - visible.length);
  const cursor = activePosition >= 0 && activePosition < visible.length ? line(xAt(activePosition), top, xAt(activePosition), bottom, 'cursor') : '';
  container.innerHTML = `<svg viewBox="0 0 ${width} ${height}" direction="ltr" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">
    ${axis}${timeAxis}${overlays}${candles}${cursor}
    ${line(left, lastY, right, lastY, 'level')}
    <rect x="${right + 3}" y="${lastY - 10}" width="70" height="20" rx="4" fill="var(--accent-bg)" stroke="var(--accent-border)"/>
    <text class="last-text" x="${right + 8}" y="${lastY + 4}">${format(last.close)}</text>
    </svg>`;
  return { left, step, offset: bars.length - visible.length };
}
