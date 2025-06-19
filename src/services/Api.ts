import type { UserPreferences, RealEstateListing } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

export const sendMessageToDatabricks = async (message: string, preferences: UserPreferences) => {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      user_preferences: preferences,
      session_id: 'user-session-123'
    })
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error);
  }
  
  return data.response;
};

export const getListingsFromDatabricks = async (preferences: UserPreferences): Promise<RealEstateListing[]> => {
  const response = await fetch(`${API_BASE_URL}/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      budget: preferences.budget,
      location: preferences.location,
      property_type: preferences.propertyType,
      bedrooms: preferences.bedrooms
    })
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error);
  }
  
  return data.listings;
};