import { createSignal, For, Show } from 'solid-js';
import { Title } from "@solidjs/meta";
import { tables, reducers } from '../spacetime_bindings';
import { useTable, useReducer } from 'spacetimedb/solid';
import { useSpacetimeDBSignals } from '~/helpers';

export default function Home() {
  const [name, setName] = createSignal('');

  const {isActive} = useSpacetimeDBSignals();

  // Subscribe to all people in the database
  const [people] = useTable(() => tables.person);

  const addReducer = useReducer(reducers.add);

  const addPerson = (e: Event) => {
    e.preventDefault();
    if (!name().trim() || !isActive()) return;

    // Call the add reducer
    addReducer({ name: name() });
    setName('');
  };

  return (
    <main>
      <Title>Hello World</Title>
      <div style={{ padding: '2rem' }}>
        <h1>SpacetimeDB SolidJS App</h1>

        <form onSubmit={addPerson} style={{ 'margin-bottom': '2rem' }}>
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
            Add Person
          </button>
        </form>

        <div>
          <h2>People ({people.length})</h2>
          <Show
            when={people.length > 0}
            fallback={<p>No people yet. Add someone above!</p>}
          >
            <ul>
              <For each={people}>
                {(person) => <li>{person.name}</li>}
              </For>
            </ul>
          </Show>
        </div>
      </div>
    </main>
  );
}
