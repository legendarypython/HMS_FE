import { useCallback, useRef, useState } from 'react';

// Returns [ref, visible] - attach ref to the element that should fade in as
// it scrolls into view (paired with the .ui-reveal/.ui-reveal-visible
// classes in theme.css). Reveals once and stays revealed rather than
// re-hiding on scroll away - a page that keeps flickering content in/out as
// you scroll up and down reads as gimmicky, not polished.
//
// Uses a callback ref rather than useRef+useEffect - a plain useRef's
// "attach the observer" effect only ever runs once, at this hook's own
// mount time, which is too early for any conditionally-rendered element
// (e.g. a section gated behind `{data.length > 0 && ...}` that doesn't
// exist in the DOM until an async fetch resolves) - ref.current would still
// be null when the effect runs, so the observer never gets created at all,
// leaving that element permanently stuck at opacity 0. A callback ref fires
// exactly when React actually attaches the DOM node, no matter when that
// happens, so it works correctly for both always-rendered and
// conditionally-rendered elements alike.
//
// Falls back to already-visible when IntersectionObserver isn't available
// (very old browsers) so content is never permanently stuck invisible.
export default function useScrollReveal() {
  const [visible, setVisible] = useState(typeof IntersectionObserver === 'undefined');
  const observerRef = useRef(null);

  const ref = useCallback((node) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  return [ref, visible];
}
