const puppeteer = require('puppeteer');

const BASE_URL = 'https://www.discord.com';

const discord = {
    init: async () => {
        discord.browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1366, height: 768 }, args: ['--start-maximized'] });
        discord.page = await discord.browser.newPage();
        await discord.page.setViewport({ width: 1366, height: 768 });
        await discord.page.setUserAgent('UA-TEST');
        await discord.page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    },
    login: async (username, password) => {
        try {
            // Wait for page to load
            await discord.page.waitForTimeout(3000);
            
            console.log('Looking for login button...');
            
            // Try multiple approaches to find and click the login button
            let clicked = false;
            
            // Approach 1: Try direct CSS selector
            try {
                await discord.page.waitForSelector('a[href*="/login"]', { timeout: 5000 });
                await discord.page.click('a[href*="/login"]');
                clicked = true;
                console.log('Login button clicked via CSS selector');
            } catch (e) {
                console.log('CSS selector failed:', e.message);
            }
            
            // Approach 2: Try XPath if CSS failed
            if (!clicked) {
                try {
                    const loginButtons = await discord.page.$x('//a[contains(text(), "Log In") or contains(text(), "Login")]');
                    if (loginButtons.length > 0) {
                        await loginButtons[0].click();
                        clicked = true;
                        console.log('Login button clicked via XPath');
                    }
                } catch (e) {
                    console.log('XPath approach failed:', e.message);
                }
            }
            
            // Approach 3: Use evaluate to click any login link
            if (!clicked) {
                await discord.page.evaluate(() => {
                    const links = Array.from(document.querySelectorAll('a'));
                    const loginLink = links.find(link => 
                        link.href.includes('/login') || 
                        link.textContent.toLowerCase().includes('log in') ||
                        link.textContent.toLowerCase().includes('login')
                    );
                    if (loginLink) {
                        loginLink.click();
                        return true;
                    }
                    return false;
                });
                clicked = true;
                console.log('Login button clicked via evaluate');
            }
            
            if (!clicked) {
                throw new Error('Could not find or click login button');
            }
            
            // Wait for navigation to login page
            await discord.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
            console.log('Navigated to login page');

            // Wait for login form to appear and fill it
            await discord.page.waitForSelector('input[name="email"]', { timeout: 10000 });
            console.log('Login form found');
            
            await discord.page.type('input[name="email"]', username, { delay: 100 });
            await discord.page.type('input[name="password"]', password, { delay: 100 });
            console.log('Credentials entered');
            
            // Submit the form - try multiple approaches
            let submitted = false;
            
            // Try Enter key first
            try {
                await discord.page.keyboard.press('Enter');
                await discord.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
                submitted = true;
                console.log('Form submitted via Enter key');
            } catch (e) {
                console.log('Enter key submission failed:', e.message);
            }
            
            // Try clicking submit button if Enter didn't work
            if (!submitted) {
                try {
                    const submitButton = await discord.page.$('button[type="submit"]');
                    if (submitButton) {
                        await submitButton.click();
                        await discord.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
                        submitted = true;
                        console.log('Form submitted via button click');
                    }
                } catch (e) {
                    console.log('Button submission failed:', e.message);
                }
            }
            
            if (!submitted) {
                // Try evaluate approach for submit
                await discord.page.evaluate(() => {
                    const forms = document.querySelectorAll('form');
                    if (forms.length > 0) {
                        forms[0].submit();
                    }
                });
                await discord.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
                console.log('Form submitted via evaluate');
            }
            
            console.log('Login completed successfully');
            
        } catch (error) {
            console.error('Login failed:', error.message);
            
            // Add some debugging info
            const url = await discord.page.url();
            console.log('Current URL:', url);
            
            const title = await discord.page.title();
            console.log('Current page title:', title);
            
            throw error;
        }
    },
    moveTo: async (serverID, channelID) => {
        await discord.page.goto(`${BASE_URL}/channels/${serverID}/${channelID}`, { waitUntil: 'networkidle2' });
        await discord.page.waitForTimeout(5000);
    },
    textMsg: async (msg) => {
        await discord.page.type('div[data-slate-node="element"]', msg);
        await discord.page.waitForTimeout(1500);
        await discord.page.keyboard.press('Enter');
        await discord.page.waitForTimeout(500);
        await discord.page.keyboard.press('Enter');
        await discord.page.waitForTimeout(1500);
    },
    clickBtn: async () => {
        try {
            console.log('Looking for buttons...');
            
            // Wait a bit for buttons to appear
            await discord.page.waitForTimeout(1000);
            
            let buttonClicked = false;
            
            // Try multiple approaches to find and click buttons
            
            // Approach 1: Look for buttons by text content using evaluate
            buttonClicked = await discord.page.evaluate(() => {
                // Look for any button or clickable element containing "Fish Again" or "Sell"
                const allButtons = Array.from(document.querySelectorAll('button, div[role="button"], span[role="button"], [class*="button"], [class*="clickable"]'));
                
                let clicked = false;
                
                // First try to find "Fish Again" button
                const fishButton = allButtons.find(btn => 
                    btn.textContent && btn.textContent.toLowerCase().includes('fish again')
                );
                
                if (fishButton) {
                    fishButton.click();
                    console.log('Fish Again button clicked');
                    clicked = true;
                } else {
                    // If no "Fish Again", try "Sell" button
                    const sellButton = allButtons.find(btn => 
                        btn.textContent && btn.textContent.toLowerCase().includes('sell')
                    );
                    
                    if (sellButton) {
                        sellButton.click();
                        console.log('Sell button clicked');
                        clicked = true;
                    }
                }
                
                return clicked;
            });
            
            // Approach 2: If evaluate didn't work, try XPath
            if (!buttonClicked) {
                try {
                    // Try XPath for Fish Again
                    let fishButtons = await discord.page.$x('//*[contains(text(), "Fish Again")]');
                    if (fishButtons.length > 0) {
                        await fishButtons[0].click();
                        buttonClicked = true;
                        console.log('Fish Again button clicked via XPath');
                    } else {
                        // Try XPath for Sell
                        let sellButtons = await discord.page.$x('//*[contains(text(), "Sell")]');
                        if (sellButtons.length > 0) {
                            await sellButtons[0].click();
                            buttonClicked = true;
                            console.log('Sell button clicked via XPath');
                        }
                    }
                } catch (e) {
                    console.log('XPath approach failed:', e.message);
                }
            }
            
            // Approach 3: Try common Discord button selectors
            if (!buttonClicked) {
                const commonSelectors = [
                    '[class*="button"][class*="primary"]',
                    '[class*="button"][class*="secondary"]',
                    '[data-testid*="button"]',
                    'button[type="button"]',
                    '[role="button"]'
                ];
                
                for (const selector of commonSelectors) {
                    try {
                        const buttons = await discord.page.$$(selector);
                        for (const button of buttons) {
                            const text = await discord.page.evaluate(el => el.textContent, button);
                            if (text && (text.includes('Fish Again') || text.includes('Sell'))) {
                                await button.click();
                                buttonClicked = true;
                                console.log(`Button "${text}" clicked via selector: ${selector}`);
                                break;
                            }
                        }
                        if (buttonClicked) break;
                    } catch (e) {
                        console.log(`Selector ${selector} failed:`, e.message);
                    }
                }
            }
            
            if (!buttonClicked) {
                console.log('No Fish Again or Sell buttons found');
                
                // Debug: log all visible text on page to help identify button structure
                const pageText = await discord.page.evaluate(() => {
                    return Array.from(document.querySelectorAll('*'))
                        .filter(el => el.textContent && el.textContent.trim().length > 0)
                        .map(el => el.textContent.trim())
                        .filter(text => text.length < 100) // Avoid very long text
                        .slice(0, 20); // Limit output
                });
                console.log('Available text on page:', pageText);
            }
            
        } catch (error) {
            console.error('Error in clickBtn:', error.message);
        }
    }
}

module.exports = discord;