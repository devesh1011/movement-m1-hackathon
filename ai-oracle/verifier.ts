import { GoogleGenAI } from "@google/genai";
import { configDotenv } from "dotenv";

configDotenv();

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface ProofData {
  type: "image" | "text" | "github";
  content: string; // Base64 string for images, or raw text/json for others
  mimeType?: string; // e.g., 'image/jpeg'
}

export async function verifyData(
  challengeDetails: string,
  taskDetails: string,
  proof: ProofData
): Promise<{ verified: boolean; reason: string }> {
  try {
    // 1. Construct the System Prompt
    const systemPrompt = `
      You are the strict AI Judge for a high-stakes crypto challenge called "Protocol 75".
      Users stake real money on their discipline. Your job is to verify if their proof matches the daily task.
      
      CONTEXT:
      - Challenge Name: "${challengeDetails}"
      - Daily Task Requirement: "${taskDetails}"
      
      INSTRUCTIONS:
      1. Analyze the provided image or text proof strictly.
      2. If the proof clearly demonstrates the task (e.g., a gym selfie for a workout task, code commit for a coding task), mark as VERIFIED.
      3. If the proof is vague, irrelevant, unrelated, or looks fake (e.g., a black screen, a picture of a wall, or code that doesn't match), mark as REJECTED.
      4. Be skeptical. If in doubt, reject.
      
      OUTPUT FORMAT:
      Return ONLY a JSON object with this structure:
      {
        "verified": boolean,
        "reason": "Short explanation of your decision"
      }
    `;

    // 2. Prepare the Payload
    let contents = [];

    // Add the text prompt
    contents.push({
      role: "user",
      parts: [{ text: systemPrompt }],
    });

    // Add the Image Proof (if applicable)
    if (proof.type === "image") {
      // Remove header if present (e.g., "data:image/jpeg;base64,")
      const base64Data = proof.content.replace(/^data:image\/\w+;base64,/, "");

      contents[0].parts.push({
        inlineData: {
          mimeType: proof.mimeType || "image/jpeg",
          data: base64Data,
        },
      });
    } else {
      // Handle Text/Code Proof
      contents[0].parts.push({
        text: `USER PROOF SUBMISSION:\n${proof.content}`,
      });
    }

    // 3. Call Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Use 2.0 Flash for speed/vision capabilities
      contents: contents,
      config: {
        responseMimeType: "application/json", // Force JSON output
      },
    });

    // 4. Parse Response
    const responseText = response.text();
    console.log("🤖 Gemini Judgment:", responseText);

    if (!responseText) {
      return { verified: false, reason: "AI returned empty response" };
    }

    const result = JSON.parse(responseText);

    return {
      verified: result.verified,
      reason: result.reason,
    };
  } catch (error) {
    console.error("Verification Error:", error);
    return { verified: false, reason: "Verification system error" };
  }
}
