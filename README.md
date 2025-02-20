# Smith Ventures - AI-Powered Venture Capital Evaluation Platform

Smith Ventures is an innovative platform that leverages artificial intelligence to evaluate startup proposals through the lens of multiple AI VC partners, each modeled after famous venture capitalists. The platform provides anonymous, instant feedback on startup pitches from different investment perspectives.

## Key Features

- **Anonymous Proposal Submission**: Submit startup pitches without requiring login
- **Multi-VC AI Evaluation**: Get feedback from 5 distinct AI VC personas:
  - The Visionary Futurist (Marc Andreessen style)
  - The Product-Market Fit Expert (Paul Graham style)
  - The Growth Strategist (Bill Gurley style)
  - The Impact Investor (Vinod Khosla style)
  - The Operations Expert (Reid Hoffman style)
- **Secure & Private**: End-to-end encryption for all sensitive data
- **Instant Feedback**: Comprehensive evaluation with detailed reasoning from each VC
- **Shareable Results**: Private, unique links to view proposal evaluations

## Technical Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, OpenAI GPT-4 Turbo
- **Database**: Neon DB (PostgreSQL) with Drizzle ORM
- **Security**: Client-side encryption, anonymous submissions

## End-to-End Encryption System

Smith Ventures implements robust end-to-end encryption to ensure the privacy and security of all startup proposals:

- **Client-Side Encryption**: All sensitive data is encrypted in the browser before transmission using the Web Crypto API
- **AES-GCM Algorithm**: Uses AES-256-GCM for strong encryption with authenticated encryption
- **Unique Access Tokens**: Each proposal generates a unique encryption key and UUID
- **Zero Knowledge**: Server never has access to unencrypted data
- **Secure Key Management**: Encryption keys are stored locally and included in shareable links
- **Encrypted Storage**: Both proposals and VC evaluations are stored in encrypted form

## AI VC Partner System

The platform features five AI VC partners, each with unique investment philosophies and evaluation criteria:

### 1. The Visionary Futurist (Marc Andreessen style)

- Evaluates transformative technology and paradigm shifts
- Focuses on software's potential to disrupt industries
- Analyzes market transformation potential and technology moats

### 2. The Product-Market Fit Expert (Paul Graham style)

- Assesses founder quality and product execution
- Evaluates problem-solution fit and user needs
- Analyzes growth potential and market dynamics

### 3. The Growth Strategist (Bill Gurley style)

- Focuses on business model sustainability and unit economics
- Evaluates competitive advantages and market size
- Analyzes path to profitability and scaling economics

### 4. The Impact Investor (Vinod Khosla style)

- Evaluates climate tech and social impact potential
- Focuses on breakthrough technologies
- Analyzes technical innovation and scalability

### 5. The Operations Expert (Reid Hoffman style)

- Assesses scalability and network effects
- Focuses on blitzscaling potential
- Analyzes operational challenges and growth dynamics

Each VC provides:

- Investment decision (Yes/No)
- Detailed reasoning
- Key points and recommendations
- Investment thesis (for positive votes)
- Risk analysis
- Confidence score with explanation

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
