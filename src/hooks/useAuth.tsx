import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  selectProfile: (profile: Profile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if logged in on mount
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setUser(data);
          // Try to load last selected profile from localStorage
          const savedProfile = localStorage.getItem('stellar_stream_profile');
          if (savedProfile) {
            setProfile(JSON.parse(savedProfile));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setProfile(null);
    localStorage.removeItem('stellar_stream_profile');
  };

  const selectProfile = (p: Profile) => {
    setProfile(p);
    localStorage.setItem('stellar_stream_profile', JSON.stringify(p));
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, selectProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
