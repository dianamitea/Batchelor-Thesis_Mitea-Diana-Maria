/**
 * Background Service Worker
 * Handles badge management and messaging from content scripts
 */

console.log('[Background] Service worker loaded');

// Store detected tabs with cookie banners
const tabsWithCookieBanners = new Set();

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Background] Message received:', request.action, 'from tab:', sender.tab.id);
    
    if (request.action === 'cookieBannerDetected') {
        const tabId = sender.tab.id;
        tabsWithCookieBanners.add(tabId);
        
        // Set badge on extension icon
        chrome.action.setBadgeText({ text: '🍪', tabId: tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#ff6b6b', tabId: tabId });
        chrome.action.setTitle({ title: 'Cookie banner detected - Click to analyze', tabId: tabId });
        
        console.log('[Background] Badge set for tab:', tabId);
        sendResponse({ status: 'badge_set' });
    }
    
    return true; // Keep message channel open for async responses
});

// Clear badge when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    tabsWithCookieBanners.delete(tabId);
    console.log('[Background] Tab removed:', tabId);
});

// Clear badge when tab changes
chrome.tabs.onActivated.addListener((activeInfo) => {
    // Badges are per-tab, so they'll show/hide automatically
    console.log('[Background] Tab activated:', activeInfo.tabId);
});

// Clear badge when tab is refreshed/navigated
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading') {
        // Clear badge when navigating to new page
        if (!tabsWithCookieBanners.has(tabId)) {
            chrome.action.setBadgeText({ text: '', tabId: tabId });
            chrome.action.setTitle({ title: 'Privacy Policy Analyzer', tabId: tabId });
        }
    }
});

console.log('[Background] Service worker ready');
