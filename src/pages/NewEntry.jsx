import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEntries } from '../context/EntriesContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export default function NewEntry() {
  const navigate = useNavigate();
  const { addEntry } = useEntries();
  const { transcript, isListening, error, isSupported, start, stop, reset } = useSpeechRecognition();

  const [title, setTitle] = useState('');
  const [step, setStep] = useState('record'); // 'record' | 'review'

  const body = transcript.trim();

  const handleSave = () => {
    const id = addEntry({
      title: title.trim() || 'Untitled',
      body,
    });
    reset();
    navigate(`/entry/${id}`);
  };

  const handleCancel = () => {
    reset();
    navigate('/');
  };

  if (!isSupported) {
    return (
      <div className="page">
        <p className="unsupported">
          Voice input is not supported in this browser. Try Chrome or Edge.
        </p>
        <Link to="/">Back to Brain Drain</Link>
      </div>
    );
  }

  return (
    <div className="page new-entry-page">
      <header className="page-header">
        <Link to="/" className="back-link">
          ← Brain Drain
        </Link>
      </header>

      <h2 className="new-entry-heading">New entry</h2>

      {error && <p className="error-msg" role="alert">{error}</p>}

      {step === 'record' ? (
        <>
          <div className="record-area">
            <button
              type="button"
              className={`mic-btn ${isListening ? 'listening' : ''}`}
              onClick={isListening ? stop : start}
              aria-pressed={isListening}
              aria-label={isListening ? 'Stop recording' : 'Start recording'}
            >
              <span className="mic-icon" aria-hidden="true">
                {isListening ? '■' : '🎤'}
              </span>
            </button>
            <p className="record-hint">
              {isListening ? 'Speaking…' : 'Tap the mic to start recording.'}
            </p>
          </div>

          {(body || transcript) && (
            <div className="transcript-preview">
              <p className="transcript-label">Live transcript</p>
              <div className="transcript-text">{body || transcript || '…'}</div>
              <button type="button" className="btn primary" onClick={() => setStep('review')}>
                Continue to save
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="review-area">
          <label className="field-label">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="title-input"
            placeholder="Give this entry a title"
          />
          <label className="field-label">Entry</label>
          <div className="review-body">{body || 'No content recorded.'}</div>
          <div className="entry-actions">
            <button type="button" className="btn" onClick={() => setStep('record')}>
              Back
            </button>
            <button type="button" className="btn" onClick={handleCancel}>
              Cancel
            </button>
            <button type="button" className="btn primary" onClick={handleSave}>
              Save entry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
