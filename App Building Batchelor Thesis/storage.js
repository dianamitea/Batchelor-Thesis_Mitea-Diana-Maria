const STORAGE_KEY = 'privacy_analyzer_history';
const MAX_HISTORY_ITEMS = 50;

window.STORAGE_LOADED = true;
console.log('[Storage] storage.js loaded');

try {
    class AnalysisStorage {
        static saveAnalysis(url, policyText, analysisResult, title = null) {
            try {
                const history = this.getHistory();
                let domain = 'unknown';
                try {
                    if (url && url !== 'unknown') {
                        domain = new URL(url).hostname;
                    }
                } catch (e) {
                    console.warn('[Storage] Invalid URL format:', url);
                }
                
                const analysis = {
                    id: this.generateId(),
                    url: url || 'unknown',
                    title: title || url || 'Unknown',
                    timestamp: new Date().toISOString(),
                    domain: domain,
                    result: analysisResult,
                    policyLength: policyText.length
                };
                history.unshift(analysis);
                if (history.length > MAX_HISTORY_ITEMS) {
                    history.splice(MAX_HISTORY_ITEMS);
                }
                localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
                return analysis;
            } catch (error) {
                console.error('[Storage] Error saving analysis:', error);
                return null;
            }
        }
        
        static getHistory() {
            try {
                const data = localStorage.getItem(STORAGE_KEY);
                return data ? JSON.parse(data) : [];
            } catch (error) {
                console.error('[Storage] Error getting history:', error);
                return [];
            }
        }
        
        static clearHistory() {
            try {
                localStorage.removeItem(STORAGE_KEY);
                return true;
            } catch (error) {
                console.error('[Storage] Error clearing history:', error);
                return false;
            }
        }
        
        static getStatistics() {
            try {
                const history = this.getHistory();
                if (history.length === 0) return null;
                
                let totalScore = 0;
                const domainsAnalyzed = new Set();
                
                history.forEach(item => {
                    if (item.result && item.result.score) {
                        totalScore += item.result.score;
                    }
                    if (item.domain) {
                        domainsAnalyzed.add(item.domain);
                    }
                });
                
                return {
                    totalAnalyses: history.length,
                    averageScore: Math.round((totalScore / history.length) * 10) / 10,
                    uniqueDomains: domainsAnalyzed.size
                };
            } catch (error) {
                console.error('[Storage] Error getting statistics:', error);
                return null;
            }
        }
        
        static generateId() {
            return '_' + Math.random().toString(36).substr(2, 9);
        }
        
        static compareAnalyses(analysis1, analysis2) {
            try {
                if (!analysis1 || !analysis2) return null;
                return {
                    scoreChange: analysis2.result.score - analysis1.result.score,
                    timestamp1: analysis1.timestamp,
                    timestamp2: analysis2.timestamp
                };
            } catch (error) {
                console.error('[Storage] Error comparing:', error);
                return null;
            }
        }
        
        static exportAsJSON(analysis) {
            try {
                const json = JSON.stringify(analysis, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `privacy-analysis-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                return true;
            } catch (error) {
                console.error('[Storage] Error exporting JSON:', error);
                return false;
            }
        }
        
        static exportAsCSV(analysis) {
            try {
                const lines = [];
                lines.push('Privacy Policy Analysis Export');
                lines.push(`URL,"${analysis.url}"`);
                lines.push(`Domain,"${analysis.domain}"`);
                lines.push(`Score,"${analysis.result.score}/10"`);
                lines.push(`Analyzed,"${analysis.timestamp}"`);
                
                if (analysis.result.flags && analysis.result.flags.length > 0) {
                    lines.push('');
                    lines.push('Detected Keywords');
                    analysis.result.flags.forEach(flag => {
                        lines.push(`"${flag.text}"`);
                    });
                }
                
                const csv = lines.join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `privacy-analysis-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                return true;
            } catch (error) {
                console.error('[Storage] Error exporting CSV:', error);
                return false;
            }
        }
    }
    
    window.AnalysisStorage = AnalysisStorage;
    console.log('[Storage] AnalysisStorage ready');
} catch (err) {
    console.error('[Storage] CRITICAL ERROR:', err.message);
}
