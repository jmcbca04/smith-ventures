import OpenAI from 'openai';
import { VCPersona } from '@/config/vc-personas';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getVCEvaluation(
  vcPersona: VCPersona,
  startupName: string,
  pitch: string
): Promise<{ vote: boolean; reasoning: string; metadata: any }> {
  const prompt = `${vcPersona.evaluationPrompt}

Startup Name: ${startupName}
Pitch: ${pitch}

Provide your response in the following JSON format:
{
  "vote": boolean,
  "reasoning": "detailed explanation",
  "metadata": {
    "confidence": number between 0 and 1,
    "keyPoints": ["point1", "point2", "point3"],
    "investmentThesis": "optional thesis if vote is yes"
  }
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are an experienced venture capitalist evaluating investment opportunities. Provide your analysis in the requested JSON format.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0].message.content!);
  return result;
} 