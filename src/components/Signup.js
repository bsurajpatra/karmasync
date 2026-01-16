import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup, checkUsername } from '../api/authApi';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import LoadingAnimation from './LoadingAnimation';
import Footer from './Footer';
import '../styles/Signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDelayMessage, setShowDelayMessage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

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

    setFieldErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const validateUsername = (username) => {
    const regex = /^[a-zA-Z0-9_-]+$/;
    return regex.test(username);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const errors = {};
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (!validateUsername(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const usernameCheck = await checkUsername(formData.username);
      if (!usernameCheck.available) {
        setFieldErrors(prev => ({
          ...prev,
          username: usernameCheck.message
        }));
        setLoading(false);
        return;
      }

      const signupData = {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password
      };

      await signup(signupData);
      setSuccess(true);

      setTimeout(() => {
        navigate('/verify-otp', {
          state: {
            userData: {
              email: formData.email,
              username: formData.username
            }
          }
        });
      }, 1500);

    } catch (err) {
      if (err.message === 'Email already registered' || err.message === 'Username already exists') {
        setError('User with this email or username already exists, proceed to sign in');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during signup');
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormComplete = () => {
    return (
      formData.fullName.trim() !== '' &&
      formData.username.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.password.trim() !== '' &&
      formData.confirmPassword.trim() !== ''
    );
  };

  if (loading) {
    return (
      <LoadingAnimation
        message={
          <>
            Creating your account...<br />
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
            <h2>Create Account</h2>
            <p className="auth-subtitle">Join us and start managing your projects</p>
          </div>

          {error && (
            <div className="signup-message error">
              {error}
            </div>
          )}
          {success && (
            <div className="signup-message success">
              Account created successfully! Redirecting to verification...
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <input
                type="text"
                name="fullName"
                className="auth-input"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
              />
              {fieldErrors.fullName && (
                <div className="signup-message error">{fieldErrors.fullName}</div>
              )}
            </div>

            <div className="form-group">
              <input
                type="text"
                name="username"
                className="auth-input"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
              />
              {fieldErrors.username && (
                <div className="signup-message error">{fieldErrors.username}</div>
              )}
            </div>

            <div className="form-group">
              <input
                type="email"
                name="email"
                className="auth-input"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
              {fieldErrors.email && (
                <div className="signup-message error">{fieldErrors.email}</div>
              )}
            </div>

            <div className="form-group password-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="auth-input"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
              {fieldErrors.password && (
                <div className="signup-message error">{fieldErrors.password}</div>
              )}
            </div>

            <div className="form-group password-group">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                className="auth-input"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
              {fieldErrors.confirmPassword && (
                <div className="signup-message error">{fieldErrors.confirmPassword}</div>
              )}
            </div>

            <button
              type="submit"
              className={`auth-button ${!isFormComplete() ? 'auth-button-disabled' : ''}`}
              disabled={loading || success || !isFormComplete()}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign In
              </Link>
            </p>
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

export default Signup; 