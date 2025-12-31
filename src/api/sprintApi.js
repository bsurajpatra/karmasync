import axios from 'axios';
import config from '../config';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const BASE_URL = `${config.API_URL}/api/sprints`;

export const createSprint = async (sprintData) => {
    try {
        const response = await axios.post(BASE_URL, sprintData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getSprintsByProject = async (projectId) => {
    try {
        const response = await axios.get(`${BASE_URL}/project/${projectId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const updateSprint = async (id, sprintData) => {
    try {
        const response = await axios.put(`${BASE_URL}/${id}`, sprintData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const updateSprintStatus = async (id, status) => {
    try {
        const response = await axios.patch(`${BASE_URL}/${id}/status`, { status }, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const assignTasksToSprint = async (sprintId, taskIds) => {
    try {
        const response = await axios.post(`${BASE_URL}/assign`, { sprintId, taskIds }, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const removeTasksFromSprint = async (sprintId, taskIds) => {
    try {
        const response = await axios.post(`${BASE_URL}/remove`, { sprintId, taskIds }, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
