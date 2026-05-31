class CookieAnalyzer {
    // Known consent/preference cookie names (substring match)
    static CONSENT_COOKIE_NAMES = [
        'cookie_consent', 'cookieconsent', 'gdpr_consent', 'consent', 'consent_status',
        'privacy_setting_detail', 'privacy_settings', 'cookielawinfo', 'cookies_accepted',
        'viewed_cookie_policy', 'cookie_notice_accepted', 'CookieConsent', 'euconsent',
        'cc_cookie', 'cookieyes', 'onetrust', 'cmplz', 'borlabs', 'complianz',
        // Facebook / Meta
        'usida', 'consent_management',
        // Generic additional
        'tracking_consent', 'user_consent', 'cookie_optin', 'cookie_optout'
    ];

    // Short/ambiguous names that must match the full cookie name exactly (case-insensitive)
    static CONSENT_COOKIE_EXACT_NAMES = [
        'oo',        // Facebook opt-out
        'SOCS',      // Google consent
        'NID',       // Google
        'CONSENT',   // Google
        'locale',    // Meta/Facebook locale-based consent
        'privacy'    // Amazon
    ];

    // Detects whether user has given/denied consent
    static detectConsent(cookies) {
        for (const cookie of cookies) {
            const name = cookie.name.toLowerCase();
            const rawValue = cookie.value || '';
            const isConsentCookie =
                this.CONSENT_COOKIE_NAMES.some(c => name.includes(c.toLowerCase())) ||
                this.CONSENT_COOKIE_EXACT_NAMES.some(c => name === c.toLowerCase());
            if (!isConsentCookie) continue;

            // Try URL-decode then JSON parse (covers Temu, OneTrust, CookieYes etc.)
            try {
                const decoded = decodeURIComponent(rawValue);
                const parsed = JSON.parse(decoded);
                const str = JSON.stringify(parsed).toLowerCase();
                console.log('[CookieAnalyzer] Consent cookie parsed JSON:', str);

                // Handle Temu-style per-platform ad preference cookies
                // e.g. {"fbads":1,"ggads":1,"ttads":1,...}
                const numericEntries = Object.entries(parsed).filter(([k, v]) => typeof v === 'number');
                if (numericEntries.length > 2) {
                    const enabledCount = numericEntries.filter(([, v]) => v === 1).length;
                    const totalCount = numericEntries.length;
                    console.log(`[CookieAnalyzer] Ad-platform prefs: ${enabledCount}/${totalCount} enabled`);
                    if (enabledCount === 0) {
                        return { found: true, cookieName: cookie.name, accepted: false, rawValue, detail: 'All ad platforms disabled' };
                    }
                    if (enabledCount === totalCount) {
                        return { found: true, cookieName: cookie.name, accepted: true, rawValue, detail: 'All ad platforms enabled' };
                    }
                    return { found: true, cookieName: cookie.name, accepted: null, rawValue, detail: `${enabledCount}/${totalCount} ad platforms enabled` };
                }

                // Handle adschoice binary string
                if (parsed.adschoice && typeof parsed.adschoice === 'string') {
                    const bits = parsed.adschoice;
                    const allZero = bits.split('').every(b => b === '0');
                    const allOne  = bits.split('').every(b => b === '1');
                    if (allZero) return { found: true, cookieName: cookie.name, accepted: false, rawValue };
                    if (allOne)  return { found: true, cookieName: cookie.name, accepted: true,  rawValue };
                }

                // Standard boolean flags
                if (str.includes('"accept_all":false') || str.includes('"rejected":true') ||
                    str.includes('"necessary_only":true')) {
                    return { found: true, cookieName: cookie.name, accepted: false, rawValue };
                }
                if (str.includes('"accept_all":true') || str.includes('"accepted":true') ||
                    str.includes('"all":true') || str.includes('"granted":true')) {
                    return { found: true, cookieName: cookie.name, accepted: true, rawValue };
                }

            } catch (e) {
                // Not JSON, fall through to string matching
            }

            const value = rawValue.toLowerCase();
            console.log('[CookieAnalyzer] Consent cookie raw value:', value);
            const rejected = value.includes('reject') || value.includes('decline') ||
                             value.includes('necessary_only') || value.includes('opt-out');
            const accepted = value.includes('accept') || value.includes('allow') ||
                             value.includes('granted') || value.includes('opt-in');

            return {
                found: true,
                cookieName: cookie.name,
                accepted: rejected ? false : accepted ? true : null,
                rawValue
            };
        }
        return { found: false, accepted: null, cookieName: null };
    }

    // Cookie patterns for categorization
    static COOKIE_PATTERNS = {
        tracking: {
            keywords: [
                // Google
                '_ga', '_gid', '_gat', '_gcl',
                // Facebook/Meta specific
                'fbp', 'fbsr', 'fb_', '_fbc', 'datr', 'sb', 'fr', 'wd', 'spin', 'xs', 'c_user',
                // User identifiers & fingerprinting
                'uuid', 'uid', 'user_id', 'userid', 'api_uid', 'device_id', 'deviceid',
                'visitor', 'visitor_id', 'visitorid',
                '_nano', 'nano_fp', 'fingerprint',
                // Behavioral tracking
                'tracking', 'tracker', 'track',
                // TikTok/ByteDance (Temu uses these)
                '_ttc', '_ttp', 'tt_', 'ttclid', 'ttwid',
                // Twitter/X
                'twid', 'ct0', 'guest_id',
                // Generic tracking patterns
                '_bee', 'beacon', 'pixel', 'telemetry',
                'sid', 'session_id', 'sessionid',
                // Hashed/obfuscated identifiers (short random names typical of trackers)
                'njrpl', 'dilx', 'hfsc'
            ],
            description: 'Tracking cookies used to monitor your behavior across websites'
        },
        analytics: {
            keywords: [
                'analytics', '_utm', 'utmz', 'utma', 'utmb', 'utmc',
                'metric', 'stat', 'measure',
                'segment', 'amplitude', 'mixpanel', 'hotjar', 'hj',
                'heap', 'fullstory', 'logrocket',
                'clarity', 'mouseflow', 'crazyegg',
                '_hjSession', 'ajs_'
            ],
            description: 'Analytics cookies that collect data about how you use the website'
        },
        advertising: {
            keywords: [
                'advert', 'campaign', 'retarget',
                'doubleclick', 'criteo', 'adzerk',
                'adsense', 'adwords', 'gclid', 'msclkid',
                'taboola', 'outbrain', 'spotx',
                'prebid', 'adnxs', 'rubiconproject',
                'pubmatic', 'appnexus', 'openx',
                'ttd_', 'liveramp', 'quantcast',
                // Must not start with just 'ad' to avoid false matches
                '__adroll', 'ar_debug'
            ],
            description: 'Advertising cookies used for personalized ads and retargeting'
        },
        functional: {
            keywords: [
                'session', 'csrf', 'xsrf', 'auth', 'token',
                'pref', 'preference', 'language', 'locale', 'lang',
                'theme', 'settings', 'config',
                'currency', 'region', 'timezone', 'country',
                'cart', 'basket', 'wishlist',
                '__cf_bm', '__cfruid', 'cf_clearance',  // Cloudflare security
                'img_sup'
            ],
            description: 'Functional cookies necessary for the website to work properly'
        },
        social: {
            keywords: [
                'facebook', 'twitter', 'linkedin', 'instagram',
                'tiktok', 'youtube', 'social',
                'pinterest', 'snapchat', 'reddit',
                'whatsapp', 'telegram'
            ],
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
            
            console.log('[CookieAnalyzer] ========== DEBUG START ==========');
            console.log('[CookieAnalyzer] Tab URL:', tab.url);
            console.log('[CookieAnalyzer] Main domain:', mainDomain);
            
            // Get ONLY cookies for this specific URL/domain
            let domainCookies = await chrome.cookies.getAll({ url: tab.url });
            console.log('[CookieAnalyzer] Direct URL query returned:', domainCookies.length, 'cookies');
            if (domainCookies.length > 0) {
                domainCookies.forEach(c => console.log(`  - ${c.name} (domain: ${c.domain})`));
            }
            
            // If no domain cookies, try getting all and filter by exact domain match
            if (domainCookies.length === 0) {
                console.log('[CookieAnalyzer] No cookies for URL, fetching ALL cookies in browser...');
                const allCookies = await chrome.cookies.getAll({});
                console.log('[CookieAnalyzer] Total cookies in browser:', allCookies.length);
                
                // Show all cookie domains for debugging
                const domains = new Set(allCookies.map(c => c.domain));
                console.log('[CookieAnalyzer] Domains with cookies:', Array.from(domains).join(', '));
                
                // Exact domain matching - try multiple strategies
                domainCookies = allCookies.filter(cookie => {
                    const cookieDomain = cookie.domain.toLowerCase().replace(/^\./, '');
                    const normalizedDomain = mainDomain.toLowerCase();
                    
                    // Match exact domain or subdomain
                    const matches = cookieDomain === normalizedDomain || 
                           normalizedDomain.endsWith(cookieDomain) ||
                           cookieDomain === '.'+normalizedDomain;
                    
                    if (matches) {
                        console.log(`[CookieAnalyzer] ✓ MATCHED: ${cookie.name} (domain: ${cookie.domain})`);
                    }
                    return matches;
                });
                
                console.log('[CookieAnalyzer] After exact matching:', domainCookies.length, 'cookies');
            }
            
            console.log('[CookieAnalyzer] ========== DEBUG END ==========');

            if (!domainCookies || domainCookies.length === 0) {
                console.log('[CookieAnalyzer] No HTTP cookies found, scanning localStorage/sessionStorage...');

                // Scan localStorage + sessionStorage in the page and build synthetic cookie objects
                let syntheticCookies = [];
                let lsKeyCount = 0;
                try {
                    const [lsExec] = await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: () => {
                            const extract = (store) => {
                                const items = [];
                                for (let i = 0; i < store.length; i++) {
                                    const key = store.key(i);
                                    let val = '';
                                    try { val = (store.getItem(key) || '').substring(0, 60); } catch (_) {}
                                    items.push({ key, val });
                                }
                                return items;
                            };
                            return {
                                local: extract(localStorage),
                                session: extract(sessionStorage)
                            };
                        }
                    });

                    if (lsExec && lsExec.result) {
                        const allItems = [
                            ...lsExec.result.local.map(i => ({ ...i, source: 'localStorage' })),
                            ...lsExec.result.session.map(i => ({ ...i, source: 'sessionStorage' }))
                        ];
                        lsKeyCount = allItems.length;
                        console.log('[CookieAnalyzer] Storage keys found:', lsKeyCount);

                        // Build synthetic cookie objects that categorizeCookies can process
                        for (const { key, val, source } of allItems) {
                            syntheticCookies.push({
                                name: key,
                                domain: mainDomain,
                                value: val,
                                expirationDate: undefined,
                                secure: false,
                                httpOnly: false,
                                sameSite: 'no_restriction',
                                _source: source   // extra metadata
                            });
                        }
                    }
                } catch (e) {
                    console.log('[CookieAnalyzer] Could not scan page storage:', e.message);
                }

                if (syntheticCookies.length === 0) {
                    return {
                        status: 'no_cookies',
                        message: `No HTTP cookies found for ${mainDomain}. This site may use localStorage/sessionStorage instead. Try interacting with the site or visiting different pages.`,
                        cookies: [],
                        categorized: {},
                        totalCookies: 0,
                        breakdown: {tracking: 0, analytics: 0, advertising: 0, functional: 0, social: 0, other: 0},
                        discrepancies: [],
                        recommendations: [],
                        persistence: { shortTerm: 0, longTerm: 0, veryLongTerm: 0, analysis: 'No persistent storage detected' },
                        thirdPartyTrackers: [],
                        privacyScore: 100
                    };
                }

                // Run full analysis on the synthetic (localStorage) cookies
                domainCookies = syntheticCookies;
                console.log('[CookieAnalyzer] Analyzing', domainCookies.length, 'localStorage/sessionStorage entries as synthetic cookies');
            }

            const categorized = this.categorizeCookies(domainCookies);
            const consentStatus = this.detectConsent(domainCookies);

            // Check if a cookie consent banner is currently visible in the live page DOM.
            // We inject a script directly instead of reading the badge, because the badge
            // is cleared by navigation events and can be stale by the time analysis runs.
            let bannerActive = false;
            try {
                const [detection] = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                        function isVisible(el) {
                            if (!el) return false;
                            const s = window.getComputedStyle(el);
                            const r = el.getBoundingClientRect();
                            return s.display !== 'none' && s.visibility !== 'hidden' &&
                                   s.opacity !== '0' && r.width > 0 && r.height > 0;
                        }
                        // Selector-based detection
                        const selectors = [
                            '[class*="cookie"]', '[id*="cookie"]',
                            '[class*="consent"]', '[id*="consent"]',
                            '[class*="gdpr"]', '[id*="gdpr"]',
                            '[class*="privacy"]', '[id*="privacy"]',
                            '.onetrust-banner', '#onetrust-banner',
                            '.CookiebotDialog', '#CookiebotDialog',
                            '[class*="banner"]', '[role="dialog"]'
                        ];
                        for (const sel of selectors) {
                            try {
                                const el = document.querySelector(sel);
                                if (isVisible(el)) return true;
                            } catch (e) {}
                        }
                        // Button-based detection — multilingual (EN, RO, FR, DE, ES, IT, NL)
                        const CONSENT_WORDS = [
                            'accept all', 'reject all', 'accept cookies', 'decline all',
                            'agree', 'i agree', 'got it',
                            // Romanian
                            'acceptați', 'acceptati', 'respingeți', 'respingeti', 'refuzați',
                            // French
                            'tout accepter', 'tout refuser', 'accepter',
                            // German
                            'alle akzeptieren', 'alle ablehnen', 'akzeptieren',
                            // Spanish
                            'aceptar todo', 'rechazar todo', 'aceptar',
                            // Italian
                            'accetta tutto', 'rifiuta tutto',
                            // Dutch
                            'alles accepteren', 'alles weigeren'
                        ];
                        const buttons = document.querySelectorAll('button, [role="button"], a');
                        for (const btn of buttons) {
                            const text = (btn.innerText || btn.textContent || '').toLowerCase().trim();
                            if (CONSENT_WORDS.some(w => text === w || text.startsWith(w)) && isVisible(btn)) {
                                return true;
                            }
                        }
                        return false;
                    }
                });
                bannerActive = detection?.result === true;
                console.log('[CookieAnalyzer] Banner active (live DOM):', bannerActive);
            } catch (e) {
                // Fallback to badge if script injection fails (e.g. chrome:// pages)
                try {
                    const badgeText = await chrome.action.getBadgeText({ tabId: tab.id });
                    bannerActive = !!(badgeText && badgeText.trim() !== '');
                } catch (e2) {}
                console.log('[CookieAnalyzer] Banner active (badge fallback):', bannerActive);
            }

            // Check previous analysis for this domain to detect "rejection not honored"
            const sessionKey = `prev_${mainDomain}`;
            let previousAnalysis = null;
            try {
                const stored = await chrome.storage.session.get(sessionKey);
                previousAnalysis = stored[sessionKey] || null;
                if (previousAnalysis) {
                    console.log('[CookieAnalyzer] Previous analysis:', previousAnalysis);
                }
            } catch (e) { /* session storage unavailable */ }

            // Check if the user recently clicked a reject button on this domain
            let userRejected = false;
            try {
                const rejKey = `rejected_${mainDomain}`;
                const stored = await chrome.storage.local.get(rejKey);
                const flag = stored[rejKey];
                // Consider the rejection flag valid for 5 minutes; keep it so re-analyses still see it
                if (flag && (Date.now() - flag.rejectedAt) < 5 * 60 * 1000) {
                    userRejected = true;
                    console.log('[CookieAnalyzer] User rejection flag found for:', mainDomain);
                    // Do NOT clear — flag persists for full 5-min window so subsequent analyses also detect it
                }
            } catch (e) { /* ignore */ }

            const riskAssessment = this.assessRisk(categorized, consentStatus, bannerActive, previousAnalysis, userRejected);
            const recommendations = this.generateRecommendations(categorized, riskAssessment);
            const persistence = this.analyzePersistence(categorized);
            const thirdParty = this.detectThirdParty(domainCookies);

            // Save current analysis state to session for next comparison
            try {
                await chrome.storage.session.set({
                    [sessionKey]: {
                        complianceStatus: riskAssessment.complianceStatus,
                        bannerWasActive: bannerActive,
                        trackingCount: categorized.tracking.length,
                        consentAccepted: consentStatus.accepted,
                        consentDetail: consentStatus.detail || null
                    }
                });
            } catch (e) { /* ignore */ }

            return {
                status: 'success',
                cookies: domainCookies,
                categorized: categorized,
                totalCookies: domainCookies.length,
                riskLevel: riskAssessment.level,
                complianceStatus: riskAssessment.complianceStatus,
                riskScore: riskAssessment.score,
                riskExplanation: riskAssessment.explanation,
                consentStatus: consentStatus,
                breakdown: this.getBreakdown(categorized),
                discrepancies: this.findPolicyDiscrepancies(categorized),
                recommendations: recommendations,
                persistence: persistence,
                thirdPartyTrackers: thirdParty,
                privacyScore: this.calculatePrivacyScore(categorized, thirdParty),
                storageType: domainCookies.some(c => c._source) ? 'localStorage' : 'HTTP'
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

    static assessRisk(categorized, consentStatus, bannerActive = false, previousAnalysis = null, userRejected = false) {
        let riskScore = 0;
        let riskLevel = 'LOW';
        let complianceStatus = 'COMPLIANT';
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

        const hasTrackingCookies = categorized.tracking.length > 0 ||
                                   categorized.analytics.length > 0 ||
                                   categorized.advertising.length > 0 ||
                                   categorized.social.length > 0;

        // NON-COMPLIANT: banner is active but consent is already pre-set to "accepted"
        // Catches sites (e.g. Temu) that set tracking cookies BEFORE user makes any choice.
        if (hasTrackingCookies && bannerActive && consentStatus.found && consentStatus.accepted === true) {
            riskLevel = 'HIGH';
            complianceStatus = 'NON-COMPLIANT';
            const isRepeatOffense = previousAnalysis?.complianceStatus === 'NON-COMPLIANT' &&
                                    previousAnalysis?.consentDetail &&
                                    consentStatus.detail === previousAnalysis.consentDetail;
            if (isRepeatOffense) {
                explanation = `Consent choice not honored: ${categorized.tracking.length + categorized.analytics.length + categorized.advertising.length} tracking cookies remain active and the consent state is unchanged after your banner interaction. Your rejection was ignored — this violates GDPR.`;
            } else {
                explanation = `Pre-consent tracking detected: Cookie banner is still visible, yet ${categorized.tracking.length} tracking cookies are already active and consent is pre-set to "accepted". The site collected data before you made a choice — this violates GDPR Article 7.`;
            }
        }
        // NON-COMPLIANT: user clicked reject/decline but consent cookie is still "accepted"
        // (site has an HTTP consent cookie but ignored the rejection — e.g. Temu)
        else if (hasTrackingCookies && userRejected && consentStatus.found && consentStatus.accepted === true) {
            riskLevel = 'HIGH';
            complianceStatus = 'NON-COMPLIANT';
            const count = categorized.tracking.length + categorized.analytics.length + categorized.advertising.length;
            explanation = `Consent choice not honored: You clicked reject but ${count} tracking cookies remain active and the consent cookie is still set to "accepted" — your rejection was ignored. This violates GDPR.`;
        }
        // OPT-OUT IGNORED: user clicked reject/decline and tracking cookies are still present.
        // Require !bannerActive: if the banner is still showing the rejection flag is stale
        // (from a previous session) and the user hasn't interacted with it yet.
        else if (hasTrackingCookies && userRejected && !bannerActive) {
            const count = categorized.tracking.length + categorized.analytics.length +
                          categorized.advertising.length + categorized.social.length;
            riskLevel = 'HIGH';
            complianceStatus = 'OPT-OUT IGNORED';
            explanation = `Tracking continues after rejection: You declined cookies but ${count} tracking/social cookies are still active. The site does not honor opt-out choices — this violates GDPR Article 7.`;
        }
        // NON-COMPLIANT: consent cookie found but its value is unreadable (Unknown) and banner is still visible
        // This is effectively the same as pre-consent — we cannot verify any choice was made
        else if (hasTrackingCookies && bannerActive && consentStatus.found && consentStatus.accepted === null) {
            const count = categorized.tracking.length + categorized.analytics.length +
                          categorized.advertising.length + categorized.social.length;
            riskLevel = 'HIGH';
            complianceStatus = 'NON-COMPLIANT';
            explanation = `Pre-consent tracking detected: ${count} tracking/social cookies are active while the consent banner is still showing. The consent cookie ('${consentStatus.cookieName}') was found but its value could not be verified — this violates GDPR.`;
        }
        // NON-COMPLIANT: banner still visible, no consent cookie — classic pre-consent tracking
        else if (hasTrackingCookies && !consentStatus.found && bannerActive) {
            const count = categorized.tracking.length + categorized.analytics.length +
                          categorized.advertising.length + categorized.social.length;
            riskLevel = 'HIGH';
            complianceStatus = 'NON-COMPLIANT';
            explanation = `Pre-consent tracking detected: ${count} tracking/social cookies are active while the consent banner is still showing. The site is collecting data before obtaining your permission — this violates GDPR.`;
        }
        // HIGH RISK: banner gone, no verifiable consent cookie, tracking cookies present
        // Consent may have been given but the site stores it server-side (e.g. Facebook after "Allow all").
        else if (hasTrackingCookies && !consentStatus.found && !bannerActive) {
            const count = categorized.tracking.length + categorized.analytics.length +
                          categorized.advertising.length + categorized.social.length;
            riskLevel = 'HIGH';
            complianceStatus = 'HIGH RISK';
            explanation = `Unverifiable consent: ${count} tracking/social cookies are active but no consent record was found in HTTP cookies. This site stores consent server-side, making independent verification impossible — a transparency concern under GDPR.`;
        }
        // NON-COMPLIANT: user explicitly rejected via consent cookie but tracking cookies still exist
        else if (hasTrackingCookies && consentStatus.found && consentStatus.accepted === false) {
            riskLevel = 'HIGH';
            complianceStatus = 'NON-COMPLIANT';
            explanation = `Cookie rejection ignored: User declined cookies (via '${consentStatus.cookieName}') but ${categorized.tracking.length + categorized.analytics.length} tracking cookies are still active. This violates GDPR.`;
        }
        // Normal risk scoring when consent was given and honored
        else if (normalizedScore >= 70) {
            riskLevel = 'HIGH';
            complianceStatus = 'HIGH RISK';
            const consentNote = consentStatus.found && consentStatus.accepted === true
                ? `Consent given via '${consentStatus.cookieName}'.`
                : consentStatus.found && consentStatus.accepted === null
                    ? `Consent cookie '${consentStatus.cookieName}' found but value could not be verified.`
                    : 'No verifiable consent record found.';
            explanation = `High risk: ${categorized.tracking.length} tracking + ${categorized.advertising.length} advertising cookies detected. ${consentNote}`;
        } else if (normalizedScore >= 40) {
            riskLevel = 'MEDIUM';
            complianceStatus = 'MODERATE RISK';
            explanation = `Moderate risk: Mix of analytics and tracking cookies found.`;
        } else {
            riskLevel = 'LOW';
            complianceStatus = 'COMPLIANT';
            explanation = `Low risk: Mostly functional cookies detected.`;
        }

        return { score: normalizedScore, level: riskLevel, complianceStatus, explanation };
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
