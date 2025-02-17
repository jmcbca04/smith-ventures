import OpenAI from 'openai';
import { vcPersonas } from '@/config/vc-personas';
import type { VCVoteData, ProposalData } from '@/types/encryption';
import { encryptDataNode } from './server/encryption';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Evaluation {
  encrypted_data: string;
  iv: string;
  encrypted_metadata: string;
  metadata_iv: string;
}

export async function evaluateProposal(
  proposal: ProposalData,
  encryptionKey: string
): Promise<Evaluation[]> {
  // Artificial delay to simulate real VC deliberation
  await new Promise(resolve => setTimeout(resolve, 2000));

  const evaluations = await Promise.all(
    vcPersonas.map(async (vcPersona) => {
      const prompt = `You are ${vcPersona.name}, a venture capitalist modeled after ${
        vcPersona.modeledAfter
      }. You're known for ${vcPersona.focus.join(
        ', '
      )}. Please evaluate this startup proposal:

Startup: ${proposal.startup_name}
Pitch: ${proposal.pitch}

Provide your evaluation in the following format:
1. Vote (yes/no)
2. Reasoning
3. Key points (bullet points)
4. Investment thesis (if voting yes)
5. Confidence level (0.0-1.0)`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No response from OpenAI');

      // Parse the response
      const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      // Find vote line
      const voteLine = lines.find(line => line.toLowerCase().includes('vote') || line.match(/^(yes|no)/i));
      const vote = voteLine ? voteLine.toLowerCase().includes('yes') : false;
      
      // Find reasoning
      const reasoningStartIndex = lines.findIndex(line => 
        line.toLowerCase().includes('reasoning') || 
        line.match(/^2\.|^reasoning:/i)
      );
      const keyPointsStartIndex = lines.findIndex(line => 
        line.toLowerCase().includes('key points') || 
        line.match(/^3\.|^key points:/i)
      );
      const reasoning = reasoningStartIndex >= 0 ? 
        lines.slice(reasoningStartIndex + 1, keyPointsStartIndex > reasoningStartIndex ? keyPointsStartIndex : undefined)
          .filter(line => !line.match(/^[0-9]\./) && !line.toLowerCase().includes('investment thesis'))
          .join('\n')
        : '';

      // Find key points
      const keyPoints = lines
        .filter(line => 
          line.trim().startsWith('•') || 
          line.trim().startsWith('-') || 
          line.trim().startsWith('*')
        )
        .map(line => line.trim().replace(/^[•\-*]\s*/, ''));

      // Find investment thesis
      const thesisStartIndex = lines.findIndex(line => 
        line.toLowerCase().includes('investment thesis') || 
        line.match(/^4\.|^thesis:/i)
      );
      const confidenceStartIndex = lines.findIndex(line => 
        line.toLowerCase().includes('confidence') || 
        line.match(/^5\.|^confidence:/i)
      );
      const investmentThesis = vote && thesisStartIndex >= 0 ? 
        lines.slice(thesisStartIndex + 1, confidenceStartIndex > thesisStartIndex ? confidenceStartIndex : undefined)
          .filter(line => !line.match(/^[0-9]\./) && !line.toLowerCase().includes('confidence'))
          .join('\n')
        : undefined;

      // Find confidence
      const confidenceLine = lines.find(line => 
        line.toLowerCase().includes('confidence') || 
        line.match(/^5\.|^confidence:/i)
      );
      const confidence = confidenceLine
        ? parseFloat(confidenceLine.match(/\d+\.?\d*/)?.[0] || '0.7')
        : 0.7;

      // Create the vote data
      const voteData: VCVoteData = {
        vc_persona: vcPersona.name,
        vote,
        reasoning: reasoning.trim(),
      };

      // Create metadata
      const metadata = {
        confidence,
        key_points: keyPoints,
        investment_thesis: investmentThesis?.trim(),
      };

      // Encrypt both vote data and metadata using Node's crypto
      const encryptedVote = await encryptDataNode(
        JSON.stringify(voteData),
        encryptionKey
      );

      const encryptedMetadata = await encryptDataNode(
        JSON.stringify(metadata),
        encryptionKey
      );

      return {
        encrypted_data: encryptedVote.encrypted_data,
        iv: encryptedVote.iv,
        encrypted_metadata: encryptedMetadata.encrypted_data,
        metadata_iv: encryptedMetadata.iv,
      };
    })
  );

  return evaluations;
} 