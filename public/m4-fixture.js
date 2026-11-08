export const markets = [
  { symbol: 'BTC/USD', en: 'Bitcoin', ar: 'بيتكوين', mark: '₿', base: 67420, decimals: 2 },
  { symbol: 'ETH/USD', en: 'Ethereum', ar: 'إيثريوم', mark: 'Ξ', base: 3430, decimals: 2 },
  { symbol: 'XAU/USD', en: 'Gold', ar: 'ذهب', mark: 'Au', base: 2318, decimals: 2 },
  { symbol: 'EUR/USD', en: 'Euro / US Dollar', ar: 'اليورو / الدولار', mark: '€', base: 1.076, decimals: 5 },
  { symbol: 'SPX', en: 'S&P 500 Index', ar: 'مؤشر إس آند بي 500', mark: 'S', base: 5220, decimals: 2 }
];

export const intervals = { '1H': 1, '4H': 4, '1D': 24 };
export const modes = ['fixture', 'stale', 'verified', 'unavailable', 'loading'];
export const hasBars = mode => mode === 'fixture' || mode === 'stale';
const hour = 3_600_000;
const fixtureEnd = Date.UTC(2024, 5, 20);
const sampleHours = 24 * 42;

// Offline display fixture with stable closing times. Never used as market evidence.
export function sampleBars(market, interval, mode) {
  if (!hasBars(mode)) return [];
  const hours = intervals[interval];
  const cutoff = mode === 'stale' ? sampleHours - 7 * 24 : sampleHours;
  let seed = 31 + markets.indexOf(market) * 13;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  const hourly = [];
  let open = market.base * 0.96;
  for (let i = 0; i < cutoff; i++) {
    const drift = Math.sin(i / 8) * .00037 + Math.sin(i / 39) * .00026 + .000045;
    const close = open * (1 + drift + (random() - .5) * .0019);
    const high = Math.max(open, close) * (1 + random() * .0008);
    const low = Math.min(open, close) * (1 - random() * .0008);
    hourly.push({ open, close, high, low, end: fixtureEnd - (sampleHours - i - 1) * hour });
    open = close;
  }
  const bars = [];
  for (let i = 0; i < hourly.length; i += hours) {
    const slice = hourly.slice(i, i + hours);
    bars.push({
      open: slice[0].open,
      close: slice.at(-1).close,
      high: Math.max(...slice.map(bar => bar.high)),
      low: Math.min(...slice.map(bar => bar.low)),
      end: slice.at(-1).end
    });
  }
  return bars.slice(-42);
}

export function exampleLevels(bars, market) {
  if (!bars.length) return null;
  const close = bars.at(-1).close;
  const range = Math.max(...bars.map(bar => bar.high)) - Math.min(...bars.map(bar => bar.low));
  return {
    confirmation: Number((close + range * .2).toFixed(market.decimals)),
    invalidation: Number((close - range * .28).toFixed(market.decimals))
  };
}
