import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as loginApi } from '../api/authApi';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import LoadingAnimation from './LoadingAnimation';
import Footer from './Footer';
import '../styles/Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDelayMessage, setShowDelayMessage] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => {
        setShowDelayMessage(true);
      }, 5000);
    } else {
      setShowDelayMessage(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await loginApi(formData);
      await authLogin(response.user, response.token);
      navigate('/dashboard');
    } catch (error) {
      if (error.message === 'User not found') {
        setError('No account found with this email or username');
      } else if (error.message === 'Invalid password') {
        setError('Incorrect password');
      } else if (error.message === 'Email not verified') {
        setError('Please verify your email before logging in');
      } else {
        setError(error.message || 'An error occurred during login');
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormComplete = () => {
    return (
      formData.identifier.trim() !== '' &&
      formData.password.trim() !== ''
    );
  };

  if (loading) {
    return (
      <LoadingAnimation
        message={
          <>
            Signing you in...<br />
            {showDelayMessage && (
              <span style={{ fontSize: '0.9em', opacity: 0.8 }}>
                If this is your first visit today, the server might be starting up. Please wait a moment...
              </span>
            )}
          </>
        }
      />
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-logo-section">
        <img src="/logo.png" alt="KarmaSync Logo" className="auth-logo" />
        <div className="auth-logo-text">KarmaSync</div>
      </div>
      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p className="auth-subtitle">Sign in to continue your productivity journey</p>
          </div>

          {error && <div className="signup-message error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <input
                type="text"
                name="identifier"
                className="auth-input"
                placeholder="Email or Username"
                value={formData.identifier}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group password-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="auth-input"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <button
              type="submit"
              className={`auth-button ${!isFormComplete() ? 'auth-button-disabled' : ''}`}
              disabled={loading || !isFormComplete()}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="auth-link">
                Sign Up
              </Link>
            </p>
            <Link to="/forgot-password" className="auth-link">
              Forgot Password?
            </Link>
            <Link to="/" className="auth-link back-link">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;