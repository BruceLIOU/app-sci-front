import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { CChartBar } from "@coreui/react-chartjs";
import React, { useState, useEffect } from "react";
import { DateUtils } from "src/utils/date";
import StatCard from "../../../components/StatCard";
import TableEmptyRow from "../../../components/TableEmptyRow";
import PaymentDataService from "../../../services/payment.service";

const Comptability = () => {
	const [payments, setPayments] = useState<any[]>([]);

	useEffect(() => {
		PaymentDataService.getAll()
			.then((res) => setPayments(res.data))
			.catch((err) => console.log(err.message));
	}, []);

	const totalPaid = payments
		.filter((p) => p.status === "paid")
		.reduce((sum, p) => sum + Number.parseFloat(p.amount || 0), 0);
	const totalPending = payments
		.filter((p) => p.status === "pending")
		.reduce((sum, p) => sum + Number.parseFloat(p.amount || 0), 0);
	const totalLate = payments
		.filter((p) => p.status === "late")
		.reduce((sum, p) => sum + Number.parseFloat(p.amount || 0), 0);
	const totalExpected = totalPaid + totalPending + totalLate;
	const recoveryRate =
		totalExpected > 0 ? ((totalPaid / totalExpected) * 100).toFixed(1) : 0;

	const byMonth: Record<string, any> = {};
	const monthSortKey: Record<string, string> = {};
	payments.forEach((p) => {
		const key = p.month || "Non défini";
		if (!byMonth[key]) byMonth[key] = { paid: 0, pending: 0, late: 0 };
		const amount = Number.parseFloat(p.amount || 0);
		byMonth[key][p.status] = (byMonth[key][p.status] || 0) + amount;
		if (!monthSortKey[key] || (p.due_date && p.due_date < monthSortKey[key])) {
			monthSortKey[key] = p.due_date || "";
		}
	});

	const months = Object.keys(byMonth).sort((a, b) =>
		(monthSortKey[a] || "").localeCompare(monthSortKey[b] || ""),
	);
	const paidByMonth = months.map((m) => byMonth[m].paid.toFixed(2));
	const pendingByMonth = months.map((m) =>
		(byMonth[m].pending + byMonth[m].late).toFixed(2),
	);

	const byProperty = payments.reduce((acc: Record<string, any>, p) => {
		if (!p.Property) return acc;
		const key = `${p.Property.type} - ${p.Property.city}`;
		if (!acc[key]) acc[key] = { paid: 0, total: 0 };
		acc[key].total += Number.parseFloat(p.amount || 0);
		if (p.status === "paid") acc[key].paid += Number.parseFloat(p.amount || 0);
		return acc;
	}, {});

	const propertyEntries = Object.entries(byProperty) as Array<
		[string, { paid: number; total: number }]
	>;

	return (
		<>
			<div className="mb-4">
				<Card className="app-page-hero border-0">
					<CardContent className="p-0 relative">
						<div className="app-page-kicker mb-3">Pilotage comptable</div>
						<h2 className="mb-2 app-display-title">
							Suivi financier de votre parc
						</h2>
						<p className="app-page-description mb-3">
							Visualisez les loyers encaisses, les retards et la performance de
							recouvrement avec une vue centralisee sur les paiements.
						</p>
						<div className="flex flex-wrap gap-2">
							<span className="app-filter-chip">
								{payments.length} paiements
							</span>
							<span className="app-filter-chip">
								{totalExpected.toFixed(2)} € attendus
							</span>
							<span className="app-filter-chip">
								{recoveryRate} % recouvres
							</span>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-center">
				<StatCard
					value={`${totalPaid.toFixed(2)} €`}
					label="Loyers perçus"
					color="success"
				/>
				<StatCard
					value={`${totalPending.toFixed(2)} €`}
					label="En attente"
					color="warning"
				/>
				<StatCard
					value={`${totalLate.toFixed(2)} €`}
					label="En retard"
					color="danger"
				/>
				<StatCard
					value={`${recoveryRate} %`}
					label="Taux de recouvrement"
					color="info"
				/>
			</div>

			{months.length > 0 && (
				<Card className="mb-4 app-panel-card">
					<CardHeader className="border-b py-3 px-4">
						<strong>Loyers par mois</strong>
					</CardHeader>
					<CardContent>
						<CChartBar
							style={{ height: "280px" }}
							data={{
								labels: months.map((m) => DateUtils.formatMonthYear(m)),
								datasets: [
									{
										label: "Perçus (€)",
										backgroundColor: "rgba(21, 128, 61, 0.78)",
										data: paidByMonth,
									},
									{
										label: "En attente / Retard (€)",
										backgroundColor: "rgba(234, 88, 12, 0.75)",
										data: pendingByMonth,
									},
								],
							}}
							options={{
								maintainAspectRatio: false,
								plugins: { legend: { display: true, position: "bottom" } },
							}}
						/>
					</CardContent>
				</Card>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Card className="mb-4 app-panel-card">
					<CardHeader className="border-b py-3 px-4">
						<strong>Revenus par bien</strong>
					</CardHeader>
					<CardContent>
						{propertyEntries.length === 0 ? (
							<p className="text-muted-foreground">Aucune donnée disponible</p>
						) : (
							propertyEntries.map(([name, val]) => (
								<div key={name} className="mb-3">
									<div className="flex justify-between mb-1">
										<span>{name}</span>
										<span>
											{val.paid.toFixed(2)} € / {val.total.toFixed(2)} €
										</span>
									</div>
									<div className="w-full bg-muted rounded-full h-2">
										<div
											className="bg-green-600 h-2 rounded-full"
											style={{
												width: `${val.total > 0 ? (val.paid / val.total) * 100 : 0}%`,
											}}
										/>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>

				<Card className="mb-4 app-panel-card app-table-card">
					<CardHeader className="border-b py-3 px-4">
						<strong>Détail des paiements</strong>
					</CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Mois</TableHead>
									<TableHead>Locataire</TableHead>
									<TableHead>Montant</TableHead>
									<TableHead>Statut</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{payments.length === 0 ? (
									<TableEmptyRow colSpan={4} message="Aucun paiement" />
								) : (
									payments.map((p) => (
										<TableRow key={p.id}>
											<TableCell>
												{DateUtils.formatMonthYear(p.month) || "-"}
											</TableCell>
											<TableCell>
												{p.Tenant
													? `${p.Tenant.firstname} ${p.Tenant.lastname}`
													: "-"}
											</TableCell>
											<TableCell>
												{Number.parseFloat(p.amount || 0).toFixed(2)} €
											</TableCell>
											<TableCell>
												<Badge
													variant={
														p.status === "paid"
															? "default"
															: p.status === "late"
																? "destructive"
																: "secondary"
													}
												>
													{p.status === "paid"
														? "Payé"
														: p.status === "late"
															? "Retard"
															: "Attente"}
												</Badge>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>
		</>
	);
};

export default Comptability;
