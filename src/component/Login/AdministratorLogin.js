import React, { Component } from 'react';
import Navber from '../Navber/Navber';
import axios from 'axios';

class AdministratorLogin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mobile: '',
      password: '',
      errors: {
        mobileError: '',
        errorMessage: ''
      },
      showErrorPopup: false
    };

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onChange(e) {
    const { name, value } = e.target;
    this.setState({showErrorPopup:false});
    // Clear the specific error related to mobile field when it's being updated
    if (name === 'mobile') {
      this.setState(prevState => ({
        errors: { ...prevState.errors, mobileError: '' }, 
      }));
    }

    this.setState({ [name]: value });
  }

  onSubmit(e) {
    e.preventDefault();

    const { mobile, password } = this.state;

    // Form validation for mobile number
    if (!/^\d{10}$/.test(mobile)) {
      this.setState({
        errors: { ...this.state.errors, mobileError: 'Invalid mobile number' }
      });
      return;
    }

    // Axios post request to login endpoint
    axios
      .post('http://localhost:6000/api/auth/login', { mobile, password }, { withCredentials: true })
      .then(response => {
        if (response.data === 'Mobile not found') {
          throw new Error('Mobile not found');
        }
        sessionStorage.setItem('usertoken', response.data);
        sessionStorage.setItem('userData', JSON.stringify({ mobile, password }));
        this.props.history.push('/administrator/login/admin_home');
      })
      .catch(err => {
        const errorMessage = err.response.data.message;
        this.setState({
          errors: { ...this.state.errors, errorMessage: errorMessage ? errorMessage : err.message },
          showErrorPopup: true
        });
        console.log(err);
      });
  }

  render() {
    const { mobile, password, errors, showErrorPopup } = this.state;

    return (
      <div className="body">
        <Navber />
        <div className="container my-5">
          {showErrorPopup && (
            <div className="alert alert-danger" role="alert">
              {errors.errorMessage}
            </div>
          )}
          <div className="row">
            <div className="col-md-6 mt-5 mx-auto">
              <form noValidate onSubmit={this.onSubmit}>
                <h1 className="h3 mb-3 mt-5 font-weight-normal btn-rg">Please sign in as admin</h1>
                <div className="form-group btn-rg">
                  <label htmlFor="mobile">Mobile</label>
                  <input
                    id="mobile"
                    type="tel"
                    className="form-control"
                    name="mobile"
                    placeholder="Enter Mobile Number"
                    value={mobile}
                    onChange={this.onChange}
                  />
                  {errors.mobileError && <div className="mobile-error" style={{ color: 'red' }}>{errors.mobileError}</div>}
                </div>
                <div className="form-group btn-rg">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    placeholder="Password"
                    value={password}
                    onChange={this.onChange}
                  />
                </div>
                <button type="submit" className="btn btn-lg btn-primary btn-block mb-5">
                  Sign in
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="mb-5 mt-5">v</div>
      </div>
    );
  }
}

export default AdministratorLogin;
