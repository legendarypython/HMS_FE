// Single source of truth for which hospital this build represents, and its
// branding. Set REACT_APP_TENANT_* at build time (CRA only inlines env vars
// prefixed REACT_APP_) for a second tenant's deployment - every default below
// matches today's real Panchkuiyan content exactly, so the existing deployed
// build needs zero new env vars to keep working unchanged.
export const TENANT_ID = process.env.REACT_APP_TENANT_ID || 'panchkuiyan';

// OPD (outpatient) hours vary per clinic - windows are [startHour, endHour)
// in 24h time, closedDays are JS Date.getDay() values (0 = Sunday).
const DEFAULT_OPD_WINDOWS = [[11, 15], [18, 20]];
const DEFAULT_CLOSED_DAYS = [0];

const parseJsonEnv = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const TENANT_CONFIG = {
  name: process.env.REACT_APP_TENANT_NAME || 'Panchkuiyan Hospital',
  shortName: process.env.REACT_APP_TENANT_SHORT_NAME || 'Panchkuiyan',
  doctorName: process.env.REACT_APP_TENANT_DOCTOR_NAME || 'Dr. Bhavana Gupta',
  email: process.env.REACT_APP_TENANT_EMAIL || 'bhavanarmsk7@gmail.com',
  phone: process.env.REACT_APP_TENANT_PHONE || '9412426818',
  address: process.env.REACT_APP_TENANT_ADDRESS || '1/89, Panchkuian Hospital, Panchkuian, near Mathur Vaishya Bhawan, Agra',
  heroBgImage: process.env.REACT_APP_TENANT_HERO_BG_IMG || process.env.REACT_APP_TENANT_HERO_IMG_1 || '/images/clinic-ot.jpg',
  heroImage1: process.env.REACT_APP_TENANT_HERO_IMG_1 || '/images/dr-bhavana-desk.jpg',
  heroImage2: process.env.REACT_APP_TENANT_HERO_IMG_2 || '/images/clinic-signboard.jpg',
  ctaImage: process.env.REACT_APP_TENANT_CTA_IMG || process.env.REACT_APP_TENANT_HERO_IMG_1 || '/images/clinic-reception.jpg',
  ctaBgImage: process.env.REACT_APP_TENANT_CTA_BG_IMG || process.env.REACT_APP_TENANT_HERO_IMG_1 || '/images/clinic-ward.jpg',
  bookingBgImage: process.env.REACT_APP_TENANT_BOOKING_BG_IMG || process.env.REACT_APP_TENANT_HERO_IMG_1 || '/images/clinic-reception.jpg',
  opdWindows: parseJsonEnv(process.env.REACT_APP_TENANT_OPD_WINDOWS, DEFAULT_OPD_WINDOWS),
  closedDays: parseJsonEnv(process.env.REACT_APP_TENANT_CLOSED_DAYS, DEFAULT_CLOSED_DAYS),
  // Real HFR ID from the facility's ABDM registration (see PROGRESS.md) - the
  // "hip-id" the Scan & Share QR encodes, per ABDM's documented QR URL format.
  abdmHfrId: process.env.REACT_APP_TENANT_ABDM_HFR_ID || 'IN0911573004',
};
