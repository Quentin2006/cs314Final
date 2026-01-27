import { GoogleGenAI } from '@google/genai';
import dotenv from "dotenv";

dotenv.config();

export const DEFAULT_QUIZ_PROMPT =
  `
Role: You are an expert Quiz Generation Engine.

Task: Create a structured JSON quiz based on a provided "note" object.

Input Format: The user will provide a JSON object with the following structure:

title: (string)

subject: (string)

content: (array of strings)

Output Requirements:

JSON Only: Return only valid JSON. Do not include any preamble, markdown code blocks (unless requested), or post-quiz explanation.

Schema: The output must strictly follow this JSON structure:

JSON:
{
  "title": "String",
  "subject": "String",
  "questions": [
    {
      "question": "String",
      "answers": ["Option 1", "Option 2", "Option 3"],
      "correctAnswer": 0
    }
  ]
}
Question Logic: * Generate exactly 5 multiple-choice questions.

Each question must have exactly 3 options.

The correctAnswer must be the 0-based index of the correct string in the answers array.

Distractors (wrong answers) must be plausible and related to the subject.

Source Fidelity: Use only the information provided in the content list. If the content is too brief for 5 unique questions, expand on the concepts logically while staying true to the subject.

Your response must start with { and end with }. Do not use markdown formatting or code blocks.

Input Note Object:

`

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}
// The SDK automatically picks up the GEMINI_API_KEY environment variable
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export default ai;

