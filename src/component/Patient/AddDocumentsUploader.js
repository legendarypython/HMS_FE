import React, { useState } from 'react';
import Button from '../ui/Button';
import Field from '../ui/Field';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE, apiFetch } from '../../utils/api';
import './AddPatient.css';

// Reusable "attach files to an existing patient" uploader - used from the
// Add Patient duplicate-check flow, and reusable anywhere else a patient's
// documents need appending to without going through the full patient form.
const AddDocumentsUploader = ({ patientId, onUploaded }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files));
    setSuccess(false);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('documents', file));

      const response = await apiFetch(`${API_BASE}/api/patients/${patientId}/documents`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.message || 'Failed to upload documents');
        return;
      }
      setSuccess(true);
      setFiles([]);
      if (onUploaded) onUploaded(json.data);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {error && <div className="ui-banner ui-banner-error">{error}</div>}
      {success && <div className="ui-banner ui-banner-success">Documents added successfully.</div>}
      <Field label="Choose Documents" htmlFor="addDocuments">
        <label htmlFor="addDocuments" className="patient-form-file-label">Choose Documents</label>
        <input type="file" id="addDocuments" multiple onChange={handleFileChange} className="patient-form-file-input" />
        {files.map((file, index) => (
          <div key={index} className="patient-form-document-item">
            <span>{file.name}</span>
            <button type="button" onClick={() => removeFile(index)}>x</button>
          </div>
        ))}
      </Field>
      <Button type="button" onClick={handleUpload} disabled={uploading || files.length === 0}>
        {uploading ? 'Uploading...' : 'Upload Documents'}
      </Button>
    </div>
  );
};

export default AddDocumentsUploader;
