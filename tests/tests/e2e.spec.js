const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Give images time to load in lazy-load scenarios
test.setTimeout(60000);

// ─────────────────────────────────────────────────────────────────────────────
// APPROVED JEWELLERY KEYWORDS — images must belong to ONE of these categories
// ─────────────────────────────────────────────────────────────────────────────
const JEWELLERY_KEYWORDS = [
    'necklace', 'haram', 'choker', 'chain', 'pendant',
    'earring', 'jhumka', 'stud', 'drop',
    'bangle', 'bracelet', 'kada', 'kada',
    'ring', 'band',
    'set', 'bridal',
    'gold', 'silver', 'diamond',
    'jewellery', 'jewel', 'jewelry',
    'temple', 'antique', 'matte',
    'lamp', 'statue', 'deity', 'puja', 'sterling'
];

// ─────────────────────────────────────────────────────────────────────────────
// NON-JEWELLERY BLACKLIST — these must NEVER appear in any alt text / card text
// ─────────────────────────────────────────────────────────────────────────────
const BLACKLIST = [
    'fish', 'food', 'handbag', 'bag', 'shoe', 'cloth', 'dress', 'plant',
    'animal', 'car', 'landscape', 'person', 'face', 'hand'
];

// ─────────────────────────────────────────────────────────────────────────────
// APPROVED local image path prefix
// ─────────────────────────────────────────────────────────────────────────────
const APPROVED_IMG_PREFIX = 'assets/img/';

test.describe('Image Integrity — Only Jewellery in Catalogue', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        // Wait for catalogue cards to be injected by JS
        await page.waitForSelector('.product-card', { timeout: 15000 });
    });

    // ── TEST 1: JSON DB — every item points to an approved local image path ──
    test('[DB] All jewellery.json items use local assets/img/ paths', () => {
        const dbPath = path.join(__dirname, '..', 'data', 'jewellery.json');
        expect(fs.existsSync(dbPath), 'jewellery.json must exist').toBe(true);

        const items = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        expect(items.length, 'Catalogue must have at least 10 items').toBeGreaterThanOrEqual(10);

        items.forEach(item => {
            // Image must be a local path — NOT an external http URL
            expect(
                item.img,
                `Item "${item.name}" must use local path (assets/img/...), got: ${item.img}`
            ).toMatch(/^assets\/img\//);

            // Image filename must contain a jewellery-related keyword
            const filename = item.img.toLowerCase();
            const hasJewelleryKeyword = JEWELLERY_KEYWORDS.some(kw => filename.includes(kw));
            expect(
                hasJewelleryKeyword,
                `Image file "${item.img}" for "${item.name}" must have a jewellery keyword in its filename`
            ).toBe(true);

            // Blacklist check on filename
            BLACKLIST.forEach(bad => {
                expect(
                    filename,
                    `Image "${item.img}" must NOT contain blacklisted word: "${bad}"`
                ).not.toContain(bad);
            });

            // Local file must exist
            const fullPath = path.join(__dirname, '..', item.img);
            expect(
                fs.existsSync(fullPath),
                `Local image file must exist: ${fullPath}`
            ).toBe(true);
        });
    });

    // ── TEST 2: DB — all item names & descriptions contain jewellery terms ──
    test('[DB] All item names are jewellery-related (no non-jewellery items)', () => {
        const items = JSON.parse(fs.readFileSync(
            path.join(__dirname, '..', 'data', 'jewellery.json'), 'utf-8'));

        items.forEach(item => {
            const text = (item.name + ' ' + item.description).toLowerCase();

            // Name must contain at least one jewellery keyword
            const isJewellery = JEWELLERY_KEYWORDS.some(kw => text.includes(kw));
            expect(
                isJewellery,
                `"${item.name}" does not appear to be a jewellery item`
            ).toBe(true);

            // Name must NOT contain blacklisted non-jewellery content (whole word match)
            BLACKLIST.forEach(bad => {
                const wordBoundary = new RegExp(`\\b${bad}\\b`, 'i');
                expect(
                    wordBoundary.test(text),
                    `Item "${item.name}" must not contain blacklisted word: "${bad}"`
                ).toBe(false);
            });
        });
    });

    // ── TEST 3: UI — all rendered product cards have valid local image src paths ──
    test('[UI] Every product card image has a valid local src path (no broken external URLs)', async ({ page }) => {
        // Scroll through page to trigger lazy loading
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(3000);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(1000);

        const imageSrcs = await page.evaluate(() =>
            [...document.querySelectorAll('.product-card img')].map(img => ({
                src: img.getAttribute('src') || img.src,
                alt: img.alt
            }))
        );

        expect(imageSrcs.length, 'Catalogue must show at least 1 card').toBeGreaterThan(0);

        imageSrcs.forEach(({ src, alt }) => {
            // Every image must reference a local asset path
            const isLocal = src.startsWith('assets/img/') || src.includes('/assets/img/');
            expect(
                isLocal,
                `Image for "${alt}" must use local assets/img/ path, got: ${src}`
            ).toBe(true);

            // src must end with an image extension
            expect(
                src,
                `Image src must end with .jpg, .png, or .webp: ${src}`
            ).toMatch(/\.(jpg|jpeg|png|webp)$/i);
        });
    });

    // ── TEST 4: UI — all card alt texts are jewellery-related ──
    test('[UI] All rendered image alt texts are jewellery-related', async ({ page }) => {
        const cardAltTexts = await page.evaluate(() =>
            [...document.querySelectorAll('.product-card img')].map(img => img.alt.toLowerCase())
        );

        expect(cardAltTexts.length, 'Catalogue must render at least 1 card').toBeGreaterThan(0);

        cardAltTexts.forEach(alt => {
            const isJewellery = JEWELLERY_KEYWORDS.some(kw => alt.includes(kw));
            expect(
                isJewellery,
                `Card alt text "${alt}" does not match any jewellery keyword. Non-jewellery image found!`
            ).toBe(true);

            // Blacklist check on alt text
            BLACKLIST.forEach(bad => {
                expect(
                    alt,
                    `Alt text "${alt}" contains blacklisted word: "${bad}". Remove this image!`
                ).not.toContain(bad);
            });
        });
    });

    // ── TEST 5: UI — no image src points to forbidden external domains ──
    test('[UI] No catalogue image loads from non-approved external domains', async ({ page }) => {
        const FORBIDDEN_DOMAINS = ['handbag', 'food', 'fish', 'pixabay', 'pexels'];

        const imageSrcs = await page.evaluate(() =>
            [...document.querySelectorAll('.product-card img')].map(img => img.src)
        );

        imageSrcs.forEach(src => {
            const srcLower = src.toLowerCase();
            FORBIDDEN_DOMAINS.forEach(forbidden => {
                expect(
                    srcLower,
                    `Image src "${src}" references a forbidden domain/keyword: "${forbidden}"`
                ).not.toContain(forbidden);
            });
        });
    });

    // ── TEST 6: UI — every card has jewellery-related category tags ──
    test('[UI] All card tags are valid jewellery collection names', async ({ page }) => {
        const VALID_TAGS = ['veda', 'mudhra', 'era', 'contemporary', 'VEDA', 'MUDHRA', 'ERA', 'CONTEMPORARY'];

        const tags = await page.evaluate(() =>
            [...document.querySelectorAll('.card-tag')].map(el => el.textContent.trim())
        );

        tags.forEach(tag => {
            expect(
                VALID_TAGS.some(v => v.toLowerCase() === tag.toLowerCase()),
                `Card tag "${tag}" is not a valid collection name`
            ).toBe(true);
        });
    });

    // ── TEST 7: UI — card enquire buttons all link to WhatsApp ──
    test('[UI] All Enquire buttons link to the correct WhatsApp number', async ({ page }) => {
        const enquireBtns = await page.evaluate(() =>
            [...document.querySelectorAll('.enquire-btn')].map(btn => btn.href)
        );

        enquireBtns.forEach(href => {
            expect(href, `Button href must be a WhatsApp link: ${href}`)
                .toContain('wa.me/917010955834');
        });
    });

});
