
"use client";

import { useState, useEffect } from "react";
import { getUserById, findUserByEmailOrPhone } from "@/services/user-service";
import type { User } from "@/lib/db/schema";

const SESSION_KEY = "finmate_session_userId";
// This is a placeholder for a real hashing mechanism
const FAKE_PASSWORD_SALT = "somesalt";

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

  const login = async (identifier: string, passwordOrOtp: string, role: 'customer' | 'coach'): Promise<User | null> => {
    setIsLoading(true);
    try {
      const userToLogin = await findUserByEmailOrPhone(identifier);
      if (!userToLogin) {
          throw new Error("User not found.");
      }
      
      let isVerified = false;
      if(role === 'coach') {
          // Password check for coach
          isVerified = (userToLogin.passwordHash === passwordOrOtp + FAKE_PASSWORD_SALT);
      } else {
          // OTP check for customer
          isVerified = passwordOrOtp === 'otp_login';
      }

      if (userToLogin && isVerified) {
        localStorage.setItem(SESSION_KEY, userToLogin.id);
        setUser(userToLogin);
        setIsLoading(false);
        return userToLogin;
      } else {
        throw new Error("Invalid credentials.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
      return null;
    }
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
