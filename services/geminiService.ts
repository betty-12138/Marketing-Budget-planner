
import { GoogleGenAI } from "@google/genai";
import { Transaction, MonthlySummary, CategorySummary } from "../types";

const apiKey = process.env.API_KEY || '';

// Safely initialize GenAI
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const analyzeBudget = async (
  currentMonth: string,
  monthlyData: MonthlySummary,
  categoryBreakdown: CategorySummary[],
  recentTransactions: Transaction[]
): Promise<{ summary: string; recommendations: string[] }> => {
  if (!ai) {
    return {
      summary: "API Key is missing. Unable to generate insights.",
      recommendations: ["Check configuration."]
    };
  }

  const prompt = `
    You are a Senior Marketing Budget Analyst based in China. Analyze the following budget data for ${currentMonth}.
    Currency is RMB (CNY/¥).
    
    Context:
    - Total Budget (Planned): ¥${monthlyData.planned.toFixed(2)}
    - Total Spent (Actual): ¥${monthlyData.actual.toFixed(2)}
    - Variance: ¥${monthlyData.variance.toFixed(2)}
    
    Category Breakdown (Planned vs Actual):
    ${categoryBreakdown.map(c => `- ${c.category}: Planned ¥${c.planned}, Actual ¥${c.actual}`).join('\n')}

    Recent Transactions:
    ${recentTransactions.slice(0, 5).map(t => `- ${t.description} (${t.createdBy || 'Unknown User'}): ¥${t.amount}`).join('\n')}

    Task:
    1. Provide a concise 2-sentence summary of the financial health.
    2. Provide 3 specific, actionable short recommendations or warnings for the marketing team.
    
    Format the output as JSON:
    {
      "summary": "...",
      "recommendations: ["...", "...", "..."]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text);
    return {
      summary: result.summary || "Analysis completed.",
      recommendations: result.recommendations || []
    };

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      summary: "Unable to analyze budget at this time due to technical difficulties.",
      recommendations: ["Monitor spending manually.", "Review largest category variances."]
    };
  }
};
