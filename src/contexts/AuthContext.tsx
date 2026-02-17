import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getData, setData, STORAGE_KEYS, initializeData } from '@/lib/data';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  register: (email: string, password: string, name: string, role: 'patient' | 'doctor') => Promise<{ success: boolean; message: string; session?: any; user?: any }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session key used in sessionStorage (survives page refresh, cleared on tab close)
const SESSION_USER_KEY = 'medicare_session_user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // Initialize mock data
    initializeData();

    // Clear any old localStorage session (we now use sessionStorage only)
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);

    // Check sessionStorage for current session (survives page refresh, cleared on tab close)
    const sessionUserStr = sessionStorage.getItem(SESSION_USER_KEY);
    if (sessionUserStr) {
      try {
        const sessionUser = JSON.parse(sessionUserStr) as User;
        setUser(sessionUser);
        setLoading(false);
        return;
      } catch {
        sessionStorage.removeItem(SESSION_USER_KEY);
      }
    }

    // Check active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email!);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email!);
      } else {
        // Only clear if not using session user
        const currentSession = sessionStorage.getItem(SESSION_USER_KEY);
        if (!currentSession) {
          setUser(null);
        }
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        const userData: User = {
          id: data.id,
          email: data.email || email,
          name: data.full_name,
          role: data.role as 'patient' | 'doctor' | 'admin',
          password: '',
        };
        setUser(userData);
        sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback
      const fallbackUser = {
        id: userId,
        email: email,
        name: email.split('@')[0],
        role: 'patient' as const,
        password: ''
      };
      setUser(fallbackUser);
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(fallbackUser));
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    // 1. Try Mock Login first (since Supabase is broken/unreachable for this demo)
    const users = getData<User[]>(STORAGE_KEYS.USERS, []);
    const mockUser = users.find(u => u.email === email && u.password === password);

    if (mockUser) {
      setUser(mockUser);
      // Persist in sessionStorage (survives refresh, cleared on tab close)
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(mockUser));
      return { success: true, message: 'Login successful (Mock Mode)!', user: mockUser };
    }

    // 2. Try Supabase Login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Login successful!' };
  };

  const register = async (email: string, password: string, name: string, role: 'patient' | 'doctor') => {
    // Mock Registration Fallback (Optional, but good for completeness)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          full_name: name,
          role,
          avatar_url: '',
          phone: '',
          address: '',
        },
      },
    });

    if (error) {
      console.error('Supabase signup error:', error);

      // MOCK REGISTRATION FALLBACK
      // Generate a random ID for the new user
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        password, // In a real app, never store plain text passwords!
        name,
        role,
        phone: '',
        address: ''
      };

      // Save to local storage
      const existingUsers = getData<User[]>(STORAGE_KEYS.USERS, []);
      setData(STORAGE_KEYS.USERS, [...existingUsers, newUser]);

      // Auto-login
      setUser(newUser);
      // Persist in sessionStorage
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(newUser));

      return {
        success: true,
        message: 'Registration successful (Mock Mode)!',
        session: { user: newUser, access_token: 'mock-token' },
        user: newUser
      };
    }

    console.log('Registration successful:', data);
    return { success: true, message: 'Registration successful! Please check your email.', session: data.session, user: data.user };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    sessionStorage.removeItem(SESSION_USER_KEY);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {!loading && children}
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
