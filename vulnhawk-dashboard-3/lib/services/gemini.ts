import { GoogleGenerativeAI } from "@google/generative-ai";
import { EnhancedReport } from "@/lib/types";

// Debug log to check if API key is loaded
console.log("GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Cache for storing generated reports
const reportCache = new Map<string, EnhancedReport>();

// Optimized prompt template for better AI response quality
const REPORT_PROMPT = `Analyze the following security scan data and generate a comprehensive security report. Focus on actionable insights and prioritize critical findings.

SCAN DATA:
{scanData}

Generate a structured report with the following sections:
1. Executive Summary: Brief overview of key findings and overall risk level
2. Risk Assessment: Detailed analysis of security posture
3. Vulnerabilities: Prioritized list of security issues
4. Recommendations: Actionable steps for remediation

Format the response as a JSON object with this structure:
{
  "executiveSummary": "string",
  "riskAssessment": {
    "overallRisk": "Critical|High|Medium|Low",
    "riskFactors": ["string"]
  },
  "vulnerabilities": [{
    "id": "string",
    "title": "string",
    "severity": "Critical|High|Medium|Low",
    "description": "string",
    "impact": "string",
    "remediation": "string",
    "references": ["string"]
  }],
  "recommendations": [{
    "title": "string",
    "priority": "Critical|High|Medium|Low",
    "description": "string",
    "implementation": "string"
  }]
}

Ensure the response is valid JSON and follows the exact structure above.`;

export async function generateEnhancedReport(scanData: any): Promise<EnhancedReport> {
  try {
    // Check cache first
    const cacheKey = JSON.stringify(scanData);
    const cachedReport = reportCache.get(cacheKey);
    if (cachedReport) {
      console.log("Using cached report");
      return cachedReport;
    }

    // Initialize the model with optimized parameters
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.2, // Lower temperature for more focused output
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    // Format the prompt with scan data
    const prompt = REPORT_PROMPT.replace("{scanData}", JSON.stringify(scanData, null, 2));

    // Generate the report
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from response");
    }

    // Parse and validate the report
    const report = JSON.parse(jsonMatch[0]) as EnhancedReport;

    // Validate required fields
    if (!report.executiveSummary || !report.riskAssessment || !report.vulnerabilities || !report.recommendations) {
      throw new Error("Invalid report structure");
    }

    // Cache the report
    reportCache.set(cacheKey, report);

    return report;
  } catch (error) {
    console.error("Error generating enhanced report:", error);
    throw error;
  }
}

export interface EnhancedReport {
  executiveSummary: string;
  riskAssessment: {
    overallRisk: "Critical" | "High" | "Medium" | "Low";
    riskFactors: string[];
  };
  vulnerabilities: {
    id: string;
    title: string;
    severity: "Critical" | "High" | "Medium" | "Low";
    description: string;
    impact: string;
    remediation: string;
    references: string[];
  }[];
  recommendations: {
    priority: "High" | "Medium" | "Low";
    title: string;
    description: string;
    implementation: string;
  }[];
  technicalDetails: {
    attackVectors: string[];
    affectedComponents: string[];
    securityControls: string[];
  };
}

interface Technology {
  name: string;
  version?: string;
  category: string;
}

interface InfoDisclosure {
  type: string;
  description: string;
  severity: string;
  location: string;
}

interface SecurityIssue {
  type: string;
  description: string;
  severity: string;
  details: {
    endpoint?: string;
    method?: string;
    payload?: string;
    evidence?: string;
  };
}

interface RawScanOutput {
  recon?: {
    open_ports?: string[];
    subdomains?: string[];
    technologies?: Technology[];
    info_disclosure?: InfoDisclosure[];
  };
  auth?: {
    weak_auth?: SecurityIssue[];
    session_issues?: SecurityIssue[];
    brute_force?: SecurityIssue[];
    auth_bypass?: SecurityIssue[];
  };
  client?: {
    xss?: SecurityIssue[];
    csrf?: SecurityIssue[];
    clickjacking?: SecurityIssue[];
    client_validation?: SecurityIssue[];
  };
} 