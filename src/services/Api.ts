// src/services/databricksApi.ts
import type { UserPreferences, RealEstateListing } from "../types";

const mockApiCall = (delay: number = 1000) =>
  new Promise((resolve) => setTimeout(resolve, delay));

export const sendMessageToDatabricks = async (
  message: string,
  preferences: UserPreferences
) => {
  await mockApiCall(1500);
  // TODO: Replace with actual Databricks API call
  const payload = {
    message,
    user_preferences: preferences,
    session_id: "user-session-123",
  };
  console.log("Sending to Databricks:", payload);
  return "Thanks for that information! Let me help you find the perfect property.";
};

export const getListingsFromDatabricks = async (
  preferences: UserPreferences
): Promise<RealEstateListing[]> => {
  await mockApiCall(2000);
  // TODO: Replace with actual Databricks API call
  const payload = {
    budget: preferences.budget,
    location: preferences.location,
    property_type: preferences.propertyType,
    bedrooms: preferences.bedrooms,
  };
  console.log("Fetching listings from Databricks:", payload);

  // Mock listings data
  return [
    {
      id: "1",
      address: "123 Oak Street, Downtown",
      price: 450000,
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1800,
      imageUrl:
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
      description:
        "Beautiful modern home with updated kitchen and spacious backyard.",
    },
    {
      id: "2",
      address: "456 Pine Avenue, Suburbs",
      price: 325000,
      bedrooms: 2,
      bathrooms: 1.5,
      sqft: 1200,
      imageUrl:
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400",
      description:
        "Cozy starter home in quiet neighborhood with great schools nearby.",
    },
  ];
};
