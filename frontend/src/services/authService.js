import apiClient from "./apiClient";

export const authService = {
  async login(email, password) {
    // FastAPI's OAuth2 login expects form fields, not JSON, and calls the email "username"
    const body = new URLSearchParams({ username: email, password });
    const { data } = await apiClient.post("/auth/login", body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return data.access_token;
  },

  async getMe() {
    const { data } = await apiClient.get("/auth/me");
    return data;
  },
};