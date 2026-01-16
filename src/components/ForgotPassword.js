import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import config from '../config';
import LoadingAnimation from './LoadingAnimation';
// import { forgotPassword } from '../api/authApi'; // Unused
import Footer from './Footer';
import '../styles/ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      console.log('Sending forgot password request to:', `${config.API_URL}/api/auth/forgot-password`);
      console.log('Request payload:', { email });

      const response = await axios.post(`${config.API_URL}/api/auth/forgot-password`, { email });
      console.log('Forgot password response:', response.data);

      setSuccess(true);
    } catch (error) {
      console.error('Forgot password error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);

      if (error.response?.status === 404) {
        setError('Account does not exist. Please create an account.');
      } else {
        setError(error.response?.data?.message || 'Failed to process request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingAnimation message="Processing your request..." />;

  return (
    <div className="forgot-container">
      <div className="forgot-logo-section">
        <img src="/logo.png" alt="KarmaSync Logo" className="forgot-logo" />
        <div className="forgot-logo-text">KarmaSync</div>
      </div>
      <div className="forgot-content">
        <div className="forgot-card">
          <div className="forgot-header">
            <h2>Forgot Password</h2>
            <p className="forgot-subtitle">Enter your email to reset your password</p>
          </div>

          {error && <div className="forgot-message error">{error}</div>}
          {success && (
            <div className="forgot-message success">
              Password reset link sent to your mail, and please check your spam folder if you don't see the email in your inbox
            </div>
          )}

          <form onSubmit={handleSubmit} className="forgot-form">
            <div className="form-group">
              <input
                type="email"
                required
                className="forgot-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="forgot-button"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Reset Password'}
            </button>
          </form>

          <div className="forgot-footer">
            <p>
              Remember your password?{' '}
              <Link to="/login" className="forgot-link">
                Login
              </Link>
            </p>
            <Link to="/" className="forgot-link forgot-back-link">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword; 