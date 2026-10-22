# Platform evolution — before / after

All images use explicit offline provider fixtures. These are UI evidence, not genuine TradingView candle or predictive-performance evidence. Before: exact canonical `a3e996e…`; after: local 7.2 candidate. The baseline production-package manifest matches the published release (`32f5c8fc…`).

| Section | Desktop EN dark: before → after | Mobile AR light: before → after |
| --- | --- | --- |
| Dashboard | [Before](platform-evolution-evidence/before-dashboard-1440-en-dark.png) → [After](platform-evolution-evidence/after-dashboard-1440-en-dark.png) | [Before](platform-evolution-evidence/before-dashboard-390-ar-light.png) → [After](platform-evolution-evidence/after-dashboard-390-ar-light.png) |
| Markets | [Before](platform-evolution-evidence/before-markets-1440-en-dark.png) → [After](platform-evolution-evidence/after-markets-1440-en-dark.png) | [Before](platform-evolution-evidence/before-markets-390-ar-light.png) → [After](platform-evolution-evidence/after-markets-390-ar-light.png) |
| Trading | [Before](platform-evolution-evidence/before-trading-1440-en-dark.png) → [After](platform-evolution-evidence/after-trading-1440-en-dark.png) | [Before](platform-evolution-evidence/before-trading-390-ar-light.png) → [After](platform-evolution-evidence/after-trading-390-ar-light.png) |
| AI Intelligence | [Before](platform-evolution-evidence/before-ai-1440-en-dark.png) → [After](platform-evolution-evidence/after-ai-1440-en-dark.png) | [Before](platform-evolution-evidence/before-ai-390-ar-light.png) → [After](platform-evolution-evidence/after-ai-390-ar-light.png) |
| Risk | [Before](platform-evolution-evidence/before-risk-1440-en-dark.png) → [After](platform-evolution-evidence/after-risk-1440-en-dark.png) | [Before](platform-evolution-evidence/before-risk-390-ar-light.png) → [After](platform-evolution-evidence/after-risk-390-ar-light.png) |
| Portfolio | [Before](platform-evolution-evidence/before-portfolio-1440-en-dark.png) → [After](platform-evolution-evidence/after-portfolio-1440-en-dark.png) | [Before](platform-evolution-evidence/before-portfolio-390-ar-light.png) → [After](platform-evolution-evidence/after-portfolio-390-ar-light.png) |
| Journal | [Before](platform-evolution-evidence/before-journal-1440-en-dark.png) → [After](platform-evolution-evidence/after-journal-1440-en-dark.png) | [Before](platform-evolution-evidence/before-journal-390-ar-light.png) → [After](platform-evolution-evidence/after-journal-390-ar-light.png) |
| Brokers | [Before](platform-evolution-evidence/before-brokers-1440-en-dark.png) → [After](platform-evolution-evidence/after-brokers-1440-en-dark.png) | [Before](platform-evolution-evidence/before-brokers-390-ar-light.png) → [After](platform-evolution-evidence/after-brokers-390-ar-light.png) |
| Settings | [Before](platform-evolution-evidence/before-settings-1440-en-dark.png) → [After](platform-evolution-evidence/after-settings-1440-en-dark.png) | [Before](platform-evolution-evidence/before-settings-390-ar-light.png) → [After](platform-evolution-evidence/after-settings-390-ar-light.png) |

The complete 144-image Cartesian set and its SHA-256 manifest are retained at `/workspace/work/platform-evolution-evidence/`. Selected 36 originals are committed here with per-file hashes; no image manipulation was used.

Reproduce after packaging with the existing fixture server (`node --import ./tests/browser-provider.js tests/packaged-launch.mjs`, hosted-safe environment), then set `TEST_URL=http://127.0.0.1:<printed port> EVOLUTION=1 CAPTURE_OUT=work/evolution-images` and run `python3 tests/capture_evolution.py`. Capture waits for actual research readiness and fast-forwards finite animations through Playwright.

The screenshots cover empty states. The automated connected-journey test additionally creates a real deterministic analysis, saves the idea and matched hypothetical plan through application APIs, exports original records, and captures the resulting local state. No account or verified-profit record is synthesized.
