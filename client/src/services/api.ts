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
  try {
    const response = await api.post<{ campaign: Campaign; message: string }>('/campaigns', campaign);
    return response.data.campaign;
  } catch (error: any) {
    if (error.response) {
      // Server responded with error
      throw new Error(error.response.data?.error || error.response.data?.message || 'Failed to create campaign');
    } else if (error.request) {
      // Request made but no response
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
};

export const getAllCampaigns = async (): Promise<Campaign[]> => {
  try {
    const response = await api.get<{ campaigns: Campaign[] }>('/campaigns');
    return response.data.campaigns;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.error || error.response.data?.message || 'Failed to fetch campaigns');
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
};



