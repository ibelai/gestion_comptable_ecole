import axios from 'axios';
const API_URL1 = process.env.REACT_APP_API_URL || 'http://localhost:1000';
const API_URL = `${API_URL1}/api/paiements`;

export const getPaiements = () => axios.get(API_URL);
export const createPaiement = (data) => axios.post(API_URL, data);
export const deletePaiement = (id) => axios.delete(`${API_URL}/${id}`);
