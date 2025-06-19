// src/components/MessageBubble.tsx
import React from "react";
import type { Message } from "../types";
import ListingCard from "./ListingCard";

interface MessageBubbleProps {
  message: Message;
}
const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => (
  <div
    className={`flex ${message.isBot ? "justify-start" : "justify-end"} mb-4`}
  >
    <div
      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        message.isBot ? "bg-gray-100 text-gray-800" : "bg-blue-600 text-white"
      }`}
    >
      <p className="text-sm">{message.text}</p>
      {message.listings && message.listings.length > 0 && (
        <div className="mt-3">
          {message.listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
      <p
        className={`text-xs mt-1 ${
          message.isBot ? "text-gray-500" : "text-blue-100"
        }`}
      >
        {message.timestamp.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  </div>
);

export default MessageBubble;
