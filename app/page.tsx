import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-6xl">
          Get Your Startup Evaluated by AI VCs
        </h1>
        <p className="mt-6 text-lg leading-8 text-neutral-600">
          Submit your pitch anonymously and receive feedback from multiple AI-powered VC partners,
          each with their own investment philosophy and expertise.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link href="/submit">
            <Button size="lg">
              Submit Your Pitch
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.name}
            className="rounded-lg border border-neutral-200 bg-white p-8 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-neutral-900">
              {feature.name}
            </h3>
            <p className="mt-2 text-sm text-neutral-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const features = [
  {
    name: 'Anonymous Submissions',
    description:
      'Submit your startup pitch without creating an account. Get a unique link to view your results.',
  },
  {
    name: 'Multiple VC Perspectives',
    description:
      'Each proposal is evaluated by 5 AI VCs with different investment philosophies and areas of expertise.',
  },
  {
    name: 'Detailed Feedback',
    description:
      'Receive comprehensive feedback including investment decisions, reasoning, and potential concerns.',
  },
  {
    name: 'Instant Results',
    description:
      'Get your results within minutes, with each VC providing their unique insights and analysis.',
  },
  {
    name: 'Private & Secure',
    description:
      'Your pitch remains private and can only be accessed through your unique link.',
  },
  {
    name: 'Share Results',
    description:
      'Optionally share your results with others using your private proposal link.',
  },
];
