import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Home, MapPin, DollarSign, Bed, Bath, Square } from 'lucide-react';
import { sendMessageToDatabricks, getListingsFromDatabricks } from './services/Api';

// Types
interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  listings?: RealEstateListing[];
}

interface RealEstateListing {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  imageUrl: string;
  description: string;
}

interface UserPreferences {
  area: string;
  persona: string;
}

// Components
const LoadingIndicator: React.FC = () => (
  <div className="flex items-center gap-2 text-gray-600">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span className="text-sm">Thinking...</span>
  </div>
);

const ListingCard: React.FC<{ listing: RealEstateListing }> = ({ listing }) => (
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

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => (
  <div className={`flex ${message.isBot ? 'justify-start' : 'justify-end'} mb-4`}>
    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
      message.isBot 
        ? 'bg-gray-100 text-gray-800' 
        : 'bg-blue-600 text-white'
    }`}>
      <p className="text-sm">{message.text}</p>
      {message.listings && message.listings.length > 0 && (
        <div className="mt-3">
          {message.listings.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
      <p className={`text-xs mt-1 ${message.isBot ? 'text-gray-500' : 'text-blue-100'}`}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  </div>
);

const ChatInput: React.FC<{ 
  onSendMessage: (message: string) => void; 
  disabled: boolean 
}> = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type your message..."
        disabled={disabled}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !input.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
};

// Main App Component
const RealEstateChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm here to help you find your perfect home. Let's start with a quick question. Which area are you interested in?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    area: '',
    persona: ''
  });
  const [questionStep, setQuestionStep] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const questions = [
    { key: 'area' as keyof UserPreferences, text: "Which area are you interested in?" },
    { key: 'persona' as keyof UserPreferences, text: "What's your persona or lifestyle? (e.g., city extrovert, quiet family person, young professional, etc.)" }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (text: string, isBot: boolean, listings?: RealEstateListing[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isBot,
      timestamp: new Date(),
      listings
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async (message: string) => {
    // Add user message
    addMessage(message, false);
    setIsLoading(true);

    try {
      if (questionStep < questions.length) {
        // Update preferences
        const currentQuestion = questions[questionStep];
        const updatedPreferences = {
          ...userPreferences,
          [currentQuestion.key]: message
        };
        setUserPreferences(updatedPreferences);

        if (questionStep < questions.length - 1) {
          // Move to next question
          const nextQuestion = questions[questionStep + 1];
          addMessage(nextQuestion.text, true);
          setQuestionStep(questionStep + 1);
        } else {
          // Both questions answered, send to Databricks
          addMessage("Perfect! Let me search for properties that match your criteria...", true);
          
          // Create the formatted message for Databricks
          const searchMessage = `I'm looking for properties in ${updatedPreferences.area} and I'm a ${updatedPreferences.persona}`;
          
          try {
            const response = await sendMessageToDatabricks(searchMessage, updatedPreferences);
            addMessage(response, true);
            
            // Remove the listings call - no property cards will be shown
            // const listings = await getListingsFromDatabricks(updatedPreferences);
            // if (listings && listings.length > 0) {
            //   addMessage("Here are some properties I found for you:", true, listings);
            // }
          } catch (error) {
            console.error('Error fetching from Databricks:', error);
            addMessage("I found your preferences! Based on your interest in " + updatedPreferences.area + " and being a " + updatedPreferences.persona + ", I can help you find suitable properties. Let me know if you have any specific questions!", true);
          }
        }
      } else {
        // Handle follow-up questions after both questions are answered
        const response = await sendMessageToDatabricks(message, userPreferences);
        addMessage(response, true);
      }
    } catch (error) {
      console.error('Error:', error);
      addMessage("I'm having trouble connecting to our property database right now, but I can still help you with general advice about your area and preferences!", true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Real Estate Assistant</h1>
            <p className="text-sm text-gray-600">Find your perfect home with AI</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
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

      {/* Input Area */}
      <div className="bg-white border-t px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default RealEstateChatbot;