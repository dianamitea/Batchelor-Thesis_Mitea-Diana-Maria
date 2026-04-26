/**
 * Cookie Banner Detection Script
 * Detects common cookie consent banners and notifies background service worker
 */

console.log('[CookieDetect] Content script loaded');

// Common cookie banner selectors and text patterns
const COOKIE_BANNER_PATTERNS = {
    selectors: [
        // Common frameworks
        '[class*="cookie"]',
        '[id*="cookie"]',
        '[data-testid*="cookie"]',
        // OneTrust
        '.onetrust-banner',
        '#onetrust-banner',
        // CookieBot
        '.CookiebotDialog',
        '#CookiebotDialog',
        // Cookie Notice
        '.cookie-notice',
        '.gdpr-notice',
        // Generic patterns
        '[class*="gdpr"]',
        '[class*="consent"]',
        '[id*="gdpr"]',
        '[id*="consent"]',
        // Common banner containers
        '.banner',
        '.modal[role="dialog"]',
        '[role="dialog"][aria-label*="cookie"]'
    ],
    
    keywords: ['accept', 'decline', 'cookie', 'gdpr', 'consent', 'privacy', 'agree', 'reject']
};

function detectCookieBanner() {
    try {
        // Check for banner using CSS selectors
        for (const selector of COOKIE_BANNER_PATTERNS.selectors) {
            const element = document.querySelector(selector);
            if (element && isVisible(element)) {
                console.log('[CookieDetect] Banner detected with selector:', selector);
                return true;
            }
        }

        // Check for keywords in visible text
        const bodyText = document.body.innerText.toLowerCase();
        const hasKeywords = COOKIE_BANNER_PATTERNS.keywords.some(keyword => 
            bodyText.includes(keyword)
        );

        if (hasKeywords) {
            // Check if there are interactive elements (buttons, links) with cookie-related text
            const elements = document.querySelectorAll('button, a, [role="button"]');
            for (const el of elements) {
                const text = el.innerText.toLowerCase();
                if (text.includes('accept') || text.includes('decline') || text.includes('agree')) {
                    if (isVisible(el)) {
                        console.log('[CookieDetect] Banner detected via keyword matching');
                        return true;
                    }
                }
            }
        }

        return false;
    } catch (error) {
        console.error('[CookieDetect] Error detecting banner:', error);
        return false;
    }
}

function isVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        rect.width > 0 &&
        rect.height > 0
    );
}

// Run detection on page load
function checkForCookieBanners() {
    const hasBanner = detectCookieBanner();
    
    if (hasBanner) {
        console.log('[CookieDetect] Notifying background about cookie banner...');
        chrome.runtime.sendMessage(
            { action: 'cookieBannerDetected', url: window.location.href },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('[CookieDetect] Error sending message:', chrome.runtime.lastError);
                } else {
                    console.log('[CookieDetect] Message sent, response:', response);
                }
            }
        );
    }
}

// Run on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkForCookieBanners);
} else {
    checkForCookieBanners();
}

// Also check after a short delay (for dynamically loaded banners)
setTimeout(checkForCookieBanners, 2000);

// Listen for mutations to detect late-loaded banners
const observer = new MutationObserver((mutations) => {
    // Only check occasionally to avoid performance issues
    if (Math.random() > 0.9) {
        checkForCookieBanners();
    }
});

// Observe DOM changes (document.body is guaranteed to be available at document_end)
observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
});

console.log('[CookieDetect] Cookie banner detector active');
