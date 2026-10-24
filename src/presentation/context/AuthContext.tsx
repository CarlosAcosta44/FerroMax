'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/infrastructure/db/supabaseClient';
import { SupabaseAuthRepository } from '@/infrastructure/repositories/SupabaseAuthRepository';
import { UserProfile, UserRole } from '@/domain/entities/UserProfile';
import { SignUpDTO, SignInDTO } from '@/domain/repositories/IAuthRepository';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  signIn: (dto: SignInDTO) => Promise<{ user: any; profile: UserProfile }>;
  signUp: (dto: SignUpDTO) => Promise<{ user: any; profile: UserProfile }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const authRepo = useMemo(() => new SupabaseAuthRepository(), []);

  const fetchSessionAndProfile = async () => {
    try {
      const sessionData = await authRepo.getCurrentSession();
      setUser(sessionData.user);
      setProfile(sessionData.profile);
    } catch (err) {
      console.error('Error loading initial auth session:', err);
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
        const prof = await authRepo.getProfile(session.user.id, session.user);
        setProfile(prof);
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [authRepo]);

  const signIn = async (dto: SignInDTO) => {
    setIsLoading(true);
    try {
      const result = await authRepo.signIn(dto);
      setUser({
        id: result.user.id,
        email: result.user.email || dto.email,
      });
      setProfile(result.profile);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (dto: SignUpDTO) => {
    setIsLoading(true);
    try {
      const result = await authRepo.signUp(dto);
      if (result.user) {
        setUser({
          id: result.user.id,
          email: result.user.email || dto.email,
        });
        setProfile(result.profile);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await authRepo.signOut();
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const prof = await authRepo.getProfile(user.id);
      setProfile(prof);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role || null,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
