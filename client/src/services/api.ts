import axios from 'axios';
import { Campaign } from '../types';

// Use relative URL in production (Vercel), absolute URL in development
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createCampaign = async (campaign: Campaign): Promise<Campaign> => {
  const response = await api.post<{ campaign: Campaign; message: string }>('/campaigns', campaign);
  return response.data.campaign;
};

export const getAllCampaigns = async (): Promise<Campaign[]> => {
  const response = await api.get<{ campaigns: Campaign[] }>('/campaigns');
  return response.data.campaigns;
};



