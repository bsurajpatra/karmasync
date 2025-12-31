import axios from 'axios';
import config from '../config';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const BASE_URL = `${config.API_URL}/api/user-stories`;

export const getStoriesByProject = async (projectId) => {
    try {
        const response = await axios.get(`${BASE_URL}/project/${projectId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const createStory = async (storyData) => {
    try {
        const response = await axios.post(BASE_URL, storyData, {
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

export const updateStory = async (id, storyData) => {
    try {
        const response = await axios.put(`${BASE_URL}/${id}`, storyData, {
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

export const deleteStory = async (id) => {
    try {
        const response = await axios.delete(`${BASE_URL}/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
