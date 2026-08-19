import React, { useState, useEffect } from 'react';
import AppNavbar from '../Shared/AppNavbar';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Field from '../ui/Field';
import Select from '../ui/Select';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import Icon from '../ui/Icon';
import PageHeader from '../ui/PageHeader';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE, apiFetch } from '../../utils/api';
import './DoctorManagement.css';

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
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editPhone, setEditPhone] = useState('');

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
    if (phone) formData.append('phone', phone);
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
    setPhone('');
    setPhoto(null);
    fetchDoctors();
  };

  const startEditPhone = (doc) => {
    setEditingId(doc._id);
    setEditPhone(doc.phone || '');
  };

  const saveEditPhone = async (id) => {
    const res = await apiFetch(`${API_BASE}/api/doctors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ phone: editPhone })
    });
    if (res.ok) {
      setEditingId(null);
      fetchDoctors();
    }
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
              <Select id="docSpec" value={specialization} onChange={(e) => setSpecialization(e.target.value)}>
                <option value="">Select specialization</option>
                {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="WhatsApp Number (optional)" htmlFor="docPhone">
              <input
                id="docPhone"
                type="tel"
                className="ui-input"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
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
        ) : doctors.length === 0 ? (
          <div className="ui-table-empty">
            <Icon name="inbox" size={28} />
            No doctors added yet — use the form above to add your first one.
          </div>
        ) : (
          <div className="staff-doctor-grid">
            {doctors.map(doc => (
              <Card key={doc._id} className={`staff-doctor-card ${!doc.active ? 'staff-doctor-card-inactive' : ''}`}>
                <div className="staff-doctor-card-header">
                  {doc.photoKey ? (
                    <span className="staff-doctor-photo-wrap">
                      <img src={`${API_BASE}/api/doctors/${doc._id}/photo`} alt="" className="staff-doctor-photo" />
                    </span>
                  ) : (
                    <span className="ui-avatar staff-doctor-avatar">{(doc.name || '').charAt(0).toUpperCase()}</span>
                  )}
                  <div>
                    <div className="staff-doctor-name">{doc.name}</div>
                    <div className="text-muted">{doc.specialization}</div>
                  </div>
                </div>

                <Badge variant={doc.active ? 'success' : 'neutral'}>{doc.active ? 'Active' : 'Inactive'}</Badge>

                <div className="staff-doctor-phone">
                  {editingId === doc._id ? (
                    <div className="staff-doctor-phone-edit">
                      <input
                        type="tel"
                        className="ui-input"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        autoFocus
                      />
                      <Button size="sm" onClick={() => saveEditPhone(doc._id)}>Save</Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <span
                      className="staff-doctor-phone-display"
                      onClick={() => role === 'owner' && startEditPhone(doc)}
                      style={{ cursor: role === 'owner' ? 'pointer' : 'default' }}
                    >
                      <Icon name="phone" size={14} />
                      {doc.phone || <span className="text-muted">WhatsApp number not set</span>}
                      {role === 'owner' && <Icon name="edit" size={14} style={{ opacity: 0.6 }} />}
                    </span>
                  )}
                </div>

                {role === 'owner' && (
                  <div className="staff-doctor-actions">
                    {doc.active ? (
                      <Button size="sm" variant="danger" onClick={() => handleRemove(doc._id)} style={{ width: '100%' }}>Remove</Button>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => handleRestore(doc._id)} style={{ width: '100%' }}>Restore</Button>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorManagement;
