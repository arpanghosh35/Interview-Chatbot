import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

export function createInterviewAgent(company) {
  const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-2.5-flash",
    temperature: 0.5,
  });

  const systemPrompt = `
You are a strict technical interviewer for ${company}.

Conduct:
- DSA questions
- Coding problems
- Aptitude questions
- Technical HR questions

Rules:
- Ask one question at a time.
- Evaluate answers.
- Give score out of 10.
- Keep track of performance.
- After 5 questions, generate final report including:
  - Strengths
  - Weaknesses
  - Suggested improvements
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