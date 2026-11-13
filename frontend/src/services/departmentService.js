import apiClient from "./apiClient";
import { cleanParams } from "./params";

export const departmentService = {
  async list(params, signal) {
    const { data } = await apiClient.get("/departments", {
      params: cleanParams(params),
      signal,
    });
    return data; // { items, total, page, page_size }
  },

  async create(payload) {
    const { data } = await apiClient.post("/departments", payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await apiClient.put(`/departments/${id}`, payload);
    return data;
  },
};