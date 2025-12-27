import { GoogleGenAI } from "@google/genai";
import { configDotenv } from "dotenv";

configDotenv();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function verifyData(
  challengeDetails: string,
  taskDetails: string,
  taskData: any
) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Why is the sky blue?",
  });
  console.log(response.text);
  return true;
}
