'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { EncryptionService, parseAccessToken, importKey, decryptData } from '@/lib/client/encryption';
import type { ProposalData, VCVoteData } from '@/types/encryption';

interface RawVote {
  id: string;
  encrypted_data: string;
  iv: string;
  encrypted_metadata: string;
  metadata_iv: string;
  created_at: string;
}

interface DecryptedVote {
  id: string;
  vote: VCVoteData;
  metadata: {
    confidence: number;
    key_points: string[];
    investment_thesis?: string;
  };
}

interface APIResponse {
  success: boolean;
  proposal: {
    id: string;
    encrypted_data: string;
    iv: string;
    status: string;
    created_at: string;
  };
  votes: RawVote[];
}

export default function ProposalPage() {
  const router = useRouter();
  const params = useParams();
  console.log('Raw params:', params);
  
  // Extract and validate the proposal ID
  const proposalId = typeof params?.id === 'string' && params.id !== 'undefined' 
    ? params.id 
    : null;
  
  console.log('Extracted proposalId:', proposalId);

  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [votes, setVotes] = useState<DecryptedVote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [decryptedVotes, setDecryptedVotes] = useState<DecryptedVote[]>([]);
  const [managerVote, setManagerVote] = useState<boolean | null>(null);
  const [managerReasoning, setManagerReasoning] = useState('');
  const [isSubmittingManagerVote, setIsSubmittingManagerVote] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [needsToken, setNeedsToken] = useState(false);

  useEffect(() => {
    console.log('useEffect triggered with proposalId:', proposalId);
    if (!proposalId) {
      console.error('No valid proposal ID found, redirecting to home');
      setIsLoading(false);
      setNeedsToken(false);
      router.push('/');
      return;
    }
    console.log('Initializing with proposal ID:', proposalId);
    fetchProposal();
  }, [proposalId, router]);

  const fetchProposal = async () => {
    try {
      if (!proposalId) {
        console.error('No valid proposal ID provided in fetchProposal');
        setIsLoading(false);
        setNeedsToken(false);
        return;
      }

      console.log('Fetching proposal data for ID:', proposalId);
      const encryptionService = EncryptionService.getInstance();
      console.log('Got encryption service instance');
      const existingToken = encryptionService.getToken(proposalId);
      console.log('Existing token for proposal:', existingToken ? 'Found' : 'Not found');

      if (!existingToken) {
        console.log('No token found for ID:', proposalId);
        setNeedsToken(true);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/proposals/${proposalId}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'If-None-Match': new Date().getTime().toString()
        }
      });
      const data = (await response.json()) as APIResponse;
      
      if (!data.proposal) {
        console.error('No proposal data returned');
        setIsLoading(false);
        return;
      }

      // Decrypt proposal and votes if completed
      if (data.proposal.status === 'completed' && data.votes.length > 0) {
        const { key } = parseAccessToken(existingToken);
        const cryptoKey = await importKey(key);
        
        // Decrypt votes and metadata
        const decryptedVotes: DecryptedVote[] = await Promise.all(
          data.votes.map(async (vote: RawVote) => {
            const voteData = await decryptData({ encrypted_data: vote.encrypted_data, iv: vote.iv }, cryptoKey);
            const metadata = await decryptData({ encrypted_data: vote.encrypted_metadata, iv: vote.metadata_iv }, cryptoKey);
            return {
              id: vote.id,
              vote: JSON.parse(voteData) as VCVoteData,
              metadata: JSON.parse(metadata)
            };
          })
        );

        setVotes(decryptedVotes);
        
        // Decrypt proposal data
        const proposalData = await decryptData({ 
          encrypted_data: data.proposal.encrypted_data, 
          iv: data.proposal.iv 
        }, cryptoKey);
        
        setProposal({
          startup_name: 'Test Startup', // Temporary for testing
          pitch: 'Test pitch', // Temporary for testing
          status: data.proposal.status,
          created_at: data.proposal.created_at,
        } as ProposalData);
      } else {
        // Just set the encrypted proposal for now
        setProposal({
          id: data.proposal.id,
          status: data.proposal.status,
          created_at: data.proposal.created_at,
          encrypted_data: data.proposal.encrypted_data,
          iv: data.proposal.iv
        } as unknown as ProposalData);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load proposal:', error);
      if (error instanceof Error && error.message === 'No access token found for this proposal') {
        setNeedsToken(true);
      } else {
        toast.error('Failed to load proposal');
      }
      setIsLoading(false);
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!proposalId) {
      toast.error('Invalid proposal ID');
      return;
    }

    setIsLoading(true);

    try {
      const encryptionService = EncryptionService.getInstance();
      // Store the token first
      encryptionService.storeToken(proposalId, accessToken);
      
      // Then try to fetch the proposal
      const data = await encryptionService.getProposal(proposalId);
      setProposal(data.proposal);
      setVotes(data.votes);
      setNeedsToken(false);
    } catch (error) {
      toast.error('Invalid access token');
    } finally {
      setIsLoading(false);
    }
  };

  const startEvaluation = async () => {
    if (!proposalId) {
      toast.error('Invalid proposal ID');
      return;
    }

    setIsEvaluating(true);
    setVotes([]);
    
    try {
      console.log('Starting evaluation process...');
      
      // Get the access token
      const encryptionService = EncryptionService.getInstance();
      const token = encryptionService.getToken(proposalId);
      
      if (!token) {
        throw new Error('No access token found for this proposal');
      }
      
      // Start the evaluation
      const evalResponse = await fetch(`/api/proposals/${proposalId}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken: token })
      });
      
      if (!evalResponse.ok) {
        throw new Error('Failed to start evaluation');
      }
      
      const evalResult = await evalResponse.json();
      console.log('Evaluation response:', evalResult);
      
      if (!evalResult.success) {
        throw new Error(evalResult.message || 'Evaluation failed');
      }

      // Parse the access token and import the key
      const { key } = parseAccessToken(token);
      const cryptoKey = await importKey(key);

      // Decrypt the proposal data
      const decryptedProposal = JSON.parse(
        await decryptData({
          encrypted_data: evalResult.proposal.encrypted_data,
          iv: evalResult.proposal.iv,
        }, cryptoKey)
      );

      // Add status and created_at from the response
      decryptedProposal.status = evalResult.proposal.status;
      decryptedProposal.created_at = evalResult.proposal.created_at;

      // Set the decrypted proposal
      setProposal(decryptedProposal);

      // Decrypt the votes
      const decryptedVotes = await Promise.all(
        evalResult.votes.map(async (vote: any) => ({
          id: vote.id,
          vote: JSON.parse(
            await decryptData({
              encrypted_data: vote.encrypted_data,
              iv: vote.iv,
            }, cryptoKey)
          ),
          metadata: JSON.parse(
            await decryptData({
              encrypted_data: vote.encrypted_metadata,
              iv: vote.metadata_iv,
            }, cryptoKey)
          ),
        }))
      );

      // Set the decrypted votes
      setVotes(decryptedVotes);
      setIsEvaluating(false);
      toast.success('Evaluation completed successfully!');
    } catch (error) {
      console.error('Evaluation failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to complete evaluation');
      setIsEvaluating(false);
    }
  };

  // Calculate final vote count including manager's double vote
  const getVoteResults = () => {
    const aiVoteCount = votes.filter(v => v.vote.vote).length;
    const totalVotes = votes.length + (managerVote !== null ? 2 : 0); // Manager vote counts as 2
    const yesVotes = aiVoteCount + (managerVote ? 2 : 0);
    return {
      yesVotes,
      totalVotes,
      isAccepted: yesVotes > totalVotes / 2
    };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p>Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (needsToken) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-bold text-center mb-8">Enter Access Token</h1>
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Paste your access token here"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full"
              />
            </div>
            <Button type="submit" className="w-full">
              Access Proposal
            </Button>
            <p className="text-sm text-neutral-500 text-center">
              You need an access token to view this proposal. The token was provided when the proposal was submitted.
            </p>
          </form>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold">Proposal Not Found</h1>
          <p className="mt-4">This proposal doesn't exist or has been deleted.</p>
          <Button onClick={() => router.push('/')} className="mt-8">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            {proposal.startup_name}
          </h1>
          {proposal.created_at && (
            <p className="mt-2 text-sm text-neutral-500">
              Submitted on {formatDate(new Date(proposal.created_at))}
            </p>
          )}
          <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Pitch</h2>
            <p className="mt-2 whitespace-pre-wrap text-neutral-600">
              {proposal.pitch}
            </p>
          </div>
        </div>

        {votes.length === 0 ? (
          <div className="text-center">
            <h2 className="text-xl font-semibold">Ready for Evaluation</h2>
            <p className="mt-2 text-neutral-600">
              Click below to have our AI VC partners evaluate your proposal
            </p>
            <Button
              onClick={startEvaluation}
              className="mt-6"
              size="lg"
              disabled={isEvaluating}
            >
              {isEvaluating ? 'Evaluating...' : 'Start Evaluation'}
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {votes.length > 0 && (
              <>
                {managerVote === null ? (
                  <div className="p-6 rounded-lg border border-primary-100 bg-primary-50">
                    <h2 className="text-xl font-bold text-primary-900">Cast Your Vote as Managing Partner</h2>
                    <p className="mt-2 text-primary-800">
                      As the Managing Partner, your vote counts twice and can break any ties.
                    </p>
                    <div className="mt-4 space-y-4">
                      <textarea
                        className="w-full h-24 p-3 rounded-md border border-neutral-200 text-sm"
                        placeholder="Enter your reasoning (optional)"
                        value={managerReasoning}
                        onChange={(e) => setManagerReasoning(e.target.value)}
                      />
                      <div className="flex gap-4">
                        <Button
                          onClick={() => setManagerVote(true)}
                          className="flex-1"
                          variant="default"
                        >
                          Vote to Invest
                        </Button>
                        <Button
                          onClick={() => setManagerVote(false)}
                          className="flex-1"
                          variant="outline"
                        >
                          Vote to Pass
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`p-6 rounded-lg border ${
                    getVoteResults().isAccepted
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">
                          {getVoteResults().isAccepted
                            ? 'Congratulations! 🎉'
                            : 'Thank you for your submission'}
                        </h2>
                        <p className="mt-2 text-lg">
                          {getVoteResults().isAccepted
                            ? `Smith Ventures has decided to invest! ${getVoteResults().yesVotes} out of ${getVoteResults().totalVotes} votes were to invest (including your double vote as Managing Partner).`
                            : `Unfortunately, we'll have to pass. Only ${getVoteResults().yesVotes} out of ${getVoteResults().totalVotes} votes were to invest (including your double vote as Managing Partner).`}
                        </p>
                      </div>
                      <div className={`text-lg font-semibold px-4 py-2 rounded-full ${
                        getVoteResults().isAccepted
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {getVoteResults().isAccepted ? 'Investing' : 'Pass'}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="space-y-8">
              <h2 className="text-2xl font-semibold">VC Partner Evaluations</h2>
              {votes.map((vote, index) => (
                <div
                  key={vote.id}
                  className="rounded-lg border border-neutral-200 bg-white p-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{vote.vote.vc_persona}</h3>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-sm font-medium ${
                      vote.vote.vote
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {vote.vote.vote ? 'Invest' : 'Pass'}
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-medium">Reasoning</h4>
                    <p className="mt-1 text-neutral-600">{vote.vote.reasoning}</p>
                  </div>
                  {vote.metadata && (
                    <div className="mt-4">
                      <h4 className="font-medium">Key Points</h4>
                      <ul className="mt-2 list-disc pl-5 space-y-1">
                        {vote.metadata.key_points.map((point, i) => (
                          <li key={i} className="text-neutral-600">{point}</li>
                        ))}
                      </ul>
                      {vote.metadata.investment_thesis && (
                        <div className="mt-4">
                          <h4 className="font-medium">Investment Thesis</h4>
                          <p className="mt-1 text-neutral-600">
                            {vote.metadata.investment_thesis}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 