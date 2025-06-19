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
      text: "Hi! I'm here to help you find your perfect home. Let's start with a quick question. Which area are you interested in?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    area: "",
    persona: "",
  });
  const [questionStep, setQuestionStep] = useState(0);

  const questions = [
    {
      key: "area" as keyof UserPreferences,
      text: "Which area are you interested in?",
    },
    {
      key: "persona" as keyof UserPreferences,
      text: "What's your persona or lifestyle? (e.g., city extrovert, quiet family person, young professional, etc.)",
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

        if (questionStep < questions.length - 1) {
          // Move to next question
          const nextQuestion = questions[questionStep + 1];
          addMessage(nextQuestion.text, true);
          setQuestionStep(questionStep + 1);
        } else {
          // Both questions answered, send to Databricks
          addMessage(
            "Perfect! Let me search for properties that match your criteria...",
            true
          );

          // Create the formatted message for Databricks
          const searchMessage = `I'm looking for properties in ${updatedPreferences.area} and I'm a ${updatedPreferences.persona}`;

          try {
            const response = await sendMessageToDatabricks(
              searchMessage,
              updatedPreferences
            );
            addMessage(response, true);

            // Remove listings call - no property cards will be shown
            // const listings = await getListingsFromDatabricks(updatedPreferences);
            // if (listings && listings.length > 0) {
            //   addMessage(
            //     "Here are some properties I found for you:",
            //     true,
            //     listings
            //   );
            // }
          } catch (error) {
            console.error("Error fetching from Databricks:", error);
            addMessage(
              "I found your preferences! Based on your interest in " +
                updatedPreferences.area +
                " and being a " +
                updatedPreferences.persona +
                ", I can help you find suitable properties. Let me know if you have any specific questions!",
              true
            );
          }
        }
      } else {
        // Handle follow-up questions after both questions are answered
        const response = await sendMessageToDatabricks(message, userPreferences);
        addMessage(response, true);
      }
    } catch (error) {
      console.error("Error:", error);
      addMessage(
        "I'm having trouble connecting to our property database right now, but I can still help you with general advice about your area and preferences!",
        true
      );
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