const { GoogleGenerativeAI } = require("@google/generative-ai");

// Sample vulnerability scan data based on the logs
const sampleScanData = {
  recon: {
    open_ports: [],
    subdomains: ['ftp.axentobooks.com', 'www.axentobooks.com'],
    technologies: [
      { name: "Nginx", version: "1.18.0", category: "Web Server" },
      { name: "PHP", version: "7.4", category: "Programming Language" }
    ],
    info_disclosure: [
      { type: "Server Header", description: "Server version exposed", severity: "Low", location: "HTTP Headers" }
    ]
  },
  auth: {
    weak_auth: [
      { 
        type: "Weak Password Policy",
        description: "No password complexity requirements",
        severity: "High",
        details: { endpoint: "/auth/register" }
      }
    ],
    session_issues: [],
    brute_force: [
      {
        type: "No Rate Limiting",
        description: "Login endpoint vulnerable to brute force",
        severity: "High",
        details: { endpoint: "/auth/login" }
      }
    ],
    auth_bypass: [
      {
        type: "Authentication Bypass",
        description: "Possible auth bypass through parameter manipulation",
        severity: "Critical",
        details: { endpoint: "/api/user" }
      }
    ]
  },
  client: {
    xss: [],
    csrf: [
      {
        type: "Missing CSRF Token",
        description: "No CSRF protection on form submission",
        severity: "Medium",
        details: { endpoint: "/api/update" }
      }
    ],
    clickjacking: [
      {
        type: "Missing X-Frame-Options",
        description: "Site vulnerable to clickjacking",
        severity: "Medium",
        details: { evidence: "No X-Frame-Options header" }
      }
    ],
    client_validation: []
  }
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function generateReport() {
  try {
    // Use Gemini 2.0 Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a cybersecurity expert. Analyze this penetration test output and generate a comprehensive security report.
    Your response must be a valid JSON object with this exact structure:
    {
      "executiveSummary": "string with brief overview of findings",
      "riskAssessment": {
        "overallRisk": "Critical",
        "riskFactors": ["factor1", "factor2"]
      },
      "vulnerabilities": [
        {
          "id": "string",
          "title": "string",
          "severity": "Critical",
          "description": "string",
          "impact": "string",
          "remediation": "string",
          "references": ["string"]
        }
      ],
      "recommendations": [
        {
          "priority": "High",
          "title": "string",
          "description": "string",
          "implementation": "string"
        }
      ],
      "technicalDetails": {
        "attackVectors": ["string"],
        "affectedComponents": ["string"],
        "securityControls": ["string"]
      }
    }

    Here is the scan output to analyze:
    ${JSON.stringify(sampleScanData, null, 2)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    
    // Parse and format the JSON response
    const report = JSON.parse(jsonMatch[0]);
    console.log("Generated Security Report:");
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error("Error generating report:", error);
    if (error.status === 403) {
      console.log("Please check if your API key is valid and has access to Gemini API");
    }
    console.log("Raw response:", error.response?.text());
  }
}

generateReport(); 