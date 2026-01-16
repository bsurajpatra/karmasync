import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyOTP, resendOTP } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import LoadingAnimation from './LoadingAnimation';
import Footer from './Footer';
import '../styles/OTPVerfication.css';

const OTPVerification = () => {
  console.log('OTPVerification component rendered');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const navigate = useNavigate();
  const location = useLocation();
  const userData = location.state?.userData;
  const { login } = useAuth();

  console.log('Location state:', location.state);
  console.log('User data received:', userData);

  useEffect(() => {
    console.log('Checking user data in useEffect');
    if (!userData) {
      console.log('No user data found, redirecting to signup');
      navigate('/signup');
      return;
    }
    console.log('User data is valid:', userData);
  }, [userData, navigate]);

  useEffect(() => {
    let timer;
    if (countdown > 0 && resendDisabled) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown, resendDisabled]);

  const handleChange = (element, index) => {
    console.log('OTP input changed:', { index, value: element.value });
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.value && index < 5) {
      const nextInput = element.parentElement.nextElementSibling?.querySelector('input');
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = e.target.parentElement.previousElementSibling?.querySelector('input');
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('OTP form submitted');
    setError('');
    setLoading(true);

    const otpString = otp.join('');
    console.log('OTP string:', otpString);

    if (otpString.length !== 6) {
      console.log('Invalid OTP length');
      setError('Please enter all digits of the OTP');
      setLoading(false);
      return;
    }

    try {
      console.log('Verifying OTP...');
      const response = await verifyOTP({
        email: userData.email,
        otp: otpString
      });
      console.log('OTP verification response:', response);

      setSuccess(true);
      console.log('Setting success state to true');

      setTimeout(() => {
        console.log('Navigating to dashboard');
        login(response.user, response.token);
        navigate('/dashboard', {
          state: {
            message: 'Account verified successfully! Welcome to KarmaSync.'
          }
        });
      }, 2000);
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Wrong OTP entered try again');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    console.log('Resending OTP');
    setError('');
    setResendDisabled(true);
    setCountdown(30);

    try {
      console.log('Making resend OTP request...');
      const response = await resendOTP({ email: userData.email });
      console.log('Resend OTP response:', response);
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Failed to resend OTP. Please try again.');
      setResendDisabled(false);
      setCountdown(0);
    }
  };

  if (loading) {
    return <LoadingAnimation message="Verifying your email..." />;
  }

  return (
    <div className="otp-container">
      <div className="otp-logo-section">
        <img src="/logo.png" alt="KarmaSync Logo" className="otp-logo" />
        <div className="otp-logo-text">KarmaSync</div>
      </div>
      <div className="otp-content">
        <div className="otp-card">
          <div className="otp-header">
            <h2>Verify Your Email</h2>
            <p className="otp-subtitle">Enter the 6-digit code sent to {userData?.email}</p>
            <p className="otp-subtitle" style={{ fontSize: '0.9em' }}>
              Please check your spam folder if you don't see the email in your inbox
            </p>
          </div>

          {error && <div className="otp-message error">{error}</div>}
          {success && (
            <div className="otp-message success">
              OTP Verified Successfully, redirecting to Dashboard
            </div>
          )}

          <form onSubmit={handleSubmit} className="otp-form">
            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <div key={index} className="otp-input-group">
                  <input
                    type="text"
                    maxLength="1"
                    className="otp-input"
                    value={digit}
                    onChange={(e) => handleChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    autoFocus={index === 0}
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="otp-button"
              disabled={loading || success}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            <div className="otp-resend">
              <button
                type="button"
                className="otp-resend-button"
                onClick={handleResendOTP}
                disabled={resendDisabled}
              >
                {resendDisabled
                  ? `Resend OTP in ${countdown}s`
                  : 'Resend OTP'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OTPVerification; 