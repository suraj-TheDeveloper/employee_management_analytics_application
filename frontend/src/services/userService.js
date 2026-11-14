import apiClient from "./apiClient";
import { cleanParams } from "./params";

export const userService = {
  async list(params, signal) {
    const { data } = await apiClient.get("/users", { params: cleanParams(params), signal });
    return data;
  },

  // params is unused; it keeps the (params, signal) shape that useFetch expects
  async listRoles(_params, signal) {
    const { data } = await apiClient.get("/roles", { signal });
    return data; // plain array: [{ id, name, description }]
  },

  async create(payload) {
    const { data } = await apiClient.post("/users", payload);
    return data;
  },

  async setStatus(id, isActive) {
    const { data } = await apiClient.patch(`/users/${id}/status`, { is_active: isActive });
    return data;
  },

  async setRole(id, roleId) {
    const { data } = await apiClient.patch(`/users/${id}/role`, { role_id: roleId });
    return data;
  },
};