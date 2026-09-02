import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { Loader2 } from "lucide-react";
export const RequireAuth: React.FC<{ children: React.ReactNode; blockAdmin?: boolean }> = ({
  children,
  blockAdmin = false,
}) => {
  const { user, isAdmin, loading } = useUser();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-dark">
        {" "}
        <Loader2 className="animate-spin text-text-primary" size={32} />{" "}
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  if (isAdmin) {
    return <Navigate to="/admin/overview" replace />;
  }
  return <>{children}</>;
};
export const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAdmin, loading } = useUser();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-dark">
        {" "}
        <Loader2 className="animate-spin text-text-primary" size={32} />{" "}
      </div>
    );
  }
  if (!isAdmin) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};
export const RequireOwner: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isOwner, loading } = useUser();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-dark">
        {" "}
        <Loader2 className="animate-spin text-text-primary" size={32} />{" "}
      </div>
    );
  }
  if (!isOwner) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};
