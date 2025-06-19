import type { UserPreferences, RealEstateListing } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

export const sendMessageToDatabricks = async (message: string, preferences: UserPreferences) => {
  // Create messages array for the new API format
  const messages = [
    {
      role: 'user',
      content: message
    }
  ];

  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error);
  }
  
  // Extract the assistant's response from the Databricks response
  const databricksResponse = data.response;
  if (databricksResponse.messages && databricksResponse.messages.length > 0) {
    const lastMessage = databricksResponse.messages[databricksResponse.messages.length - 1];
    return lastMessage.content || "I received your message, let me help you find properties.";
  }
  
  return "Thanks for that information! Let me help you find the perfect property.";
};

export const getListingsFromDatabricks = async (preferences: UserPreferences): Promise<RealEstateListing[]> => {
  // Create the exact message format you specified
  const searchMessage = `I'm looking for properties in ${preferences.area} and I'm a ${preferences.persona}`;

  const messages = [
    {
      role: 'user',
      content: searchMessage
    }
  ];

  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error);
  }
  
  // Return mock listings since the LLM response needs to be parsed
  // TODO: Parse the LLM response to extract actual property data
  return [
    {
      id: '1',
      address: `Property in ${preferences.area}`,
      price: 450000,
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1800,
      imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400',
      description: `Perfect for a ${preferences.persona} lifestyle in ${preferences.area}`
    },
    {
      id: '2',
      address: `Another property in ${preferences.area}`,
      price: 325000,
      bedrooms: 1,
      bathrooms: 1.5,
      sqft: 1200,
      imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400',
      description: `Great match for ${preferences.persona} in ${preferences.area}`
    }
  ];
};