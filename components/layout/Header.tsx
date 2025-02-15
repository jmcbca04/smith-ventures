import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { MobileMenu } from './MobileMenu';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-neutral-900">
              Smith Ventures
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/about" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
              About
            </Link>
            <Link href="/how-it-works" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
              How it Works
            </Link>
            <Link href="/submit">
              <Button>Submit Proposal</Button>
            </Link>
          </nav>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
} 