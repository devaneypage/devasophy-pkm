import { useState, useEffect, createContext, useContext, createElement } from "react";
import { api } from "@/lib/api";

interface User {
  id: number;
  email: string;
  name: string | null;
  role: string;
}

interface AuthCtx {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.auth.me().then((data: any) => {
      setUser(data.user);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.auth.login(email, password);
    setUser(data.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const data = await api.auth.register(email, password, name);
    setUser(data.user);
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
    window.location.reload();
  };

  const ctx: AuthCtx = { user, isLoading, login, register, logout };
  return createElement(AuthContext.Provider, { value: ctx }, children);
}

export const useAuth = () => useContext(AuthContext);
