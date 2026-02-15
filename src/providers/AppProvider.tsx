import { AuthProvider } from "@/features/auth/context/AuthProvider";

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  return <AuthProvider>{children}</AuthProvider>;
};
