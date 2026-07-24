import React, { useState, useEffect } from 'react';
import AppNavbar from '../Shared/AppNavbar';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import Icon from '../ui/Icon';
import PageHeader from '../ui/PageHeader';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE, apiFetch } from '../../utils/api';

const SPECIALIZATIONS = [
  'General Physician',
  'Gynecologist',
  'Obstetrician',
  'Pediatrician',
  'Cardiologist',
  'Dermatologist',
  'Orthopedic',
  'Neurologist',
  'Psychiatrist',
  'ENT Specialist',
  'Ophthalmologist',
  'Urologist',
  'Endocrinologist',
  'Oncologist',
  'Radiologist',
  'General Surgeon',
  'Other'
];

const DoctorManagement = () => {
  const role = sessionStorage.getItem('userRole');
  const [doctors, setDoctors] = useState([]);
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDoctors = () => {
    setLoading(true);
    apiFetch(`${API_BASE}/api/doctors/all`, { headers: getAuthHeader() })
      .then(res => res.json())
      .then(json => setDoctors(json.data || []))
      .catch(err => console.error('Error fetching doctors:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDoctors(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !specialization) {
      setError('Name and specialization are required');
      return;
    }
    const formData = new FormData();
    formData.append('name', name);
    formData.append('specialization', specialization);
    if (photo) formData.append('photo', photo);
    const res = await apiFetch(`${API_BASE}/api/doctors/create`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.message || 'Could not add doctor');
      return;
    }
    setName('');
    setSpecialization('');
    setPhoto(null);
    fetchDoctors();
  };

  const handleRemove = async (id) => {
    await apiFetch(`${API_BASE}/api/doctors/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    fetchDoctors();
  };

  const handleRestore = async (id) => {
    await apiFetch(`${API_BASE}/api/doctors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ active: true })
    });
    fetchDoctors();
  };

  return (
    <div>
      <AppNavbar role={role} />
      <div className="page">
        <PageHeader icon="stethoscope" title="Doctors" />

        <Card style={{ marginBottom: 24 }}>
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {error && <div className="ui-banner ui-banner-error" style={{ width: '100%' }}>{error}</div>}
            <Field label="Name" required htmlFor="docName">
              <input id="docName" className="ui-input" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Specialization" required htmlFor="docSpec">
              <select id="docSpec" className="ui-select" value={specialization} onChange={(e) => setSpecialization(e.target.value)}>
                <option value="">Select specialization</option>
                {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Photo (optional)" htmlFor="docPhoto">
              <label htmlFor="docPhoto" className="ui-file-upload-label">
                <Icon name="file" size={16} /> {photo ? photo.name : 'Choose Photo'}
              </label>
              <input
                id="docPhoto"
                type="file"
                className="ui-file-upload-input"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setPhoto(e.target.files[0] || null)}
              />
            </Field>
            <Button type="submit" style={{ marginBottom: 'var(--space-4)' }}>Add Doctor</Button>
          </form>
        </Card>

        {loading ? (
          <Spinner label="Loading doctors..." />
        ) : (
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Specialization</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map(doc => (
                  <tr key={doc._id} className={!doc.active ? 'ui-row-inactive' : ''}>
                    <td data-label="Photo">
                      {doc.photoKey ? (
                        <img src={`${API_BASE}/api/doctors/${doc._id}/photo`} alt="" className="doctor-thumb" />
                      ) : (
                        <span className="ui-avatar">{(doc.name || '').charAt(0).toUpperCase()}</span>
                      )}
                    </td>
                    <td data-label="Name">{doc.name}</td>
                    <td data-label="Specialization">{doc.specialization}</td>
                    <td data-label="Status">
                      <Badge variant={doc.active ? 'success' : 'neutral'}>{doc.active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td data-label="Actions">
                      {role === 'owner' && (
                        doc.active ? (
                          <Button size="sm" variant="danger" onClick={() => handleRemove(doc._id)}>Remove</Button>
                        ) : (
                          <Button size="sm" variant="secondary" onClick={() => handleRestore(doc._id)}>Restore</Button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {doctors.length === 0 && (
              <div className="ui-table-empty">
                <Icon name="inbox" size={28} />
                No doctors added yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorManagement;
