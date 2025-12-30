import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createProject } from '../api/projectApi';
import { searchUsers } from '../api/userApi';
import LoadingAnimation from './LoadingAnimation';

import '../styles/ProjectOverview.css';
import '../styles/CreateProjectCompact.css';
import Footer from './Footer';

const ROLE_TYPES = {
  MANAGER: 'manager',
  DEVELOPER: 'developer'
};

const CreateCollaborativeProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCollaborators, setSelectedCollaborators] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    githubLink: '',
    projectType: 'collaborative'
  });

  const debouncedSearch = useCallback(
    async (term) => {
      if (term.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        console.log('Searching for users with term:', term);
        const results = await searchUsers(term);
        console.log('Search results:', results);

        const filteredResults = results.filter(user =>
          !selectedCollaborators.some(collab => collab._id === user._id)
        );
        console.log('Filtered results (excluding selected collaborators):', filteredResults);

        setSearchResults(filteredResults);
      } catch (err) {
        console.error('Error searching users:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          stack: err.stack
        });
        setError('Failed to search users. Please try again.');
      } finally {
        setSearchLoading(false);
      }
    },
    [selectedCollaborators]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddCollaborator = (user) => {
    setSelectedUser(user);
    setShowRoleModal(true);
    setSearchResults([]);
    setSearchTerm('');
  };

  const handleRoleSelect = (role) => {
    if (selectedUser) {
      setSelectedCollaborators(prev => [...prev, { ...selectedUser, role }]);
      setShowRoleModal(false);
      setSelectedUser(null);
    }
  };

  const handleRemoveCollaborator = (userId) => {
    setSelectedCollaborators(prev =>
      prev.filter(collab => collab._id !== userId)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedCollaborators.length === 0) {
      setError('Please add at least one collaborator');
      return;
    }

    setLoading(true);
    try {
      const projectData = {
        ...formData,
        collaborators: selectedCollaborators.map(collab => ({
          userId: collab._id,
          role: collab.role
        }))
      };
      await createProject(projectData);
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingAnimation message="Creating project..." />;

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
              <h1 className="po-project-name">Collaborative</h1>
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
                <label htmlFor="title" className="cp-label">Project Name*</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter project name"
                  className="cp-input"
                  required
                />
              </div>

              <div className="cp-form-group">
                <label htmlFor="description" className="cp-label">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter project description"
                  rows="4"
                  className="cp-textarea"
                />
              </div>

              <div className="cp-form-group">
                <label htmlFor="collaborators" className="cp-label">Collaborators*</label>
                <div className="cp-search-container">
                  <input
                    type="text"
                    id="collaborators"
                    placeholder="Search users by username"
                    value={searchTerm}
                    onChange={handleSearch}
                    className="cp-input"
                  />
                  {searchResults.length > 0 && (
                    <div className="cp-search-results">
                      {searchResults.map(user => (
                        <div
                          key={user._id}
                          className="cp-search-item"
                          onClick={() => handleAddCollaborator(user)}
                        >
                          <div className="cp-user-info">
                            <span className="cp-username">{user.username}</span>
                            <span className="cp-email">{user.email}</span>
                          </div>
                          <i className="fas fa-plus add-icon"></i>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="cp-collaborators-list">
                  {selectedCollaborators.map(collab => (
                    <div key={collab._id} className="cp-collaborator-tag">
                      <div className="collaborator-info">
                        <span className="cp-username">{collab.username}</span>
                        <span className="cp-role-badge">
                          {collab.role === ROLE_TYPES.MANAGER ?
                            <span className="cp-role-manager">Project Manager</span> :
                            <span className="cp-role-developer">Developer</span>
                          }
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCollaborator(collab._id)}
                        className="cp-remove-btn"
                        title="Remove collaborator"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cp-form-group">
                <label htmlFor="githubLink" className="cp-label">Repository Link</label>
                <input
                  type="url"
                  id="githubLink"
                  name="githubLink"
                  value={formData.githubLink}
                  onChange={handleInputChange}
                  placeholder="Enter GitHub repository URL"
                  className="cp-input"
                />
              </div>

              <div className="cp-actions">
                <button type="submit" className="cp-btn-primary">
                  Create Project
                </button>
                <button
                  type="button"
                  className="cp-btn-secondary"
                  onClick={() => navigate('/projects')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showRoleModal && (
        <div className="cp-modal-overlay">
          <div className="cp-role-modal">
            <h3>Select Role for {selectedUser?.username}</h3>
            <div className="cp-role-options">
              <button
                className="cp-role-option manager"
                onClick={() => handleRoleSelect(ROLE_TYPES.MANAGER)}
              >
                <h4>Project Manager</h4>
                <p>Full access to project management</p>
                <ul>
                  <li>Create, edit, and delete tasks</li>
                  <li>Manage project details</li>
                  <li>Manage collaborators</li>
                  <li>Full commenting access</li>
                </ul>
              </button>
              <button
                className="cp-role-option developer"
                onClick={() => handleRoleSelect(ROLE_TYPES.DEVELOPER)}
              >
                <h4>Developer</h4>
                <p>Task execution and updates</p>
                <ul>
                  <li>View and update task status</li>
                  <li>Comment on any tasks tasks</li>
                  <li>Limited project access</li>
                </ul>
              </button>
            </div>
            <button
              className="cp-modal-close-btn"
              onClick={() => {
                setShowRoleModal(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default CreateCollaborativeProject; 