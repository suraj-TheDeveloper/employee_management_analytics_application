import apiClient from "./apiClient";
import { cleanParams } from "./params";

export const leaveService = {
  async list(params, signal) {
    const { data } = await apiClient.get("/leaves", { params: cleanParams(params), signal });
    return data;
  },

  async create(payload) {
    const { data } = await apiClient.post("/leaves", payload);
    return data;
  },

  async review(id, payload) {
    const { data } = await apiClient.patch(`/leaves/${id}/review`, payload);
    return data;
  },
};