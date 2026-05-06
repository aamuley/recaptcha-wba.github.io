async function createRecaptchaAssessment(token, siteKey, action) {
  // REQUIRED: Replace these with your actual Google Cloud Project data
  const GOOGLE_CLOUD_PROJECT_ID = "ps-docs-ai-chatbox";
  const GOOGLE_API_KEY = "AIzaSyAKlp55W-EO4f-WpCVzvvtFrweD6Tf5vp0";

  // Google's live Enterprise Assessment URL
  const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT_ID}/assessments?key=${GOOGLE_API_KEY}`;

  const payload = {
    event: {
      token: token,
      siteKey: siteKey,
      expectedAction: action
    }
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // If Google returns an error object (e.g., bad API key, wrong project ID)
    if (data.error) {
      return {
        valid: false,
        score: 0.0,
        text_response: `Google API Error: ${data.error.message}`,
        reason: data.error.status
      };
    }

    // Parse Google's token properties and assessment verdict
    const isTokenValid = data.tokenProperties ? data.tokenProperties.valid : false;
    const score = data.riskAnalysis ? data.riskAnalysis.score : 0.0;
    const reason = data.riskAnalysis && data.riskAnalysis.reasons ? data.riskAnalysis.reasons.join(', ') : "NONE";

    return {
      valid: isTokenValid,
      score: score,

      text_response: isTokenValid
        ? `Success: Assessment verified. Score is ${score}.`
        : `Failed: Token invalid. Reason: ${data.tokenProperties?.invalidReason || 'UNKNOWN'}`,
      reason: reason
    };

  } catch (err) {
    return {
      valid: false,
      score: 0.0,
      text_response: `Network / CORS Error: ${err.message}`,
      reason: "NETWORK_FAILURE"
    };
  }
}