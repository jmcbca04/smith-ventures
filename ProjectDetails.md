# Smith Ventures

## Project Overview

Smith Ventures is an AI-powered venture capital evaluation platform where startup proposals are assessed by multiple AI VC partners, each with distinct investment philosophies modeled after famous venture capitalists.

## Core Features

### 1. Anonymous Proposal Submission

- No login required
- Simple form for startup name and pitch
- Unique UUID generation for each proposal
- Private shareable link generation

### 2. AI VC Partner System

Five distinct AI personas modeled after famous VCs:

1. **The Visionary Futurist** (Marc Andreessen)

   - Focus: Transformative technology, paradigm shifts
   - Style: Bold bets on future trends

2. **The Product-Market Fit Expert** (Paul Graham)

   - Focus: Founder quality, product execution
   - Style: Early-stage startups with clear user need

3. **The Growth Strategist** (Bill Gurley)

   - Focus: Business model sustainability, market size
   - Style: Companies with clear path to profitability

4. **The Impact Investor** (Vinod Khosla)

   - Focus: Climate tech, social impact
   - Style: World-changing technologies

5. **The Operations Expert** (Reid Hoffman)
   - Focus: Scalability, network effects
   - Style: Companies with potential for rapid scaling

### 3. Evaluation Process

- Each AI VC evaluates proposals independently
- Provides YES/NO investment decision
- Includes detailed reasoning and key points
- Confidence score for each evaluation
- Optional investment thesis for positive votes

### 4. Results & Sharing

- Private results page for each proposal
- Comprehensive feedback from all VCs
- Shareable unique link
- Real-time evaluation status

## Technical Architecture

### Frontend

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Radix UI Components

### Backend

- Next.js API Routes
- OpenAI GPT-4 Turbo
- Drizzle ORM
- Neon DB (PostgreSQL)

### Database Schema

```typescript
// Proposals Table
- id (UUID, primary key)
- startupName (string)
- pitch (text)
- createdAt (timestamp)
- status (pending/completed)
- isArchived (boolean)

// VC Votes Table
- id (UUID, primary key)
- proposalId (UUID, foreign key)
- vcPersona (string)
- vote (boolean)
- reasoning (text)
- createdAt (timestamp)
- metadata (JSON)
```

### Security & Privacy

- Client-side encryption
- No user data storage
- Anonymous submissions
- Secure link sharing

### Deployment

- Vercel hosting
- Neon serverless database
- Environment variables for configuration

## Environment Setup

Required environment variables:

```
DATABASE_URL=postgresql://user:password@host:port/database
OPENAI_API_KEY=your-api-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
