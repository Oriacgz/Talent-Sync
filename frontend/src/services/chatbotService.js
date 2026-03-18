/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Send chat message to Ollama LLM via backend,
 *                 reset chat session
 * DEPENDS ON: api.js
 */
import apiClient from "./api";
export const chatbotService = {
  sendMessage: (message, history) => {},
  resetSession: () => {},
};