import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createProject } from '../api/projectApi';
import LoadingAnimation from './LoadingAnimation';
import Footer from './Footer';
import '../styles/CreatePersonalProject.css';
import '../styles/ProjectOverview.css';
import '../styles/CreateProjectCompact.css';

const CreatePersonalProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    githubLink: '',
    projectType: 'personal'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Creating personal project:', formData);
      const response = await createProject(formData);
      console.log('Project created successfully:', response);
      navigate(`/project/${response._id}/overview`);
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingAnimation message="Creating your project..." />;

  return (
    <div className="projects-wrapper">
      <header className="po-header">
        <div className="po-header-content">
          <Link to="/dashboard" className="po-logo-container">
            <img src="/logo.png" alt="KarmaSync" className="po-logo" />
          </Link>

          <div className="po-divider"></div>

          <div className="po-titles">
            <span className="po-page-label">Create Project</span>
            <div className="po-project-title-wrapper">
              <h1 className="po-project-name">Personal</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="projects-body">
        <div className="projects-sidebar">
          <nav className="sidebar-nav">
            <button className="sidebar-link" onClick={() => navigate('/projects')}>
              <i className="fas fa-arrow-left"></i>
              <span>Back to Projects</span>
            </button>
          </nav>
        </div>

        <div className="project-overview-container">
          <div className="cp-container">
            <form onSubmit={handleSubmit} className="cp-form">
              {error && <div className="error-message">{error}</div>}

              <div className="cp-form-group">
                <label htmlFor="title" className="cp-label">Project Name *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter project name"
                  className="cp-input"
                />
              </div>

              <div className="cp-form-group">
                <label htmlFor="description" className="cp-label">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Enter project description"
                  className="cp-textarea"
                />
              </div>

              <div className="cp-form-group">
                <label htmlFor="githubLink" className="cp-label">GitHub Link</label>
                <input
                  type="url"
                  id="githubLink"
                  name="githubLink"
                  value={formData.githubLink}
                  onChange={handleInputChange}
                  placeholder="https://github.com/username/repository"
                  pattern="https://github.com/.*"
                  className="cp-input"
                />
                <small className="cp-hint">Must be a valid GitHub URL starting with https://github.com/</small>
              </div>

              <div className="cp-actions">
                <button
                  type="submit"
                  className="cp-btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
                <button
                  type="button"
                  className="cp-btn-secondary"
                  onClick={() => navigate('/projects')}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CreatePersonalProject; 