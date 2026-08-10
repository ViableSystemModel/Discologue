import { MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";

import { StyleRegistry, css } from "solid-styled";

import { SpacetimeDBProvider } from 'spacetimedb/solid';
import { DbConnection } from './spacetime_bindings';

const HOST = import.meta.env.VITE_SPACETIMEDB_HOST ?? 'http://0.0.0.0:3001';
const DB_NAME = import.meta.env.VITE_SPACETIMEDB_DB_NAME ?? 'discologue';
const TOKEN_KEY = `${HOST}/${DB_NAME}/auth_token`;

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

export default function App() {
  const isBrowser = typeof localStorage !== 'undefined';

  return (
    <Router
      root={(props) => (
        <SpacetimeDBProvider connectionBuilder={
          DbConnection.builder()
            .withUri(HOST)
            .withDatabaseName(DB_NAME)
            .withToken(isBrowser
              ? (localStorage.getItem(TOKEN_KEY) || undefined)
              : undefined
            )
            .onConnect((_conn, identity, token) => {
              if (isBrowser) {
                localStorage.setItem(TOKEN_KEY, token);
              }
              console.log(
                'Connected to SpacetimeDB with identity:',
                identity.toHexString()
              );
            })
            .onDisconnect(() => {
              console.log('Disconnected from SpacetimeDB');
            })
            .onConnectError((_ctx, err) => {
              console.log('Error connecting to SpacetimeDB:', err);
            })
        }>
          <MetaProvider>
            <StyleRegistry auto>
              <GlobalStyles />
              <a href="/">Index</a>
              <a href="/about">About</a>
              <Suspense>{props.children}</Suspense>
            </StyleRegistry>
          </MetaProvider>
        </SpacetimeDBProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}