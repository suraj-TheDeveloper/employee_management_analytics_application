import apiClient from "./apiClient";
import { cleanParams } from "./params";

export const designationService = {
  async list(params, signal) {
    const { data } = await apiClient.get("/designations", {
      params: cleanParams(params),
      signal,
    });
    return data;
  },
};