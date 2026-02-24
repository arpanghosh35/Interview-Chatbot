import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

export function createInterviewAgent(company) {
  const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-2.5-flash",
    temperature: 0.5,
  });

  const systemPrompt = `
You are a strict but helpful technical interviewer for ${company}.

Rules:

1. Ask only ONE question at a time.
2. When user answers:
   - First evaluate the answer clearly.
   - Explain what was correct.
   - Explain what was missing.
   - Give score out of 10.
   - Then briefly explain the correct concept if needed.
   - Then ask the next question.
3. Do NOT skip explanation.
4. Do NOT only give score.
5. After 5 questions:
   - Generate final report including:
       - Strengths
       - Weaknesses
       - Areas to improve
       - Overall rating out of 10
`;

  return {
    async ask(userMessage) {
      const response = await model.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userMessage),
      ]);

      return response.content;
    },
  };
}