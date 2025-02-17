'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import { EncryptionService } from '@/lib/client/encryption';
import type { ProposalData } from '@/types/encryption';

export default function SubmitPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProposalData>({
    startup_name: '',
    pitch: '',
  });
  const [accessToken, setAccessToken] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const encryptionService = EncryptionService.getInstance();
      const result = await encryptionService.submitProposal(formData);

      setAccessToken(result.token);
      toast.success('Proposal submitted successfully! Save your access token to view results later.');
      router.push(`/proposal/${result.proposal_id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Submit Your Startup Pitch
          </h1>
          <p className="mt-2 text-lg text-neutral-600">
            Get evaluated by our AI VC partners and receive detailed feedback
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="startupName">Startup Name</Label>
            <Input
              id="startupName"
              value={formData.startup_name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  startup_name: e.target.value,
                }))
              }
              required
              maxLength={100}
              placeholder="Enter your startup's name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pitch">Pitch</Label>
            <Textarea
              id="pitch"
              value={formData.pitch}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  pitch: e.target.value,
                }))
              }
              required
              minLength={50}
              maxLength={2000}
              placeholder="Describe your startup, product, market opportunity, and why it's compelling (50-2000 characters)"
              className="h-48"
            />
            <p className="text-sm text-neutral-500">
              {formData.pitch.length}/2000 characters
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Evaluation'}
          </Button>

          {accessToken && (
            <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <p className="text-sm font-medium text-neutral-900">Your Access Token</p>
              <p className="mt-1 text-xs text-neutral-600">
                Save this token to access your results later. Without it, you won't be able to view your proposal.
              </p>
              <div className="mt-2 p-2 bg-white rounded border border-neutral-300 font-mono text-sm break-all">
                {accessToken}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => {
                  navigator.clipboard.writeText(accessToken);
                  toast.success('Access token copied to clipboard');
                }}
              >
                Copy to Clipboard
              </Button>
            </div>
          )}

          <p className="mt-4 text-center text-sm text-neutral-500">
            Your data is end-to-end encrypted. Only you can access it with your unique token.
          </p>
        </form>
      </div>
    </div>
  );
} 