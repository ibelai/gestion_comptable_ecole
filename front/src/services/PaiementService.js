import axios from 'axios';

const API_URL = `${API_URL}/api/paiements`;

export const getPaiements = () => axios.get(API_URL);
export const createPaiement = (data) => axios.post(API_URL, data);
export const deletePaiement = (id) => axios.delete(`${API_URL}/${id}`);
