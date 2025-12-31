import axios from 'axios';
import config from '../config';
import { API_BASE_URL } from '../config';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  console.log('Auth token:', token ? 'Present' : 'Missing');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const BASE_URL = `${config.API_URL}/api/tasks`;

export const getTasks = async (projectId) => {
  try {
    console.log('Making GET request to /api/tasks for project:', projectId);
    const response = await axios.get(`${config.API_URL}/api/projects/${projectId}/tasks`, {
      headers: getAuthHeader()
    });
    console.log('GET /api/tasks response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in getTasks:', error.response || error);
    throw error;
  }
};

export const getTaskById = async (id) => {
  try {
    console.log('Making GET request to /api/tasks/' + id);
    const response = await axios.get(`${config.API_URL}/api/tasks/${id}`, {
      headers: getAuthHeader()
    });
    console.log('GET /api/tasks/' + id + ' response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in getTaskById:', error.response || error);
    throw error;
  }
};

export const createTask = async (taskData) => {
  try {
    console.log('Making POST request to /api/tasks with data:', taskData);
    const response = await axios.post(BASE_URL, {
      ...taskData,
      type: taskData.type || 'tech',
      status: taskData.status || 'todo',
    }, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      }
    });
    console.log('POST /api/tasks response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in createTask:', error.response || error);
    throw error;
  }
};

export const updateTaskStatus = async (id, status) => {
  try {
    console.log('Making PATCH request to /api/tasks/' + id + ' with status:', status);
    const response = await axios.patch(`${BASE_URL}/${id}`, { status }, {
      headers: getAuthHeader()
    });
    console.log('PATCH /api/tasks/' + id + ' response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in updateTaskStatus:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
      config: error.config
    });

    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to update task status'
    );
  }
};

export const updateTask = async (id, taskData) => {
  try {
    console.log('Making PUT request to /api/tasks/' + id + ' with data:', taskData);
    const response = await axios.put(`${BASE_URL}/${id}`, taskData, {
      headers: getAuthHeader()
    });
    console.log('PUT /api/tasks/' + id + ' response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in updateTask:', error.response || error);
    throw error;
  }
};

export const deleteTask = async (id) => {
  try {
    console.log('Making DELETE request to /api/tasks/' + id);
    const response = await axios.delete(`${BASE_URL}/${id}`, {
      headers: getAuthHeader()
    });
    console.log('DELETE /api/tasks/' + id + ' response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in deleteTask:', error.response || error);
    throw error;
  }
};

export const addTaskComment = async (taskId, comment) => {
  try {
    console.log('Making POST request to /api/tasks/' + taskId + '/comments with data:', comment);
    const response = await axios.post(`${BASE_URL}/${taskId}/comments`, {
      text: comment
    }, {
      headers: getAuthHeader()
    });
    console.log('POST /api/tasks/' + taskId + '/comments response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in addTaskComment:', error.response || error);
    throw error;
  }
};

export const getTasksByProject = async (projectId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/tasks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch project tasks');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    throw error;
  }
}; 