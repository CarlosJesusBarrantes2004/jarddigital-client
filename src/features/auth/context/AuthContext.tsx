import { createContext } from "react";
import type { Branch, User } from "../types";

interface AuthContextType {
  user: User | null;
  currentBranch: { id: number; name: string } | null;
  currentModality: { id: number; name: string } | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  selectBranch: (branch: Branch) => void;
  checkAuth: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
