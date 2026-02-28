const { chromium } = require('playwright'); // Ensure playwright is installed, else use fetch

(async () => {
    try {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        console.log('Navigating to local site...');
        await page.goto('http://localhost:5173/');

        console.log('Logging in...');
        await page.click('text="Sign In"');
        await page.fill('input[type="email"]', 'testuser9@example.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button:has-text("Sign In")');

        await page.waitForTimeout(2000);

        console.log('Going to watch page...');
        await page.goto('http://localhost:5173/watch/30caeef4-03d9-433e-aa26-c605087bef3a');
        await page.waitForTimeout(2000);

        console.log('Setting up console listener...');
        page.on('console', msg => {
            if (msg.text().includes('DEBUG:')) {
                console.log(`[Browser]: ${msg.text()}`);
            }
        });

        console.log('Typing comment...');
        await page.fill('textarea', 'Direct playwright test comment');
        await page.click('button:has-text("Post Comment")');

        console.log('Waiting for response...');
        await page.waitForTimeout(3000);

        console.log('Closing browser...');
        await browser.close();
    } catch (e) {
        console.error('Playwright failed. Try fallback fetch approach. Error:', e.message);
    }
})();
