class CookieAnalyzer {
    // Cookie patterns for categorization
    static COOKIE_PATTERNS = {
        tracking: {
            keywords: ['_ga', 'uuid', 'tracking', 'tracker', 'sid', 'visitor', 'user_id', 'fbp', 'fbsr', 'twid'],
            description: 'Tracking cookies used to monitor your behavior across websites'
        },
        analytics: {
            keywords: ['analytics', '_utm', 'metric', 'stat', 'measure', 'segment', 'amplitude', 'mixpanel'],
            description: 'Analytics cookies that collect data about how you use the website'
        },
        advertising: {
            keywords: ['ad', 'advert', 'campaign', 'marketing', 'retarget', 'doubleclick', 'criteo', 'adzerk'],
            description: 'Advertising cookies used for personalized ads and retargeting'
        },
        functional: {
            keywords: ['session', 'csrf', 'xsrf', 'auth', 'token', 'pref', 'language', 'theme', 'settings'],
            description: 'Functional cookies necessary for the website to work properly'
        },
        social: {
            keywords: ['facebook', 'twitter', 'linkedin', 'instagram', 'tiktok', 'youtube', 'social'],
            description: 'Social media cookies used for social sharing and integration'
        }
    };

    static async analyzeCookies() {
        try {
            // Get current tab URL to extract domain
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.url) {
                return {
                    status: 'error',
                    message: 'Could not determine current domain'
                };
            }
            
            const url = new URL(tab.url);
            const mainDomain = url.hostname;
            
            console.log('[CookieAnalyzer] Tab URL:', tab.url);
            console.log('[CookieAnalyzer] Main domain:', mainDomain);
            
            // Get ALL cookies from the browser
            let allCookies = await chrome.cookies.getAll({});
            console.log('[CookieAnalyzer] Total cookies in browser:', allCookies.length);
            
            // Build domain patterns to match
            const domainParts = mainDomain.split('.');
            const patterns = [
                mainDomain,  // www.instagram.com
                mainDomain.replace('www.', ''),  // instagram.com
            ];
            
            // Add parent domain (instagram.com from www.instagram.com)
            if (domainParts.length > 1) {
                patterns.push(domainParts.slice(-2).join('.'));  // instagram.com
            }
            
            // Add common third-party variants
            const baseName = mainDomain.replace('www.', '').split('.')[0]; // instagram, facebook, etc
            patterns.push(baseName); // instagram
            patterns.push('meta.com'); // Meta owns Instagram, Facebook, etc
            patterns.push('fbcdn.net');
            patterns.push('cdninstagram.com');
            patterns.push('instagram');
            patterns.push('facebook');
            
            console.log('[CookieAnalyzer] Matching patterns:', patterns);
            
            // Filter to cookies that match any pattern
            const relevantCookies = allCookies.filter(cookie => {
                const cookieDomain = cookie.domain.toLowerCase();
                return patterns.some(pattern => cookieDomain.includes(pattern));
            });
            
            console.log('[CookieAnalyzer] Filtered cookies:', relevantCookies.length);
            
            // If we got very few, include more broadly
            if (relevantCookies.length < 5) {
                console.log('[CookieAnalyzer] Low cookie count, expanding search...');
                // Include cookies with similar TLD or structure
                const expandedCookies = allCookies.filter(cookie => {
                    const cookieDomain = cookie.domain.toLowerCase();
                    return cookieDomain.includes('.com') || 
                           cookieDomain.includes('.net') ||
                           cookieDomain.includes(baseName);
                });
                if (expandedCookies.length > relevantCookies.length) {
                    relevantCookies.length = 0;
                    relevantCookies.push(...expandedCookies);
                    console.log('[CookieAnalyzer] Expanded to:', relevantCookies.length);
                }
            }
            
            console.log('[CookieAnalyzer] Sample cookies:', relevantCookies.slice(0, 5).map(c => ({ name: c.name, domain: c.domain })));

            if (!relevantCookies || relevantCookies.length === 0) {
                return {
                    status: 'no_cookies',
                    message: `No cookies found for ${mainDomain}. Try interacting with the site or visiting different pages.`,
                    cookies: [],
                    categorized: {},
                    totalCookies: 0,
                    breakdown: {tracking: 0, analytics: 0, advertising: 0, functional: 0, social: 0, other: 0},
                    discrepancies: []
                };
            }

            const categorized = this.categorizeCookies(relevantCookies);
            const riskAssessment = this.assessRisk(categorized);
            const recommendations = this.generateRecommendations(categorized, riskAssessment);
            const persistence = this.analyzePersistence(categorized);
            const thirdParty = this.detectThirdParty(relevantCookies);

            return {
                status: 'success',
                cookies: relevantCookies,
                categorized: categorized,
                totalCookies: relevantCookies.length,
                riskLevel: riskAssessment.level,
                riskScore: riskAssessment.score,
                riskExplanation: riskAssessment.explanation,
                breakdown: this.getBreakdown(categorized),
                discrepancies: this.findPolicyDiscrepancies(categorized),
                recommendations: recommendations,
                persistence: persistence,
                thirdPartyTrackers: thirdParty,
                privacyScore: this.calculatePrivacyScore(categorized, thirdParty)
            };
        } catch (error) {
            console.error('[CookieAnalyzer] Error:', error);
            return {
                status: 'error',
                message: 'Unable to analyze cookies: ' + error.message
            };
        }
    }

    static categorizeCookies(cookies) {
        const categorized = {
            tracking: [],
            analytics: [],
            advertising: [],
            functional: [],
            social: [],
            other: []
        };

        cookies.forEach(cookie => {
            const name = cookie.name.toLowerCase();
            const domain = cookie.domain.toLowerCase();
            let categorized_flag = false;

            for (const [category, data] of Object.entries(this.COOKIE_PATTERNS)) {
                if (data.keywords.some(keyword => name.includes(keyword) || domain.includes(keyword))) {
                    categorized[category].push({
                        name: cookie.name,
                        domain: cookie.domain,
                        expiry: cookie.expirationDate,
                        secure: cookie.secure,
                        httpOnly: cookie.httpOnly,
                        sameSite: cookie.sameSite,
                        value: cookie.value ? `${cookie.value.substring(0, 20)}...` : 'N/A'
                    });
                    categorized_flag = true;
                    break;
                }
            }

            if (!categorized_flag) {
                categorized.other.push({
                    name: cookie.name,
                    domain: cookie.domain,
                    expiry: cookie.expirationDate,
                    secure: cookie.secure,
                    httpOnly: cookie.httpOnly,
                    sameSite: cookie.sameSite,
                    value: cookie.value ? `${cookie.value.substring(0, 20)}...` : 'N/A'
                });
            }
        });

        return categorized;
    }

    static assessRisk(categorized) {
        let riskScore = 0;
        let riskLevel = 'LOW';
        let explanation = '';

        // Tracking cookies = high risk (4 points each)
        riskScore += categorized.tracking.length * 4;

        // Analytics + advertising = medium risk (2 points each)
        riskScore += (categorized.analytics.length + categorized.advertising.length) * 2;

        // Social cookies = medium risk (2 points each)
        riskScore += categorized.social.length * 2;

        // Functional + other = low risk (0.5 points each)
        riskScore += (categorized.functional.length + categorized.other.length) * 0.5;

        // Normalize to 0-100 scale
        const normalizedScore = Math.min(100, Math.round((riskScore / 50) * 100));

        if (normalizedScore >= 70) {
            riskLevel = 'HIGH';
            explanation = `High risk detected: ${categorized.tracking.length} tracking + ${categorized.advertising.length} advertising cookies detected`;
        } else if (normalizedScore >= 40) {
            riskLevel = 'MEDIUM';
            explanation = `Moderate risk: Mix of analytics and tracking cookies found`;
        } else {
            riskLevel = 'LOW';
            explanation = `Low risk: Mostly functional cookies detected`;
        }

        return { score: normalizedScore, level: riskLevel, explanation: explanation };
    }

    static getBreakdown(categorized) {
        return {
            tracking: categorized.tracking.length,
            analytics: categorized.analytics.length,
            advertising: categorized.advertising.length,
            functional: categorized.functional.length,
            social: categorized.social.length,
            other: categorized.other.length
        };
    }

    static findPolicyDiscrepancies(categorized) {
        const discrepancies = [];

        if (categorized.tracking.length > 0) {
            discrepancies.push({
                type: 'tracking_cookies',
                message: `Found ${categorized.tracking.length} tracking cookies - verify if privacy policy mentions tracking`,
                severity: 'high'
            });
        }

        if (categorized.advertising.length > 0 || categorized.social.length > 0) {
            discrepancies.push({
                type: 'third_party_cookies',
                message: `Found advertising/social cookies - check if policy discloses third-party partners`,
                severity: 'medium'
            });
        }

        if (categorized.analytics.length > 0) {
            discrepancies.push({
                type: 'analytics_cookies',
                message: `Analytics cookies detected - policy should explain data collection practices`,
                severity: 'medium'
            });
        }

        return discrepancies;
    }

    static generateRecommendations(categorized, riskAssessment) {
        const recommendations = [];

        if (riskAssessment.level === 'HIGH') {
            recommendations.push({
                priority: 'critical',
                text: '🚨 HIGH RISK: Consider disabling cookies or using incognito mode on this site',
                action: 'Review the site\'s privacy policy carefully before proceeding'
            });
        }

        if (categorized.tracking.length > 3) {
            recommendations.push({
                priority: 'high',
                text: '⚠️  Multiple tracking cookies detected',
                action: 'Use browser privacy settings or a cookie manager to limit tracking'
            });
        }

        if (categorized.advertising.length > 0) {
            recommendations.push({
                priority: 'medium',
                text: '📊 This site uses advertising cookies for targeted ads',
                action: 'Adjust advertising preferences in your browser settings'
            });
        }

        if (categorized.social.length > 0) {
            recommendations.push({
                priority: 'medium',
                text: '👥 Social media trackers detected',
                action: 'Consider blocking social media integrations on privacy-focused browsers'
            });
        }

        if (categorized.functional.length > 0) {
            recommendations.push({
                priority: 'low',
                text: '✅ Functional cookies detected (these are necessary)',
                action: 'These cookies help the site work - safe to accept'
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                priority: 'low',
                text: '✅ Cookie usage appears normal',
                action: 'No major privacy concerns detected'
            });
        }

        return recommendations;
    }

    static analyzePersistence(categorized) {
        const now = Math.floor(Date.now() / 1000);
        let shortTerm = 0;
        let longTerm = 0;
        let veryLongTerm = 0;

        const allCookies = [
            ...categorized.tracking,
            ...categorized.analytics,
            ...categorized.advertising,
            ...categorized.functional,
            ...categorized.social,
            ...categorized.other
        ];

        allCookies.forEach(cookie => {
            if (!cookie.expiry) return;
            const daysRemaining = (cookie.expiry - now) / 86400;
            
            if (daysRemaining > 365) veryLongTerm++;
            else if (daysRemaining > 30) longTerm++;
            else shortTerm++;
        });

        return {
            shortTerm,
            longTerm,
            veryLongTerm,
            analysis: `${veryLongTerm} cookies persist for >1 year (high tracking risk), ${longTerm} for 1+ months, ${shortTerm} expire soon`
        };
    }

    static detectThirdParty(cookies) {
        const thirdParty = [];
        const knownTrackers = ['google', 'facebook', 'meta', 'amazon', 'doubleclick', 'criteo', 'twitter', 'linkedin'];

        cookies.forEach(cookie => {
            const domain = cookie.domain.toLowerCase();
            if (knownTrackers.some(tracker => domain.includes(tracker)) && !domain.includes('localhost')) {
                thirdParty.push({
                    name: cookie.name,
                    company: knownTrackers.find(t => domain.includes(t)),
                    domain: domain,
                    purpose: 'Third-party tracking'
                });
            }
        });

        return thirdParty;
    }

    static calculatePrivacyScore(categorized, thirdParty) {
        let score = 100; // Start with perfect score

        score -= categorized.tracking.length * 10; // Tracking cookies = -10 each
        score -= categorized.advertising.length * 5; // Ads = -5 each
        score -= thirdParty.length * 8; // Third-party trackers = -8 each
        score -= categorized.analytics.length * 3; // Analytics = -3 each

        return Math.max(0, score); // Don't go below 0
    }
}
