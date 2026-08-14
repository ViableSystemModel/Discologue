import { createSignal, For, Show } from 'solid-js';
import { Title } from "@solidjs/meta";
import { tables, reducers } from '../spacetime_bindings';
import { useTable, useReducer } from 'spacetimedb/solid';
import { useSpacetimeDBSignals } from '~/helpers';

export default function Home() {
  const [name, setName] = createSignal('');

  const {isActive} = useSpacetimeDBSignals();

  // Subscribe to all people in the database
  const [games] = useTable(() => tables.listOwnedGames);

  const createGameReducer = useReducer(reducers.createGame);

  const createGame = (e: Event) => {
    e.preventDefault();
    if (!name().trim() || !isActive()) return;

    // Call the add reducer
    createGameReducer({ name: name() });
    setName('');
  };

  return (
    <main>
      <Title>Hello World</Title>
      <div style={{ padding: '2rem' }}>
        <h1>Discologue</h1>

        <form onSubmit={createGame} style={{ 'margin-bottom': '2rem' }}>
          <input
            type="text"
            placeholder="Enter name"
            value={name()}
            onInput={e => setName(e.currentTarget.value)}
            style={{ padding: '0.5rem', 'margin-right': '0.5rem' }}
            disabled={!isActive()}
          />
          <button
            type="submit"
            style={{ padding: '0.5rem 1rem' }}
            disabled={!isActive()}
          >
            Create Game
          </button>
        </form>

        <div>
          <h2>Your Games ({games.length})</h2>
          <Show
            when={games.length > 0}
            fallback={<p>No games yet</p>}
          >
            <ul>
              <For each={games}>
                {(game) => <li>{game.name}</li>}
              </For>
            </ul>
          </Show>
        </div>
      </div>
    </main>
  );
}
