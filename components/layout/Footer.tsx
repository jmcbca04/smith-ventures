import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-white border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-neutral-900">Smith Ventures</h3>
            <p className="text-sm text-neutral-600">
              AI-powered venture capital evaluation platform with distinct investment philosophies.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/submit" className="text-sm text-neutral-600 hover:text-neutral-900">
                  Submit Proposal
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-sm text-neutral-600 hover:text-neutral-900">
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-neutral-600 hover:text-neutral-900">
                  About
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t">
          <p className="text-sm text-neutral-600">
            © {new Date().getFullYear()} Smith Ventures. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 