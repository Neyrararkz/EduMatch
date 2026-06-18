import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  type LoginInput,
  type RegisterInput,
} from "../shared/api/auth";
import {
  clearStoredTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredTokens,
} from "../shared/api/token-storage";
import type { User } from "../shared/types/auth";

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    getStoredAccessToken()
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCurrentUser() {
      const storedAccessToken = getStoredAccessToken();

      if (!storedAccessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await getMe(storedAccessToken);
        setUser(response.user);
        setAccessToken(getStoredAccessToken());
      } catch {
        clearStoredTokens();
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadCurrentUser();
  }, [accessToken]);

  async function login(input: LoginInput) {
    const response = await loginRequest(input);

    setStoredTokens(response.accessToken, response.refreshToken);

    setAccessToken(response.accessToken);
    setUser(response.user);
  }

  async function register(input: RegisterInput) {
    const response = await registerRequest(input);

    setStoredTokens(response.accessToken, response.refreshToken);

    setAccessToken(response.accessToken);
    setUser(response.user);
  }

  async function logout() {
    const refreshToken = getStoredRefreshToken();

    try {
      if (refreshToken) {
        await logoutRequest(refreshToken);
      }
    } finally {
      clearStoredTokens();
      setAccessToken(null);
      setUser(null);
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated: Boolean(user && accessToken),
      login,
      register,
      logout,
    }),
    [user, accessToken, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}