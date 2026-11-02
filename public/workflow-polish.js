import {favoriteSymbols} from './professional-markets.js';

// Presentation only: keep original controls, listeners, values and form ownership.
const form = document.getElementById('workRiskForm');
const translations = [];
function label(element, en, ar) {
  translations.push({element, en, ar});
  return element;
}
function group(id, number, en, ar, controls) {
  const fieldset = document.createElement('fieldset');
  fieldset.id = id;
  fieldset.className = 'flow-risk-group';
  const legend = document.createElement('legend');
  const index = document.createElement('span');
  index.className = 'flow-step';
  index.textContent = number;
  index.setAttribute('aria-hidden', 'true');
  legend.append(index, label(document.createElement('span'), en, ar));
  fieldset.append(legend);
  for (const id of controls) fieldset.append(document.getElementById(id).closest('label'));
  return fieldset;
}
const market = group('flowRiskBudget', '01', 'Market & risk budget', 'السوق وميزانية المخاطر', ['planSymbol', 'planSide', 'planCapital', 'planRisk']);
const prices = group('flowRiskPrices', '02', 'Price & protection', 'السعر والحماية', ['planEntry', 'planStop', 'planTarget', 'planLeverage']);
const optional = group('flowRiskOptional', '03', 'Additional targets & notes · optional', 'أهداف وملاحظات إضافية · اختياري', ['d64Target2', 'd64Target3', 'd64PlanNote']);
document.querySelector('.d64-plan-extra').remove();
const calculate = form.querySelector('button[type="submit"]');
form.prepend(market, prices);
calculate.before(optional, document.querySelector('.v75-cost-option'));
form.append(calculate);
const layout = document.createElement('div');
layout.className = 'flow-risk-layout';
form.before(layout);
layout.append(form, document.querySelector('.q-planning-costs'));
const planner = form.closest('.work-planner');
planner.querySelector('h2').id = 'flowRiskTitle';
planner.setAttribute('aria-labelledby', 'flowRiskTitle');
planner.after(document.getElementById('evoRisk'));

// Favorites have one owner and one storage key in the existing Markets module.
// The strip carries symbols only: it never invents quotes or polling services.
const watchlist = document.createElement('nav');
watchlist.id = 'flowWatchlist';
watchlist.className = 'flow-watchlist';
const title = label(document.createElement('strong'), 'Watchlist', 'قائمة المتابعة');
const items = document.createElement('div');
items.className = 'flow-watchlist-items';
const manage = label(document.createElement('button'), 'Manage in Markets', 'إدارة في الأسواق');
manage.type = 'button';
manage.className = 'ghost small';
manage.onclick = () => document.querySelector('.nav-stack [data-view="markets"]').click();
watchlist.append(title, items, manage);
function placeWatchlist() {
  const terminal = document.getElementById('proTerminal');
  if (terminal.parentElement?.matches('#view-dashboard, #view-trading')) terminal.before(watchlist);
}
function selection() {
  const symbol = window.THNContext.get().symbol;
  for (const button of items.children) button.setAttribute('aria-pressed', String(button.dataset.symbol === symbol));
}
function renderFavorites() {
  const prior = items.contains(document.activeElement) ? document.activeElement.dataset.symbol : null;
  items.replaceChildren();
  for (const symbol of favoriteSymbols()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ghost small';
    button.dataset.symbol = symbol;
    button.dir = 'ltr';
    button.textContent = symbol;
    button.onclick = () => window.THNContext.set({symbol}, 'favorite-watchlist');
    items.append(button);
    if (symbol === prior) button.focus({preventScroll: true});
  }
  items.hidden = items.childElementCount === 0;
  selection();
}
items.addEventListener('focusin', event => event.target.scrollIntoView({block: 'nearest', inline: 'nearest'}));
function translate() {
  const arabic = document.documentElement.lang === 'ar';
  for (const {element, en, ar} of translations) element.textContent = arabic ? ar : en;
  watchlist.setAttribute('aria-label', arabic ? 'قائمة أدوات المتابعة المحفوظة' : 'Saved instrument watchlist');
}
window.addEventListener('thn:favorites', renderFavorites);
window.addEventListener('thn:market-catalog', renderFavorites);
window.addEventListener('thn:context', selection);
window.addEventListener('thn:view', placeWatchlist);
new MutationObserver(translate).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
translate();
renderFavorites();
placeWatchlist();
