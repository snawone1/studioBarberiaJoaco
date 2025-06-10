
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

// Function to normalize Argentinian phone numbers
function normalizeArgentinianPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters except a leading '+'
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    // If it already has a country code, assume it's correct or handled
    // For +549..., ensure it's just +54...
    if (cleaned.startsWith('+549')) {
      cleaned = '+54' + cleaned.substring(4);
    }
    return cleaned;
  }

  // Remove leading zeros if any, common in local inputs
  cleaned = cleaned.replace(/^0+/, '');

  // Typical lengths for Argentinian numbers without country code:
  // Area code (2-4 digits) + Number (6-8 digits) = Total 8-10 digits.
  // Mobile numbers often written as 10 digits (e.g., 1123456789) or 11 if '15' was used.
  // If it looks like a local Argentinian number (usually 10 digits, e.g. 11XXXXXXXX or 2XX XXXXXXX, or 2XXX XXXXXX)
  // or 8 digits for some regions.
  if (cleaned.length >= 8 && cleaned.length <= 11 && /^\d+$/.test(cleaned)) {
    // Prepend +54. If it's a mobile number like 11XXXXYYYY, some systems expect +54911XXXXYYYY.
    // For simplicity now, we'll just add +54.
    // If it starts with '15' (common old mobile prefix), remove it before adding +54,
    // as '+54 11...' is more standard than '+54 15...'.
     if (cleaned.startsWith('15') && (cleaned.length === 10 || cleaned.length === 11)) {
      cleaned = cleaned.substring(2); // Remove '15'
    }
    // If after removing '15', the number starts with a common area code (like 11, 221, 341 etc.)
    // and total length is now appropriate, prepend +54.
    // A simple heuristic: if it's 8-10 digits now, prepend +54.
    if (cleaned.length >= 8 && cleaned.length <= 10) {
       // For mobile numbers, it's common to add a '9' after '+54'.
       // Example: if number is 1123456789 (Buenos Aires mobile), it becomes +5491123456789
       // Let's check if it's likely a mobile number (e.g., starts with 11 for BA, or other mobile area codes)
       // This can get complex. A simpler approach:
       // If it's 10 digits, assume it's Area Code + Number (e.g. 11 XXXX XXXX or 261 XXX XXXX)
       // Let's try adding +54 directly for now and see.
       // If it's likely a mobile (e.g., 10 digits starting with 11, 15, or area codes that are mostly mobile)
       // For now, a general rule: if 10 digits, add '+549', otherwise '+54' for shorter numbers (might be landlines)
       if (cleaned.length === 10) {
         return '+549' + cleaned;
       }
       return '+54' + cleaned;
    }
  }
  // If no specific Argentinian rule matched, return the original cleaned number or original if it had '+'
  return phoneNumber.replace(/[^\d+]/g, '').startsWith('+') ? phoneNumber.replace(/[^\d+]/g, '') : cleaned;
}


export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function signup(data: RegisterFormData): Promise<User | AuthError | null> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      if (user) {
        const normalizedPhoneNumber = normalizeArgentinianPhoneNumber(data.phoneNumber);
        
        const userDocRef = doc(firestore, 'users', user.uid);
        const userData = {
          uid: user.uid,
          email: user.email,
          fullName: data.fullName,
          phoneNumber: normalizedPhoneNumber, // Use normalized number
          createdAt: new Date().toISOString(), 
        };

        console.log("Attempting to save user data to Firestore:", userData);
        try {
          await setDoc(userDocRef, userData);
          console.log("User data successfully saved to Firestore for UID:", user.uid);
        } catch (firestoreError: any) {
          console.error("Error saving user data to Firestore:", firestoreError);
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

