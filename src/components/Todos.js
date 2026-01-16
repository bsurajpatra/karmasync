import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getTodos, createTodo, updateTodo, deleteTodo, updateTodoStatus } from '../api/todosApi';
import LoadingAnimation from './LoadingAnimation';
import Footer from './Footer';
import '../styles/ProjectOverview.css';
import '../styles/TodosCompact.css';
import '../styles/Dashboard.css';
import { useAuth } from '../context/AuthContext';
import LogoutModal from './LogoutModal';

const Todos = () => {
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    priority: 'Low',
    category: 'General',
    dueDate: '',
    status: 'Pending'
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const data = await getTodos();
      setTodos(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'category' && value === 'Custom') {
      setCustomCategory('');
    }
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const todoData = {
        ...formData,
        category: formData.category === 'Custom' ? customCategory : formData.category
      };

      console.log('Submitting todo data:', todoData);

      if (editingTodo) {
        await updateTodo(editingTodo._id, todoData);
      } else {
        await createTodo(todoData);
      }

      setShowForm(false);
      setEditingTodo(null);
      setFormData({
        name: '',
        priority: 'Low',
        category: 'General',
        dueDate: '',
        status: 'Pending'
      });
      setCustomCategory('');
      await fetchTodos();
    } catch (err) {
      console.error('Error saving todo:', err);
      setError(err.response?.data?.message || 'Failed to save todo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setFormData({
      name: todo.name,
      priority: todo.priority,
      category: todo.category,
      dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
      status: todo.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteTodo(id);
      fetchTodos();
    } catch (err) {
      setError('Failed to delete todo');
    }
  };

  const handleStatusChange = async (todo) => {
    try {
      await updateTodoStatus(todo._id, todo.status === 'Pending' ? 'Done' : 'Pending');
      fetchTodos();
    } catch (err) {
      setError('Failed to update todo status');
    }
  };

  const filteredTodos = todos.filter(todo => {
    const searchLower = searchTerm.toLowerCase();
    return (
      todo.name.toLowerCase().includes(searchLower) ||
      todo.category.toLowerCase().includes(searchLower) ||
      todo.priority.toLowerCase().includes(searchLower) ||
      todo.status.toLowerCase().includes(searchLower) ||
      (todo.dueDate && new Date(todo.dueDate).toLocaleDateString().includes(searchLower))
    );
  });

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // renderTodoItem function removed (unused)

  const renderDeleteConfirmation = () => {
    if (!deleteConfirmation) return null;

    return (
      <div className="td-modal-overlay">
        <div className="td-modal">
          <div className="td-modal-header">
            <h2>Delete To-do</h2>
            <button className="td-modal-close" onClick={() => setDeleteConfirmation(null)}>&times;</button>
          </div>
          <div className="td-modal-body">
            <p style={{ color: '#4a5568', marginBottom: '1.5rem' }}>
              Are you sure you want to delete "{deleteConfirmation.name}"? This action cannot be undone.
            </p>
            <div className="td-actions" style={{ justifyContent: 'flex-end', borderTop: 'none', paddingTop: 0 }}>
              <button
                className="td-btn"
                style={{ background: '#edf2f7', color: '#4a5568' }}
                onClick={() => setDeleteConfirmation(null)}
              >
                Cancel
              </button>
              <button
                className="td-btn"
                style={{ background: '#e53e3e', color: 'white' }}
                onClick={() => {
                  handleDelete(deleteConfirmation._id);
                  setDeleteConfirmation(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingAnimation message="Loading your todos..." />;
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
            <span className="po-page-label">Personal</span>
            <div className="po-project-title-wrapper">
              <h1 className="po-project-name">My To-dos</h1>
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
            <Link to="/todos" className="sidebar-link active" style={{ background: 'linear-gradient(135deg, #4a90e2 0%, #70a1ff 100%)', color: 'white', boxShadow: '0 4px 10px rgba(74, 144, 226, 0.3)' }}>
              <i className="fas fa-tasks" style={{ color: 'white' }}></i>
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

        <div className="project-overview-container">
          <div className="td-container">
            <div className="td-header">
              <div>
                <span className="td-date">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </span>
                <h2 style={{ margin: '0.5rem 0 0 0', color: '#2d3748' }}>Task Board</h2>
              </div>
              <div className="td-header-actions">
                <button
                  className="td-btn"
                  onClick={() => setShowForm(true)}
                  style={{
                    background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    boxShadow: '0 4px 6px rgba(66, 153, 225, 0.2)'
                  }}
                >
                  <i className="fas fa-plus"></i> Add New To-do
                </button>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="td-content">
              <div className="td-search-bar">
                <div className="td-search-wrapper">
                  <i className="fas fa-search td-search-icon"></i>
                  <input
                    type="text"
                    placeholder="Search todos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="td-search-input"
                  />
                </div>
                {searchTerm && (
                  <button className="td-clear-search" onClick={() => setSearchTerm('')}>
                    <i className="fas fa-times"></i> Clear
                  </button>
                )}
              </div>

              <div className="td-list">
                {filteredTodos.length === 0 ? (
                  <div className="td-empty">
                    <h3>{searchTerm ? 'No matches found' : 'All caught up!'}</h3>
                    <p>{searchTerm ? 'Try a different search term' : 'Create a task to get started'}</p>
                  </div>
                ) : (
                  filteredTodos.map(todo => (
                    <div key={todo._id} className={`td-item td-item-${todo.priority.toLowerCase()}`}>
                      <div className="td-item-header">
                        <h3 className="td-item-title">{todo.name}</h3>
                        <span className={`td-badge ${todo.status === 'Done' ? 'td-status-done' : 'td-status-pending'}`}>
                          {todo.status}
                        </span>
                      </div>

                      <div className="td-item-details">
                        <span className="td-badge td-category">{todo.category}</span>
                        <span className={`td-badge td-priority-${todo.priority.toLowerCase()}`}>{todo.priority}</span>
                        {todo.dueDate && (
                          <span className="td-date-badge">
                            <i className="fas fa-calendar-alt"></i>
                            {new Date(todo.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div className="td-actions">
                        <button className="td-btn td-btn-done" onClick={() => handleStatusChange(todo)}>
                          <i className={`fas fa-${todo.status === 'Pending' ? 'check' : 'undo'}`}></i>
                          {todo.status === 'Pending' ? 'Done' : 'Undo'}
                        </button>
                        <button className="td-btn td-btn-edit" onClick={() => handleEdit(todo)}>
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        <button className="td-btn td-btn-delete" onClick={() => setDeleteConfirmation(todo)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {renderDeleteConfirmation()}

      {
        showForm && (
          <div className="td-modal-overlay">
            <div className="td-modal">
              <div className="td-modal-header">
                <h2>{editingTodo ? 'Edit Todo' : 'New Todo'}</h2>
                <button className="td-modal-close" onClick={() => {
                  setShowForm(false);
                  setEditingTodo(null);
                  setFormData({
                    name: '', priority: 'Low', category: 'General', dueDate: '', status: 'Pending'
                  });
                  setCustomCategory('');
                }}>&times;</button>
              </div>

              <div className="td-modal-body">
                {isSubmitting ? (
                  <LoadingAnimation message="Saving..." />
                ) : (
                  <form onSubmit={handleSubmit} className="td-form">
                    <div className="td-form-group">
                      <label className="td-label" htmlFor="name">Task Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="What needs to be done?"
                        className="td-input"
                      />
                    </div>

                    <div className="td-form-group">
                      <label className="td-label" htmlFor="priority">Priority</label>
                      <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="td-select"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div className="td-form-group">
                      <label className="td-label" htmlFor="category">Category</label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="td-select"
                      >
                        <option value="General">General</option>
                        <option value="Health">Health</option>
                        <option value="Study">Study</option>
                        <option value="Work">Work</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>

                    {formData.category === 'Custom' && (
                      <div className="td-form-group">
                        <label className="td-label">Custom Category</label>
                        <input
                          type="text"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          required
                          placeholder="Enter category name"
                          className="td-input"
                        />
                      </div>
                    )}

                    <div className="td-form-group">
                      <label className="td-label" htmlFor="dueDate">Due Date</label>
                      <input
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleInputChange}
                        className="td-input"
                      />
                    </div>

                    <button type="submit" className="td-submit-btn">
                      {editingTodo ? 'Save Changes' : 'Create Task'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )
      }
      <Footer />
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />
    </div >
  );
};

export default Todos; 