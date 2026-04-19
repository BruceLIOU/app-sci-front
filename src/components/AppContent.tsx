import { Spinner } from "@/components/ui/spinner";
import React, { Suspense } from "react";
import { useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import routes from "../routes";
import type { RootState } from "../store";
import OwnerProfileGuard from "./OwnerProfileGuard";

const AppContent = () => {
	const userRole = useSelector(
		(state: RootState) => state.auth.user?.role ?? "viewer",
	);

	return (
		<div className="app-content-container max-w-screen-2xl mx-auto w-full px-4 py-4 lg:px-6">
			<Suspense
				fallback={
					<div className="flex justify-center py-12">
						<Spinner size="lg" />
					</div>
				}
			>
				<Routes>
					{routes.map((route, idx) => {
						if (!route.element) return null;
						// biome-ignore lint/suspicious/noExplicitAny: le type de rôle vient du store
						if (route.roles && !route.roles.includes(userRole as any)) {
							return (
								<Route
									key={route.path}
									path={route.path}
									element={<Navigate to="/dashboard" replace />}
								/>
							);
						}
						return (
							<Route
								key={route.path}
								path={route.path}
								element={
									route.sciOnly ? (
										<OwnerProfileGuard requireSci>
											<route.element />
										</OwnerProfileGuard>
									) : (
										<route.element />
									)
								}
							/>
						);
					})}
					<Route path="/" element={<Navigate to="dashboard" replace />} />
				</Routes>
			</Suspense>
		</div>
	);
};

export default React.memo(AppContent);
