const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    use: {
        baseURL: 'http://localhost:3000',
        screenshot: 'only-on-failure',
    },
    webServer: {
        command: 'npx serve .',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
    },
});
