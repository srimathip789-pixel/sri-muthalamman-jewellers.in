# Security Policy

## Reporting a vulnerability
Please **do not open a public issue**. Contact the owner privately via
WhatsApp (+91 70109 55834) or a GitHub private security advisory
(Security tab → "Report a vulnerability"). Expect a reply within 7 days.

## What protects this site
| Control | Where |
|---|---|
| Content-Security-Policy, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy | `netlify.toml`, `vercel.json` |
| HTML-escaping of all catalogue data + image path allow-list (anti-XSS) | `js/script.js` |
| No inline event handlers (CSP-compatible) | `js/script.js` |
| Third-party CSS pinned with Subresource Integrity (SRI) | `index.html` |
| Lightbox library self-hosted (no third-party JavaScript) | `vendor/glightbox/` |
| Trivy scan: dependency CVEs, leaked secrets, misconfiguration | `.github/workflows/security.yml` |
| Automated security regression tests (Playwright) | `tests/security.spec.js` |
| Dependabot updates for npm + GitHub Actions | `.github/dependabot.yml` |
| `security.txt` (RFC 9116) | `.well-known/security.txt` |

## Run the checks locally
```bash
npm ci
npx playwright test tests/security.spec.js
trivy fs --scanners vuln,secret,misconfig .
```
