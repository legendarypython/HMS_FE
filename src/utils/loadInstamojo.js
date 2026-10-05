// Instamojo's checkout.js must be loaded from this exact URL (their docs
// forbid bundling or self-hosting it). It used to be a render-blocking
// <script> in index.html, which delayed first paint on every page - including
// ones that never take a payment - by about a second. Now only the booking
// page loads it, on demand.
const CHECKOUT_SRC = 'https://js.instamojo.com/v1/checkout.js';

let pending = null;

export const loadInstamojo = () => {
  if (window.Instamojo) return Promise.resolve(window.Instamojo);
  if (pending) return pending;
  pending = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => {
      if (window.Instamojo) resolve(window.Instamojo);
      else { pending = null; reject(new Error('Instamojo checkout did not initialise')); }
    };
    script.onerror = () => {
      pending = null;
      script.remove();
      reject(new Error('Could not load Instamojo checkout'));
    };
    document.head.appendChild(script);
  });
  return pending;
};
