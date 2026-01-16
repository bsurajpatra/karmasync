import axios from 'axios';
import config from '../config';
// import { API_BASE_URL } from '../config'; // Unused

const BASE_URL = `${config.API_URL}/api/todos`;

const getAuthToken = () => {
  const token = localStorage.getItem('token');
  console.log('Auth Token:', token ? 'Present' : 'Missing');
  return token;
};

const getAuthHeader = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getTodos = async () => {
  try {
    const response = await axios.get(BASE_URL, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Get Todos Error:', error);
    throw error;
  }
};

export const createTodo = async (todoData) => {
  try {
    console.log('Creating Todo:', todoData);
    const response = await axios.post(BASE_URL, todoData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Create Todo Error:', error);
    throw error;
  }
};

export const updateTodo = async (todoId, todoData) => {
  try {
    console.log('Updating Todo:', { todoId, todoData });
    const response = await axios.put(`${BASE_URL}/${todoId}`, todoData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Update Todo Error:', error);
    throw error;
  }
};

export const deleteTodo = async (todoId) => {
  try {
    console.log('Deleting Todo:', todoId);
    const response = await axios.delete(`${BASE_URL}/${todoId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Delete Todo Error:', error);
    throw error;
  }
};

export const updateTodoStatus = async (todoId, status) => {
  try {
    console.log('Updating Todo Status:', { todoId, status });
    const response = await axios.put(`${BASE_URL}/${todoId}`, { status }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Update Todo Status Error:', error);
    throw error;
  }
};

export const getTodosByCategory = async (category) => {
  try {
    const response = await axios.get(`${BASE_URL}?category=${category}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching todos by category:', error);
    throw error;
  }
};

export const getTodosByPriority = async (priority) => {
  try {
    const response = await axios.get(`${BASE_URL}?priority=${priority}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching todos by priority:', error);
    throw error;
  }
};

export const getTodosByStatus = async (status) => {
  try {
    const response = await axios.get(`${BASE_URL}?status=${status}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching todos by status:', error);
    throw error;
  }
}; 