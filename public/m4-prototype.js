import { copy } from './m4-copy.js';
import { drawChart } from './m4-chart.js';
import { exampleLevels, hasBars, intervals, markets, modes, sampleBars } from './m4-fixture.js';

const $ = selector => document.querySelector(selector);
const workspace = $('#workspace');
const dialog = $('#picker');
const query = $('#query');
const root = document.documentElement;
const keys = { language: 'thn-m4-language', theme: 'thn-m4-theme', record: 'thn-m4-record' };
const views = ['dashboard', 'terminal', 'risk'];
const viewFromHash = () => views.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'dashboard';

function read(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}

const state = {
  lang: read(keys.language) === 'ar' ? 'ar' : 'en',
  theme: read(keys.theme) === 'light' ? 'light' : 'dark',
  view: viewFromHash(),
  market: markets[0],
  interval: '4H',
  mode: 'fixture',
  showLevels: false,
  activeBar: -1,
  assumptions: {},
  result: null,
  message: '',
  badFields: []
};

const t = key => copy[state.lang][key];
const paths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  chart: '<path d="M4 20V5m0 15h16M8 15l4-5 4 2 4-6"/>',
  shield: '<path d="m12 3 8 4v5c0 4-4 8-8 9-4-1-8-5-8-9V7l8-4Z"/><path d="m9 12 2 2 4-4"/>',
  search: '<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M19 5l-1.5 1.5m-11 11L5 19"/>',
  moon: '<path d="M20 15A8.5 8.5 0 0 1 9 4a8.5 8.5 0 1 0 11 11Z"/>'
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
const format = (value, market = state.market) => new Intl.NumberFormat('en-US', { minimumFractionDigits: market.decimals, maximumFractionDigits: market.decimals }).format(value);
const usd = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const date = end => new Date(end).toISOString().slice(0, 16).replace('T', ' ');
const num = value => `<bdi class="num" dir="ltr">${value}</bdi>`;
const tag = (key, style = '') => `<span class="tag ${style}">${t(key)}</span>`;
const button = (label, view, style = 'primary') => `<a class="${style}" href="#${view}" data-view="${view}">${t(label)}</a>`;
const fact = (label, value) => `<div><dt>${t(label)}</dt><dd>${value}</dd></div>`;

let bars = [];
let levels = null;
let chartLayout;
let returnFocus;
const resize = new ResizeObserver(() => refreshChart());
const refreshData = () => {
  bars = sampleBars(state.market, state.interval, state.mode);
  levels = exampleLevels(bars, state.market);
  state.activeBar = -1;
};
refreshData();

function top() {
  root.lang = state.lang;
  root.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
  root.dataset.theme = state.theme;
  $('#current-view').textContent = t(state.view);
  $('#navigation').setAttribute('aria-label', t('workspace'));
  $('#language').textContent = state.lang === 'en' ? 'العربية' : 'English';
  $('#language').lang = state.lang === 'en' ? 'ar' : 'en';
  const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
  $('#theme').innerHTML = icon(nextTheme === 'light' ? 'sun' : 'moon');
  $('#theme').setAttribute('aria-label', t(nextTheme));
  $('#theme').title = t(nextTheme);
  document.querySelectorAll('#navigation [data-view]').forEach(link => {
    if (link.dataset.view === state.view) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.querySelectorAll('[data-t]').forEach(node => { node.textContent = t(node.dataset.t); });
  query.placeholder = t('filterHint');
  document.querySelectorAll('[data-icon]').forEach(node => { node.innerHTML = icon(node.dataset.icon); });
}

function context() {
  return `<div class="context">
    <div class="context-copy">${tag(state.mode, state.mode === 'fixture' ? 'accent' : 'warn')}
      <span>${t(state.mode + 'Note')}</span></div>
    <label class="sr-only" for="mode">${t('source')}</label>
    <select id="mode">${modes.map(mode => `<option value="${mode}" ${state.mode === mode ? 'selected' : ''}>${t(mode)}</option>`).join('')}</select>
  </div>`;
}

function identity(market = state.market) {
  return `<span class="mark" aria-hidden="true">${market.mark}</span><span><bdi dir="ltr">${market.symbol}</bdi><small>${market[state.lang]}</small></span>`;
}

function watchRows(list) {
  return list.map(market => {
    const close = sampleBars(market, state.interval, state.mode).at(-1)?.close;
    return `<button class="watch-row" type="button" data-market="${market.symbol}" aria-pressed="${market === state.market}">
      <span class="watch-symbol">${identity(market)}</span><span>${close ? num(format(close, market)) : '<span aria-hidden="true">—</span>'}</span>
    </button>`;
  }).join('');
}

function chartPanel() {
  const { market, mode, interval } = state;
  const last = bars.at(-1);
  const available = mode === 'fixture';
  return `<section class="panel" aria-labelledby="instrument">
    <div class="chart-head instrument">
      <div class="identity"><span class="mark" aria-hidden="true">${market.mark}</span><div>
        <h2 id="instrument"><bdi dir="ltr">${market.symbol}</bdi></h2><p>${market[state.lang]}</p></div></div>
      <div class="price"><strong>${last ? num(format(last.close)) : '—'}</strong>
        <span class="fine">${t(last ? 'lastClose' : 'noClose')}${last ? ` · ${num(date(last.end) + ' UTC')}` : ''}</span></div>
    </div>
    <div class="toolbar">
      <div class="seg">${Object.keys(intervals).map(value => `<button type="button" data-interval="${value}" aria-pressed="${interval === value}" ${available ? '' : 'disabled'}>${num(value)}</button>`).join('')}</div>
      <div class="seg"><button type="button" id="levels" aria-pressed="${available && state.showLevels}" ${available ? '' : 'disabled'}>${t('levels')}</button></div>
    </div>
    ${available ? `<figure class="chart" id="chart" tabindex="0" aria-describedby="chart-help"></figure>
      <p class="sr-only" id="chart-help">${t('chartKeyboard')}</p>` :
      `<div class="chart chart-empty"><strong>${t(mode)}</strong><span>${t(mode + 'Note')}</span></div>`}
    <div class="chart-note fine"><span>${available ? t('sampleOhlc') : t(mode)}</span><span id="bar-readout" aria-live="polite"></span></div>
  </section>`;
}

function evidence() {
  const last = bars.at(-1);
  return `<section class="panel" aria-labelledby="evidence">
    <div class="panel-top"><h2 id="evidence">${t(state.view === 'terminal' ? 'evidence' : 'provenance')}</h2><span data-icon="chart"></span></div>
    <dl class="fact-list panel-pad">
      ${fact('observed', t('none'))}
      ${fact('origin', t(last ? 'builtIn' : 'unset'))}
      ${last ? fact('time', num(date(last.end))) : ''}
      ${last && state.mode === 'fixture' && state.view === 'terminal' ? fact('highLow', num(format(last.high) + ' / ' + format(last.low))) : ''}
    </dl>
  </section>`;
}

function dashboard() {
  return `<div class="layout">
    <div class="stack">${chartPanel()}
      <section class="panel rail-card"><div class="eyebrow">${t('next')}</div>
        <h2 class="section-title">${t(state.mode === 'fixture' ? 'inspect' : 'blocked')}</h2>
        <p>${t(state.mode === 'fixture' ? 'inspectBody' : state.mode + 'Note')}</p>
        ${button('openTerminal', 'terminal', 'secondary next-action')}
      </section>
    </div>
    <div class="stack"><section class="panel">
      <div class="panel-top"><h2>${t('watchlist')}</h2>${tag('examples')}</div>
      <div class="watchlist">${watchRows(markets)}</div>
    </section>${evidence()}</div>
  </div>`;
}

function terminal() {
  const example = state.mode === 'fixture';
  return `<div class="layout terminal">
    ${chartPanel()}
    <div class="stack">
      ${evidence()}
      <section class="panel rail-card decision">
        <div class="eyebrow">${t('thesis')}</div>
        <h2 class="section-title">${t(example ? 'wait' : 'blocked')}</h2>
        <p>${t(example ? 'thesisBody' : state.mode === 'stale' ? 'staleThesis' : 'blockedThesis')}</p>
        ${example ? `<dl class="fact-list">${fact('confirmation', num(format(levels.confirmation)))}${fact('invalidation', num(format(levels.invalidation)))}</dl>
        <details class="details"><summary>${t('opposing')}</summary><p>${t('opposingBody')}</p></details>` : ''}
        ${button('plan', 'risk')}
      </section>
    </div>
  </div>`;
}

const fields = ['entry', 'stop', 'size', 'budget'];

function initialAssumptions() {
  // A detached educational scenario still works when attributed evidence is absent.
  const sample = levels ?? exampleLevels(sampleBars(state.market, state.interval, 'fixture'), state.market);
  const size = { 'BTC/USD': 0.1, 'ETH/USD': 1, 'XAU/USD': 5, 'EUR/USD': 1000, SPX: 1 };
  return { entry: sample.confirmation, stop: sample.invalidation, size: size[state.market.symbol], budget: 100 };
}
state.assumptions = initialAssumptions();

function savedRecord() {
  try {
    const record = JSON.parse(read(keys.record));
    if (!record || !markets.some(market => market.symbol === record.symbol) ||
        !Object.hasOwn(intervals, record.interval) || !modes.includes(record.mode) ||
        !Number.isFinite(record.loss)) return null;
    return record;
  } catch { return null; }
}

function savedMarkup() {
  const record = savedRecord();
  if (!record) return `<p>${t('noPrior')}</p>`;
  const stamp = typeof record.bar === 'number' && Number.isFinite(record.bar) && Math.abs(record.bar) <= 8.64e15 ? num(date(record.bar)) : t('none');
  return `<dl class="fact-list">${fact('sourceAtSave', `${t(record.mode)} · ${num(record.symbol)} · ${num(record.interval)}`)}
    ${fact('asOfSave', stamp)}${fact('loss', num(usd(record.loss)))}</dl>`;
}

function risk() {
  return `<ol class="steps">
    ${['stageEvidence', 'stageAssumptions', 'stageResult'].map((key, i) => `<li data-stage="${i}"><span class="step-number">${i + 1}</span>${t(key)}</li>`).join('')}
  </ol>
  <div class="layout risk-layout">
    <section class="panel">
      <div class="panel-top"><h2>${t('assumptions')}</h2>${tag('hypothetical', 'warn')}</div>
      <form class="panel-pad" id="scenario" novalidate>
        <div class="identity"><span class="mark" aria-hidden="true">${state.market.mark}</span>
          <div><strong><bdi dir="ltr">${state.market.symbol}</bdi></strong><p>${t('riskSource')} · ${t(state.mode)} · ${num(state.interval)}</p></div></div>
        <p class="fine">${t('costNote')}</p>
        <div class="fields">${fields.map(key => `<label for="${key}">${t(key)}<input required type="number" min="0" step="any" inputmode="decimal" id="${key}" name="${key}" aria-describedby="form-message"></label>`).join('')}</div>
        <div id="form-message" class="form-message" role="status"></div>
        <div class="actions"><button class="primary" type="submit">${t('check')}</button><button id="reset" class="secondary" type="button">${t('reset')}</button></div>
      </form>
    </section>
    <div class="stack">
      <section class="panel"><div class="panel-top"><h2>${t('result')}</h2><span data-icon="shield"></span></div>
        <div class="panel-pad" id="result" aria-live="polite"></div>
        <div class="panel-pad actions"><button class="secondary" id="save" type="button" disabled>${t('save')}</button></div>
        <p class="saved panel-pad" id="saved" role="status" hidden></p>
      </section>
      <section class="panel rail-card">
        <h2 class="section-title">${t('riskRestricted')}</h2><p>${t('riskRestrictedBody')}</p>
        <details class="details"><summary>${t('savedReview')}</summary><div id="saved-record">${savedMarkup()}</div></details>
        ${button('back', 'terminal', 'secondary')}
      </section>
    </div>
  </div>`;
}

function refreshResult() {
  const output = $('#result');
  if (!output) return;
  const result = state.result;
  const stage = result ? 2 : 1;
  document.querySelectorAll('[data-stage]').forEach(item => {
    if (Number(item.dataset.stage) === stage) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
  $('#form-message').textContent = state.message ? t(state.message) : '';
  fields.forEach(key => $('#' + key).setAttribute('aria-invalid', String(state.badFields.includes(key))));
  $('#save').disabled = !result || result.remaining < 0;
  $('#saved').hidden = true;
  const budgetShare = result ? result.loss / result.assumptions.budget : 0;
  output.innerHTML = result ?
    `${tag(result.remaining >= 0 ? 'within' : 'over', result.remaining >= 0 ? 'accent' : 'warn')}
      <dl class="result-list">${fact('loss', num(usd(result.loss)))}${fact('remaining', num(usd(result.remaining)))}</dl>
      <div class="budget-meter"><label for="budget-usage">${t('budgetUsed')}</label><meter id="budget-usage" min="0" max="1" value="${Math.min(1, budgetShare)}"></meter></div>
      <p class="fine">${t('resultNote')}</p>` : `<p class="muted">${t('pending')}</p>`;
}

function clearResult() {
  state.result = null;
  state.message = '';
  state.badFields = [];
  refreshResult();
}

function resetScenario() {
  state.assumptions = initialAssumptions();
  clearResult();
}

function bindRisk() {
  const form = $('#scenario');
  if (!form) return;
  fields.forEach(key => { form.elements[key].value = state.assumptions[key] ?? ''; });
  form.addEventListener('input', event => {
    state.assumptions[event.target.name] = event.target.value;
    clearResult();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    clearResult();
    const values = Object.fromEntries(fields.map(key => [key, form.elements[key].valueAsNumber]));
    const invalid = fields.filter(key => !Number.isFinite(values[key]) || values[key] <= 0);
    if (invalid.length) {
      state.message = 'invalidNumber';
      state.badFields = invalid;
    } else if (values.stop >= values.entry) {
      state.message = 'invalidStop';
      state.badFields = ['stop'];
    } else {
      const loss = (values.entry - values.stop) * values.size;
      if (!Number.isFinite(loss) || loss <= 0) {
        state.message = 'invalidResult';
        state.badFields = ['entry', 'stop', 'size'];
      } else {
        state.result = { loss, remaining: values.budget - loss, assumptions: values };
      }
    }
    refreshResult();
    if (state.badFields.length) form.elements[state.badFields[0]].focus();
  });
  $('#reset').onclick = () => {
    resetScenario();
    fields.forEach(key => { form.elements[key].value = state.assumptions[key]; });
  };
  $('#save').onclick = () => {
    if (!state.result || state.result.remaining < 0) return;
    const record = {
      version: 1,
      kind: 'hypothetical-prototype',
      symbol: state.market.symbol,
      interval: state.interval,
      mode: state.mode,
      bar: bars.at(-1)?.end ?? null,
      ...state.result
    };
    const ok = write(keys.record, JSON.stringify(record));
    $('#saved').hidden = false;
    $('#saved').textContent = t(ok ? 'saved' : 'saveFailure');
    if (ok) $('#saved-record').innerHTML = savedMarkup();
  };
  refreshResult();
}

function refreshChart() {
  const chart = $('#chart');
  if (!chart) return;
  chartLayout = drawChart(chart, {
    bars, levels, showLevels: state.showLevels, active: state.activeBar, format,
    label: t('chartLabel'), terminal: state.view === 'terminal'
  });
  const bar = bars[state.activeBar];
  $('#bar-readout').textContent = bar ?
    `${t('bar')} ${date(bar.end)} UTC · ${t('closePrice')} ${format(bar.close)}` :
    state.showLevels ? t('levelsLegend') : '';
}

function inspectBar(index) {
  if (index === state.activeBar) return;
  state.activeBar = index;
  refreshChart();
}

function bindChart() {
  const chart = $('#chart');
  if (!chart) return;
  resize.observe(chart);
  refreshChart();
  chart.addEventListener('pointermove', event => {
    const left = chart.getBoundingClientRect().left;
    const { left: inset, step, offset } = chartLayout;
    const index = offset + Math.floor((event.clientX - left - inset) / step);
    inspectBar(index >= offset && index < bars.length ? index : -1);
  });
  chart.addEventListener('pointerleave', () => inspectBar(-1));
  chart.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Escape') {
      inspectBar(-1);
      return;
    }
    const origin = state.activeBar < 0 ? bars.length : state.activeBar;
    const delta = event.key === 'ArrowLeft' ? -1 : 1;
    inspectBar(Math.min(bars.length - 1, Math.max(chartLayout.offset, origin + delta)));
  });
}

function render() {
  resize.disconnect();
  const number = views.indexOf(state.view) + 1;
  const content = { dashboard, terminal, risk };
  workspace.innerHTML = `<div class="page-head"><div>
    <div class="heading-label"><span class="eyebrow">${num('0' + number)} / ${t('workspace')}</span><span class="review">${tag('review')}</span></div>
    <h1>${t(state.view + 'Title')}</h1><p>${t(state.view + 'Intro')}</p>
    </div></div>
    ${context()}${content[state.view]()}<p class="mobile-mode">${t('mode')} · ${t('restrictions')} <a href="/">${t('existing')}</a></p>`;
  top();
  $('#mode').onchange = event => {
    state.mode = event.target.value;
    refreshData();
    resetScenario();
    render();
    $('#mode').focus();
  };
  bindChart();
  bindRisk();
}

function updateMarket(symbol) {
  const market = markets.find(candidate => candidate.symbol === symbol);
  if (!market || market === state.market) return;
  state.market = market;
  refreshData();
  resetScenario();
  render();
}

function renderPicker() {
  const filter = query.value.trim().toLowerCase();
  const list = markets.filter(market => [market.symbol, market.en, market.ar].some(name => name.toLowerCase().includes(filter)));
  $('#picker-results').innerHTML = list.length ? watchRows(list) : `<p class="muted">${t('noMatches')}</p>`;
}

function openPicker() {
  if (dialog.open) return;
  returnFocus = document.activeElement;
  query.value = '';
  renderPicker();
  dialog.showModal();
  query.focus();
}

$('#open-picker').onclick = openPicker;
$('#close-picker').onclick = () => dialog.close();
dialog.addEventListener('close', () => returnFocus?.focus());
query.addEventListener('input', renderPicker);
dialog.addEventListener('keydown', event => {
  if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return;
  const rows = Array.from(dialog.querySelectorAll('[data-market]'));
  if (!rows.length) return;
  if (event.key === 'Enter' && event.target === query) {
    event.preventDefault();
    rows[0].click();
    return;
  }
  if (event.key === 'Enter') return;
  event.preventDefault();
  const current = rows.indexOf(document.activeElement);
  const index = current < 0 ? (event.key === 'ArrowDown' ? 0 : rows.length - 1) : current + (event.key === 'ArrowDown' ? 1 : -1);
  (rows[index] ?? query).focus();
});
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    openPicker();
  }
});
document.addEventListener('click', event => {
  const item = event.target.closest('[data-market]');
  if (item) {
    updateMarket(item.dataset.market);
    if (dialog.open) dialog.close();
    else document.querySelector(`[data-market="${item.dataset.market}"]`)?.focus();
  }
  const interval = event.target.closest('[data-interval]');
  if (interval) {
    state.interval = interval.dataset.interval;
    refreshData();
    resetScenario();
    render();
    document.querySelector(`[data-interval="${state.interval}"]`).focus();
  }
  if (event.target.closest('#levels')) {
    state.showLevels = !state.showLevels;
    $('#levels').setAttribute('aria-pressed', String(state.showLevels));
    refreshChart();
  }
});
window.addEventListener('hashchange', () => {
  const next = viewFromHash();
  if (next === state.view) return;
  state.view = next;
  render();
  workspace.focus();
  window.scrollTo(0, 0);
});
$('#language').onclick = () => {
  state.lang = state.lang === 'en' ? 'ar' : 'en';
  write(keys.language, state.lang);
  render();
};
$('#theme').onclick = () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  write(keys.theme, state.theme);
  root.dataset.theme = state.theme;
  top();
};
render();
