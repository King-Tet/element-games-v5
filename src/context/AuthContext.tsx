'use client'; // This context will be used in client components

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User, // Import the User type from firebase/auth
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config'; // Import your initialized auth instance

interface AuthContextType {
  user: User | null; // Use the specific User type
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start loading until auth state is confirmed

  useEffect(() => {
    // Listener for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Set user to the logged-in user or null
      setLoading(false); // Auth state determined, stop loading
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once on mount

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true); // Optionally set loading during sign-in process
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle setting the user state
    } catch (error) {
      console.error("Error signing in with Google:", error);
      // Handle specific errors (e.g., popup closed, network error) if needed
      setLoading(false); // Ensure loading is reset on error
    }
    // setLoading(false); // loading will be set to false by onAuthStateChanged
  };

  const signOutUser = async () => {
    try {
      setLoading(true); // Optionally set loading during sign-out
      await signOut(auth);
      // onAuthStateChanged will handle setting the user state to null
    } catch (error) {
      console.error("Error signing out:", error);
      setLoading(false); // Ensure loading is reset on error
    }
     // setLoading(false); // loading will be set to false by onAuthStateChanged
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOutUser,
  };

  // Provide the context value to children components
  // Don't render children until initial loading is complete to prevent layout shifts
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};