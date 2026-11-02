// Brand presentation only. Route identity and application state retain their owners.
const route = document.getElementById('proRouteTitle');
const label = document.createElement('span');
label.className = 'identity-workspace-label';
route.before(label);
const theme = document.getElementById('themeBtn');
theme.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4v16a8 8 0 0 0 0-16Z"/></svg>';
function translate() {
  const arabic = document.documentElement.lang === 'ar';
  const light = document.documentElement.dataset.theme === 'light';
  label.textContent = arabic ? 'مساحة THN للأبحاث' : 'THN / RESEARCH WORKSPACE';
  document.querySelector('.brand-lockup').setAttribute('aria-label', arabic ? 'THN AI Trader · لوحة التحكم' : 'THN AI Trader · Dashboard');
  const action = light
    ? (arabic ? 'استخدام المظهر الداكن' : 'Switch to dark theme')
    : (arabic ? 'استخدام المظهر الفاتح' : 'Switch to light theme');
  theme.setAttribute('aria-label', action);
  theme.title = action;
}
translate();
new MutationObserver(translate).observe(document.documentElement, {attributes: true, attributeFilter: ['lang', 'data-theme']});
