import axios from 'axios';
const API_URL1 = process.env.REACT_APP_API_URL || 'http://localhost:1000';
const API_URL = `${API_URL1}/api/frais`;

export const getFrais = () => axios.get(API_URL);
export const createFrais = (frais) => axios.post(API_URL, frais);
export const updateFrais = (id, frais) => axios.put(`${API_URL}/${id}`, frais);
export const deleteFrais = (id) => axios.delete(`${API_URL}/${id}`);
