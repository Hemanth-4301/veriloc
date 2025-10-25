import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await api.get("/auth/me");
          setAdmin(response.data.admin);
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem("token");
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = useCallback(async (username, password) => {
    try {
      const response = await api.post("/auth/login", { username, password });
      const { token: newToken, admin: adminData } = response.data;

      localStorage.setItem("token", newToken);
      setToken(newToken);
      setAdmin(adminData);

      toast.success("Login successful!");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setAdmin(null);
    toast.success("Logged out successfully");
  }, []);

  const register = useCallback(async (adminData) => {
    try {
      const response = await api.post("/auth/register", adminData);
      toast.success("Admin created successfully!");
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const updateAdmin = useCallback(async (adminId, updateData) => {
    try {
      const response = await api.put(`/auth/admins/${adminId}`, updateData);
      toast.success("Admin updated successfully!");
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || "Update failed";
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const deleteAdmin = useCallback(async (adminId) => {
    try {
      await api.delete(`/auth/admins/${adminId}`);
      toast.success("Admin deleted successfully!");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Delete failed";
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const getAdmins = useCallback(async () => {
    try {
      const response = await api.get("/auth/admins");
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch admins";
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const value = useMemo(() => ({
    admin,
    loading,
    isAuthenticated: !!admin,
    isSuperAdmin: admin?.isSuperAdmin || false,
    login,
    logout,
    register,
    updateAdmin,
    deleteAdmin,
    getAdmins,
  }), [admin, loading, login, logout, register, updateAdmin, deleteAdmin, getAdmins]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
