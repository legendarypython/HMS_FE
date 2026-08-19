import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import AppNavbar from '../Shared/AppNavbar';
import PageHeader from '../ui/PageHeader';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { TENANT_CONFIG } from '../../config/tenant';
import './PaymentQrPage.css';

// A UPI deep link, not an Instamojo payment request - deliberately no
// backend involved at all. Routing an in-person payment through Instamojo
// would take its usual transaction fee even though the money's changing
// hands right at the counter; a personal UPI transfer is fee-free. No `am`
// (amount) param on purpose - this is one fixed QR for any visit, not
// generated per-transaction, so the payer's own UPI app asks them to type
// the amount, same as scanning any shop's static UPI poster would.
const buildUpiLink = (upiId, payeeName) =>
  `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&cu=INR`;

const getInitial = (name) => (name || '').replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase();

const PaymentQrPage = () => {
  const role = sessionStorage.getItem('userRole');
  const upiLink = buildUpiLink(TENANT_CONFIG.upiId, TENANT_CONFIG.legalName);

  return (
    <div>
      <AppNavbar role={role} />
      <div className="page page-narrow">
        <PageHeader icon="qr-code" title="Payment QR" subtitle="Show or print this for patients paying in person." />

        <div className="payment-qr-card">
          <div className="payment-qr-print-area">
            <div className="payment-qr-header">
              <span className="ui-avatar payment-qr-avatar">{getInitial(TENANT_CONFIG.legalName)}</span>
              <div className="payment-qr-name">{TENANT_CONFIG.legalName}</div>
            </div>
            <div className="payment-qr-code">
              <QRCodeSVG value={upiLink} size={240} level="M" includeMargin />
            </div>
            <div className="payment-qr-id">UPI ID: {TENANT_CONFIG.upiId}</div>
            <div className="payment-qr-tagline">Scan to pay with any UPI app</div>
          </div>

          <Button variant="secondary" onClick={() => window.print()} className="no-print" style={{ marginTop: 'var(--space-5)' }}>
            <Icon name="file" size={16} /> Print
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentQrPage;
