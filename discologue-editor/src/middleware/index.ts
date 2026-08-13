import { createMiddleware } from '@solidjs/start/middleware';
import { clerkMiddleware } from 'clerk-solidjs/start/server';
import {env} from '../env'

export default createMiddleware({
  onRequest: [
    clerkMiddleware({
      publishableKey: env.VITE_CLERK_PUBLISHABLE_KEY,
      secretKey: env.CLERK_SECRET_KEY,
    }),
  ]
});