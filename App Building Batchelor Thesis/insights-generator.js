// Privacy Policy Insights Generator
// Transforms raw analysis into actionable insights

window.INSIGHTS_LOADED = true;
console.log('[InsightsGenerator] Loading insights generator...');

try {
  class InsightsGenerator {
    static generateInsights(result) {
      try {
        console.log('[InsightsGenerator] Generating insights for score:', result.score);
        return {
          summary: this.generateSummary(result.score),
          recommendations: this.generateRecommendations(result),
          riskIndicator: this.getRiskIndicator(result.score)
        };
      } catch (e) {
        console.error('[InsightsGenerator] Error in generateInsights:', e);
        return null;
      }
    }

    static generateSummary(score) {
      if (score <= 2) {
        return {
          title: "VERY HIGH RISK",
          description: "This privacy policy indicates extremely poor data protection.",
          details: [
            "The company explicitly mentions selling or sharing your personal data with third parties for profit",
            "Extensive data collection practices are described, including sensitive information",
            "Users have minimal rights to access, delete, or control their data",
            "Data may be retained indefinitely without clear deletion policies"
          ]
        };
      } else if (score <= 4) {
        return {
          title: "HIGH RISK",
          description: "This privacy policy has significant concerns.",
          details: [
            "Substantial data collection and potential third-party sharing are evident",
            "The company collects more data than necessary for core functionality",
            "Limited user control options available",
            "Long data retention periods are mentioned"
          ]
        };
      } else if (score <= 6) {
        return {
          title: "MEDIUM RISK",
          description: "This privacy policy has mixed practices.",
          details: [
            "Some data collection occurs but is partially justified",
            "Third-party sharing may happen but is somewhat limited",
            "Users have some control over their data",
            "Moderate data retention periods"
          ]
        };
      } else if (score <= 8) {
        return {
          title: "LOW RISK",
          description: "This privacy policy includes good protections.",
          details: [
            "Data collection is limited to essential functions",
            "Strong user rights including access and deletion",
            "Minimal or no third-party sharing",
            "Clear data retention and deletion policies"
          ]
        };
      } else {
        return {
          title: "EXCELLENT",
          description: "This privacy policy shows strong commitment to protecting your data.",
          details: [
            "Minimal necessary data collection",
            "Strong user rights with easy access and deletion",
            "No data selling or sharing with third parties",
            "Transparent and short data retention policies"
          ]
        };
      }
    }

    static generateRecommendations(result) {
      const recs = [];
      const score = result.score;
      const flags = result.flags || [];

      // Check for data sharing keywords
      const sharingFlags = flags.filter(f => f.category === 'third_party_sharing');
      if (sharingFlags.length > 5) {
        recs.push("Your data is being shared widely. Consider using privacy tools like VPNs when using this service");
        recs.push("Review your privacy settings to minimize data shared with third parties");
        recs.push("Disable personalized advertising options if available");
        recs.push("Consider whether this service is worth the privacy trade-off");
      } else if (sharingFlags.length > 0) {
        recs.push("This service shares some data with partners. Review what information is being shared");
      }

      // Check for data collection
      const collectionFlags = flags.filter(f => f.category === 'data_collection');
      if (collectionFlags.length > 8) {
        recs.push("Extensive tracking detected. Clear cookies regularly or use private browsing when visiting");
        recs.push("Disable location services and camera/microphone permissions in browser settings");
        recs.push("Consider using a privacy-focused browser like Firefox with strong tracking protection");
        recs.push("Install a content blocker or privacy extension to reduce data collection");
      } else if (collectionFlags.length > 3) {
        recs.push("Moderate data collection detected. Review what data you're providing");
      }

      // Check for user rights
      const rightsFlags = flags.filter(f => f.category === 'user_rights');
      if (rightsFlags.length > 5) {
        recs.push("You have good privacy rights with this service. Request and download your data annually");
        recs.push("You can delete your data at any time. Consider doing this if you stop using the service");
      } else if (rightsFlags.length === 0) {
        recs.push("Warning: This policy does not mention user rights. You may have limited control over your data");
      }

      // Default advice
      if (recs.length === 0) {
        recs.push("Read the full privacy policy to understand all data practices");
        recs.push("Use strong, unique passwords for this service");
      }

      return recs.slice(0, 4);
    }

    static getRiskIndicator(score) {
      if (score <= 2) return { emoji: '', level: 'VERY HIGH RISK', color: '#d32f2f' };
      if (score <= 4) return { emoji: '', level: 'HIGH RISK', color: '#f57c00' };
      if (score <= 6) return { emoji: '', level: 'MEDIUM RISK', color: '#fbc02d' };
      if (score <= 8) return { emoji: '', level: 'LOW RISK', color: '#7cb342' };
      return { emoji: '', level: 'EXCELLENT', color: '#388e3c' };
    }
  }

  window.InsightsGenerator = InsightsGenerator;
  console.log('[InsightsGenerator] InsightsGenerator class ready');
} catch (err) {
  console.error('[InsightsGenerator] ERROR:', err.message);
}
