/**
 * Privacy Policy Analyzer - Core Engine
 * Ported from Python main.py to JavaScript
 * Runs entirely client-side, no backend required
 */

/**
 * Enhanced privacy keyword categories with tiered confidence levels
 * Based on GDPR, CCPA, and ePrivacy Directive standards
 */
const PRIVACY_CATEGORIES = {
  "third_party_sharing": {
    critical: [
      "sell data", "sell to third parties", "third party sharing", "sell your data",
      "sell information", "sell personal data", "data broker",
      "sell or share", "disclosed to third parties", "share with advertisers",
      "share with business partners", "disclose to service providers"
    ],
    moderate: [
      "share", "third party", "partner", "vendor", "affiliate", "processor",
      "data sharing", "external parties", "recipient", "disclose", "disclosure",
      "third-party", "partners", "advertisers", "analytics", "advertising network"
    ],
    weak: [
      "integrate", "collaboration", "cooperate", "work with", "contact",
      "service provider", "provider", "contractor"
    ]
  },
  
  "data_collection": {
    critical: [
      "collect personal information", "collect your data", "automatically collect",
      "collect identifiable information", "collect sensitive data",
      "collect payment information", "collect biometric data",
      "collect health information", "collect location data continuously"
    ],
    moderate: [
      "collect", "location", "ip address", "cookies", "device information",
      "track", "tracking", "monitor", "browsing history", "cookies and similar",
      "device identifiers", "session data", "user information", "personal details",
      "usage information", "behavioral data", "clickstream", "profile data",
      "email address", "phone number", "identification", "telemetry"
    ],
    weak: [
      "information gathering", "data point", "metric", "analytics",
      "user activity", "visitor information", "page views"
    ]
  },
  
  "user_rights": {
    critical: [
      "right to be forgotten", "right to deletion", "right to delete",
      "right to access", "right to data portability", "data subject rights",
      "delete personal data", "request deletion", "erase personal data"
    ],
    moderate: [
      "opt-out", "delete", "request access", "unsubscribe", "withdraw consent",
      "opt-in", "consent", "choice", "control", "access your data",
      "modify", "correct", "update", "data subject", "access", "transparency",
      "notification", "withdraw", "objection"
    ],
    weak: [
      "contact us", "preference", "feedback", "support", "customer service",
      "inquire", "question", "help"
    ]
  },
  
  "data_retention": {
    critical: [
      "retain indefinitely", "retain permanently", "never delete",
      "keep for legal purposes indefinitely"
    ],
    moderate: [
      "retain", "retention", "keep", "maintain", "archive", "storage",
      "how long", "deletion schedule", "retention period", "keep data"
    ],
    weak: [
      "storage", "backup", "system"
    ]
  },
  
  "consent_requirement": {
    critical: [
      "consent is required", "you must consent", "consent mandatory",
      "require explicit consent", "prior consent required"
    ],
    moderate: [
      "with your consent", "with consent", "consent", "require consent",
      "explicit consent", "opt-in", "permission", "approval"
    ],
    weak: [
      "agree", "accept", "acknowledge"
    ]
  }
};

// Words that negate or soften concerns
const NEGATION_WORDS = [
  "not", "never", "no", "neither", "nor", "without", "rarely",
  "don't", "doesn't", "won't", "cannot", "can't", "do not",
  "does not", "will not", "no longer", "except"
];

// Legal/exemption patterns that indicate required/mandatory actions
const MANDATORY_PATTERNS = [
  /required by law/gi,
  /by law/gi,
  /legal requirement/gi,
  /law enforcement/gi,
  /legal obligation/gi,
  /court order/gi,
  /government request/gi,
  /judicial order/gi,
  /legal process/gi,
  /comply with law/gi,
  /as required/gi,
  /mandatory disclosure/gi,
  /lawful request/gi
];

// Patterns that indicate data collection is optional/user-controlled
const OPTIONAL_PATTERNS = [
  /you can choose/gi,
  /you may choose/gi,
  /optional/gi,
  /at your option/gi,
  /if you prefer/gi,
  /you decide/gi,
  /you control/gi,
  /you decide whether/gi,
  /your choice/gi,
  /choose to/gi,
  /opt-in/gi,
  /opt out/gi,
  /can be disabled/gi,
  /can turn off/gi,
  /you may decline/gi
];

// Patterns indicating mandatory/forced data collection
const MANDATORY_COLLECTION_PATTERNS = [
  /we collect/gi,
  /we automatically/gi,
  /we monitor/gi,
  /we track/gi,
  /we require/gi,
  /we must collect/gi,
  /necessarily collect/gi,
  /required to collect/gi,
  /need to collect/gi,
  /in order to provide/gi,
  /cannot function without/gi,
  /necessary for/gi
];

/**
 * Main analysis function - Enhanced with better context detection
 * Distinguishes between opt-out, mandatory, and optional collection
 * @param {string} text - Privacy policy text to analyze
 * @returns {object} Analysis results with score, metrics, flags, and collection types
 */
function analyzePrivacyPolicy(text) {
  if (!text || text.trim().length === 0) {
    return {
      score: 10,
      metrics: {
        data_collection: 0,
        third_party_sharing: 0,
        user_rights: 0,
        data_retention: 0,
        consent_requirement: 0
      },
      flags: [],
      collectionTypes: {
        mandatory: 0,
        optional: 0,
        undeclared: 0
      },
      confidence: {}
    };
  }

  // Tokenize into sentences
  const sentences = tokenizeSentences(text);
  
  const findings = {
    data_collection: 0,
    third_party_sharing: 0,
    user_rights: 0,
    data_retention: 0,
    consent_requirement: 0
  };
  
  const collectionTypes = {
    mandatory: 0,
    optional: 0,
    undeclared: 0
  };
  
  const flagsWithConfidence = {};
  
  // Analyze each sentence with context window
  sentences.forEach((sentence, index) => {
    // Get surrounding sentences for better context (±1 sentence)
    const contextStart = Math.max(0, index - 1);
    const contextEnd = Math.min(sentences.length, index + 2);
    const contextWindow = sentences.slice(contextStart, contextEnd).map(s => s.toLowerCase()).join(" ");
    
    const sentenceLower = sentence.toLowerCase();
    
    // Check if sentence contains legal exemptions
    const hasMandatoryPattern = MANDATORY_PATTERNS.some(pattern => pattern.test(sentenceLower));
    
    // Check for negation in context
    const hasNegation = NEGATION_WORDS.some(word => 
      new RegExp(`\\b${word}\\b`, 'gi').test(contextWindow)
    );
    
    // Check if collection is optional or mandatory
    const isOptional = OPTIONAL_PATTERNS.some(pattern => pattern.test(contextWindow));
    const isMandatory = MANDATORY_COLLECTION_PATTERNS.some(pattern => pattern.test(contextWindow));
    
    // Scan for keywords in all categories
    Object.entries(PRIVACY_CATEGORIES).forEach(([category, tierKeywords]) => {
      Object.entries(tierKeywords).forEach(([tier, keywords]) => {
        keywords.forEach(keyword => {
          const keywordRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          
          if (keywordRegex.test(sentenceLower)) {
            
            // Skip if it's explicitly negated (except for user_rights which is positive)
            if (hasNegation && category !== "user_rights" && category !== "consent_requirement") {
              return; // Don't count this finding
            }
            
            // Skip legal/mandatory exemptions
            if (hasMandatoryPattern && (category === "third_party_sharing" || category === "data_collection")) {
              return; // Acceptable under law
            }
            
            // Add to findings
            findings[category]++;
            
            // Track collection type for data collection keywords
            if (category === "data_collection" && (isOptional || isMandatory)) {
              if (isOptional) collectionTypes.optional++;
              if (isMandatory) collectionTypes.mandatory++;
            } else if (category === "data_collection") {
              collectionTypes.undeclared++;
            }
            
            // Store flag with confidence tier and collection type
            const flagKey = keyword.toLowerCase();
            if (!flagsWithConfidence[flagKey]) {
              flagsWithConfidence[flagKey] = {
                text: keyword,
                tier: tier,
                confidence: getConfidenceScore(tier),
                count: 0,
                category: category,
                collectionType: (category === "data_collection") ? 
                  (isOptional ? "optional" : isMandatory ? "mandatory" : "undeclared") : null
              };
            }
            flagsWithConfidence[flagKey].count++;
          }
        });
      });
    });
  });

  // Calculate privacy score with new weighting
  // Third-party sharing is worst (0.2 per mention)
  // Mandatory data collection is bad (0.08 per mention)
  // Optional data collection is moderate (0.03 per mention)
  // User rights are good (0.2 per mention)
  const mandatory_collection_score = collectionTypes.mandatory * 0.08;
  const optional_collection_score = collectionTypes.optional * 0.03;
  const undeclared_collection_score = collectionTypes.undeclared * 0.06;
  
  const score_deduction = 
    (findings.third_party_sharing * 0.2) + 
    mandatory_collection_score +
    optional_collection_score +
    undeclared_collection_score +
    (findings.data_retention * 0.15);
  
  const score_addition = (findings.user_rights * 0.2) + (findings.consent_requirement * 0.15);
  
  const base_score = 10;
  const final_score = Math.max(1, Math.min(10, Math.round(base_score - score_deduction + score_addition)));
  
  // Prepare flags array sorted by confidence
  const flagsArray = Object.values(flagsWithConfidence)
    .sort((a, b) => {
      // Sort by confidence first, then by count
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return b.count - a.count;
    })
    .map(flag => ({
      text: flag.text,
      tier: flag.tier,
      confidence: flag.confidence,
      count: flag.count,
      category: flag.category,
      collectionType: flag.collectionType
    }));

  return {
    score: final_score,
    metrics: findings,
    flags: flagsArray,
    collectionTypes: collectionTypes,
    confidence: Object.fromEntries(
      flagsArray.map(f => [f.text, f.confidence])
    ),
    received_length: text.length
  };
}

/**
 * Tokenize text into sentences (simple regex-based approach)
 * @param {string} text
 * @returns {array} Array of sentences
 */
function tokenizeSentences(text) {
  // Split on sentence boundaries (. ! ?) followed by space and capital letter
  const sentences = text.match(/[^.!?]*[.!?]+/g) || [text];
  return sentences
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Get confidence score based on keyword tier
 * @param {string} tier - "critical", "moderate", or "weak"
 * @returns {number} Confidence 0-100
 */
function getConfidenceScore(tier) {
  const tierScores = {
    critical: 95,
    moderate: 70,
    weak: 45
  };
  return tierScores[tier] || 50;
}

/**
 * Process text in chunks for large policies (used by Web Worker)
 * @param {string} text
 * @param {number} chunkSize - Characters per chunk
 * @returns {array} Array of {chunk, startChar, endChar} objects
 */
function chunkText(text, chunkSize = 50000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push({
      chunk: text.slice(i, i + chunkSize),
      startChar: i,
      endChar: Math.min(i + chunkSize, text.length)
    });
  }
  return chunks;
}

/**
 * Merge results from multiple chunks
 * @param {array} chunkResults - Array of analysis results from chunks
 * @returns {object} Merged result
 */
function mergeChunkResults(chunkResults) {
  const merged = {
    metrics: {
      data_collection: 0,
      third_party_sharing: 0,
      user_rights: 0,
      data_retention: 0,
      consent_requirement: 0
    },
    collectionTypes: {
      mandatory: 0,
      optional: 0,
      undeclared: 0
    },
    flags: {},
    totalLength: 0
  };

  chunkResults.forEach(result => {
    merged.metrics.data_collection += result.metrics.data_collection;
    merged.metrics.third_party_sharing += result.metrics.third_party_sharing;
    merged.metrics.user_rights += result.metrics.user_rights;
    merged.metrics.data_retention += result.metrics.data_retention || 0;
    merged.metrics.consent_requirement += result.metrics.consent_requirement || 0;
    merged.totalLength += result.received_length;
    
    merged.collectionTypes.mandatory += result.collectionTypes.mandatory;
    merged.collectionTypes.optional += result.collectionTypes.optional;
    merged.collectionTypes.undeclared += result.collectionTypes.undeclared;

    // Merge flags
    result.flags.forEach(flag => {
      const key = flag.text.toLowerCase();
      if (!merged.flags[key]) {
        merged.flags[key] = { ...flag };
      } else {
        merged.flags[key].count += flag.count;
      }
    });
  });

  // Convert flags back to array
  const flagsArray = Object.values(merged.flags)
    .sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return b.count - a.count;
    });

  // Recalculate score on merged metrics
  const mandatory_collection_score = merged.collectionTypes.mandatory * 0.08;
  const optional_collection_score = merged.collectionTypes.optional * 0.03;
  const undeclared_collection_score = merged.collectionTypes.undeclared * 0.06;
  
  const score_deduction = 
    (merged.metrics.third_party_sharing * 0.2) + 
    mandatory_collection_score +
    optional_collection_score +
    undeclared_collection_score +
    (merged.metrics.data_retention * 0.15);
  
  const score_addition = (merged.metrics.user_rights * 0.2) + (merged.metrics.consent_requirement * 0.15);
  const final_score = Math.max(1, Math.min(10, Math.round(10 - score_deduction + score_addition)));

  return {
    score: final_score,
    metrics: merged.metrics,
    flags: flagsArray,
    collectionTypes: merged.collectionTypes,
    received_length: merged.totalLength
  };
}
