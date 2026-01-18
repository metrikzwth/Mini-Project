import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getData, setData, STORAGE_KEYS, initializeData } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; message: string; user?: User };
  register: (email: string, password: string, name: string, role: 'patient' | 'doctor') => { success: boolean; message: string };
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    initializeData();
    const storedUser = getData<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const login = (email: string, password: string) => {
    const users = getData<User[]>(STORAGE_KEYS.USERS, []);
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (foundUser) {
      setUser(foundUser);
      setData(STORAGE_KEYS.CURRENT_USER, foundUser);
      return { success: true, message: 'Login successful!', user: foundUser };
    }
    
    return { success: false, message: 'Invalid email or password' };
  };

  const register = (email: string, password: string, name: string, role: 'patient' | 'doctor') => {
    const users = getData<User[]>(STORAGE_KEYS.USERS, []);
    
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, message: 'Email already registered' };
    }
    
    const newUser: User = {
      id: `${role[0]}${Date.now()}`,
      email,
      password,
      name,
      role
    };
    
    users.push(newUser);
    setData(STORAGE_KEYS.USERS, users);
    setUser(newUser);
    setData(STORAGE_KEYS.CURRENT_USER, newUser);
    
    return { success: true, message: 'Registration successful!' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
