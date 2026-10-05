import { TENANT_CONFIG } from '../config/tenant';

// A bare 10-digit number is assumed to be Indian (+91) - this site's only
// deployments are - so tel: links dial correctly from abroad too.
export const telHref = (phone = TENANT_CONFIG.phone) => {
  const cleaned = String(phone).replace(/[^\d+]/g, '');
  return `tel:${/^\d{10}$/.test(cleaned) ? `+91${cleaned}` : cleaned}`;
};

export const mailtoHref = (email = TENANT_CONFIG.email) => `mailto:${email}`;

// An exact Google Maps share link (REACT_APP_TENANT_MAPS_URL) wins when set;
// otherwise a search for the address text, which needs no coordinates.
export const mapsHref = () =>
  TENANT_CONFIG.mapsUrl ||
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(TENANT_CONFIG.address)}`;
