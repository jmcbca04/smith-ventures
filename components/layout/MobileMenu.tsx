'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="md:hidden" ref={menuRef}>
      <Button 
        variant="ghost" 
        size="icon" 
        aria-label={isOpen ? "Close menu" : "Open menu"}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg
          className="h-6 w-6 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </Button>

      <div 
        className={`
          fixed inset-x-0 top-16 z-50 bg-white border-b shadow-lg transform transition-transform duration-200 ease-out
          ${isOpen ? 'translate-y-0' : '-translate-y-full'}
        `}
      >
        <nav className="container mx-auto px-4 py-4 flex flex-col space-y-4">
          <Link 
            href="/about" 
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            About
          </Link>
          <Link 
            href="/how-it-works" 
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            How it Works
          </Link>
          <Link 
            href="/submit"
            onClick={() => setIsOpen(false)}
          >
            <Button className="w-full">Submit Proposal</Button>
          </Link>
        </nav>
      </div>
    </div>
  );
} 