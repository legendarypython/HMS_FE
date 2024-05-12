import React, { Component } from 'react';
import axios from 'axios';
import Navber from './AdminNavbar';
import '../../styles/Admin.css';
import Footer from '../Footer';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { AddPatientPage } from '../Patient/AddPatient'; // Import the AddPatientPage component
import { Link } from 'react-router-dom';

class Admin extends Component {
  state = {
    patients: [],
    page: 1,
    limit: 10,
    totalPages: 0,
    searchQuery: '',
    selectedFilter: null,
    filterValues: {},
    filters: [
      { name: 'CaseType', options: ['AnteNatal', 'Infertility', 'General'] },
      { name: 'DateOfAdmission', type: 'date' },
      { name: 'IsNewPatient', options: ['Yes', 'No'] }
    ],
    showFiltersModal: false // New state to control the visibility of the filters modal
  };

  componentDidMount() {
    this.fetchPatients();
  }

  fetchPatients = async () => {
    const { page, limit, searchQuery, filterValues } = this.state;

    try {
      const response = await axios.post('http://localhost:6000/api/patients/search', {
        name: searchQuery,
        sortBy: 'firstName',
        order: 'asc',
        page,
        limit,
        filters: filterValues
      });

      const { data, pagination } = response.data;
      const { total } = pagination;

      this.setState({
        patients: data,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  handlePageChange = page => {
    this.setState({ page }, () => {
      this.fetchPatients();
    });
  };

  handleSearch = () => {
    this.setState({ page: 1 }, () => {
      this.fetchPatients();
    });
  };

  handleFilterSelection = filterName => {
    this.setState({ selectedFilter: filterName });
  };

  handleFilterValueSelection = (name,value) => {
    const { filterValues } = this.state;
    const updatedFilterValues = {
      ...filterValues,
      [name]: value
    };
    this.setState({ filterValues: updatedFilterValues });
  };

  handleClearFilters = () => {
    this.setState({ filterValues: {}, selectedFilter: null }, () => {
      this.fetchPatients();
    });
  };

  handleCaseTypeSelection = option => {
    const { filterValues } = this.state;
    const currentFilterValue = filterValues['CaseType'] || [];
    const updatedFilterValue = currentFilterValue.includes(option)
      ? currentFilterValue.filter(item => item !== option)
      : [...currentFilterValue, option];

    const updatedFilterValues = {
      ...filterValues,
      ['CaseType']: updatedFilterValue
    };

    this.setState({ filterValues: updatedFilterValues }); 
    console.log(JSON.stringify(filterValues));

  };

  toggleFiltersModal = () => {
    this.setState(prevState => ({
      showFiltersModal: !prevState.showFiltersModal
    }));
  };

  render() {
    const { patients, totalPages, page, searchQuery, filters, selectedFilter, filterValues, showFiltersModal } = this.state;

    return (
      <div className="admin-container">
        <Navber />

        <div className="bg-dark">
          <div className="search-container">
          <AddPatientPage className = 'add-patient'/>
            <input
              type="text"
              value={searchQuery}
              onChange={e => this.setState({ searchQuery: e.target.value })}
              placeholder="Search by name or phone..."
            />
            <button onClick={this.handleSearch}>Search</button>

            {/* Filter button */}
            <button className="filter-button" onClick={this.toggleFiltersModal}>
              Filters
            </button>

            {/* Filters Modal */}
            {showFiltersModal && (
              <div className="filters-modal">
                <div className="filters-content">
                  {filters.map(filter => (
                    <div key={filter.name} className="filter-group">
                      <div className="filter-label">{filter.name}</div>
                      {/* Render filter options */}
                      {/* Example: CaseType filter */}
                      {filter.name === 'CaseType' && (
                        <div className="case-type-options">
                          {filter.options.map(option => (
                            <button
                              key={option}
                              className={`case-type-option ${filterValues['CaseType'] && filterValues['CaseType'].includes(option) ? 'selected' : ''}`}
                              onClick={() => this.handleCaseTypeSelection(option)}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Example: DateOfAdmission filter */}
                      {filter.name === 'DateOfAdmission' && (
                        <div className="date-range-selector">
                          <DatePicker
                            selected={filterValues['startDate']}
                            onChange={date => this.handleFilterValueSelection('startDate', date)}
                            selectsStart
                            startDate={filterValues['startDate']}
                            endDate={filterValues['endDate']}
                            placeholderText="Start Date"
                          />
                          <DatePicker
                            selected={filterValues['endDate']}
                            onChange={date => this.handleFilterValueSelection('endDate', date)}
                            selectsEnd
                            startDate={filterValues['startDate']}
                            endDate={filterValues['endDate']}
                            minDate={filterValues['startDate']}
                            placeholderText="End Date"
                          />
                        </div>
                      )}
                      {/* Example: IsNewPatient filter */}
                      {filter.name === 'IsNewPatient' && (
                        <div className="radio-buttons">
                          {filter.options.map(option => (
                            <label key={option}>
                              <input
                                type="radio"
                                value={option}
                                checked={filterValues['IsNewPatient'] === option}
                                onChange={() => this.handleFilterValueSelection(filter.name,option)}
                              />
                              {option}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button className="filter-button" onClick={this.handleClearFilters}>
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="admin-content">
          <table className="patient-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Case Type</th>
                <th>Date of Admission</th>
                <th>New Patient</th>
                <th>Phone Number</th>
                <th>Actions</th> {/* Add Actions column for View button */}

              </tr>
            </thead>
            <tbody>
              {patients.map(patient => (
                <tr key={patient.patientId}>
                  <td>{`${patient.firstName} ${patient.lastName}`}</td>
                  <td>{this.calculateAge(patient.dateOfBirth)}</td>
                  <td>{this.getCaseTypeLabel(patient.caseType)}</td>
                  <td>{this.formatDate(patient.dateOfAdmission)}</td>
                  <td>{patient.isNewPatient ? 'Yes' : 'No'}</td>
                  <td>{patient.phone.replace(/-/g, '')}</td>
                  <td>
                    <Link to={`/patient/view/${patient.patientId}`} className="view-button">View</Link> {/* Link to Patient detail form */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <button onClick={() => this.handlePageChange(page - 1)} disabled={page === 1}  className='next-btn'>
                Previous
              </button>
              <span>{`Page ${page} of ${totalPages}`}</span>
              <button onClick={() => this.handlePageChange(page + 1)} disabled={page === totalPages} className='next-btn'>
                Next
              </button>
            </div>
          )}
        </div>

        <Footer />
      </div>
    );
  }

  calculateAge = dateOfBirth => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  getCaseTypeLabel = caseType => {
    switch (caseType) {
      case 1:
        return 'AnteNatal';
      case 2:
        return 'Infertility';
      case 3:
        return 'General';
      default:
        return '';
    }
  };

  formatDate = date => {
    return new Date(date).toLocaleDateString('en-US');
  };
}

export default Admin;
