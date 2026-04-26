// Global variables
let isAnalysisInProgress = false;
let currentPageUrl = '';
let cookieBannerDetected = false;

// Check if opened due to cookie banner detection
function checkForCookieBannerAlert() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;
        
        const tabId = tabs[0].id;
        chrome.action.getBadgeText({ tabId: tabId }, (badgeText) => {
            if (badgeText === '🍪') {
                cookieBannerDetected = true;
                
                // Show alert banner
                const alertBanner = document.getElementById('cookieAlert');
                if (alertBanner) {
                    alertBanner.classList.add('show');
                }
                
                // Highlight cookies tab with pulsing red background
                const cookiesTab = document.getElementById('cookiesTab');
                if (cookiesTab) {
                    cookiesTab.classList.add('cookie-alert-active');
                }
                
                // Auto-switch to cookies tab with delay for effect
                setTimeout(() => {
                    switchTab('cookies');
                }, 600);
                
                // Auto-trigger cookie analysis
                setTimeout(() => {
                    document.getElementById('analyzeCookiesBtn')?.click();
                }, 1200);
            }
        });
    });
}
document.getElementById('policyTab')?.addEventListener('click', () => {
    switchTab('policy');
});

document.getElementById('cookiesTab')?.addEventListener('click', () => {
    switchTab('cookies');
});

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabName === 'policy' ? 'policyTab' : 'cookiesTab').classList.add('active');

    // Update containers
    document.querySelectorAll('.container').forEach(container => container.classList.remove('active'));
    document.getElementById(tabName === 'policy' ? 'policyContainer' : 'cookiesContainer').classList.add('active');

    // Clear status messages
    document.getElementById('status').classList.remove('show');
    document.getElementById('cookieStatus').classList.remove('show');
}

// ===== PRIVACY POLICY ANALYSIS =====
document.getElementById('analyzeBtn')?.addEventListener('click', async () => {
    if (isAnalysisInProgress) return;
    isAnalysisInProgress = true;

    const btn = document.getElementById('analyzeBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Analyzing...';

    try {
        // Get current tab URL
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        currentPageUrl = tabs[0]?.url || 'unknown';

        // Extract policy text
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: () => document.body.innerText.substring(0, 100000)
        });

        const policyText = results[0]?.result;

        if (!policyText || policyText.trim().length < 100) {
            throw new Error('Could not extract policy text. Make sure you\'re on a privacy policy page.');
        }

        updateStatus('Analyzing policy...', 'info');

        // Send to analyzer
        const result = await analyzeWithWorker(policyText);
        window.currentAnalysisResult = result;

        // Save to history
        try {
            AnalysisStorage.saveAnalysis(currentPageUrl, policyText, result);
        } catch (error) {
            console.error('[Popup] Error saving analysis:', error);
        }

        // Show results
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('resultsArea').style.display = 'block';

        // Render results
        UIRenderer.renderResults(result, 'resultsArea');
        const insights = InsightsGenerator.generateInsights(result);
        UIRenderer.renderInsights(insights);

        // Render filters
        UIRenderer.renderFilterControls('filterControls');
        document.getElementById('filterSection').style.display = 'block';

        updateStatus('✅ Analysis complete!', 'success');
    } catch (error) {
        updateStatus(`❌ Error: ${error.message}`, 'error');
        console.error('[Analysis Error]', error);
    } finally {
        isAnalysisInProgress = false;
        btn.disabled = false;
        btn.textContent = 'Analyze Privacy Policy';
    }
});

function analyzeWithWorker(text) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('analyzer-worker.js');
        const timeoutId = setTimeout(() => {
            worker.terminate();
            reject(new Error('Analysis timeout'));
        }, 30000);

        worker.onmessage = (event) => {
            clearTimeout(timeoutId);
            worker.terminate();

            if (event.data.success) {
                resolve(event.data.result);
            } else {
                reject(new Error(event.data.error || 'Analysis failed'));
            }
        };

        worker.postMessage({ id: 'main', text: text, action: 'analyze' });
    });
}

function updateStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `status show ${type}`;
    }
}

// ===== COLLAPSIBLE SECTIONS =====
function setupCollapsible(toggleId, contentId, arrowId) {
    const toggle = document.getElementById(toggleId);
    const content = document.getElementById(contentId);
    const arrow = document.getElementById(arrowId);

    if (!toggle || !content) return;

    let expanded = true;

    toggle.addEventListener('click', () => {
        expanded = !expanded;
        content.classList.toggle('collapsed', !expanded);
        if (arrow) arrow.textContent = expanded ? '▼' : '▶';
    });
}

// Initialize collapsibles when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupCollapsible('keywordToggle', 'keywordContent', 'keywordArrow');
        setupCollapsible('collectionToggle', 'collectionContent', 'collectionArrow');
        setupCollapsible('flagsToggle', 'flagsContent', 'flagsArrow');
    });
} else {
    setupCollapsible('keywordToggle', 'keywordContent', 'keywordArrow');
    setupCollapsible('collectionToggle', 'collectionContent', 'collectionArrow');
    setupCollapsible('flagsToggle', 'flagsContent', 'flagsArrow');
}

// ===== HISTORY =====
document.getElementById('historyBtn')?.addEventListener('click', () => {
    const modal = document.getElementById('historyModal');
    modal.classList.add('show');
    const history = AnalysisStorage.getHistory();
    UIRenderer.renderHistory(history, 'historyList');
});

document.getElementById('clearHistoryBtn')?.addEventListener('click', () => {
    if (confirm('Clear all analysis history?')) {
        AnalysisStorage.clearHistory();
        document.getElementById('historyList').innerHTML = '<p style="color:#999;font-size:12px;text-align:center;">History cleared</p>';
    }
});

// ===== STATISTICS =====
document.getElementById('statsBtn')?.addEventListener('click', () => {
    const modal = document.getElementById('statsModal');
    modal.classList.add('show');
    const stats = AnalysisStorage.getStatistics();
    UIRenderer.renderStatistics(stats, 'statisticsContent');
});

// ===== EXPORT =====
document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
    if (!window.currentAnalysisResult) {
        updateStatus('❌ No analysis to export', 'error');
        return;
    }
    AnalysisStorage.exportAsJSON({ url: currentPageUrl, result: window.currentAnalysisResult });
    updateStatus('✅ Exported as JSON', 'success');
});

document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
    if (!window.currentAnalysisResult) {
        updateStatus('❌ No analysis to export', 'error');
        return;
    }
    AnalysisStorage.exportAsCSV({ url: currentPageUrl, result: window.currentAnalysisResult });
    updateStatus('✅ Exported as CSV', 'success');
});

// ===== COOKIES =====
document.getElementById('analyzeCookiesBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('analyzeCookiesBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Analyzing...';

    try {
        const cookieResult = await CookieAnalyzer.analyzeCookies();
        window.currentCookieResult = cookieResult;

        UIRenderer.renderCookieAnalysis(cookieResult);
        document.getElementById('cookieAnalysisBox').style.display = 'block';
        document.getElementById('cookieEmptyState').style.display = 'none';

        const cookieStatus = document.getElementById('cookieStatus');
        cookieStatus.textContent = `Found ${cookieResult.totalCookies} cookies - Risk: ${cookieResult.riskLevel}`;
        cookieStatus.className = `status show ${cookieResult.riskLevel === 'HIGH' ? 'error' : 'success'}`;
    } catch (error) {
        const cookieStatus = document.getElementById('cookieStatus');
        cookieStatus.textContent = `❌ Error: ${error.message}`;
        cookieStatus.className = 'status show error';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Analyze Cookies';
    }
});

// Show empty state on load
window.addEventListener('load', () => {
    const emptyState = document.getElementById('emptyState');
    const resultsArea = document.getElementById('resultsArea');
    const cookieEmptyState = document.getElementById('cookieEmptyState');
    const cookieBox = document.getElementById('cookieAnalysisBox');
    
    if (emptyState) emptyState.style.display = 'block';
    if (resultsArea) resultsArea.style.display = 'none';
    if (cookieEmptyState) cookieEmptyState.style.display = 'block';
    if (cookieBox) cookieBox.style.display = 'none';
    
    // Check if popup was opened due to cookie banner detection
    checkForCookieBannerAlert();
});

// Close modals via close button
document.getElementById('closeHistoryBtn')?.addEventListener('click', () => {
    document.getElementById('historyModal').classList.remove('show');
});

document.getElementById('closeStatsBtn')?.addEventListener('click', () => {
    document.getElementById('statsModal').classList.remove('show');
});

// Close modals when clicking outside
document.getElementById('historyModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'historyModal') {
        e.target.classList.remove('show');
    }
});

document.getElementById('statsModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'statsModal') {
        e.target.classList.remove('show');
    }
});

console.log('[Popup] Loaded and ready');
