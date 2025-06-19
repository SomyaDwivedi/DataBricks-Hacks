// src/hooks/useChatbot.ts
import { useState } from "react";
import type { Message, UserPreferences, RealEstateListing } from "../types";
import {
  sendMessageToDatabricks,
  getListingsFromDatabricks,
} from "../services/Api";

export const useChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm here to help you find your perfect home. Let's start with a few questions. What's your budget range?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    budget: "",
    location: "",
    propertyType: "",
    bedrooms: "",
  });
  const [questionStep, setQuestionStep] = useState(0);

  const questions = [
    {
      key: "budget" as keyof UserPreferences,
      text: "What's your budget range?",
    },
    {
      key: "location" as keyof UserPreferences,
      text: "Which area or neighborhood are you interested in?",
    },
    {
      key: "propertyType" as keyof UserPreferences,
      text: "What type of property are you looking for? (house, condo, apartment, etc.)",
    },
    {
      key: "bedrooms" as keyof UserPreferences,
      text: "How many bedrooms do you need?",
    },
  ];

  const addMessage = (
    text: string,
    isBot: boolean,
    listings?: RealEstateListing[]
  ) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isBot,
      timestamp: new Date(),
      listings,
    };
    setMessages((prev) => [...prev, newMessage]);
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
          [currentQuestion.key]: message,
        };
        setUserPreferences(updatedPreferences);

        // Send to Databricks for processing
        await sendMessageToDatabricks(message, updatedPreferences);

        // Move to next question or show listings
        if (questionStep < questions.length - 1) {
          const nextQuestion = questions[questionStep + 1];
          addMessage(nextQuestion.text, true);
          setQuestionStep(questionStep + 1);
        } else {
          // All questions answered, fetch listings
          addMessage(
            "Perfect! Let me search for properties that match your criteria...",
            true
          );
          const listings = await getListingsFromDatabricks(updatedPreferences);
          addMessage(
            "Here are some properties I found for you:",
            true,
            listings
          );
        }
      } else {
        // Handle follow-up questions
        const response = await sendMessageToDatabricks(
          message,
          userPreferences
        );
        addMessage(response, true);
      }
    } catch (error) {
      console.error("Error:", error);
      addMessage("Sorry, I encountered an error. Please try again.", true);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    handleSendMessage,
  };
};
