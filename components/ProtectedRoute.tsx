import React from "react";
import { useUser } from "../context/UserContext";
import { Loader2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading, role } = useUser();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-dark">
        <Loader2 className="h-8 w-8 animate-spin text-text-primary" />
      </div>
    );
  }

  // 1. Basic Auth Check
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 2. Role Check for Owner Routes
  // If user tries to access /owner but is not an OWNER, redirect to home
  if (location.pathname.startsWith("/owner") && role !== "OWNER") {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};
