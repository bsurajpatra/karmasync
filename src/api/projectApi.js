import axios from 'axios';
import config from '../config';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  console.log('Auth token:', token ? 'Present' : 'Missing');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const BASE_URL = `${config.API_URL}/api/projects`;

export const getProjects = async () => {
  try {
    console.log('Making GET request to /api/projects');
    const response = await axios.get(BASE_URL, {
      headers: getAuthHeader()
    });
    console.log('GET /api/projects response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in getProjects:', error.response || error);
    throw error;
  }
};

export const getProjectById = async (id) => {
  try {
    console.log('Making GET request to /api/projects/' + id);
    const response = await axios.get(`${BASE_URL}/${id}`, {
      headers: getAuthHeader()
    });
    console.log('GET /api/projects/' + id + ' response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in getProjectById:', error.response || error);
    throw error;
  }
};

export const createProject = async (projectData) => {
  try {
    console.log('Making POST request to /api/projects with data:', projectData);
    const headers = getAuthHeader();
    console.log('Request headers:', headers);

    const response = await axios.post(BASE_URL, projectData, {
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    });
    console.log('POST /api/projects response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in createProject:', error.response || error);
    if (error.response?.data) {
      throw error.response.data;
    }
    throw { message: 'Error creating project' };
  }
};

export const updateProject = async (id, projectData) => {
  try {
    console.log('Making PUT request to /api/projects/' + id + ' with data:', projectData);
    const response = await axios.put(`${BASE_URL}/${id}`, projectData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      }
    });
    console.log('PUT /api/projects/' + id + ' response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in updateProject:', error.response || error);
    if (error.response?.data) {
      throw error.response.data;
    }
    throw { message: 'Error updating project' };
  }
};

export const deleteProject = async (projectId) => {
  try {
    const response = await axios.delete(`${BASE_URL}/${projectId}`);
    console.log('Project and tasks deleted:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error.response?.data || error.message;
  }
};

export const addCustomBoard = async (projectId, boardData) => {
  const response = await axios.post(`${BASE_URL}/${projectId}/boards`, boardData);
  return response.data;
};

export const updateCustomBoard = async (projectId, boardId, boardData) => {
  const response = await axios.put(`${BASE_URL}/${projectId}/boards/${boardId}`, boardData);
  return response.data;
};

export const deleteCustomBoard = async (projectId, boardId) => {
  const response = await axios.delete(`${BASE_URL}/${projectId}/boards/${boardId}`);
  return response.data;
};

export const removeCollaborator = async (projectId, collaboratorId) => {
  try {
    console.log('Making POST request to remove collaborator:', { projectId, collaboratorId });
    const response = await axios.post(`${BASE_URL}/${projectId}/collaborators/remove`,
      { collaboratorId },
      {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Remove collaborator response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in removeCollaborator:', error.response || error);
    if (error.response?.data) {
      throw error.response.data;
    }
    throw { message: 'Error removing collaborator' };
  }
};

export const updateCollaboratorRole = async (projectId, collaboratorId, role) => {
  try {
    console.log('Making PUT request to update collaborator role:', { projectId, collaboratorId, role });
    const response = await axios.put(`${BASE_URL}/${projectId}/collaborators/role`,
      { collaboratorId, role },
      {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Update collaborator role response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in updateCollaboratorRole:', error.response || error);
    if (error.response?.data) {
      throw error.response.data;
    }
    throw { message: 'Error updating collaborator role' };
  }
};

export const addCollaborator = async (projectId, collaboratorData) => {
  try {
    console.log('Making POST request to add collaborator:', { projectId, collaboratorData });
    const response = await axios.post(`${BASE_URL}/${projectId}/collaborators`,
      collaboratorData,
      {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Add collaborator response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in addCollaborator:', error.response || error);
    if (error.response?.data) {
      throw error.response.data;
    }
    throw { message: 'Error adding collaborator' };
  }
};

export const leaveProject = async (projectId) => {
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/api/projects/${projectId}/leave`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}; 