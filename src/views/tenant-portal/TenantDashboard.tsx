import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { AlertTriangle, Building2, Calendar, Euro } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import TenantPortalService, {
	type TenantDashboard as TenantDashboardData,
} from "../../services/tenant_portal.service";

const TenantDashboard: React.FC = () => {
	const [data, setData] = useState<TenantDashboardData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		TenantPortalService.getDashboard()
			.then((r) => setData(r.data))
			.catch((e) =>
				setError(e.response?.data?.message || "Erreur de chargement."),
			)
			.finally(() => setLoading(false));
	}, []);

	if (loading)
		return (
			<div className="flex justify-center py-12">
				<Spinner size="lg" />
			</div>
		);
	if (error)
		return (
			<div className="text-destructive py-8 text-center text-sm">{error}</div>
		);
	if (!data) return null;

	const { tenant, activeLease, pendingPayments } = data;
	const totalMonthly =
		(activeLease?.rent_amount ?? 0) + (activeLease?.charges_amount ?? 0);

	return (
		<div className="space-y-5">
			<div>
				<h1 className="text-xl font-semibold">
					Bonjour{tenant.firstname ? `, ${tenant.firstname}` : ""} 👋
				</h1>
				<p className="text-sm text-muted-foreground mt-0.5">
					{tenant.Property?.address
						? `Locataire — ${tenant.Property.address}`
						: "Bienvenue dans votre espace locataire"}
				</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card>
					<CardContent className="pt-5 pb-4">
						<div className="flex items-start gap-3">
							<div className="rounded-lg bg-primary/10 p-2">
								<Euro className="h-5 w-5 text-primary" />
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Loyer mensuel</p>
								<p className="text-lg font-semibold">
									{totalMonthly > 0
										? `${totalMonthly.toLocaleString("fr-FR")} €`
										: "—"}
								</p>
								{activeLease && (
									<p className="text-xs text-muted-foreground">
										{activeLease.rent_amount} + {activeLease.charges_amount}{" "}
										charges
									</p>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-5 pb-4">
						<div className="flex items-start gap-3">
							<div
								className={`rounded-lg p-2 ${pendingPayments > 0 ? "bg-destructive/10" : "bg-green-500/10"}`}
							>
								<AlertTriangle
									className={`h-5 w-5 ${pendingPayments > 0 ? "text-destructive" : "text-green-600"}`}
								/>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">
									Paiements en attente
								</p>
								<p className="text-lg font-semibold">{pendingPayments}</p>
								<p className="text-xs text-muted-foreground">
									{pendingPayments === 0 ? "Aucun impayé" : "À régulariser"}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-5 pb-4">
						<div className="flex items-start gap-3">
							<div className="rounded-lg bg-blue-500/10 p-2">
								<Calendar className="h-5 w-5 text-blue-600" />
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Fin de bail</p>
								<p className="text-lg font-semibold">
									{activeLease?.end_date
										? new Date(activeLease.end_date).toLocaleDateString("fr-FR")
										: "—"}
								</p>
								{activeLease && (
									<Badge
										variant={
											activeLease.status === "active" ? "default" : "secondary"
										}
										className="text-xs mt-0.5"
									>
										{activeLease.status === "active"
											? "Actif"
											: activeLease.status}
									</Badge>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{tenant.Property && (
				<Card>
					<CardHeader className="pb-2 pt-4 px-4">
						<div className="flex items-center gap-2 text-sm font-medium">
							<Building2 className="h-4 w-4" />
							Mon logement
						</div>
					</CardHeader>
					<CardContent className="px-4 pb-4 text-sm text-muted-foreground space-y-1">
						{tenant.Property.address && (
							<p className="font-medium text-foreground">
								{tenant.Property.address}
							</p>
						)}
						{tenant.Property.city && <p>{tenant.Property.city}</p>}
					</CardContent>
				</Card>
			)}
		</div>
	);
};

export default TenantDashboard;
