import React, { useState } from 'react';
import Button from '../ui/Button';
import './DocumentPreviewModal.css';

// Shared preview overlay for a fetched document blob URL.
// `document` is the currently displayed { name, url }.
// Pass `documents` (the full raw list, each with a `filename`) and `onSelect`
// (a fetch-and-set function like the callers already have) to enable prev/next
// navigation between documents belonging to the same record.
const DocumentPreviewModal = ({ document, documents = [], onSelect, onClose }) => {
  const [fullscreen, setFullscreen] = useState(false);

  if (!document) return null;

  const currentIndex = documents.findIndex(d => d.filename === document.name);
  const canNavigate = Boolean(onSelect) && documents.length > 1 && currentIndex !== -1;

  const goTo = (delta) => {
    const nextIndex = (currentIndex + delta + documents.length) % documents.length;
    onSelect(documents[nextIndex]);
  };

  const handleClose = () => {
    setFullscreen(false);
    onClose();
  };

  // document.url is an already-authenticated blob: URL (the /api/documents/:id
  // fetch requires a Bearer token, so a plain <a href> pointing at the API
  // wouldn't work) - reuse it via a programmatic anchor click to trigger a
  // real save-as download instead of just the inline iframe preview.
  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = document.url;
    link.download = document.name;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div className="doc-modal-overlay">
      <div className={`doc-modal ${fullscreen ? 'doc-modal-fullscreen' : ''}`}>
        <div className="doc-modal-header">
          {canNavigate && (
            <button className="doc-modal-nav" onClick={() => goTo(-1)} aria-label="Previous document">←</button>
          )}
          <strong className="doc-modal-title">{document.name}</strong>
          {canNavigate && (
            <button className="doc-modal-nav" onClick={() => goTo(1)} aria-label="Next document">→</button>
          )}
          <div className="doc-modal-actions">
            <Button size="sm" variant="ghost" onClick={handleDownload}>Download</Button>
            <Button size="sm" variant="ghost" onClick={() => setFullscreen(f => !f)}>
              {fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleClose}>Close</Button>
          </div>
        </div>
        <iframe src={document.url} title={document.name} className="doc-modal-frame" />
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
