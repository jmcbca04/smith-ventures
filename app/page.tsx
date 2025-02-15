import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Hero } from "@/components/layout/Hero";

const features = [
  {
    name: "Multiple AI VC Personas",
    description:
      "Get feedback from five distinct AI VCs, each modeled after famous investors with unique investment philosophies.",
  },
  {
    name: "Anonymous Submissions",
    description:
      "Submit your pitch anonymously and receive unbiased feedback without creating an account.",
  },
  {
    name: "Instant Feedback",
    description:
      "Receive detailed investment decisions, reasoning, and key points within minutes.",
  },
  {
    name: "Comprehensive Analysis",
    description:
      "Each VC provides a detailed analysis including investment thesis, confidence score, and key points.",
  },
  {
    name: "Private Results",
    description:
      "Access your results through a private link that you can optionally share with others.",
  },
  {
    name: "No Cost",
    description:
      "Evaluate your startup for free and get valuable insights from multiple perspectives.",
  },
];

export default function Home() {
  return (
    <>
      <Hero />
      <section className="bg-white py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Everything you need to evaluate your startup
            </h2>
            <p className="mt-6 text-lg leading-8 text-neutral-600">
              Get comprehensive feedback from multiple AI VCs, each with their own investment philosophy and expertise.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-7xl">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.name}
                  className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm transition-all hover:shadow-md"
                >
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {feature.name}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
