import { createSignal, onCleanup } from "solid-js";
import { useSpacetimeDB } from "spacetimedb/solid";

export function useSpacetimeDBSignals(interval = 100) {
  const conn = useSpacetimeDB()

  const [connectionError, setConnectionError] = createSignal(conn.connectionError)
  const [connectionId, setConnectionId] = createSignal(conn.connectionId)
  const [identity, setIdentity] = createSignal(conn.identity)
  const [isActive, setIsActive] = createSignal(conn.isActive)
  const [token, setToken] = createSignal(conn.token)

  const timer = setInterval(() => {
    const newConnectionError = conn.connectionError
    const newConnectionId = conn.connectionId
    const newIdentity = conn.identity
    const newIsActive = conn.isActive
    const newToken = conn.token

    if (newConnectionError !== connectionError()) { setConnectionError(conn.connectionError) }
    if (newConnectionId !== connectionId()) { setConnectionId(conn.connectionId) }
    if (newIdentity !== identity()) { setIdentity(conn.identity) }
    if (newIsActive !== isActive()) { setIsActive(conn.isActive) }
    if (newToken !== token()) { setToken(conn.token) }
  }, interval);

  onCleanup(() => clearInterval(timer));

  return { connectionError, connectionId, identity, isActive, token }
}
