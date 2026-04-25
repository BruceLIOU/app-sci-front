import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type React from "react";
import { useEffect, useState } from "react";
import { DateUtils } from "src/utils/date";
import TenantPortalService, {
	type TenantPayment,
} from "../../services/tenant_portal.service";

const STATUS_LABEL: Record<string, string> = {
	paid: "Payé",
	pending: "En attente",
	late: "En retard",
	cancelled: "Annulé",
};
const STATUS_VARIANT: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	paid: "default",
	pending: "secondary",
	late: "destructive",
	cancelled: "outline",
};

const TenantPayments: React.FC = () => {
	const [payments, setPayments] = useState<TenantPayment[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	console.log("payments", payments);
	useEffect(() => {
		TenantPortalService.getPayments()
			.then((r) => setPayments(r.data))
			.catch((e) =>
				setError(e.response?.data?.message || "Erreur de chargement."),
			)
			.finally(() => setLoading(false));
	}, []);

	return (
		<div className="space-y-4">
			<h1 className="text-xl font-semibold">Mes loyers</h1>

			{loading && (
				<div className="flex justify-center py-12">
					<Spinner size="lg" />
				</div>
			)}
			{error && (
				<div className="text-destructive text-sm py-4 text-center">{error}</div>
			)}
			{!loading && !error && (
				<Card>
					<CardHeader className="py-3 px-4 border-b">
						<strong className="text-sm">Historique des paiements</strong>
					</CardHeader>
					<CardContent className="p-0">
						{payments.length === 0 ? (
							<p className="text-muted-foreground text-sm py-6 text-center">
								Aucun paiement trouvé.
							</p>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Mois</TableHead>
											<TableHead>Montant</TableHead>
											<TableHead>Échéance</TableHead>
											<TableHead>Payé le</TableHead>
											<TableHead>Statut</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{payments.map((p) => (
											<TableRow key={p.id}>
												<TableCell>
													{DateUtils.formatMonthYear(p.month) || "—"}
												</TableCell>
												<TableCell>
													{Number(p.amount).toLocaleString("fr-FR")} €
												</TableCell>
												<TableCell>
													{new Date(p.due_date).toLocaleDateString("fr-FR")}
												</TableCell>
												<TableCell>
													{p.paid_date
														? new Date(p.paid_date).toLocaleDateString("fr-FR")
														: "—"}
												</TableCell>
												<TableCell>
													<Badge
														variant={STATUS_VARIANT[p.status] ?? "secondary"}
													>
														{STATUS_LABEL[p.status] ?? p.status}
													</Badge>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
};

export default TenantPayments;
