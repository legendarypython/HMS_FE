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
import IconBadge from '../ui/IconBadge';
import PageHeader from '../ui/PageHeader';
import Drawer from '../ui/Drawer';
import PatientQuickView from './PatientQuickView';
import { getAuthHeader } from '../../utils/auth';
import { API_BASE } from '../../utils/api';
import './Admin.css';

const CASE_TYPE_LABELS = { 1: 'AnteNatal', 2: 'Infertility', 3: 'General' };
// Purely categorical, not a good/bad status - warning's amber previously
// made "Infertility" look like a problem state rather than just a category.
const CASE_TYPE_BADGE_VARIANT = { 1: 'primary', 2: 'accent', 3: 'neutral' };

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
  const [searchInput, setSearchInput] = useState(''); // raw input value, updates every keystroke
  const [searchQuery, setSearchQuery] = useState(''); // debounced value that actually drives the fetch
  const [filterValues, setFilterValues] = useState({});
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quickViewPatientId, setQuickViewPatientId] = useState(null);
  // Overview strip above the table - real clinic-wide counts, independent of
  // whatever's currently typed in the search box or filters (those narrow
  // the table below, not these). null = still loading.
  const [stats, setStats] = useState(null);

  // Fetched once on mount, not on every search/filter change - these are
  // "how's the clinic doing overall" numbers, not "how many results match
  // my search". limit:1 on each since only pagination.total is needed, not
  // the actual records.
  useEffect(() => {
    const fetchCount = (filters) => axios.post(`${API_BASE}/api/patients/search`, {
      query: '', sortBy: 'firstName', order: 'asc', page: 1, limit: 1, filters
    }, { headers: getAuthHeader() }).then(res => res.data.pagination.total);

    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - 6);

    // Not a case-type breakdown - showing only one of the 3 case types here
    // was arbitrary and looked like a bug. "Returning" is a single,
    // unambiguous count that doesn't invite the same "why only this one"
    // question.
    Promise.all([
      fetchCount({}),
      fetchCount({ startDate: weekStart, endDate: new Date() }),
      fetchCount({ IsNewPatient: 'No' }),
      fetchCount({ PaymentStatus: 'pending' }),
    ])
      .then(([total, newThisWeek, returning, pendingPayment]) => {
        setStats({ total, newThisWeek, returning, pendingPayment });
      })
      .catch(err => console.error('Error fetching patient stats:', err));
  }, []);

  // 300ms debounce - was firing a request on every single keystroke before
  // (fetchPatients depends on searchQuery, which updated directly from the
  // input's onChange), with no way to tell the difference between "still
  // typing" and "done typing". This is also why the explicit Search button
  // is gone now - there's nothing left for it to trigger that typing itself
  // doesn't already do.
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // A stale page number from before a new search/filter would otherwise
  // silently return zero results (e.g. sitting on page 3 of "all patients",
  // then searching for something with only 1 page of matches).
  useEffect(() => { setPage(1); }, [searchQuery, filterValues]);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/patients/search`, {
        query: searchQuery,
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

        {stats && (
          <div className="stat-tile-row">
            <div className="stat-tile">
              <IconBadge name="users" variant="primary" size="md" className="ui-icon-badge-inline stat-tile-icon" />
              <div>
                <div className="stat-tile-value">{stats.total.toLocaleString('en-IN')}</div>
                <div className="stat-tile-label">Total Patients</div>
              </div>
            </div>
            <div className="stat-tile">
              <IconBadge name="user-plus" variant="primary" size="md" className="ui-icon-badge-inline stat-tile-icon" />
              <div>
                <div className="stat-tile-value">{stats.newThisWeek}</div>
                <div className="stat-tile-label">New This Week</div>
              </div>
            </div>
            <div className="stat-tile">
              <IconBadge name="user-check" variant="neutral" size="md" className="ui-icon-badge-inline stat-tile-icon" />
              <div>
                <div className="stat-tile-value">{stats.returning}</div>
                <div className="stat-tile-label">Returning Patients</div>
              </div>
            </div>
            <div className="stat-tile">
              <IconBadge name="wallet" variant="warning" size="md" className="ui-icon-badge-inline stat-tile-icon" />
              <div>
                <div className="stat-tile-value">{stats.pendingPayment}</div>
                <div className="stat-tile-label">Pending Payment</div>
              </div>
            </div>
          </div>
        )}

        <div className="dashboard-toolbar">
          <Link to="/patients/add"><Button>+ Add New Patient</Button></Link>
          <div className="patient-search-box">
            <Icon name="search" size={16} className="patient-search-icon" />
            <input
              className="ui-input"
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by name, phone, or ID..."
            />
          </div>
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
                  <th>Date of Appointment</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Phone Number</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(patient => (
                  <tr
                    key={patient.patientId}
                    className="patient-row patient-row-clickable"
                    onClick={() => setQuickViewPatientId(patient.patientId)}
                  >
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
                    <td data-label="Date of Appointment">{formatDate(patient.dateOfAdmission)}</td>
                    <td data-label="Status">
                      {/* primary (teal), not success (green) - this row also has a
                          Payment badge that's genuinely green-for-good ("Paid"),
                          and "New" isn't itself a positive/negative outcome the
                          way paid/pending is, just a category. */}
                      <Badge variant={patient.isNewPatient ? 'primary' : 'neutral'}>
                        {patient.isNewPatient ? 'New' : 'Returning'}
                      </Badge>
                    </td>
                    <td data-label="Payment">
                      <Badge variant={patient.paymentMethod === 'waived' ? 'primary' : patient.paymentStatus === 'paid' ? 'success' : 'warning'}>
                        {patient.paymentMethod === 'waived'
                          ? 'Waived'
                          : patient.paymentStatus === 'paid'
                          ? `Paid (${patient.paymentMethod === 'online' ? 'Online' : 'Offline'})`
                          : 'Pending'}
                      </Badge>
                    </td>
                    <td data-label="Phone Number">{patient.phone.replace(/-/g, '')}</td>
                    <td data-label="Actions" className="patient-row-chevron-cell">
                      <Icon name="chevron-right" size={18} className="patient-row-chevron" />
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

      <Drawer open={!!quickViewPatientId} onClose={() => setQuickViewPatientId(null)} title="Patient">
        {quickViewPatientId && (
          <PatientQuickView patientId={quickViewPatientId} onClose={() => setQuickViewPatientId(null)} />
        )}
      </Drawer>

      <Footer />
    </div>
  );
};

export default Admin;
