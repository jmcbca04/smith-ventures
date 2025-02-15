'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface VCVote {
  vcName: string;
  modeledAfter: string;
  vote: boolean;
  reasoning: string;
  metadata: {
    confidence: number;
    keyPoints: string[];
    investmentThesis?: string;
  };
}

interface Proposal {
  id: string;
  startupName: string;
  pitch: string;
  status: string;
  createdAt: string;
}

export default function ProposalPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [votes, setVotes] = useState<VCVote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [managerVote, setManagerVote] = useState<boolean | null>(null);
  const [managerReasoning, setManagerReasoning] = useState('');
  const [isSubmittingManagerVote, setIsSubmittingManagerVote] = useState(false);

  useEffect(() => {
    fetchProposal();
  }, [params.id]);

  const fetchProposal = async () => {
    try {
      const response = await fetch(`/api/proposals/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch proposal');
      }

      setProposal(data.proposal);
      setVotes(data.votes || []);
      setIsLoading(false);
    } catch (error) {
      toast.error('Failed to load proposal');
      router.push('/');
    }
  };

  const startEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const response = await fetch(`/api/proposals/${params.id}/evaluate`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Evaluation failed');
      }

      setVotes(data.evaluations);
      setProposal(prev => prev ? { ...prev, status: 'completed' } : null);
      toast.success('Evaluation completed!');
    } catch (error) {
      toast.error('Failed to complete evaluation');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Calculate final vote count including manager's double vote
  const getVoteResults = () => {
    const aiVoteCount = votes.filter(v => v.vote).length;
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
            {proposal.startupName}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Submitted on {formatDate(new Date(proposal.createdAt))}
          </p>
          <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Pitch</h2>
            <p className="mt-2 whitespace-pre-wrap text-neutral-600">
              {proposal.pitch}
            </p>
          </div>
        </div>

        {proposal.status === 'pending' ? (
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
              <div className="border-b pb-4">
                <h2 className="text-2xl font-semibold">Your Vote as Managing Partner</h2>
                {managerVote !== null && (
                  <div className="mt-4 p-4 rounded-lg border border-neutral-200 bg-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Managing Partner</h3>
                        <p className="text-sm text-neutral-500">Your vote counts as 2</p>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-sm font-medium ${
                        managerVote
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {managerVote ? 'Invest' : 'Pass'}
                      </div>
                    </div>
                    {managerReasoning && (
                      <div className="mt-4">
                        <h4 className="font-medium">Your Reasoning</h4>
                        <p className="mt-1 text-neutral-600">{managerReasoning}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-semibold">VC Partner Evaluations</h2>
              {votes.map((vote, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-neutral-200 bg-white p-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{vote.vcName}</h3>
                      <p className="text-sm text-neutral-500">
                        Modeled after {vote.modeledAfter}
                      </p>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        vote.vote
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {vote.vote ? 'Invest' : 'Pass'}
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium">Reasoning</h4>
                    <p className="mt-1 text-neutral-600">{vote.reasoning}</p>
                  </div>

                  {vote.metadata.keyPoints.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium">Key Points</h4>
                      <ul className="mt-2 list-inside list-disc space-y-1 text-neutral-600">
                        {vote.metadata.keyPoints.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {vote.metadata.investmentThesis && (
                    <div className="mt-4">
                      <h4 className="font-medium">Investment Thesis</h4>
                      <p className="mt-1 text-neutral-600">
                        {vote.metadata.investmentThesis}
                      </p>
                    </div>
                  )}

                  <div className="mt-4">
                    <h4 className="font-medium">Confidence Level</h4>
                    <div className="mt-2 h-2 w-full rounded-full bg-neutral-100">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{
                          width: `${vote.metadata.confidence * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 