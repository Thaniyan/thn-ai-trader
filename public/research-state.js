/* One non-financial context shared by the original nine-section application. */
(() => {
  const key = 'thn_research_context_v62';
  const validSymbol = value => typeof value === 'string' && /^[A-Z0-9^=:.\-]{1,32}$/.test(value);
  let saved; try { saved = JSON.parse(localStorage.getItem(key)); } catch { /* use defaults */ }
  let state = { symbol: validSymbol(saved?.symbol) ? saved.symbol : 'EURUSD', interval: ['15m','1h','1d'].includes(saved?.interval) ? saved.interval : '1h' };
  window.THNContext = {
    get: () => ({ ...state }),
    set(patch, source = 'user') {
      const next = { ...state, ...patch };
      if (!validSymbol(next.symbol) || !['15m','1h','1d'].includes(next.interval)) return false;
      if (next.symbol === state.symbol && next.interval === state.interval) return true;
      state = next; localStorage.setItem(key, JSON.stringify(state));
      window.dispatchEvent(new CustomEvent('thn:context', { detail: { ...state, source } })); return true;
    }
  };
})();
