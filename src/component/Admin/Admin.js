import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import AppNavbar from '../Shared/AppNavbar';
import Footer from '../Footer';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Icon from '../ui/Icon';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';
import WeekSummary from './WeekSummary';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE } from '../../utils/api';
import './Admin.css';

const CASE_TYPE_LABELS = { 1: 'AnteNatal', 2: 'Infertility', 3: 'General' };
const CASE_TYPE_BADGE_VARIANT = { 1: 'primary', 2: 'warning', 3: 'neutral' };

const getInitials = (firstName, lastName) =>
  `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
const FILTERS = [
  { name: 'CaseType', options: ['AnteNatal', 'Infertility', 'General'] },
  { name: 'DateOfAdmission', type: 'date' },
  { name: 'IsNewPatient', options: ['Yes', 'No'] }
];

const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const formatDate = (date) => new Date(date).toLocaleDateString('en-US');

const Admin = () => {
  const role = sessionStorage.getItem('userRole');
  const [patients, setPatients] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalPatientCount, setTotalPatientCount] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/patients/search`, {
        name: searchQuery,
        sortBy: 'firstName',
        order: 'asc',
        page,
        limit,
        filters: filterValues
      }, { headers: getAuthHeader() });

      const { data, pagination } = response.data;
      setPatients(data);
      setTotalPages(Math.ceil(pagination.total / limit));
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterValues, searchQuery]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  // Separate, unfiltered, fetch-once count for the overview strip - the
  // paginated/filtered totalPages above reflects whatever search/filter is
  // currently active in the table below, which isn't the same thing as "how
  // many patients do we actually have".
  useEffect(() => {
    axios.post(`${API_BASE}/api/patients/search`, {
      name: '', sortBy: 'firstName', order: 'asc', page: 1, limit: 1, filters: {}
    }, { headers: getAuthHeader() })
      .then(response => setTotalPatientCount(response.data.pagination.total))
      .catch(() => setTotalPatientCount(null));
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchPatients();
  };

  const handleFilterValueSelection = (name, value) => {
    setFilterValues(prev => ({ ...prev, [name]: value }));
  };

  const handleCaseTypeSelection = (option) => {
    setFilterValues(prev => {
      const current = prev.CaseType || [];
      const updated = current.includes(option) ? current.filter(item => item !== option) : [...current, option];
      return { ...prev, CaseType: updated };
    });
  };

  const handleClearFilters = () => {
    setFilterValues({});
  };

  return (
    <div>
      <AppNavbar role={role} />

      <div className="page">
        <PageHeader icon="users" title="Patients" />

        {totalPatientCount !== null && <WeekSummary totalPatients={totalPatientCount} />}

        <div className="dashboard-toolbar">
          <Link to="/patients/add"><Button>+ Add New Patient</Button></Link>
          <input
            className="ui-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or phone..."
          />
          <Button variant="secondary" onClick={handleSearch}>Search</Button>
          <Button variant="secondary" onClick={() => setShowFiltersModal(!showFiltersModal)}>
            <Icon name="filter" size={16} /> Filters
          </Button>
        </div>

        {showFiltersModal && (
          <div className="ui-card filters-modal">
            {FILTERS.map(filter => (
              <div key={filter.name} className="filter-group">
                <div className="filter-label">{filter.name}</div>
                {filter.name === 'CaseType' && (
                  <div className="case-type-options">
                    {filter.options.map(option => (
                      <button
                        key={option}
                        className={`case-type-option ${filterValues.CaseType && filterValues.CaseType.includes(option) ? 'selected' : ''}`}
                        onClick={() => handleCaseTypeSelection(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
                {filter.name === 'DateOfAdmission' && (
                  <div className="date-range-selector">
                    <DatePicker
                      selected={filterValues.startDate}
                      onChange={date => handleFilterValueSelection('startDate', date)}
                      selectsStart
                      startDate={filterValues.startDate}
                      endDate={filterValues.endDate}
                      placeholderText="Start Date"
                    />
                    <DatePicker
                      selected={filterValues.endDate}
                      onChange={date => handleFilterValueSelection('endDate', date)}
                      selectsEnd
                      startDate={filterValues.startDate}
                      endDate={filterValues.endDate}
                      minDate={filterValues.startDate}
                      placeholderText="End Date"
                    />
                  </div>
                )}
                {filter.name === 'IsNewPatient' && (
                  <div className="radio-buttons">
                    {filter.options.map(option => (
                      <label key={option}>
                        <input
                          type="radio"
                          checked={filterValues.IsNewPatient === option}
                          onChange={() => handleFilterValueSelection('IsNewPatient', option)}
                        />
                        {' '}{option}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Button size="sm" variant="ghost" onClick={handleClearFilters}>Clear Filters</Button>
          </div>
        )}

        {loading ? (
          <Spinner label="Loading patients..." />
        ) : (
          <div className="ui-table-wrap" style={{ marginTop: 24 }}>
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Case Type</th>
                  <th>Date of Admission</th>
                  <th>Status</th>
                  <th>Phone Number</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(patient => (
                  <tr key={patient.patientId} className="patient-row">
                    <td data-label="Name" className="patient-name-cell">
                      <span className="ui-avatar" aria-hidden="true">{getInitials(patient.firstName, patient.lastName)}</span>
                      <span className="patient-name-cell-text">
                        <span className="patient-name-cell-name">{`${patient.firstName} ${patient.lastName}`}</span>
                        <span className="patient-name-cell-id text-muted">#{patient.patientId}</span>
                      </span>
                    </td>
                    <td data-label="Age">{calculateAge(patient.dateOfBirth)}</td>
                    <td data-label="Case Type">
                      <Badge variant={CASE_TYPE_BADGE_VARIANT[patient.caseType] || 'neutral'}>
                        {CASE_TYPE_LABELS[patient.caseType] || ''}
                      </Badge>
                    </td>
                    <td data-label="Date of Admission">{formatDate(patient.dateOfAdmission)}</td>
                    <td data-label="Status">
                      <Badge variant={patient.isNewPatient ? 'success' : 'neutral'}>
                        {patient.isNewPatient ? 'New' : 'Returning'}
                      </Badge>
                    </td>
                    <td data-label="Phone Number">{patient.phone.replace(/-/g, '')}</td>
                    <td data-label="Actions">
                      <Link to={`/patients/view/${patient.patientId}`}>
                        <Button size="sm" variant="secondary">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {patients.length === 0 && (
              <div className="ui-table-empty">
                <Icon name="inbox" size={28} />
                No patients found. Try a different search or add a new patient.
              </div>
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination-container">
            <Button size="sm" variant="ghost" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
            <span>Page {page} of {totalPages}</span>
            <Button size="sm" variant="ghost" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next</Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Admin;
