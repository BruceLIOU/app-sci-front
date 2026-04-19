import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LinearScale,
	Tooltip,
} from "chart.js";
import { Download } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { DateUtils } from "src/utils/date";
import StatCard from "../../../components/StatCard";
import TableEmptyRow from "../../../components/TableEmptyRow";
import ChargeDataService from "../../../services/charge.service";
import PaymentDataService from "../../../services/payment.service";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CHARGE_TYPE_LABELS: Record<string, string> = {
	assurance: "Assurance",
	taxe_fonciere: "Taxe foncière",
	entretien: "Entretien",
	travaux: "Travaux",
	charges_copro: "Charges copro",
	frais_gestion: "Frais gestion",
	autre: "Autre",
};

const Comptability = () => {
	const [payments, setPayments] = useState<any[]>([]);
	const [charges, setCharges] = useState<any[]>([]);
	const [activeTab, setActiveTab] = useState<
		"recap" | "journal" | "tresorerie"
	>("recap");
	const [filterYear, setFilterYear] = useState(
		new Date().getFullYear().toString(),
	);

	useEffect(() => {
		PaymentDataService.getAll()
			.then((res) => setPayments(res.data))
			.catch((err) => console.log(err.message));
		ChargeDataService.getAll()
			.then((res) => setCharges(res.data))
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

	const exportCsv = () => {
		const header = [
			"Mois",
			"Locataire",
			"Bien",
			"Montant (€)",
			"Charges (€)",
			"Statut",
		];
		const rows = payments.map((p) => [
			p.month || p.due_date || "",
			p.Tenant ? `${p.Tenant.firstname} ${p.Tenant.lastname}` : "",
			p.Property ? `${p.Property.type} - ${p.Property.city}` : "",
			Number.parseFloat(p.amount || 0).toFixed(2),
			Number.parseFloat(p.charges_amount || 0).toFixed(2),
			p.status === "paid" ? "Payé" : p.status === "late" ? "Retard" : "Attente",
		]);
		const csv = [header, ...rows]
			.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
			.join("\n");
		const blob = new Blob([`\uFEFF${csv}`], {
			type: "text/csv;charset=utf-8;",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `comptabilite_${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	// Journal & trésorerie
	const paymentsInYear = payments.filter((p) => {
		const y = (p.paid_date || p.due_date || p.month || "").slice(0, 4);
		return !filterYear || y === filterYear;
	});
	const chargesInYear = charges.filter((c) => {
		const y = (c.date || "").slice(0, 4);
		return !filterYear || y === filterYear;
	});

	const journalEntries = [
		...paymentsInYear.map((p) => ({
			date: p.paid_date || p.due_date || "",
			label: `Loyer — ${p.Tenant ? `${p.Tenant.firstname} ${p.Tenant.lastname}` : "?"} / ${p.Property?.city || "?"}`,
			type: "recette" as const,
			amount: Number.parseFloat(p.amount || 0),
			status: p.status,
			month: p.month || "",
		})),
		...chargesInYear.map((c) => ({
			date: c.date || "",
			label: `${CHARGE_TYPE_LABELS[c.type] || c.type} — ${c.Property?.city || "?"}${c.description ? ` (${c.description})` : ""}`,
			type: "depense" as const,
			amount: Number.parseFloat(c.amount || 0),
			status: "paid" as const,
			month: (c.date || "").slice(0, 7),
		})),
	].sort((a, b) => b.date.localeCompare(a.date));

	// Trésorerie par bien
	const byPropertyMap: Record<
		string,
		{ property: string; recettes: number; depenses: number }
	> = {};
	for (const p of paymentsInYear.filter((x) => x.status === "paid")) {
		const key = String(p.property_id);
		if (!byPropertyMap[key])
			byPropertyMap[key] = {
				property: p.Property
					? `${p.Property.type} — ${p.Property.city}`
					: `Bien #${p.property_id}`,
				recettes: 0,
				depenses: 0,
			};
		byPropertyMap[key].recettes += Number.parseFloat(p.amount || 0);
	}
	for (const c of chargesInYear) {
		const key = String(c.property_id);
		if (!byPropertyMap[key])
			byPropertyMap[key] = {
				property: c.Property
					? `${c.Property.type} — ${c.Property.city}`
					: `Bien #${c.property_id}`,
				recettes: 0,
				depenses: 0,
			};
		byPropertyMap[key].depenses += Number.parseFloat(c.amount || 0);
	}
	const tresorerieEntries = Object.values(byPropertyMap).sort(
		(a, b) => b.recettes - a.recettes,
	);

	const yearOptions = Array.from(
		new Set(
			[
				...payments.map((p) =>
					(p.paid_date || p.due_date || p.month || "").slice(0, 4),
				),
				...charges.map((c) => (c.date || "").slice(0, 4)),
			].filter((y) => /^\d{4}$/.test(y)),
		),
	).sort((a, b) => b.localeCompare(a));

	const isDarkTheme =
		document.documentElement.getAttribute("data-coreui-theme") === "dark";
	const chartTextColor = isDarkTheme ? "#94a3b8" : "#64748b";
	const chartGridColor = isDarkTheme
		? "rgba(148,163,184,0.1)"
		: "rgba(100,116,139,0.1)";

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
						<div className="flex flex-wrap items-center gap-2">
							<span className="app-filter-chip">
								{payments.length} paiements
							</span>
							<span className="app-filter-chip">
								{totalExpected.toFixed(2)} € attendus
							</span>
							<span className="app-filter-chip">
								{recoveryRate} % recouvres
							</span>
							<Button
								size="sm"
								variant="outline"
								onClick={exportCsv}
								className="ml-auto"
							>
								<Download className="h-4 w-4 mr-1" />
								Exporter CSV
							</Button>
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

			{/* Tabs */}
			<div className="flex gap-2 mb-4 border-b">
				{(["recap", "journal", "tresorerie"] as const).map((tab) => (
					<button
						key={tab}
						type="button"
						onClick={() => setActiveTab(tab)}
						className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
					>
						{tab === "recap"
							? "Récapitulatif"
							: tab === "journal"
								? "Journal"
								: "Trésorerie / Bien"}
					</button>
				))}
				{(activeTab === "journal" || activeTab === "tresorerie") && (
					<div className="ml-auto flex items-center gap-2 pb-1">
						<select
							className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
							value={filterYear}
							onChange={(e) => setFilterYear(e.target.value)}
						>
							{yearOptions.map((y) => (
								<option key={y} value={y}>
									{y}
								</option>
							))}
						</select>
					</div>
				)}
			</div>

			{activeTab === "recap" && months.length > 0 && (
				<Card className="mb-4 app-panel-card">
					<CardHeader className="border-b py-3 px-4">
						<strong>Loyers par mois</strong>
					</CardHeader>
					<CardContent>
						<Bar
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
								plugins: {
									legend: {
										display: true,
										position: "bottom",
										labels: { color: chartTextColor },
									},
								},
								scales: {
									x: {
										ticks: { color: chartTextColor },
										grid: { color: chartGridColor },
									},
									y: {
										ticks: { color: chartTextColor },
										grid: { color: chartGridColor },
									},
								},
							}}
						/>
					</CardContent>
				</Card>
			)}

			{activeTab === "recap" && (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Card className="mb-4 app-panel-card">
						<CardHeader className="border-b py-3 px-4">
							<strong>Revenus par bien</strong>
						</CardHeader>
						<CardContent>
							{propertyEntries.length === 0 ? (
								<p className="text-muted-foreground">
									Aucune donnée disponible
								</p>
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
			)}

			{activeTab === "journal" && (
				<Card className="app-panel-card app-table-card">
					<CardHeader className="border-b py-3 px-4">
						<strong>Journal des opérations — {filterYear}</strong>
					</CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Date</TableHead>
									<TableHead>Libellé</TableHead>
									<TableHead>Type</TableHead>
									<TableHead className="text-right">Montant (€)</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{journalEntries.length === 0 ? (
									<TableEmptyRow
										colSpan={4}
										message="Aucune opération pour cette année"
									/>
								) : (
									journalEntries.map((entry, i) => (
										<TableRow key={`${entry.type}-${entry.date}-${i}`}>
											<TableCell className="text-muted-foreground text-sm whitespace-nowrap">
												{entry.date ? entry.date.slice(0, 10) : "—"}
											</TableCell>
											<TableCell>{entry.label}</TableCell>
											<TableCell>
												<Badge
													variant={
														entry.type === "recette" ? "default" : "secondary"
													}
												>
													{entry.type === "recette" ? "Recette" : "Dépense"}
												</Badge>
											</TableCell>
											<TableCell
												className={`text-right font-medium ${entry.type === "recette" ? "text-green-600" : "text-rose-500"}`}
											>
												{entry.type === "recette" ? "+" : "−"}
												{entry.amount.toFixed(2)} €
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}

			{activeTab === "tresorerie" && (
				<Card className="app-panel-card app-table-card">
					<CardHeader className="border-b py-3 px-4">
						<strong>Trésorerie par bien — {filterYear}</strong>
					</CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Bien</TableHead>
									<TableHead className="text-right">Recettes (€)</TableHead>
									<TableHead className="text-right">Dépenses (€)</TableHead>
									<TableHead className="text-right">Solde net (€)</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{tresorerieEntries.length === 0 ? (
									<TableEmptyRow
										colSpan={4}
										message="Aucune donnée pour cette année"
									/>
								) : (
									<>
										{tresorerieEntries.map((row) => {
											const solde = row.recettes - row.depenses;
											return (
												<TableRow key={row.property}>
													<TableCell className="font-medium">
														{row.property}
													</TableCell>
													<TableCell className="text-right text-green-600">
														{row.recettes.toFixed(2)}
													</TableCell>
													<TableCell className="text-right text-rose-500">
														{row.depenses.toFixed(2)}
													</TableCell>
													<TableCell
														className={`text-right font-semibold ${solde >= 0 ? "text-green-600" : "text-rose-500"}`}
													>
														{solde >= 0 ? "+" : ""}
														{solde.toFixed(2)}
													</TableCell>
												</TableRow>
											);
										})}
										{(() => {
											const totalRec = tresorerieEntries.reduce(
												(s, r) => s + r.recettes,
												0,
											);
											const totalDep = tresorerieEntries.reduce(
												(s, r) => s + r.depenses,
												0,
											);
											const totalSolde = totalRec - totalDep;
											return (
												<TableRow className="border-t-2 bg-muted/40">
													<TableCell className="font-semibold">Total</TableCell>
													<TableCell className="text-right font-semibold text-green-600">
														{totalRec.toFixed(2)}
													</TableCell>
													<TableCell className="text-right font-semibold text-rose-500">
														{totalDep.toFixed(2)}
													</TableCell>
													<TableCell
														className={`text-right font-bold ${totalSolde >= 0 ? "text-green-600" : "text-rose-500"}`}
													>
														{totalSolde >= 0 ? "+" : ""}
														{totalSolde.toFixed(2)}
													</TableCell>
												</TableRow>
											);
										})()}
									</>
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</>
	);
};

export default Comptability;
