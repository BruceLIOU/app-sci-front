import type React from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import AuthService from "../services/auth.service";
import { type RootState, setLoading, setUser } from "../store";

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const dispatch = useDispatch();
	const { user, loading } = useSelector((state: RootState) => state.auth);
	const location = useLocation();

	useEffect(() => {
		if (user) return;
		dispatch(setLoading(true));
		AuthService.me()
			.then(({ data }) => dispatch(setUser(data)))
			.catch(() => dispatch(setUser(null)));
	}, [dispatch, user]);

	if (loading) {
		return (
			<div className="min-vh-100 d-flex align-items-center justify-content-center">
				<div className="sk-spinner sk-spinner-pulse" />
			</div>
		);
	}

	if (!user) return <Navigate to="/login" replace />;

	const isOnTenantPortal = location.pathname.startsWith("/tenant-portal");

	// Locataires can only access the tenant portal
	if (user.role === "locataire" && !isOnTenantPortal) {
		return <Navigate to="/tenant-portal" replace />;
	}

	// Admin/viewer cannot access the tenant portal
	if (user.role !== "locataire" && isOnTenantPortal) {
		return <Navigate to="/" replace />;
	}

	return <>{children}</>;
};

export default AuthGuard;
