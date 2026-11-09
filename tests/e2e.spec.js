const { test, expect } = require('@playwright/test');

test.describe('Jewellery Catalogue E2E Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should have correct title and header', async ({ page }) => {
        await expect(page).toHaveTitle(/Sri Muthalamman Jewellers/);
        const header = page.locator('h1');
        await expect(header).toContainText('Sri Muthalamman Jewellers');
    });

    test('should display live gold rate ticker', async ({ page }) => {
        const ticker = page.locator('.ticker');
        await expect(ticker).toBeVisible();
        await expect(ticker).toContainText('Live Gold Rate');
    });

    test('should render catalogue items with images and pricing', async ({ page }) => {
        const productCards = page.locator('.product-card');
        await expect(productCards).toHaveCount(6); // Default items per page

        const firstCard = productCards.first();
        const img = firstCard.locator('img');
        await expect(img).toBeVisible();

        // Check for Price rendering based on Madurai market rates
        const priceElement = firstCard.locator('.price');
        await expect(priceElement).toBeVisible();

        const priceText = await priceElement.innerText();
        expect(priceText).toContain('₹');

        // Verify price format (e.g., ₹3,48,000)
        // Since rate is 7250 and first item is 48g -> 3,48,000
        await expect(priceElement).toContainText('3,48,000');
    });

    test('should filter items correctly', async ({ page }) => {
        await page.selectOption('#filter-metal', 'silver');

        const productCards = page.locator('.product-card');
        const firstCard = productCards.first();

        await expect(firstCard.locator('small')).toContainText('silver', { ignoreCase: true });

        // Weight check for first silver item (Kamatchi Vilakku 250g)
        const priceElement = firstCard.locator('.price');
        await expect(priceElement).toContainText('27,500'); // 250g * 110
    });

    test('should navigate through pagination', async ({ page }) => {
        const nextBtn = page.locator('#next-page');
        await nextBtn.click();

        const pageNumbers = page.locator('.nav-btn.active');
        await expect(pageNumbers).toHaveText('2');
    });
});
