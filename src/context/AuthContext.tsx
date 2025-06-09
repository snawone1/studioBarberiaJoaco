
'use client';

import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  type User, 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  type AuthError
} from 'firebase/auth';
import { auth, firestore } from '@/lib/firebase'; // Import firestore
import { doc, setDoc } from 'firebase/firestore'; // Import doc and setDoc
import { type LoginFormData, type RegisterFormData } from '@/lib/schemas';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (data: RegisterFormData) => Promise<User | AuthError | null>;
  login: (data: LoginFormData) => Promise<User | AuthError | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function signup(data: RegisterFormData): Promise<User | AuthError | null> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      if (user) {
        // Save additional user data to Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        const userData = {
          uid: user.uid,
          email: user.email,
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          createdAt: new Date().toISOString(), // Good practice to store creation date
        };

        console.log("Attempting to save user data to Firestore:", userData);
        try {
          await setDoc(userDocRef, userData);
          console.log("User data successfully saved to Firestore for UID:", user.uid);
        } catch (firestoreError: any) {
          console.error("Error saving user data to Firestore:", firestoreError);
          // Optionally, you might want to handle this error more gracefully,
          // e.g., by deleting the Firebase Auth user if Firestore write fails,
          // or by returning a specific error object.
          // For now, we'll just log it and return the auth error object if it exists, or a new one.
          return { code: 'firestore/save-error', message: `User created in Auth, but failed to save data to Firestore: ${firestoreError.message}` } as AuthError;
        }
      }
      return user;
    } catch (error) {
      console.error("Error signing up with Firebase Auth:", error);
      return error as AuthError;
    }
  }

  async function login(data: LoginFormData): Promise<User | AuthError | null> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      return userCredential.user;
    } catch (error) {
      console.error("Error logging in:", error);
      return error as AuthError;
    }
  }

  async function logout() {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe; // Unsubscribe on unmount
  }, []);

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
