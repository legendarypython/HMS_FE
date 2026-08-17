import { useEffect, useRef, useState } from 'react';

// Returns [ref, visible] - attach ref to the element that should fade in as
// it scrolls into view (paired with the .ui-reveal/.ui-reveal-visible
// classes in theme.css). Reveals once and stays revealed rather than
// re-hiding on scroll away - a page that keeps flickering content in/out as
// you scroll up and down reads as gimmicky, not polished.
//
// Falls back to already-visible when IntersectionObserver isn't available
// (very old browsers) so content is never permanently stuck invisible.
export default function useScrollReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}
