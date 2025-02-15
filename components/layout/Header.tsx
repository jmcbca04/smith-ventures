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
          <nav className="hidden md:flex items-center">
            <Link href="/submit">
              <Button>Submit Your Deal</Button>
            </Link>
          </nav>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
} 