import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects, createProject, updateProject, deleteProject } from '../api/projectApi';
import LoadingAnimation from './LoadingAnimation';
import '../styles/Projects.css';
import Footer from './Footer';
import '../styles/Dashboard.css';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="v2-logout-wrapper">
      <div className="v2-logout-container">
        <div className="v2-logout-title-area">
          <h2>Confirm Logout</h2>
        </div>
        <div className="v2-logout-main-content">
          <p>Are you sure you want to log out?</p>
          <div className="v2-logout-action-row">
            <div className="v2-logout-btn-group">
              <button className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button className="logout-confirm-button" onClick={onConfirm}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Projects = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Unused state variables removed
  // const [showForm, setShowForm] = useState(false);
  // const [editingProject, setEditingProject] = useState(null);
  // const [formData, setFormData] = useState({ title: '', description: '' });

  useEffect(() => {
    console.log('Projects component mounted');
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      console.log('Fetching projects...');
      const data = await getProjects();
      console.log('Projects fetched successfully:', data);
      setProjects(data);
      setError('');
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  // Unused handlers removed (handleInputChange, handleSubmit, handleEdit, handleDelete)

  const handleProjectTypeSelect = (type) => {
    if (type === 'personal') {
      navigate('/create-personal-project');
    } else {
      navigate('/create-collaborative-project');
    }
    setShowTypeModal(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  if (loading) {
    return <LoadingAnimation message="Loading your projects..." />;
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
              <h1>My Projects</h1>
              <p className="dashboard-subtitle">Manage your ongoing work</p>
            </div>
          </div>
          <div className="projects-header-actions">
            <button className="logout-button" onClick={handleLogoutClick}>
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </div>

        <div className="dashboard-body">
          <div className="dashboard-sidebar">
            <nav className="sidebar-nav">
              <Link to="/projects" className="sidebar-link active">
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
            {error && <div className="error-message">{error}</div>}
            <div className="projects-list-container">
              <div className="projects-content-header">
                <h2>Projects</h2>
                <button
                  className="create-project-button"
                  onClick={() => setShowTypeModal(true)}
                >
                  <i className="fas fa-plus"></i> Create New Project
                </button>
              </div>
              <div className="projects-list">
                {projects.length === 0 ? (
                  <div className="project-item" style={{ textAlign: 'center' }}>
                    <h3>No Projects Found</h3>
                    <p>Create your first project to get started!</p>
                  </div>
                ) : (
                  projects.map(project => (
                    <div
                      key={project._id}
                      className="project-item"
                      onClick={() => navigate(`/project/${project._id}/overview`)}
                    >
                      <div className="project-item-header">
                        <h3 className="project-item-title">{project.title}</h3>
                        <span className={`project-type-badge ${project.projectType}`}>
                          {project.projectType.charAt(0).toUpperCase() + project.projectType.slice(1)}
                        </span>
                      </div>
                      <p className="project-item-description">{project.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />

      {showTypeModal && (
        <div className="modal-overlay">
          <div className="project-type-modal">
            <button
              className="project-type-modal-close"
              onClick={() => setShowTypeModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2>Select Project Type</h2>
            <div className="project-type-options">
              <div
                className="project-type-option"
                onClick={() => handleProjectTypeSelect('personal')}
              >
                <h3>Personal Project</h3>
                <p>Create a project that you'll manage on your own</p>
              </div>
              <div
                className="project-type-option"
                onClick={() => handleProjectTypeSelect('collaborative')}
              >
                <h3>Collaborative Project</h3>
                <p>Create a project and invite team members</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Projects;