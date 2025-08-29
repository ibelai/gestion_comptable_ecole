import axios from 'axios';
   const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:1000';
const API_ = `${API_URL}/api/paiements`;

export const getPaiements = () => axios.get(API_);
export const createPaiement = (data) => axios.post(API_, data);
export const deletePaiement = (id) => axios.delete(`${API_}/${id}`);
