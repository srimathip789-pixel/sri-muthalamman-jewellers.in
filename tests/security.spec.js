// Security regression tests — run: npx playwright test tests/security.spec.js
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const XSS_ITEMS = [
    {
        id: 1, metal: 'gold', category: 'necklace', collection: 'veda<script>window.__pwned=1</script>',
        name: '<img src=x onerror="window.__pwned=1">Evil Necklace',
        description: '"><svg onload="window.__pwned=1">', weight: 10,
        img: 'assets/img/gold-necklace-3.jpg',
    },
    {
        id: 2, metal: 'gold', category: 'ring', collection: 'veda',
        name: 'Bad Image Path', description: 'test', weight: 5,
        img: 'javascript:window.__pwned=1',
    },
];

test.describe('Security: XSS protection in catalogue rendering', () => {
    test('malicious catalogue data is rendered as text, never executed', async ({ page }) => {
        let dialogFired = false;
        page.on('dialog', d => { dialogFired = true; d.dismiss(); });
        await page.route('**/data/jewellery.json', r =>
            r.fulfill({ contentType: 'application/json', body: JSON.stringify(XSS_ITEMS) }));

        await page.goto('/');
        await expect(page.locator('.product-card')).toHaveCount(2);

        expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
        expect(dialogFired).toBe(false);
        await expect(page.locator('#catalogue-view img[onerror], #catalogue-view svg, #catalogue-view script')).toHaveCount(0);
        await expect(page.locator('.product-card h4').first()).toContainText('<img src=x');
    });

    test('non-local image paths (javascript:, external) are rejected', async ({ page }) => {
        await page.route('**/data/jewellery.json', r =>
            r.fulfill({ contentType: 'application/json', body: JSON.stringify(XSS_ITEMS) }));
        await page.goto('/');
        const hrefs = await page.locator('#catalogue-view a.glightbox').evaluateAll(a => a.map(x => x.getAttribute('href')));
        hrefs.forEach(h => expect(h).not.toMatch(/^javascript:/i));
    });
});

test.describe('Security: page hardening', () => {
    test.beforeEach(async ({ page }) => { await page.goto('/'); });

    test('no inline event-handler attributes in the DOM (CSP-compatible)', async ({ page }) => {
        await expect(page.locator('.product-card').first()).toBeVisible();
        const inline = await page.evaluate(() =>
            [...document.querySelectorAll('*')].filter(el =>
                [...el.attributes].some(a => /^on/i.test(a.name))).map(el => el.outerHTML.slice(0, 80)));
        expect(inline).toEqual([]);
    });

    test('no third-party JavaScript is loaded', async ({ page }) => {
        const srcs = await page.locator('script[src]').evaluateAll(s => s.map(x => x.src));
        srcs.forEach(src => expect(new URL(src).origin).toBe('http://localhost:3000'));
    });

    test('third-party CDN stylesheets use Subresource Integrity', async ({ page }) => {
        const links = await page.locator('link[rel="stylesheet"]').evaluateAll(l =>
            l.map(x => ({ href: x.href, integrity: x.integrity })));
        links.filter(l => l.href.includes('cdnjs.cloudflare.com') || l.href.includes('jsdelivr'))
            .forEach(l => expect(l.integrity, l.href).toMatch(/^sha(256|384|512)-/));
    });

    test('links opening a new tab use rel="noopener noreferrer"', async ({ page }) => {
        await expect(page.locator('.product-card').first()).toBeVisible();
        const rels = await page.locator('a[target="_blank"]').evaluateAll(a => a.map(x => x.rel));
        expect(rels.length).toBeGreaterThan(0);
        rels.forEach(rel => { expect(rel).toContain('noopener'); expect(rel).toContain('noreferrer'); });
    });
});

test.describe('Security: hosting configuration', () => {
    const required = ['Content-Security-Policy', 'Strict-Transport-Security', 'X-Content-Type-Options',
        'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy'];
    const root = path.join(__dirname, '..');

    test('netlify.toml defines all security headers', () => {
        const toml = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');
        required.forEach(h => expect(toml, h).toContain(h));
    });

    test('vercel.json defines all security headers', () => {
        const cfg = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
        const keys = cfg.headers.flatMap(h => h.headers.map(x => x.key));
        required.forEach(h => expect(keys, h).toContain(h));
    });

    test('security.txt is published', async ({ request }) => {
        const res = await request.get('/.well-known/security.txt');
        expect(res.ok()).toBe(true);
        expect(await res.text()).toMatch(/^Contact:/m);
    });
});
