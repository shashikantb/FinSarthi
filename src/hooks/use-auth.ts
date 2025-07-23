
"use client";

import { useState, useEffect } from "react";
import { getUserById, findUserByEmailOrPhone } from "@/services/user-service";
import type { User } from "@/lib/db/schema";

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

  // Simplified login function that just sets the session.
  // The actual user verification (OTP) happens in the AuthDialog.
  const login = async (userId: string): Promise<User | null> => {
    setIsLoading(true);
    try {
      const loggedInUser = await getUserById(userId);
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
