import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEntries } from '../context/EntriesContext';

function formatDateTime(iso) {
  return new Date(iso).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function Entry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getEntry, updateEntry, deleteEntry } = useEntries();
  const entry = getEntry(id);
  const [editing, setEditing] = useState(false);

  if (!entry) {
    return (
      <div className="page">
        <p>Entry not found.</p>
        <Link to="/">Back to Brain Drain</Link>
      </div>
    );
  }

  const handleDelete = () => {
    if (window.confirm('Delete this entry? This cannot be undone.')) {
      deleteEntry(id);
      navigate('/');
    }
  };

  return (
    <div className="page entry-page">
      <header className="page-header">
        <Link to="/" className="back-link">
          ← Brain Drain
        </Link>
      </header>

      <div className="entry-meta">{formatDateTime(entry.updatedAt)}</div>

      {editing ? (
        <EntryEditor
          key={entry.id}
          entry={entry}
          onCancel={() => setEditing(false)}
          onSave={(updates) => {
            updateEntry(id, updates);
            setEditing(false);
          }}
        />
      ) : (
        <>
          <h2 className="entry-title">{entry.title || 'Untitled'}</h2>
          <div className="entry-body">{entry.body || <em>No content.</em>}</div>
          <div className="entry-actions">
            <button type="button" className="btn" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button type="button" className="btn danger" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function EntryEditor({ entry, onCancel, onSave }) {
  const [title, setTitle] = useState(entry.title || '');
  const [body, setBody] = useState(entry.body || '');

  return (
    <div className="entry-edit">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="entry-title-input"
        placeholder="Title"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="entry-body-input"
        placeholder="What's on your mind?"
        rows={12}
      />
      <div className="entry-actions">
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={() => onSave({ title: title.trim() || 'Untitled', body: body.trim() })}
        >
          Save
        </button>
      </div>
    </div>
  );
}
