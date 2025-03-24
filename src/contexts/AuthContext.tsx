import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define user roles
export type UserRole = 'admin' | 'user';

// Define user interface
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

// Define context type
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isAuthenticated: false,
  isAdmin: false,
});

// Sample user database (in a real app, this would be on the server)
const USERS: Record<string, User & { password: string }> = {
  'admin@example.com': {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
  },
  'user@example.com': {
    id: '2',
    username: 'user',
    email: 'user@example.com',
    password: 'user123',
    role: 'user',
  },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Try to get user from localStorage on initial load
  const storedUser = localStorage.getItem('user');
  const [user, setUser] = useState<User | null>(storedUser ? JSON.parse(storedUser) : null);

  const login = async (email: string, password: string): Promise<void> => {
    // In a real app, this would be an API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const foundUser = USERS[email];
        
        if (foundUser && foundUser.password === password) {
          // Remove password before storing in state
          const { password, ...userWithoutPassword } = foundUser;
          setUser(userWithoutPassword);
          localStorage.setItem('user', JSON.stringify(userWithoutPassword));
          resolve();
        } else {
          reject(new Error('Invalid email or password'));
        }
      }, 500); // Simulate network delay
    });
  };

  const register = async (username: string, email: string, password: string): Promise<void> => {
    // In a real app, this would be an API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (USERS[email]) {
          reject(new Error('Email already registered'));
          return;
        }
        
        // Create new user
        const newUser = {
          id: `${Object.keys(USERS).length + 1}`,
          username,
          email,
          password,
          role: 'user' as UserRole, // New registrations default to 'user' role
        };
        
        // Update "database"
        USERS[email] = newUser;
        
        // Login the user
        const { password: _, ...userWithoutPassword } = newUser;
        setUser(userWithoutPassword);
        localStorage.setItem('user', JSON.stringify(userWithoutPassword));
        resolve();
      }, 500); // Simulate network delay
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: user !== null,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);