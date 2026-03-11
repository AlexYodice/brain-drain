import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEntries } from '../context/EntriesContext';

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { dateStyle: 'medium' });
}

function excerpt(text, max = 80) {
  if (!text?.trim()) return 'No content';
  const t = text.trim().replace(/\s+/g, ' ');
  return t.length <= max ? t : t.slice(0, max) + '…';
}

export default function Home() {
  const { searchEntries } = useEntries();
  const [query, setQuery] = useState('');
  const filtered = searchEntries(query);

  return (
    <div className="page home">
      <header className="page-header">
        <h1>Brain Drain</h1>
        <Link to="/new" className="btn primary">
          New entry
        </Link>
      </header>

      <div className="search-wrap">
        <input
          type="search"
          placeholder="Search entries…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
          aria-label="Search entries"
        />
      </div>

      <ul className="entry-list">
        {filtered.length === 0 ? (
          <li className="entry-list-empty">
            {query ? 'No entries match your search.' : 'No entries yet. Record your first thought.'}
          </li>
        ) : (
          filtered.map((entry) => (
            <li key={entry.id}>
              <Link to={`/entry/${entry.id}`} className="entry-card">
                <span className="entry-card-title">{entry.title || 'Untitled'}</span>
                <span className="entry-card-meta">{formatDate(entry.createdAt)}</span>
                <p className="entry-card-excerpt">{excerpt(entry.body)}</p>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
