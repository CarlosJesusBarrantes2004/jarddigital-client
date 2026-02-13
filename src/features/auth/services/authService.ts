import { api } from "@/api/axios";

export const authService = {
  login: async (credentials: any) => {
    const { data } = await api.post("/token/", credentials);
    return data;
  },

  getUserProfile: async () => {
    const { data } = await api.get("/users/me/");
    return data;
  },

  logout: async () => {
    await api.post("/users/logout/");
  },
};
