// src/components/ListingCard.tsx
import React from "react";
import { MapPin, DollarSign, Bed, Bath, Square } from "lucide-react";
import type { RealEstateListing } from "../types";

interface ListingCardProps {
  listing: RealEstateListing;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden mb-3 max-w-sm">
    <img
      src={listing.imageUrl}
      alt={listing.address}
      className="w-full h-48 object-cover"
    />
    <div className="p-4">
      <div className="flex items-center gap-1 text-green-600 font-bold text-lg mb-2">
        <DollarSign className="w-5 h-5" />
        {listing.price.toLocaleString()}
      </div>
      <div className="flex items-center gap-1 text-gray-700 mb-2">
        <MapPin className="w-4 h-4" />
        <span className="text-sm">{listing.address}</span>
      </div>
      <div className="flex items-center gap-4 text-gray-600 text-sm mb-3">
        <div className="flex items-center gap-1">
          <Bed className="w-4 h-4" />
          {listing.bedrooms} bed
        </div>
        <div className="flex items-center gap-1">
          <Bath className="w-4 h-4" />
          {listing.bathrooms} bath
        </div>
        <div className="flex items-center gap-1">
          <Square className="w-4 h-4" />
          {listing.sqft} sqft
        </div>
      </div>
      <p className="text-gray-700 text-sm">{listing.description}</p>
    </div>
  </div>
);

export default ListingCard;
