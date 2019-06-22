
import {FetchPokedex} from '../actions'
import { Link } from '../../site-generator/Link';


export const Init = FetchPokedex


const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gridGap: '1rem'
}


const card = {
  border: '1px solid var(--border-color)',
  borderRadius: '.5rem',
}


export default state => (
  <main>
    <h2>All pokemons:</h2>
    <div style={grid}>
      {state.pokemons
        ? state.pokemons.map(pokemon => (
          <Link state={state} to={`/pokemons/${pokemon.id}`} style={card}>
            <img src={pokemon.img} alt={pokemon.name} />
            <span>{pokemon.name}</span>
          </Link>
        ))
        : 'Pokemons are loading!'
      }
    </div>
  </main>
)

