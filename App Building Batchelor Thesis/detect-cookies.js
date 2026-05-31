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
    
    // EN + multilingual keywords (RO, FR, DE, ES, IT, NL)
    keywords: [
        'accept', 'decline', 'cookie', 'gdpr', 'consent', 'privacy', 'agree', 'reject',
        // Romanian
        'accepta', 'acceptați', 'acceptati', 'respinge', 'refuz', 'cookie-uri', 'confidențialitate',
        // French
        'accepter', 'refuser', 'continuer sans accepter', 'tout accepter',
        // German
        'akzeptieren', 'ablehnen', 'zustimmen',
        // Spanish
        'aceptar', 'rechazar', 'continuar sin aceptar',
        // Italian
        'accetta', 'rifiuta',
        // Dutch
        'accepteren', 'weigeren', 'alles accepteren'
    ]
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
            // Check if there are interactive elements with consent-related text (multilingual)
            const ACCEPT_WORDS = [
                'accept', 'agree', 'allow', 'ok', 'got it', 'i agree',
                'accepta', 'acceptați', 'acceptati', 'accepter', 'akzeptieren', 'aceptar', 'accetta', 'accepteren'
            ];
            const elements = document.querySelectorAll('button, a, [role="button"]');
            for (const el of elements) {
                const text = (el.innerText || el.textContent || '').toLowerCase().trim();
                if (ACCEPT_WORDS.some(w => text.includes(w)) && isVisible(el)) {
                    console.log('[CookieDetect] Banner detected via keyword matching');
                    return true;
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

// Detect when the user clicks a rejection/decline button on a consent banner.
// Uses event delegation on document so it works regardless of when the banner renders.
// Stores the flag in chrome.storage.local (reliable from content scripts on all Chrome versions).
const REJECT_PATTERNS = [
    // English
    'reject all', 'reject', 'decline all', 'decline', 'refuse', 'refuse all',
    'necessary only', 'only necessary', 'only essential', 'essential only',
    'save & exit', 'save preferences', 'continue without accepting', 'no thanks',
    // Romanian
    'respinge tot', 'respinge', 'refuz', 'refuzați', 'refuzati',
    'doar necesare', 'numai necesare', 'continuați fără a accepta',
    // French
    'tout refuser', 'refuser', 'refuser tout', 'continuer sans accepter',
    // German
    'alle ablehnen', 'ablehnen', 'nur notwendige',
    // Spanish
    'rechazar todo', 'rechazar', 'solo necesarias',
    // Italian
    'rifiuta tutto', 'rifiuta', 'solo necessari',
    // Dutch
    'alles weigeren', 'weigeren'
];

const ACCEPT_PATTERNS = [
    // English
    'allow all cookies', 'allow all', 'accept all cookies', 'accept all',
    'accept cookies', 'accept', 'agree', 'i agree', 'got it', 'ok',
    // Romanian
    'acceptați', 'acceptati', 'acceptă tot', 'accepta tot',
    // French
    'tout accepter', 'accepter tout', 'accepter',
    // German
    'alle akzeptieren', 'akzeptieren',
    // Spanish
    'aceptar todo', 'aceptar',
    // Italian
    'accetta tutto', 'accetta',
    // Dutch
    'alles accepteren', 'accepteren'
];

document.addEventListener('click', (event) => {
    // Walk up the DOM (up to 5 levels) to find the interactive element with the button text
    let el = event.target;
    let text = '';
    for (let i = 0; i < 5 && el && el !== document.body; i++) {
        const t = (el.innerText || el.textContent || '').toLowerCase().trim();
        // Accept if the text is short enough to be a button label (< 80 chars)
        if (t.length > 0 && t.length < 80) {
            text = t;
            break;
        }
        el = el.parentElement;
    }
    if (!text) return;
    const hostname = location.hostname;

    if (REJECT_PATTERNS.some(p => text === p || text.startsWith(p))) {
        console.log('[CookieDetect] Reject/decline click detected on:', hostname, '| text:', text);
        chrome.storage.local.set({
            [`rejected_${hostname}`]: { rejectedAt: Date.now(), hostname }
        });
    } else if (ACCEPT_PATTERNS.some(p => text === p || text.startsWith(p))) {
        // User accepted — clear any previous rejection flag so the next analysis
        // shows HIGH RISK (unverifiable consent) instead of OPT-OUT IGNORED
        console.log('[CookieDetect] Accept click detected on:', hostname, '| clearing rejection flag');
        chrome.storage.local.remove(`rejected_${hostname}`);
    }
}, true); // capture phase so it fires before any stopPropagation

console.log('[CookieDetect] Cookie banner detector active');
