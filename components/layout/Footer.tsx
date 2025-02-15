import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-white border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h3 className="text-lg font-bold text-neutral-900">Smith Ventures</h3>
          <p className="text-sm text-neutral-600">
          The VC Firm of the Future
          </p>
        </div>
        <div className="mt-8 pt-8 border-t text-center">
          <p className="text-sm text-neutral-600">
            © {new Date().getFullYear()} Smith Ventures. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 