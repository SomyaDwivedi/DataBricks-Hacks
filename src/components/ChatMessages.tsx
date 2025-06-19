
// src/components/ChatMessages.tsx
import React from 'react';
import type { Message } from '../types';
import MessageBubble from './MessageBubble';
import LoadingIndicator from './LoadingIndicator';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}
const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, isLoading, messagesEndRef }) => (
  <div className="flex-1 overflow-y-auto px-6 py-4">
    <div className="max-w-4xl mx-auto">
      {messages.map(message => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isLoading && (
        <div className="flex justify-start mb-4">
          <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100">
            <LoadingIndicator />
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  </div>
);

export default ChatMessages;
