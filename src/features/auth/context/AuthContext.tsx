import { createContext } from "react";

import type { ActiveWorkspace, User, Workspace } from "../types";

export interface AuthContextValue {
  user: User | null;
  activeWorkspace: ActiveWorkspace | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  updateCurrentUser: (updatedData: Partial<User>) => void;
  selectWorkspace: (workspace: Workspace) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
