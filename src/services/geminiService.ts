import { GoogleGenAI, Type } from "@google/genai";
import { Scholarship, UserProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const geminiService = {
  async matchScholarships(profile: UserProfile, scholarships: Scholarship[]): Promise<{ scholarshipId: string; matchScore: number; reason: string }[]> {
    const prompt = `
      You are a scholarship matching expert. Based on the user profile below, analyze the provided scholarships and return a matching score (0-100) and a brief reason for each match.
      
      User Profile:
      - Age: ${profile.age}
      - Annual Family Income: $${profile.income}
      - Qualification: ${profile.qualification}
      - Location: ${profile.location}
      - Interests: ${profile.interests.join(", ")}
      
      Scholarships:
      ${scholarships.map(s => `ID: ${s.id}, Title: ${s.title}, Eligibility: ${s.eligibility}, Max Income: ${s.maxIncome || 'Any'}, Min Age: ${s.minAge || 'Any'}, Max Age: ${s.maxAge || 'Any'}`).join("\n")}
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                scholarshipId: { type: Type.STRING },
                matchScore: { type: Type.NUMBER },
                reason: { type: Type.STRING }
              },
              required: ["scholarshipId", "matchScore", "reason"]
            }
          }
        }
      });

      return JSON.parse(response.text || "[]");
    } catch (error) {
      console.error("Gemini Match Error:", error);
      return [];
    }
  },

  async discoverNewScholarships(profile: UserProfile): Promise<Partial<Scholarship>[]> {
    const prompt = `Find 10 the most recent and officially verified active scholarships for 2024-2025 with a focus on the user's specific state/region if applicable.
      
      User Profile:
      - Age: ${profile.age}
      - Annual Family Income (INR/USD): ${profile.income}
      - Qualification: ${profile.qualification}
      - Location (City/State/Country): ${profile.location}
      - Interests: ${profile.interests.join(", ")}

      CRITICAL: Return only scholarships that match this user's profile and are currently accepting applications. 
      Priority 1: Government scholarships from the user's specific state or central government.
      Priority 2: Private scholarships from NGOs, companies, or universities.
      
      Provide details including title, provider, amount, deadline, and eligibility. 
      Determine if it's "government" or "private".`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }] as any,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Official scholarship name" },
                provider: { type: Type.STRING, description: "Organization name" },
                providerType: { type: Type.STRING, enum: ["government", "private"] },
                amount: { type: Type.STRING, description: "Funding amount or 'Full Tuition'" },
                deadline: { type: Type.STRING, description: "Application deadline (e.g., Oct 2024)" },
                eligibility: { type: Type.STRING, description: "Brief eligibility criteria" },
                location: { type: Type.STRING, description: "Target region/state" },
                category: { type: Type.STRING, description: "Field of study (e.g. Medical, Engineering)" },
                description: { type: Type.STRING, description: "Short summary of benefits" }
              },
              required: ["title", "provider", "providerType", "amount", "deadline", "eligibility"]
            }
          }
        }
      });

      return JSON.parse(response.text || "[]");
    } catch (error) {
      console.error("Gemini Discovery Error:", error);
      return [];
    }
  },

  async chat(message: string, context: string): Promise<string> {
    const prompt = `
      Context Information:
      ${context}
      
      User Message: ${message}
      
      You are Matrix AI, a futuristic assistant for a scholarship discovery platform.
      Provide a helpful, concise response based on the context. Keep the futuristic "Matrix" personality.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      return response.text || "Connection to the Matrix lost. Please try again.";
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      return "Critical system error in neural link.";
    }
  }
};
