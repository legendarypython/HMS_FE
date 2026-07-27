import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import AppNavbar from '../Shared/AppNavbar';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Field from '../ui/Field';
import PageHeader from '../ui/PageHeader';
import { TENANT_CONFIG } from '../../config/tenant';

// M1 "Scan Health Facility QR" (Mandatory for Private): a static QR the
// facility displays at registration, letting a patient share their ABHA
// profile by scanning it with any ABDM-enabled app (ABHA app, Aarogya
// Setu, etc). Per ABDM's documented format, the QR just encodes a URL -
// hip-id must be this facility's real HFR ID, counter-id is any
// facility-chosen string identifying which physical counter/desk it's
// displayed at (useful once there's more than one registration point).
// No API call happens here - the scan and the resulting profile share are
// entirely between the patient's app and ABDM's gateway; this project only
// needs to render the correct URL and (separately) receive the resulting
// webhook, which is a distinct piece of work.
const buildShareUrl = (hipId, counterId) =>
  `https://phrsbx.abdm.gov.in/share-profile?hip-id=${encodeURIComponent(hipId)}&counter-id=${encodeURIComponent(counterId)}`;

const ScanShareQr = () => {
  const role = sessionStorage.getItem('userRole');
  const [counterId, setCounterId] = useState('reception');

  const shareUrl = buildShareUrl(TENANT_CONFIG.abdmHfrId, counterId || 'reception');

  return (
    <div>
      <AppNavbar role={role} />
      <div className="page">
        <PageHeader icon="qr-code" title="Scan & Share" />

        <Card style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
          <p className="text-muted" style={{ marginTop: 0 }}>
            Patients scan this with their ABHA app (or any ABDM-enabled app) to
            share their ABHA profile instantly - no manual data entry needed.
          </p>

          <div
            style={{
              background: '#fff',
              display: 'inline-block',
              padding: 24,
              borderRadius: 12,
              border: '1px solid var(--color-border, #e2e2e2)',
            }}
          >
            <QRCodeSVG value={shareUrl} size={240} level="M" includeMargin />
            <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: '#333' }}>
              Powered by ABDM
            </div>
          </div>

          <div style={{ marginTop: 20, textAlign: 'left' }}>
            <Field label="Counter / desk label" htmlFor="counterId">
              <input
                id="counterId"
                className="ui-input"
                value={counterId}
                onChange={(e) => setCounterId(e.target.value)}
                placeholder="e.g. reception, opd-1"
              />
            </Field>
          </div>

          <p className="text-muted" style={{ fontSize: 13 }}>
            Facility ID (HFR): <strong>{TENANT_CONFIG.abdmHfrId}</strong>
          </p>

          <Button variant="secondary" onClick={() => window.print()} style={{ marginTop: 8 }}>
            Print QR for counter display
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default ScanShareQr;
