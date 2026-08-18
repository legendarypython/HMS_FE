import React from 'react';
import { Route, Switch, BrowserRouter as Router } from 'react-router-dom';
import './App.css';

import Home from './component/Home/Home';
import Login from './component/Login/Login';
import PrivateRoute from './component/Shared/PrivateRoute';

import Dashboard from './component/Dashboard/Dashboard';
import Admin from './component/Admin/Admin';
import DoctorManagement from './component/Doctors/DoctorManagement';
import DoctorAvailability from './component/Doctors/DoctorAvailability';
import AppointmentInbox from './component/Appointments/AppointmentInbox';
import BookAppointment from './component/Appointments/BookAppointment';

import AddPatientPage from './component/Patient/AddPatientPage';
import ScanShareQr from './component/Patient/ScanShareQr';
import AntenatalDetailsForm from './component/Patient/AddAnteNatal';
import InfertilityDetailsForm from './component/Patient/AddInfertlityCase';
import PatientDetails from './component/Patient/PatientDetails';
import ViewAntenatalForm from './component/Patient/ViewAnteNatal';
import ViewInfertilityForm from './component/Patient/ViewInfertilityCase';
import MyRecord from './component/Patient/MyRecord';
import Terms from './component/Legal/Terms';
import RefundPolicy from './component/Legal/RefundPolicy';
import NotFound from './component/Shared/NotFound';

const STAFF_ROLES = ['owner', 'manager'];

function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/login" component={Login} />
          <Route exact path="/book-appointment" component={BookAppointment} />
          <Route exact path="/terms" component={Terms} />
          <Route exact path="/refund-policy" component={RefundPolicy} />

          {/* Owner-only - not in STAFF_ROLES. Per the owner's explicit request,
              a manager-role staff account can only add patients and view
              appointments; everything else (including Dashboard) is hidden
              from their nav (AppNavbar.js) and blocked here too, so a direct
              URL visit can't bypass what the nav simply doesn't show. */}
          <PrivateRoute exact path="/dashboard" roles={['owner']} component={Dashboard} />
          <PrivateRoute exact path="/doctors" roles={['owner']} component={DoctorManagement} />
          <PrivateRoute exact path="/availability" roles={['owner']} component={DoctorAvailability} />

          <PrivateRoute exact path="/patients" roles={STAFF_ROLES} component={Admin} />
          <PrivateRoute exact path="/appointments" roles={STAFF_ROLES} component={AppointmentInbox} />

          <PrivateRoute exact path="/patients/add" roles={STAFF_ROLES} component={AddPatientPage} />
          <PrivateRoute exact path="/scan-qr" roles={STAFF_ROLES} component={ScanShareQr} />
          <PrivateRoute exact path="/patients/add/anteNatalForm/:patientId" roles={STAFF_ROLES} component={AntenatalDetailsForm} />
          <PrivateRoute exact path="/patients/add/infertilityForm/:patientId" roles={STAFF_ROLES} component={InfertilityDetailsForm} />
          <PrivateRoute exact path="/patients/view/:patientId" roles={STAFF_ROLES} component={PatientDetails} />
          <PrivateRoute exact path="/patients/view/anteNatalForm/:patientId" roles={STAFF_ROLES} component={ViewAntenatalForm} />
          <PrivateRoute exact path="/patients/view/infertilityForm/:patientId" roles={STAFF_ROLES} component={ViewInfertilityForm} />

          <PrivateRoute exact path="/patient/my-record" roles={['patient']} component={MyRecord} />

          <Route component={NotFound} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
