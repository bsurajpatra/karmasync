import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCurrentUser } from '../api/authApi';
import LoadingAnimation from './LoadingAnimation';
import '../styles/Dashboard.css';
import Footer from './Footer';

import LogoutModal from './LogoutModal';

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [lockActive, setLockActive] = useState(true);

  // Strong navigation lock logic
  useEffect(() => {
    // Push a new state so that back button stays on dashboard
    window.history.pushState(null, '', window.location.pathname);

    const handlePopState = (event) => {
      if (lockActive) {
        // Always push back to dashboard
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [lockActive]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        await getCurrentUser();
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      setLockActive(false); // Release lock before logout
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <LoadingAnimation message="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-content">
        <div className="top-bar">
          <div className="header-left">
            <Link to="/dashboard">
              <img src="/logo.png" alt="KarmaSync" className="dashboard-logo" />
            </Link>
            <div className="header-content">
              <h1>Welcome to KarmaSync</h1>
              <p className="dashboard-subtitle">Your productivity companion</p>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogoutClick}>
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>

        <div className="dashboard-body">
          <div className="dashboard-sidebar">
            <nav className="sidebar-nav">
              <Link to="/projects" className="sidebar-link">
                <i className="fas fa-project-diagram"></i>
                <span>Projects</span>
              </Link>
              <Link to="/todos" className="sidebar-link">
                <i className="fas fa-tasks"></i>
                <span>My To-dos</span>
              </Link>
              <Link to="/profile" className="sidebar-link">
                <i className="fas fa-user"></i>
                <span>Profile</span>
              </Link>
              <Link to="/contact" className="sidebar-link">
                <i className="fas fa-envelope"></i>
                <span>Contact Us</span>
              </Link>
            </nav>
          </div>

          <div className="content-container">
            <div className="message-box">
              <h2>Maximize Your Productivity</h2>
              <p>
                KarmaSync helps you manage projects, track tasks, and collaborate with your team. Stay organized, meet deadlines, and achieve goals.
              </p>
            </div>
            {/* Main content area where stats or other dashboard widgets would go */}
            <div className="dashboard-main-area">
              <p style={{ textAlign: 'center', color: '#666', marginTop: '2rem' }}>Select an option from the sidebar to get started.</p>
            </div>
          </div>
        </div>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />
      <Footer />
    </div>
  );
};

export default Dashboard;