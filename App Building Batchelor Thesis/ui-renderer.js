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
                const isLocalStorage = cookieResult.storageType === 'localStorage';
                const storageNote = isLocalStorage
                    ? `<div style="margin-bottom:10px;padding:6px 10px;background:#fff3e0;border-left:3px solid #ff9800;border-radius:4px;font-size:11px;color:#e65100;">
                        ⚠️ No HTTP cookies found. Analysis is based on <strong>localStorage/sessionStorage</strong> entries — this site avoids HTTP cookies to evade standard cookie tools.
                       </div>`
                    : '';
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
                
                // Determine compliance/risk styling
                let riskColor = '#2e7d32';
                let riskIcon = '✅';
                let riskBgColor = '#e8f5e9';
                const compliance = cookieResult.complianceStatus || (cookieResult.riskLevel === 'LOW' ? 'COMPLIANT' : cookieResult.riskLevel);

                if (compliance === 'NON-COMPLIANT') {
                    riskColor = '#b71c1c';
                    riskIcon = '🚨 NON-COMPLIANT';
                    riskBgColor = '#ffcdd2';
                } else if (compliance === 'OPT-OUT IGNORED') {
                    riskColor = '#4a148c';
                    riskIcon = '❌ OPT-OUT IGNORED';
                    riskBgColor = '#ede7f6';
                } else if (compliance === 'HIGH RISK') {
                    riskColor = '#e65100';
                    riskIcon = '⚠️ HIGH RISK';
                    riskBgColor = '#fff3e0';
                } else if (compliance === 'MODERATE RISK') {
                    riskIcon = '⚡ MODERATE RISK';
                    riskColor = '#f57f17';
                    riskBgColor = '#fffde7';
                } else {
                    riskIcon = '✅ COMPLIANT';
                }
                
                // Build recommendations HTML
                let recommendationsHTML = '';
                if (cookieResult.recommendations && cookieResult.recommendations.length > 0) {
                    recommendationsHTML = cookieResult.recommendations
                        .map(rec => `
                            <div style="margin: 8px 0; padding: 8px; background: #f5f5f5; border-left: 3px solid ${rec.priority === 'critical' ? '#d32f2f' : rec.priority === 'high' ? '#fbc02d' : '#2e7d32'}; border-radius: 3px; font-size: 11px;">
                                <strong>${rec.text}</strong><br>
                                <span style="color: #666;">→ ${rec.action}</span>
                            </div>
                        `).join('');
                }
                
                // Build persistence HTML
                let persistenceHTML = '';
                if (cookieResult.persistence) {
                    persistenceHTML = `
                        <div style="margin: 8px 0; padding: 8px; background: #fff3cd; border-radius: 3px; border-left: 3px solid #fbc02d; font-size: 11px;">
                            <strong>⏱️ Cookie Persistence:</strong><br>
                            ${cookieResult.persistence.analysis}
                        </div>
                    `;
                }
                
                // Build third-party HTML
                let thirdPartyHTML = '';
                if (cookieResult.thirdPartyTrackers && cookieResult.thirdPartyTrackers.length > 0) {
                    thirdPartyHTML = `
                        <div style="margin: 8px 0; padding: 8px; background: #ffebee; border-radius: 3px; border-left: 3px solid #d32f2f; font-size: 11px;">
                            <strong>🔴 Third-Party Trackers Detected:</strong>
                            <ul style="margin: 6px 0; padding-left: 18px;">
                                ${cookieResult.thirdPartyTrackers.slice(0, 5).map(t => 
                                    `<li><strong>${t.company.toUpperCase()}</strong> (${t.domain})</li>`
                                ).join('')}
                                ${cookieResult.thirdPartyTrackers.length > 5 ? `<li>... and ${cookieResult.thirdPartyTrackers.length - 5} more</li>` : ''}
                            </ul>
                        </div>
                    `;
                }
                
                // Privacy score visual
                let privacyScoreColor = '#2e7d32';
                if (cookieResult.privacyScore < 30) privacyScoreColor = '#d32f2f';
                else if (cookieResult.privacyScore < 60) privacyScoreColor = '#fbc02d';
                
                // Build complete HTML with enhanced details
                const fullHTML = `
                    <h4 style="margin: 0 0 12px 0; color: #2e7d32; font-size: 14px;">🍪 Detailed Cookie Analysis</h4>
                    ${storageNote}
                    <div style="margin-bottom: 12px; padding: 12px; background: ${riskBgColor}; border-radius: 6px; border-left: 4px solid ${riskColor}; font-weight: bold; color: ${riskColor}; font-size: 14px; text-align: center;">
                        ${riskIcon} • Risk Level: ${cookieResult.riskLevel}
                    </div>
                    ${cookieResult.riskExplanation ? `
                    <div style="margin-bottom: 12px; padding: 10px; background: ${riskBgColor}; border-radius: 6px; font-size: 11px; color: ${riskColor};">
                        ${cookieResult.riskExplanation}
                        ${cookieResult.consentStatus && !cookieResult.consentStatus.found ? '<br><br><em>No consent cookie detected. This site may be collecting data before asking permission.</em>' : ''}
                        ${cookieResult.consentStatus && cookieResult.consentStatus.found ? `<br><br><em>Consent cookie found: <strong>${cookieResult.consentStatus.cookieName}</strong> = ${cookieResult.consentStatus.accepted === true ? '✅ Accepted' : cookieResult.consentStatus.accepted === false ? '❌ Rejected' : '❓ Unknown'}</em>` : ''}
                    </div>` : ''}
                    
                    <div style="margin-bottom: 12px; padding: 10px; background: white; border-radius: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div style="border-left: 3px solid #0056b3; padding-left: 8px;">
                            <span style="font-size: 11px; color: #666;">Total Cookies</span><br>
                            <strong style="font-size: 16px; color: #0056b3;">${cookieResult.totalCookies}</strong>
                        </div>
                        <div style="border-left: 3px solid ${privacyScoreColor}; padding-left: 8px;">
                            <span style="font-size: 11px; color: #666;">Privacy Score</span><br>
                            <strong style="font-size: 16px; color: ${privacyScoreColor};">${cookieResult.privacyScore || 0}/100</strong>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <strong style="font-size: 12px; display: block; margin-bottom: 6px;">📊 Cookie Breakdown:</strong>
                        ${breakdownHTML}
                    </div>
                    
                    ${persistenceHTML}
                    ${thirdPartyHTML}
                    
                    <div style="margin-bottom: 10px;">
                        <strong style="font-size: 12px; display: block; margin-bottom: 6px;">💡 Recommendations:</strong>
                        ${recommendationsHTML || '<p style="font-size: 11px; color: #666;">No major recommendations</p>'}
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <strong style="font-size: 12px; display: block; margin-bottom: 6px;">⚠️ Privacy Concerns:</strong>
                        <ul style="margin: 8px 0; padding-left: 20px; font-size: 11px;">
                            ${discrepanciesHTML}
                        </ul>
                    </div>
                `;
                
                console.log('[UIRenderer] Setting cookie box HTML, length:', fullHTML.length);
                cookieBox.innerHTML = fullHTML;
                cookieBox.style.display = 'block';
                console.log('[UIRenderer] ✅ DISPLAYED ENHANCED COOKIE ANALYSIS');
                
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
