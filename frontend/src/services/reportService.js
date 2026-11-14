import apiClient from "./apiClient";
import { cleanParams } from "./params";

export const reportService = {
  async summary(params, signal) {
    const { data } = await apiClient.get("/reports/summary", { params: cleanParams(params), signal });
    return data;
  },
};