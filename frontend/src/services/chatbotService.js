/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Send chat message to Gemini-backed chatbot via backend,
 *                 reset chat session
 * DEPENDS ON: api.js
 */
import apiClient from "./api";
import { resolveData } from "./mockRuntime";

export const chatbotService = {
  sendMessage: async (message, history = []) => resolveData({
    apiCall: async () => {
      const response = await apiClient.post("/chatbot/message", { message, history });
      return response?.data || { response: "", profile_complete: false };
    },
    mockFile: "students.js",
    mockExport: "chatbotMockResponse",
    fallbackValue: {
      response: "I am currently offline. You can still continue editing your profile manually.",
      profile_complete: false,
    },
  }),

  sendMessageContextual: async (message, history = [], context = null) => {
    try {
      const response = await apiClient.post("/chatbot/message-context", { message, history, context });
      if (response?.data) {
        return response.data;
      }
    } catch {
      // Fall through to the legacy endpoint for compatibility.
    }

    return chatbotService.sendMessage(message, history);
  },

  resetSession: async () => {
    const response = await apiClient.post("/chatbot/reset");
    return response?.data;
  },
};