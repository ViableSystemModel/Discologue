import { createEnv } from "@t3-oss/env-core";
import * as v from 'valibot'

export const env = createEnv({
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
  clientPrefix: "VITE_",
  client: {
    VITE_CLERK_PUBLISHABLE_KEY: v.pipe(v.string(), v.minLength(1)),
    VITE_SPACETIMEDB_HOST: v.optional(v.pipe(v.string(), v.url()), 'http://localhost:3001'),
    VITE_SPACETIMEDB_DB_NAME: v.optional(v.pipe(v.string(), v.minLength(1)), 'discologue'),
  },
  server: {
    CLERK_SECRET_KEY: v.optional(v.pipe(v.string(), v.minLength(1))),
  },
});
