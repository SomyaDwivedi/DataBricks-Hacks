// src/types/index.ts
export interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  listings?: RealEstateListing[];
}

export interface RealEstateListing {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  imageUrl: string;
  description: string;
}

export interface UserPreferences {
  area: string;
  persona: string;
}