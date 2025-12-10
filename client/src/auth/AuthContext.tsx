import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  user: { username: string; id: string; role: 'admin' | 'user' } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_token');
  });
  const [user, setUser] = useState<{ username: string; id: string; role: 'admin' | 'user' } | null>(null);

  useEffect(() => {
    if (token) {
      // Decode JWT (simplified - in production use a proper JWT library)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ 
          username: payload.username, 
          id: payload.sub,
          role: payload.role || 'user'
        });
      } catch (e) {
        console.error('Failed to decode token:', e);
        setToken(null);
        localStorage.removeItem('auth_token');
      }
    } else {
      setUser(null);
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    // Call your auth endpoint
    const response = await fetch('http://localhost:4000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    setToken(data.token);
    localStorage.setItem('auth_token', data.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: !!token,
      login,
      logout,
      user,
    }),
    [token, user]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
