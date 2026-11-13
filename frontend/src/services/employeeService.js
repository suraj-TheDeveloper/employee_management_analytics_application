import apiClient from "./apiClient";
import { cleanParams } from "./params";

export const employeeService = {
  async list(params, signal) {
    const { data } = await apiClient.get("/employees", { params: cleanParams(params), signal });
    return data;
  },

  async get({ id }, signal) {
    const { data } = await apiClient.get(`/employees/${id}`, { signal });
    return data;
  },

  // params is unused; it keeps the (params, signal) shape that useFetch expects
  async getMine(_params, signal) {
    const { data } = await apiClient.get("/employees/me", { signal });
    return data;
  },

  async create(payload) {
    const { data } = await apiClient.post("/employees", payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await apiClient.put(`/employees/${id}`, payload);
    return data;
  },

  async changeStatus(id, status) {
    const { data } = await apiClient.patch(`/employees/${id}/status`, { status });
    return data;
  },

  async updateMine(payload) {
    const { data } = await apiClient.patch("/employees/me", payload);
    return data;
  },
};