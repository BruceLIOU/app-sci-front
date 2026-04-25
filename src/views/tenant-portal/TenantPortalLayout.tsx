import { Building2, FileText, Home, LogOut, Wrench } from "lucide-react";
import React, { Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import AuthService from "../../services/auth.service";
import { type RootState, setUser } from "../../store";

const TenantDashboard = React.lazy(() => import("./TenantDashboard"));
const TenantPayments = React.lazy(() => import("./TenantPayments"));
const TenantDocuments = React.lazy(() => import("./TenantDocuments"));
const TenantMaintenance = React.lazy(() => import("./TenantMaintenance"));

const loading = (
	<div className="flex items-center justify-center min-h-[200px]">
		<div className="sk-spinner sk-spinner-pulse" />
	</div>
);

const NAV = [
	{ to: "/tenant-portal", label: "Tableau de bord", icon: Home, exact: true },
	{ to: "/tenant-portal/payments", label: "Mes loyers", icon: Building2 },
	{ to: "/tenant-portal/documents", label: "Mes documents", icon: FileText },
	{ to: "/tenant-portal/maintenance", label: "Signalement", icon: Wrench },
];

const TenantPortalLayout: React.FC = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const user = useSelector((state: RootState) => state.auth.user);

	const handleLogout = async () => {
		try {
			await AuthService.logout();
		} catch {}
		dispatch(setUser(null));
		navigate("/login", { replace: true });
	};

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<header className="border-b bg-card sticky top-0 z-10">
				<div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
					<span className="font-semibold text-sm">Espace locataire</span>
					<div className="flex items-center gap-3">
						<span className="text-xs text-muted-foreground hidden sm:block">
							{user?.name || user?.email}
						</span>
						<button
							type="button"
							onClick={handleLogout}
							className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							<LogOut className="h-4 w-4" />
							<span className="hidden sm:block">Déconnexion</span>
						</button>
					</div>
				</div>
			</header>

			<nav className="border-b bg-card">
				<div className="max-w-4xl mx-auto px-4">
					<div className="flex gap-1 overflow-x-auto">
						{NAV.map((item) => (
							<Link
								key={item.to}
								to={item.to}
								className="flex items-center gap-1.5 px-3 py-3 text-sm whitespace-nowrap border-b-2 border-transparent hover:text-foreground hover:border-muted-foreground transition-colors text-muted-foreground"
							>
								<item.icon className="h-4 w-4" />
								{item.label}
							</Link>
						))}
					</div>
				</div>
			</nav>

			<main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
				<Suspense fallback={loading}>
					<Routes>
						<Route index element={<TenantDashboard />} />
						<Route path="payments" element={<TenantPayments />} />
						<Route path="documents" element={<TenantDocuments />} />
						<Route path="maintenance" element={<TenantMaintenance />} />
					</Routes>
				</Suspense>
			</main>
		</div>
	);
};

export default TenantPortalLayout;
