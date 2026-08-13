import { MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { createMemo, createSignal, JSX, Suspense, createResource, Show } from "solid-js";

import { StyleRegistry, css } from "solid-styled";

import { SpacetimeDBProvider } from 'spacetimedb/solid';
import { DbConnection } from './spacetime_bindings';

import {
  ClerkLoaded,
  ClerkLoading,
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
  useUser,
  UserButton,
  SignUpButton,
} from 'clerk-solidjs';

import { env } from './env'
import { useSpacetimeDBSignals } from "./helpers";

function GlobalStyles() {
  css`
    @global {
      body {
        font-family: Gordita, Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue",
          sans-serif;
      }

      a {
        margin-right: 1rem;
      }

      main {
        text-align: center;
        padding: 1em;
        margin: 0 auto;
      }

      h1 {
        color: #335d92;
        text-transform: uppercase;
        font-size: 4rem;
        font-weight: 100;
        line-height: 1.1;
        margin: 4rem auto;
        max-width: 14rem;
      }

      p {
        max-width: 14rem;
        margin: 2rem auto;
        line-height: 1.35;
      }

      @media (min-width: 480px) {
        h1 {
          max-width: none;
        }

        p {
          max-width: none;
        }
      }
    }
  `;
  return null;
}

// Mark as client-only since Clerk requires browser APIs
export default function App() {
  'use client'

  return (
    <Router
      root={(props) => (
        <ClerkProvider
          publishableKey={env.VITE_CLERK_PUBLISHABLE_KEY}
        >
          <Suspense>
            <MetaProvider>
              <StyleRegistry auto>
                <GlobalStyles />
                <a href="/">Index</a>
                <a href="/about">About</a>
                <ClerkConsumer>
                  {props.children}
                </ClerkConsumer>
              </StyleRegistry>
            </MetaProvider>
          </Suspense>
        </ClerkProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}

function ClerkConsumer(props: {children?: JSX.Element}) {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { user } = useUser()

  // Use createResource for proper async handling
  const [token] = createResource(
    () => {
      // Only fetch when clerk is loaded and user is signed in
      if (!isLoaded() || !isSignedIn()) return null
      return true // trigger the fetcher
    },
    async () => {
      try {
        const t = await getToken()
        return t ?? null
      } catch (err) {
        console.error('Failed to get Clerk token:', err)
        return null
      }
    }
  )

  // Derived user info
  const username = createMemo(() => user()?.username ?? 'unknown_user')
  const email = createMemo(() => user()?.primaryEmailAddress?.emailAddress ?? 'unknown_email')

  // Only create the builder once we have a stable configuration
  const connectionConfig = createMemo(() => {
    const currentToken = token()

    // Don't connect until we know the auth state
    if (!isLoaded()) return null

    // If signed in but token still loading, wait
    if (isSignedIn() && token.loading) return null

    // If not signed in, connect anonymously (or you could wait for sign-in)
    // Return config object that won't change reference unnecessarily
    return {
      uri: env.VITE_SPACETIMEDB_HOST,
      dbName: env.VITE_SPACETIMEDB_DB_NAME,
      token: currentToken, // null for anonymous, string for authenticated
      username: username(),
      email: email(),
    }
  })

  // Stable builder that only changes when config actually changes
  const dbConnectionBuilder = createMemo(() => {
    const config = connectionConfig()
    if (!config) return null

    console.log('Creating SpacetimeDB connection builder', {
      hasToken: !!config.token,
      username: config.username
    })

    return DbConnection.builder()
      .withUri(config.uri)
      .withDatabaseName(config.dbName)
      .withToken(config.token ?? undefined)
      .onConnect((_conn, identity) => {
        console.log(
          'Connected to SpacetimeDB.',
          `Identity: ${identity.toHexString()},`,
          `Username: ${config.username},`,
          `Email: ${config.email}`,
        )
      })
      .onDisconnect(() => {
        console.log('Disconnected from SpacetimeDB')
      })
      .onConnectError((_ctx, err) => {
        console.error('Error connecting to SpacetimeDB:', err)
      })
  })

  return (
    <Show when={dbConnectionBuilder()} fallback={<div>Connecting to SpacetimeDB...</div>}>
      {(builder) => (
        <SpacetimeDBProvider connectionBuilder={builder()}>
          <NavBar username={username()} isConnecting={token.loading} />
          {props.children}
        </SpacetimeDBProvider>
      )}
    </Show>
  )
}

interface NavBarProps {
  username: string;
  isConnecting: boolean;
}

function NavBar(props: NavBarProps) {
  const { isActive } = useSpacetimeDBSignals()

  return (
    <nav style={{ display: 'flex', "flex-direction": 'row', background: 'lightblue', padding: '0.5rem', gap: '1rem' }}>
      <ClerkLoading>
        <p>Loading Clerk...</p>
      </ClerkLoading>
      <ClerkLoaded>
        <SignedIn>
          <UserButton />
          <p>Welcome, {props.username}</p>
        </SignedIn>
        <SignedOut>
          <SignInButton />
          <SignUpButton />
        </SignedOut>
      </ClerkLoaded>
      <div style={{ "align-content": 'center' }}>
        Status:{' '}
        {props.isConnecting ? (
          <strong style={{ color: 'orange' }}>Authenticating...</strong>
        ) : isActive() ? (
          <strong style={{ color: 'green' }}>Connected</strong>
        ) : (
          <strong style={{ color: 'red' }}>Disconnected</strong>
        )}
      </div>
    </nav>
  )
}