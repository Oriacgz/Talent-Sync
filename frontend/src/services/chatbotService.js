/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Unified chat service using /api/chat endpoints.
 *                 Handles both onboarding and career assistant modes.
 * DEPENDS ON: api.js
 */
import apiClient from "./api";

export const chatbotService = {
  /**
   * Send a message to the unified chat endpoint.
   * @param {string} message - User message text
   * @param {string|null} sessionId - Existing session ID (null for new session)
   * @returns {Promise<{response: string, session_id: string, mode: string, onboarding_step?: string, profile_complete: boolean, intent?: string}>}
   */
  sendMessage: async (message, sessionId = null, options = {}) => {
    try {
      const payload = { message };
      if (sessionId) {
        payload.session_id = sessionId;
      }
      if (options?.forceAssistant) {
        payload.force_assistant = true;
      }
      const response = await apiClient.post("/api/chat", payload);
      return response?.data || {
        response: "No response available.",
        session_id: null,
        mode: "ONBOARDING",
        profile_complete: false,
      };
    } catch {
      // Always throw so the caller (CareerAIPanel) can render a clean error state.
      // Never leak raw error text like "Network Error" to the UI.
      throw new Error('OFFLINE')
    }
  },

  /**
   * Alias for backward compatibility — same as sendMessage.
   */
  sendMessageContextual: async (message, sessionId = null) => {
    return chatbotService.sendMessage(message, sessionId);
  },

  /**
   * Fetch chat history for a specific session.
   * @param {string} sessionId
   * @param {number} skip
   * @param {number} limit
   */
  getHistory: async (sessionId, skip = 0, limit = 50) => {
    try {
      const response = await apiClient.get(
        `/api/chat/history/${sessionId}?skip=${skip}&limit=${limit}`
      );
      return response?.data || { messages: [], total: 0 };
    } catch {
      return { messages: [], total: 0 };
    }
  },

  /**
   * List all chat sessions for the current user.
   */
  getSessions: async () => {
    try {
      const response = await apiClient.get("/api/chat/sessions");
      return response?.data?.sessions || [];
    } catch {
      return [];
    }
  },

  /**
   * Create a fresh chat session (resets onboarding).
   */
  resetSession: async () => {
    try {
      const response = await apiClient.post("/api/chat/reset");
      return response?.data || null;
    } catch {
      return null;
    }
  },
};