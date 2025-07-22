
// src/hooks/use-auth.ts
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserById } from "@/services/user-service"; // We need a way to validate the user
import type { User } from "@/lib/db/schema";
import { getUserByCredentials } from "@/services/user-service";

const SESSION_KEY = "finsarthi_session_userId";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      setIsLoading(true);
      const storedUserId = localStorage.getItem(SESSION_KEY);
      if (storedUserId) {
        try {
          const fetchedUser = await getUserById(storedUserId);
          if (fetchedUser) {
            setUser(fetchedUser);
          } else {
            // Clear invalid session
            localStorage.removeItem(SESSION_KEY);
          }
        } catch (error) {
          console.error("Failed to fetch user from session:", error);
          localStorage.removeItem(SESSION_KEY);
        }
      }
      setIsLoading(false);
    }
    checkAuth();
  }, []);

  const login = async (email: string, password_hash: string, role: 'customer' | 'coach'): Promise<User | null> => {
    setIsLoading(true);
    try {
      const loggedInUser = await getUserByCredentials(email, password_hash, role);
      if (loggedInUser) {
        localStorage.setItem(SESSION_KEY, loggedInUser.id);
        setUser(loggedInUser);
        setIsLoading(false);
        return loggedInUser;
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
    setIsLoading(false);
    return null;
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };
}
