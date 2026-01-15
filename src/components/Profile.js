import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCurrentUser, updateProfile, deleteAccount } from '../api/authApi';
import LoadingAnimation from './LoadingAnimation';
import Footer from './Footer';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../styles/ProjectOverview.css';
import '../styles/ProfileCompact.css';
import '../styles/Dashboard.css';
import LogoutModal from './LogoutModal';

const DeleteAccountModal = ({ isOpen, onClose, onConfirm }) => {
  const [deleteText, setDeleteText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (deleteText === 'DELETE') {
      setError('');
      onConfirm();
    } else {
      setError('Please type "DELETE" to confirm');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pf-modal-overlay">
      <div className="pf-modal">
        <div className="pf-modal-header">
          <h3>Delete Account</h3>
          <button className="pf-modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="pf-modal-body">
          <p className="pf-danger-text" style={{ textAlign: 'center', fontSize: '0.95rem' }}>
            Are you sure you want to delete your account? This action cannot be undone and you will lose all your data.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="pf-form-group">
              <label>Type "DELETE" to confirm:</label>
              <input
                type="text"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                className="pf-input"
                placeholder='Type "DELETE"'
              />
            </div>
            {error && <div className="pf-message pf-error">{error}</div>}
            <div className="pf-modal-actions">
              <button type="button" className="pf-btn pf-btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="pf-btn pf-btn-danger">
                Delete Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    console.log('Profile component mounted');
    fetchUserData();
  }, []);

  useEffect(() => {
    let timer;
    if (error || success) {
      timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [error, success]);

  const fetchUserData = async () => {
    try {
      console.log('Fetching user data...');
      setLoading(true);
      const user = await getCurrentUser();
      console.log('User data received:', user);
      setUserData(user);
      setFormData(prev => ({ ...prev, fullName: user.fullName, username: user.username, email: user.email }));
    } catch (error) {
      console.error('Error fetching user data:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input changed:', { name, value });
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editMode) return;

    console.log('Updating profile with data:', formData);
    setError('');
    setSuccess('');
    setIsUpdatingProfile(true);

    if (!formData.fullName.trim()) {
      setError('Full name is required');
      setIsUpdatingProfile(false);
      return;
    }
    if (!formData.username.trim()) {
      setError('Username is required');
      setIsUpdatingProfile(false);
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      setIsUpdatingProfile(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      setIsUpdatingProfile(false);
      return;
    }

    try {
      const response = await updateProfile({
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email
      });
      console.log('Profile update response:', response);

      setSuccess('Profile updated successfully');
      setEditMode(false);
      await fetchUserData();
    } catch (error) {
      console.error('Profile update error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      if (error.response?.data?.message?.includes('username')) {
        setError('Username is already taken');
      } else if (error.response?.data?.message?.includes('email')) {
        setError('Email is already registered');
      } else {
        setError(error.message || 'Failed to update profile');
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsUpdatingPassword(true);

    if (!passwordData.currentPassword) {
      setError('Current password is required');
      setIsUpdatingPassword(false);
      return;
    }
    if (!passwordData.newPassword) {
      setError('New password is required');
      setIsUpdatingPassword(false);
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setIsUpdatingPassword(false);
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setIsUpdatingPassword(false);
      return;
    }

    try {
      const response = await updateProfile({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      console.log('Password update response:', response);

      setSuccess('Password updated successfully');
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Password update error:', error);
      if (error.response?.data?.message?.includes('current password')) {
        setError('Current password is incorrect');
      } else {
        setError(error.message || 'Failed to update password');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setError('');
      await deleteAccount();

      const successModal = document.createElement('div');
      successModal.className = 'modal-overlay';
      successModal.innerHTML = `
          <div class="modal-content success-modal">
            <div class="modal-header">
              <h2>Account Deleted</h2>
            </div>
            <div class="modal-body">
              <p>Your account has been successfully deleted. You will be redirected to the home page.</p>
            </div>
          </div>
        `;
      document.body.appendChild(successModal);

      setTimeout(() => {
        document.body.removeChild(successModal);
        logout();
        navigate('/');
      }, 2000);
    } catch (error) {
      setError(error.message || 'Failed to delete account. Please try again.');
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return <LoadingAnimation message="Loading your profile..." />;
  }

  return (
    <div className="projects-wrapper">
      <header className="po-header">
        <div className="po-header-content">
          <Link to="/dashboard" className="po-logo-container">
            <img src="/logo.png" alt="KarmaSync" className="po-logo" />
          </Link>
          <div className="po-divider"></div>
          <div className="po-titles">
            <span className="po-page-label">Settings</span>
            <div className="po-project-title-wrapper">
              <h1 className="po-project-name">My Profile</h1>
            </div>
          </div>
          <button className="logout-button" onClick={() => setShowLogoutModal(true)}>
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </header>

      <div className="projects-body">
        <div className="projects-sidebar">
          <nav className="sidebar-nav">
            <Link to="/projects" className="sidebar-link">
              <i className="fas fa-project-diagram"></i>
              <span>Projects</span>
            </Link>
            <Link to="/todos" className="sidebar-link">
              <i className="fas fa-tasks"></i>
              <span>My To-dos</span>
            </Link>
            <Link to="/profile" className="sidebar-link active" style={{ background: 'linear-gradient(135deg, #4a90e2 0%, #70a1ff 100%)', color: 'white', boxShadow: '0 4px 10px rgba(74, 144, 226, 0.3)' }}>
              <i className="fas fa-user" style={{ color: 'white' }}></i>
              <span>Profile</span>
            </Link>
            <Link to="/contact" className="sidebar-link">
              <i className="fas fa-envelope"></i>
              <span>Contact Us</span>
            </Link>
          </nav>
        </div>

        <div className="project-overview-container">
          <div className="pf-container">
            <div className="pf-header">
              <h2>Profile Settings</h2>
              <p className="pf-subtitle">Manage your account information</p>
            </div>

            {error && <div className="pf-message pf-error">{error}</div>}
            {success && <div className="pf-message pf-success">{success}</div>}

            <div className="pf-content">
              <div className="pf-info-group">
                <span className="pf-label">Full Name</span>
                {editMode ? (
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="pf-input"
                    required
                  />
                ) : (
                  <span className="pf-value">{userData?.fullName}</span>
                )}
              </div>

              <div className="pf-info-group">
                <span className="pf-label">Username</span>
                {editMode ? (
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="pf-input"
                    required
                  />
                ) : (
                  <span className="pf-value">{userData?.username}</span>
                )}
              </div>

              <div className="pf-info-group">
                <span className="pf-label">Email</span>
                {editMode ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pf-input"
                    required
                  />
                ) : (
                  <span className="pf-value">{userData?.email}</span>
                )}
              </div>

              <div className="pf-actions">
                {editMode ? (
                  <>
                    {isUpdatingProfile ? (
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                        <LoadingAnimation message="Saving..." />
                      </div>
                    ) : (
                      <>
                        <button className="pf-btn pf-btn-secondary" onClick={() => {
                          setEditMode(false);
                          setFormData({
                            fullName: userData.fullName,
                            username: userData.username,
                            email: userData.email
                          });
                          setError('');
                        }}>
                          Cancel
                        </button>
                        <button className="pf-btn pf-btn-primary" onClick={handleUpdateProfile}>
                          Save Changes
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <button className="pf-btn pf-btn-secondary" onClick={() => setShowPasswordForm(true)}>
                      Change Password
                    </button>
                    <button className="pf-btn pf-btn-primary" onClick={() => {
                      setEditMode(true);
                      setError('');
                      setSuccess('');
                    }}>
                      Edit Profile
                    </button>
                  </>
                )}
              </div>

              {(showPasswordForm) && (
                <div className="pf-modal-overlay">
                  <div className="pf-modal">
                    <div className="pf-modal-header">
                      <h3>Change Password</h3>
                      <button className="pf-modal-close" onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setShowPassword({ current: false, new: false, confirm: false });
                      }}>&times;</button>
                    </div>
                    <div className="pf-modal-body">
                      {isUpdatingPassword ? (
                        <LoadingAnimation message="Updating..." />
                      ) : (
                        <form onSubmit={handleUpdatePassword}>
                          <div className="pf-form-group">
                            <label>Current Password</label>
                            <div className="pf-password-container">
                              <input
                                type={showPassword.current ? "text" : "password"}
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                required
                                className="pf-input"
                              />
                              <button type="button" className="pf-password-toggle" onClick={() => togglePasswordVisibility('current')}>
                                {showPassword.current ? <FaEyeSlash /> : <FaEye />}
                              </button>
                            </div>
                          </div>
                          <div className="pf-form-group">
                            <label>New Password</label>
                            <div className="pf-password-container">
                              <input
                                type={showPassword.new ? "text" : "password"}
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                required
                                className="pf-input"
                              />
                              <button type="button" className="pf-password-toggle" onClick={() => togglePasswordVisibility('new')}>
                                {showPassword.new ? <FaEyeSlash /> : <FaEye />}
                              </button>
                            </div>
                          </div>
                          <div className="pf-form-group">
                            <label>Confirm Password</label>
                            <div className="pf-password-container">
                              <input
                                type={showPassword.confirm ? "text" : "password"}
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                required
                                className="pf-input"
                              />
                              <button type="button" className="pf-password-toggle" onClick={() => togglePasswordVisibility('confirm')}>
                                {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                              </button>
                            </div>
                          </div>
                          <div className="pf-modal-actions">
                            <button type="button" className="pf-btn pf-btn-secondary" onClick={() => {
                              setShowPasswordForm(false);
                              setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                            }}>Cancel</button>
                            <button type="submit" className="pf-btn pf-btn-primary">Update Password</button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="pf-danger-zone">
                <div className="pf-danger-title">Danger Zone</div>
                <p className="pf-danger-text">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button className="pf-btn pf-btn-danger" onClick={handleDeleteAccount}>
                  Delete Account
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
      <Footer />
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          try {
            await logout();
            navigate('/');
          } catch (error) {
            console.error('Logout error:', error);
          }
        }}
      />
    </div>
  );
};

export default Profile; 