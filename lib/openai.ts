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

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let retries = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }

      // Exponential backoff with jitter
      delay = Math.min(delay * 2, 10000) * (0.5 + Math.random());
      console.log(`Retry ${retries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function evaluateProposal(
  proposal: ProposalData,
  encryptionKey: string
): Promise<Evaluation[]> {
  // Artificial delay to simulate real VC deliberation
  await new Promise(resolve => setTimeout(resolve, 2000));

  const evaluations = await Promise.all(
    vcPersonas.map(async (vcPersona) => {
      const prompt = `${vcPersona.evaluationPrompt}

Startup: ${proposal.startup_name}
Pitch: ${proposal.pitch}`;

      const response = await retryWithBackoff(async () => {
        const result = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2000,
        });
        
        if (!result.choices[0].message.content) {
          throw new Error('Empty response from OpenAI');
        }
        
        return result;
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

      // Process reasoning section, excluding section headers
      const reasoningLines = lines.slice(
        reasoningStartIndex + 1, 
        keyPointsStartIndex > reasoningStartIndex ? keyPointsStartIndex : undefined
      );

      // Build structured reasoning, excluding section headers and bullet points
      const reasoning = reasoningLines
        .filter(line => {
          // Exclude numbered points, section headers, and bullet points
          const isNumberedPoint = line.match(/^[0-9]\./);
          const isSectionHeader = line.match(/^\*[^•-].*\*$/); // Matches *Section Title* format
          const isBulletPoint = line.trim().startsWith('•') || 
                               line.trim().startsWith('-') || 
                               (line.trim().startsWith('*') && line.trim().endsWith('*') && line.includes('•'));
          return !isNumberedPoint && !isSectionHeader && !isBulletPoint;
        })
        .join('\n');

      // Find key points - only include actual bullet points, not section headers
      const keyPoints = lines
        .filter(line => {
          const isBulletPoint = line.trim().startsWith('•') || 
                               line.trim().startsWith('-') || 
                               line.trim().startsWith('* •') ||
                               line.trim().startsWith('*');
          const isHeader = line.match(/^\*[^•-].*\*$/);
          return isBulletPoint && !isHeader;
        })
        .map(line => {
          // Clean up the bullet points
          return line.trim()
            .replace(/^[•\-*]\s*/, '') // Remove bullet character
            .replace(/^\* ?[•-]\s*/, '') // Remove "* •" format
            .replace(/\*\*/g, '') // Remove all ** markers
            .replace(/\*/g, '') // Remove all remaining * markers
            .trim();
        });

      // Find investment thesis
      const thesisStartIndex = lines.findIndex(line => 
        line.toLowerCase().includes('investment thesis') || 
        line.match(/^4\.|^thesis:/i)
      );
      const risksStartIndex = lines.findIndex(line => 
        line.toLowerCase().includes('risks') || 
        line.toLowerCase().includes('risk analysis') ||
        line.toLowerCase().includes('recommendations') ||
        line.toLowerCase().includes('technical risk') ||
        line.toLowerCase().includes('scaling roadmap') ||
        line.match(/^5\.|^risks:/i)
      );

      // Process investment thesis, excluding section headers
      const investmentThesis = vote && thesisStartIndex >= 0 ? 
        lines.slice(
          thesisStartIndex + 1, 
          risksStartIndex > thesisStartIndex ? risksStartIndex : undefined
        )
        .filter(line => {
          const isSectionHeader = line.match(/^\*[^•-].*\*$/);
          const isNumberedPoint = line.match(/^[0-9]\./);
          return !isSectionHeader && !isNumberedPoint;
        })
        .map(line => line.replace(/\*\*/g, '').replace(/\*/g, ''))
        .join('\n')
        .trim() : undefined;

      // Find risks/recommendations section
      const confidenceStartIndex = lines.findIndex(line => 
        line.toLowerCase().includes('confidence') || 
        line.match(/^6\.|^confidence:/i)
      );

      // Process risks section, excluding section headers
      const risksSection = risksStartIndex >= 0 ?
        lines.slice(
          risksStartIndex + 1, 
          confidenceStartIndex > risksStartIndex ? confidenceStartIndex : undefined
        )
        .filter(line => {
          const isSectionHeader = line.match(/^\*[^•-].*\*$/);
          const isNumberedPoint = line.match(/^[0-9]\./);
          return !isSectionHeader && !isNumberedPoint;
        })
        .map(line => line.replace(/\*\*/g, '').replace(/\*/g, ''))
        .join('\n')
        .trim() : undefined;

      // Find confidence with explanation
      const confidenceLine = lines.find(line => 
        line.toLowerCase().includes('confidence') || 
        line.match(/^6\.|^confidence:/i)
      );
      
      // Extract just the numerical confidence value
      const confidenceMatch = confidenceLine?.match(/(\d+\.?\d*)/);
      let confidence = 0.7; // Default confidence
      
      if (confidenceMatch) {
        const rawValue = parseFloat(confidenceMatch[1]);
        // If it's a decimal less than 1, convert to percentage
        if (rawValue <= 1) {
          confidence = rawValue;
        } else if (rawValue <= 100) {
          // If it's a percentage, convert to decimal
          confidence = rawValue / 100;
        }
      }

      // Validate confidence level based on vote
      // If voting to invest, confidence should be at least 60%
      // If voting to pass, confidence can be lower
      if (vote && confidence < 0.6) {
        confidence = 0.7; // Set a reasonable default for invest votes
      } else if (!vote && confidence > 0.4) {
        confidence = 0.3; // Set a reasonable default for pass votes
      }
      
      // Extract explanation without the confidence level and label
      const confidenceExplanation = confidenceLine
        ?.replace(/^[^:]*:\s*/, '') // Remove everything before and including the colon
        ?.replace(/\d+\.?\d*%?\s*-?\s*/, '') // Remove the confidence number and any dash
        ?.replace(/confidence\s+level\s*:?\s*/i, '') // Remove "Confidence Level" text
        ?.replace(/\*\*/g, '') // Remove all ** markers
        ?.replace(/\*/g, '') // Remove all remaining * markers
        ?.trim();

      // Create the vote data
      const voteData: VCVoteData = {
        vc_persona: vcPersona.name,
        vote,
        reasoning: reasoning.trim(),
      };

      // Create metadata
      const metadata = {
        confidence,
        confidence_explanation: confidenceExplanation,
        key_points: keyPoints,
        investment_thesis: investmentThesis?.trim(),
        risks_and_recommendations: risksSection?.trim(),
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