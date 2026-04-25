window.UI_RENDERER_LOADED = true;
console.log('[UIRenderer] ui-renderer.js loaded');

try {
    class UIRenderer {
        static renderResults(result, containerId = 'results') {
            try {
                console.log('[UIRenderer] renderResults called with', result.flags?.length || 0, 'flags');
                const container = document.getElementById(containerId);
                if (!container) return;
                
                // Update the existing score element instead of replacing
                const finalScoreEl = document.getElementById('finalScore');
                if (finalScoreEl) finalScoreEl.textContent = `${result.score}/10`;
                
                // Safely update metric counts only if elements exist
                const metrics = {
                    'finalScore': `${result.score}/10`,
                    'metricCollection': result.metrics.data_collection || 0,
                    'metricSharing': result.metrics.third_party_sharing || 0,
                    'metricRights': result.metrics.user_rights || 0,
                    'metricRetention': result.metrics.data_retention || 0,
                    'metricConsent': result.metrics.consent_requirement || 0,
                    'collectionMandatory': result.collectionTypes?.mandatory || 0,
                    'collectionOptional': result.collectionTypes?.optional || 0,
                    'collectionUndeclared': result.collectionTypes?.undeclared || 0
                };
                
                Object.entries(metrics).forEach(([id, value]) => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = value;
                });
                
                // Update flags in the existing #flagsContainer
                console.log('[UIRenderer] Calling renderFlags with', result.flags?.length || 0, 'total flags');
                this.renderFlags(result.flags || [], 'flagsContainer');
                container.style.display = 'block';
            } catch (error) {
                console.error('[UIRenderer] Error rendering results:', error);
            }
        }
        
        static renderFlags(flags, containerId = 'flagsContainer') {
            try {
                console.log('[UIRenderer] renderFlags called for container:', containerId, 'with', flags.length, 'flags');
                const container = document.getElementById(containerId);
                if (!container) {
                    console.error('[UIRenderer] renderFlags container NOT FOUND:', containerId);
                    return;
                }
                
                if (!flags || flags.length === 0) {
                    console.log('[UIRenderer] No flags to render');
                    container.innerHTML = '<p style="color:#999;font-size:12px;">No flags found in this privacy policy.</p>';
                    return;
                }
                
                console.log('[UIRenderer] Rendering', flags.length, 'flags. First flag:', flags[0]);
                container.innerHTML = flags.map(flag => `
                    <div class="flag-item" data-severity="${flag.tier || 'info'}">
                        <strong>${flag.text}</strong>
                        <p>Category: ${flag.category || 'N/A'} | Tier: ${flag.tier || 'N/A'} | Confidence: ${flag.confidence || 0}%</p>
                    </div>
                `).join('');
                console.log('[UIRenderer] renderFlags complete. Container now has', container.children.length, 'children');
            } catch (error) {
                console.error('[UIRenderer] Error rendering flags:', error);
            }
        }
        
        static renderHistory(historyItems, containerId = 'historyList') {
            try {
                const container = document.getElementById(containerId);
                if (!container) return;
                
                if (!historyItems || historyItems.length === 0) {
                    container.innerHTML = '<p style="text-align:center;color:#999;font-size:12px;padding:20px;">No analysis history yet</p>';
                    return;
                }
                
                container.innerHTML = historyItems.map(item => `
                    <div class="modal-item">
                        <div class="modal-item-title">${item.domain || 'Unknown'}</div>
                        <div class="modal-item-meta">Score: ${item.result.score}/10 • ${new Date(item.timestamp).toLocaleDateString()}</div>
                    </div>
                `).join('');
            } catch (error) {
                console.error('[UIRenderer] Error rendering history:', error);
            }
        }
        
        static renderStatistics(stats, containerId = 'statisticsContent') {
            try {
                const container = document.getElementById(containerId);
                if (!container) return;
                
                if (!stats) {
                    container.innerHTML = '<p style="text-align:center;color:#999;font-size:12px;padding:20px;">No statistics yet</p>';
                    return;
                }
                
                container.innerHTML = `
                    <div class="modal-stat">
                        <span class="modal-stat-label">Total Analyses</span>
                        <span class="modal-stat-value">${stats.totalAnalyses || 0}</span>
                    </div>
                    <div class="modal-stat">
                        <span class="modal-stat-label">Average Score</span>
                        <span class="modal-stat-value">${(stats.averageScore || 0).toFixed(1)}/10</span>
                    </div>
                    <div class="modal-stat">
                        <span class="modal-stat-label">Highest Score</span>
                        <span class="modal-stat-value">${stats.highestScore || 0}/10</span>
                    </div>
                    <div class="modal-stat">
                        <span class="modal-stat-label">Lowest Score</span>
                        <span class="modal-stat-value">${stats.lowestScore || 0}/10</span>
                    </div>
                    <div class="modal-stat">
                        <span class="modal-stat-label">Unique Domains</span>
                        <span class="modal-stat-value">${stats.uniqueDomains || 0}</span>
                    </div>
                `;
            } catch (error) {
                console.error('[UIRenderer] Error rendering statistics:', error);
            }
        }
        
        static updateStatus(message, type = 'info') {
            try {
                const statusDiv = document.getElementById('status');
                if (!statusDiv) return;
                
                statusDiv.innerText = message;
                statusDiv.style.color = type === 'error' ? '#d32f2f' : '#666';
            } catch (error) {
                console.error('[UIRenderer] Error updating status:', error);
            }
        }
        
        static getRiskLevel(score) {
            if (score >= 8) return 'Low Risk';
            if (score >= 6) return 'Moderate Risk';
            if (score >= 4) return 'High Risk';
            return 'Very High Risk';
        }
        
        static renderFilterControls(containerId = 'filterControls') {
            try {
                console.log('[UIRenderer] renderFilterControls called with containerId:', containerId);
                const container = document.getElementById(containerId);
                console.log('[UIRenderer] Container found:', !!container);
                if (!container) {
                    console.error('[UIRenderer] Container not found!');
                    return;
                }
                
                container.innerHTML = `
                    <div class="filter-buttons">
                        <button class="filter-btn active" data-filter="all">All</button>
                        <button class="filter-btn" data-filter="critical">Critical</button>
                        <button class="filter-btn" data-filter="moderate">Moderate</button>
                        <button class="filter-btn" data-filter="weak">Weak</button>
                        <button class="filter-btn" data-filter="data_collection">Data Collection</button>
                        <button class="filter-btn" data-filter="third_party_sharing">3rd Party</button>
                        <button class="filter-btn" data-filter="user_rights">User Rights</button>
                    </div>
                `;
                
                const buttons = container.querySelectorAll('.filter-btn');
                console.log('[UIRenderer] Filter buttons found:', buttons.length);
                
                buttons.forEach(btn => {
                    console.log('[UIRenderer] Adding listener to button:', btn.getAttribute('data-filter'));
                    btn.addEventListener('click', (event) => {
                        const filter = btn.getAttribute('data-filter');
                        console.log('[UIRenderer] BUTTON CLICKED! Filter:', filter);
                        
                        buttons.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        
                        console.log('[UIRenderer] currentAnalysisResult exists?', !!window.currentAnalysisResult);
                        console.log('[UIRenderer] flags exist?', !!window.currentAnalysisResult?.flags);
                        
                        if (window.currentAnalysisResult && window.currentAnalysisResult.flags) {
                            console.log('[UIRenderer] Calling applyFilter with', window.currentAnalysisResult.flags.length, 'flags');
                            UIRenderer.applyFilter(window.currentAnalysisResult.flags, filter);
                        } else {
                            console.log('[UIRenderer] No analysis result or flags found!');
                        }
                    });
                });
            } catch (error) {
                console.error('[UIRenderer] Error rendering filter controls:', error);
            }
        }
        
        static applyFilter(flags, filter) {
            try {
                console.log('[applyFilter] Called with filter:', filter, '| flags count:', flags?.length);
                
                if (!flags || flags.length === 0) {
                    console.log('[applyFilter] No flags provided!');
                    return;
                }
                
                // Show first 3 flags structure
                console.log('[applyFilter] First 3 flag structures:');
                flags.slice(0, 3).forEach((f, i) => {
                    console.log(`  [${i}]`, { text: f.text, tier: f.tier, category: f.category });
                });
                
                let filtered = flags;
                
                if (filter !== 'all') {
                    if (['critical', 'moderate', 'weak'].includes(filter)) {
                        // Filter by tier
                        const before = filtered.length;
                        filtered = filtered.filter(f => {
                            const matches = f.tier === filter;
                            return matches;
                        });
                        console.log(`[applyFilter] Tier filter "${filter}": ${before} → ${filtered.length} flags`);
                    } else {
                        // Filter by category - need to handle category names
                        const categoryMap = {
                            'data_collection': 'data_collection',
                            'third_party_sharing': 'third_party_sharing',
                            'user_rights': 'user_rights',
                            'data_retention': 'data_retention',
                            'consent_requirement': 'consent_requirement'
                        };
                        const categoryToMatch = categoryMap[filter] || filter;
                        const before = filtered.length;
                        filtered = filtered.filter(f => f.category === categoryToMatch);
                        console.log(`[applyFilter] Category filter "${filter}" (looking for "${categoryToMatch}"): ${before} → ${filtered.length} flags`);
                    }
                } else {
                    console.log('[applyFilter] "All" filter - showing all', filtered.length, 'flags');
                }
                
                const flagsContainer = document.getElementById('flagsContainer');
                if (!flagsContainer) {
                    console.error('[applyFilter] flagsContainer NOT FOUND!');
                    return;
                }
                
                console.log('[applyFilter] Updating DOM with', filtered.length, 'flags');
                flagsContainer.innerHTML = filtered.map(flag => `
                    <div class="flag-item" data-severity="${flag.tier || 'info'}">
                        <strong>${flag.text}</strong>
                        <p>Category: ${flag.category || 'N/A'} | Tier: ${flag.tier || 'N/A'} | Confidence: ${flag.confidence}%</p>
                    </div>
                `).join('') || '<p style="color:#999;font-size:12px;">No flags matching this filter.</p>';
                
                // Auto-expand the Specific Flags Found section
                const flagsContent = document.getElementById('flagsContent');
                if (flagsContent && flagsContent.classList.contains('collapsed')) {
                    console.log('[applyFilter] Expanding "Specific Flags Found" section');
                    flagsContent.classList.remove('collapsed');
                    const flagsArrow = document.getElementById('flagsArrow');
                    if (flagsArrow) flagsArrow.textContent = '▼';
                }
                
                console.log('[applyFilter] DOM updated successfully');
            } catch (error) {
                console.error('[applyFilter] Error:', error);
            }
        }
        
        // ===== PHASE 5: INSIGHTS RENDERING =====
        
        static renderInsights(insights) {
            try {
                console.log('[UIRenderer] Rendering insights');
                if (!insights) {
                    console.warn('[UIRenderer] No insights object');
                    return;
                }
                
                console.log('[UIRenderer] Insights object:', insights);
                
                // Render risk summary box
                const summary = document.getElementById('policySummary');
                console.log('[UIRenderer] policySummary element:', !!summary);
                if (summary) {
                    const summaryObj = insights.summary;
                    let summaryHTML = '';
                    
                    if (typeof summaryObj === 'object' && summaryObj.title) {
                        summaryHTML = `
                            <div style="margin-bottom: 12px;">
                                <strong style="font-size: 16px; color: #0056b3;">${summaryObj.title}</strong>
                                <p style="margin: 8px 0; font-size: 13px;">${summaryObj.description}</p>
                            </div>
                            ${summaryObj.details ? '<ul style="margin: 0; padding-left: 20px; font-size: 12px;">' + 
                                summaryObj.details.map(d => `<li style="margin-bottom: 4px;">${d}</li>`).join('') + 
                                '</ul>' : ''}
                        `;
                    } else {
                        summaryHTML = summaryObj || '';
                    }
                    
                    summary.innerHTML = summaryHTML;
                    console.log('[UIRenderer] Set summary HTML');
                    
                    const riskBox = document.getElementById('riskSummaryBox');
                    if (riskBox) {
                        riskBox.style.display = 'block';
                        const emoji = document.getElementById('riskEmoji');
                        const level = document.getElementById('riskLevel');
                        if (emoji) emoji.textContent = insights.riskIndicator.emoji || '';
                        if (level) level.textContent = insights.riskIndicator.level;
                        riskBox.style.borderLeftColor = insights.riskIndicator.color;
                        console.log('[UIRenderer] Displayed risk box');
                    }
                }
                
                // Render recommendations
                const recsList = document.getElementById('recommendationsList');
                console.log('[UIRenderer] recommendationsList element:', !!recsList);
                if (recsList) {
                    console.log('[UIRenderer] Has recommendations?', insights.recommendations && insights.recommendations.length);
                    if (insights.recommendations && insights.recommendations.length > 0) {
                        recsList.innerHTML = insights.recommendations
                            .map(rec => `<li>${rec}</li>`)
                            .join('');
                        const recsBox = document.getElementById('recommendationsBox');
                        if (recsBox) {
                            recsBox.style.display = 'block';
                            console.log('[UIRenderer] ✅ DISPLAYED RECOMMENDATIONS BOX');
                        }
                        console.log('[UIRenderer] Rendered', insights.recommendations.length, 'recommendations');
                    } else {
                        console.warn('[UIRenderer] No recommendations in insights');
                    }
                } else {
                    console.warn('[UIRenderer] recommendationsList element NOT FOUND');
                }
            } catch (error) {
                console.error('[UIRenderer] Error rendering insights:', error);
            }
        }
        
        // ===== COOKIE ANALYSIS RENDERING =====
        
        static renderCookieAnalysis(cookieResult) {
            try {
                console.log('[UIRenderer] Rendering cookie analysis:', cookieResult);
                
                const cookieBox = document.getElementById('cookieAnalysisBox');
                if (!cookieBox) {
                    console.error('[UIRenderer] cookieAnalysisBox element NOT FOUND!');
                    console.log('[UIRenderer] Available elements:', document.querySelectorAll('[id]').length);
                    return;
                }
                
                console.log('[UIRenderer] Cookie box found, status:', cookieResult.status);
                
                if (cookieResult.status === 'error' || cookieResult.status === 'no_cookies') {
                    console.log('[UIRenderer] Rendering no-cookies message');
                    cookieBox.innerHTML = `
                        <h4 style="margin: 0 0 12px 0; color: #2e7d32; font-size: 14px;">Cookie Analysis</h4>
                        <p style="margin: 0; font-size: 13px; color: #666;">${cookieResult.message || 'Unable to analyze cookies'}</p>
                        <p style="margin: 8px 0 0 0; font-size: 11px; color: #999;">Try interacting with the website first, or visiting different pages.</p>
                    `;
                    cookieBox.style.display = 'block';
                    console.log('[UIRenderer] ✅ Displayed cookie message');
                    return;
                }
                
                // Build HTML for results
                let breakdownHTML = '';
                if (cookieResult.breakdown) {
                    const bd = cookieResult.breakdown;
                    breakdownHTML = `
                        <div class="metric-row"><span>Tracking:</span> <strong>${bd.tracking || 0}</strong></div>
                        <div class="metric-row"><span>Analytics:</span> <strong>${bd.analytics || 0}</strong></div>
                        <div class="metric-row"><span>Advertising:</span> <strong>${bd.advertising || 0}</strong></div>
                        <div class="metric-row"><span>Functional:</span> <strong>${bd.functional || 0}</strong></div>
                        <div class="metric-row"><span>Social:</span> <strong>${bd.social || 0}</strong></div>
                        <div class="metric-row"><span>Other:</span> <strong>${bd.other || 0}</strong></div>
                    `;
                }
                
                let discrepanciesHTML = '';
                if (cookieResult.discrepancies && cookieResult.discrepancies.length > 0) {
                    discrepanciesHTML = cookieResult.discrepancies
                        .map(d => `<li><strong>${d.type.replace(/_/g, ' ').toUpperCase()}:</strong> ${d.message}</li>`)
                        .join('');
                } else {
                    discrepanciesHTML = '<li>No major discrepancies found between cookies and policy</li>';
                }
                
                let riskColor = '#2e7d32';
                if (cookieResult.riskLevel === 'HIGH') {
                    riskColor = '#d32f2f';
                } else if (cookieResult.riskLevel === 'MEDIUM') {
                    riskColor = '#f57c00';
                }
                
                // Build complete HTML
                const fullHTML = `
                    <h4 style="margin: 0 0 12px 0; color: #2e7d32; font-size: 14px;">Cookie Analysis</h4>
                    <div style="margin-bottom: 12px; padding: 8px; background: white; border-radius: 3px; font-weight: bold; color: ${riskColor};">
                        Found ${cookieResult.totalCookies} cookies | Risk Level: ${cookieResult.riskLevel}
                    </div>
                    <div style="margin-bottom: 10px;">
                        <strong style="font-size: 12px;">Cookie Breakdown:</strong>
                        ${breakdownHTML}
                    </div>
                    <div style="margin-bottom: 10px;">
                        <strong style="font-size: 12px;">Privacy Concerns:</strong>
                        <ul style="margin: 8px 0; padding-left: 20px; font-size: 12px;">
                            ${discrepanciesHTML}
                        </ul>
                    </div>
                `;
                
                console.log('[UIRenderer] Setting cookie box HTML, length:', fullHTML.length);
                cookieBox.innerHTML = fullHTML;
                cookieBox.style.display = 'block';
                console.log('[UIRenderer] ✅ DISPLAYED COOKIE ANALYSIS BOX');
                
            } catch (error) {
                console.error('[UIRenderer] Error rendering cookie analysis:', error);
                console.error('[UIRenderer] Stack:', error.stack);
            }
        }
    }
    
    window.UIRenderer = UIRenderer;
    console.log('[UIRenderer] UIRenderer ready');
} catch (err) {
    console.error('[UIRenderer] CRITICAL ERROR:', err.message);
}
