import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load the appropriate .env file based on the environment
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config({ path: '.env.local' });
}

export default {
  schema: './db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
    ssl: true,
  },
} satisfies Config; 