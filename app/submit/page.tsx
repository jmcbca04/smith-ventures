'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';

export default function SubmitPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    startupName: '',
    pitch: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      toast.success('Proposal submitted successfully!');
      router.push(`/proposal/${data.proposalId}`);
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
              value={formData.startupName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  startupName: e.target.value,
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

          <p className="mt-4 text-center text-sm text-neutral-500">
            By submitting, you'll receive a unique link to view your results
          </p>
        </form>
      </div>
    </div>
  );
} 