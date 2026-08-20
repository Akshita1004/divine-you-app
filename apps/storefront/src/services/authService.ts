import API from "@/lib/api";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: UserProfile;
  requiresOtp?: boolean;
}

export const authService = {
  // 1. Login with Email & Password
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await API.post("/users/login", credentials);
    return response.data;
  },

  // 2. Register with Name, Email & Password
  register: async (userData: { name: string; email: string; password: string }): Promise<AuthResponse> => {
    const response = await API.post("/users/register", userData);
    return response.data;
  },

  // 3. Send OTP
  sendOtp: async (email: string, name?: string): Promise<AuthResponse> => {
    const response = await API.post("/users/send-otp", { email, name });
    return response.data;
  },

  // 4. Verify OTP
  verifyOtp: async (payload: { email: string; otp: string }): Promise<AuthResponse> => {
    const response = await API.post("/users/verify-otp", payload);
    return response.data;
  },

  // 5. Logout Helper (Clears local tokens)
  logout: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  // 6. Helper to get stored user from LocalStorage
  getStoredUser: (): UserProfile | null => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch (err) {
      console.error("Error reading stored user:", err);
      return null;
    }
  },
};

export default authService;