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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "src/components/ui/select";
import StatCard from "../../../components/StatCard";
import TableEmptyRow from "../../../components/TableEmptyRow";
import ChargeDataService from "../../../services/charge.service";
import LeaseDataService from "../../../services/lease.service";
import PaymentDataService from "../../../services/payment.service";
import PropertyDataService from "../../../services/property.service";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const currentYear = new Date().getFullYear().toString();

const Reporting = () => {
	const [properties, setProperties] = useState<any[]>([]);
	const [leases, setLeases] = useState<any[]>([]);
	const [payments, setPayments] = useState<any[]>([]);
	const [charges, setCharges] = useState<any[]>([]);
	const [filterYear, setFilterYear] = useState(currentYear);

	useEffect(() => {
		PropertyDataService.getAll()
			.then((r) => setProperties(r.data))
			.catch(console.error);
		LeaseDataService.getAll()
			.then((r) => setLeases(r.data))
			.catch(console.error);
		PaymentDataService.getAll()
			.then((r) => setPayments(r.data))
			.catch(console.error);
		ChargeDataService.getAll()
			.then((r) => setCharges(r.data))
			.catch(console.error);
	}, []);

	const yearOptions = Array.from(
		new Set(
			[
				...payments.map((p) =>
					(p.paid_date || p.due_date || p.month || "").slice(0, 4),
				),
				...charges.map((c) => (c.date || "").slice(0, 4)),
				currentYear,
			].filter((y) => /^\d{4}$/.test(y)),
		),
	).sort((a, b) => b.localeCompare(a));

	const paymentsInYear = payments.filter(
		(p) =>
			(p.paid_date || p.due_date || p.month || "").slice(0, 4) === filterYear,
	);
	const chargesInYear = charges.filter(
		(c) => (c.date || "").slice(0, 4) === filterYear,
	);

	// Per-property stats
	interface PropertyStat {
		id: number;
		label: string;
		rent: number;
		purchase_price: number | null;
		recettes: number;
		depenses: number;
		occupiedMonths: number;
		totalMonths: number;
	}

	const statsMap: Record<number, PropertyStat> = {};
	for (const prop of properties) {
		statsMap[prop.id] = {
			id: prop.id,
			label: `${prop.type} — ${prop.address ? `${prop.address}, ` : ""}${prop.city}`,
			rent: Number.parseFloat(prop.rent || 0),
			purchase_price: prop.purchase_price
				? Number.parseFloat(prop.purchase_price)
				: null,
			recettes: 0,
			depenses: 0,
			occupiedMonths: 0,
			totalMonths: 12,
		};
	}

	for (const p of paymentsInYear.filter((x) => x.status === "paid")) {
		if (statsMap[p.property_id])
			statsMap[p.property_id].recettes += Number.parseFloat(p.amount || 0);
	}
	for (const c of chargesInYear) {
		if (statsMap[c.property_id])
			statsMap[c.property_id].depenses += Number.parseFloat(c.amount || 0);
	}

	// Taux d'occupation: count distinct months with at least one active lease
	for (const lease of leases) {
		if (!lease.property_id || !statsMap[lease.property_id]) continue;
		const start = new Date(lease.start_date);
		const end = lease.end_date ? new Date(lease.end_date) : new Date();
		const yearStart = new Date(`${filterYear}-01-01`);
		const yearEnd = new Date(`${filterYear}-12-31`);
		const overlapStart = start > yearStart ? start : yearStart;
		const overlapEnd = end < yearEnd ? end : yearEnd;
		if (overlapStart <= overlapEnd) {
			const months = Math.round(
				(overlapEnd.getTime() - overlapStart.getTime()) /
					(1000 * 60 * 60 * 24 * 30.44),
			);
			statsMap[lease.property_id].occupiedMonths = Math.min(
				12,
				(statsMap[lease.property_id].occupiedMonths || 0) + Math.max(1, months),
			);
		}
	}

	const isDarkTheme = document.documentElement.classList.contains("dark");
	const chartTextColor = isDarkTheme ? "#94a3b8" : "#64748b";
	const chartGridColor = isDarkTheme
		? "rgba(148,163,184,0.1)"
		: "rgba(100,116,139,0.1)";

	const propertyStats = Object.values(statsMap).sort(
		(a, b) => b.recettes - a.recettes,
	);

	// Prévision 12 prochains mois basée sur les baux actifs
	const activeLeases = leases.filter((l) => l.status === "active");
	const today = new Date();
	const forecastMonths = Array.from({ length: 12 }, (_, i) => {
		const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
		return {
			key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
			label: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
			year: d.getFullYear(),
			month: d.getMonth() + 1,
		};
	});
	const forecastData = forecastMonths.map(({ key, label, year, month }) => {
		const monthStart = new Date(year, month - 1, 1);
		const monthEnd = new Date(year, month, 0);
		const expected = activeLeases.reduce((sum, l) => {
			const start = new Date(l.start_date);
			const end = l.end_date ? new Date(l.end_date) : null;
			if (start > monthEnd) return sum;
			if (end && end < monthStart) return sum;
			return (
				sum +
				Number.parseFloat(l.rent_amount || 0) +
				Number.parseFloat(l.charges_amount || 0)
			);
		}, 0);
		return { key, label, expected };
	});
	const forecastTotal12 = forecastData.reduce((s, m) => s + m.expected, 0);

	const exportCsv = () => {
		const monthCount =
			filterYear === currentYear ? new Date().getMonth() + 1 : 12;
		const header = [
			"Bien",
			"Recettes (€)",
			"Charges (€)",
			"Solde net (€)",
			"Renta. brute (%)",
			"Renta. nette (%)",
			"Taux occupation (%)",
		];
		const rows = propertyStats.map((stat) => {
			const solde = stat.recettes - stat.depenses;
			const rentaBrute =
				stat.purchase_price && stat.purchase_price > 0
					? (
							((stat.recettes * (12 / monthCount)) / stat.purchase_price) *
							100
						).toFixed(1)
					: "N/A";
			const rentaNette =
				stat.purchase_price && stat.purchase_price > 0
					? (((solde * (12 / monthCount)) / stat.purchase_price) * 100).toFixed(
							1,
						)
					: "N/A";
			return [
				stat.label,
				stat.recettes.toFixed(2),
				stat.depenses.toFixed(2),
				solde.toFixed(2),
				rentaBrute,
				rentaNette,
				((stat.occupiedMonths / stat.totalMonths) * 100).toFixed(0),
			];
		});
		const csv = [header, ...rows]
			.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
			.join("\n");
		const blob = new Blob([`\uFEFF${csv}`], {
			type: "text/csv;charset=utf-8;",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `reporting_${filterYear}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	// Portfolio totals
	const totalRecettes = propertyStats.reduce((s, p) => s + p.recettes, 0);
	const totalDepenses = propertyStats.reduce((s, p) => s + p.depenses, 0);
	const totalSolde = totalRecettes - totalDepenses;
	const avgOccupancy =
		propertyStats.length > 0
			? propertyStats.reduce(
					(s, p) => s + (p.occupiedMonths / p.totalMonths) * 100,
					0,
				) / propertyStats.length
			: 0;

	// Monthly cash flow chart
	const monthKeys = Array.from(
		{ length: 12 },
		(_, i) => `${filterYear}-${String(i + 1).padStart(2, "0")}`,
	);
	const recettesByMonth = monthKeys.map((m) =>
		paymentsInYear
			.filter(
				(p) =>
					p.status === "paid" &&
					(p.paid_date || p.due_date || p.month || "").startsWith(m),
			)
			.reduce((s, p) => s + Number.parseFloat(p.amount || 0), 0),
	);
	const depensesByMonth = monthKeys.map((m) =>
		chargesInYear
			.filter((c) => (c.date || "").startsWith(m))
			.reduce((s, c) => s + Number.parseFloat(c.amount || 0), 0),
	);
	const monthLabels = [
		"Jan",
		"Fév",
		"Mar",
		"Avr",
		"Mai",
		"Juin",
		"Juil",
		"Aoû",
		"Sep",
		"Oct",
		"Nov",
		"Déc",
	];

	return (
		<>
			<div className="mb-4">
				<Card className="app-page-hero border-0">
					<CardContent className="p-0 relative">
						<div className="app-page-kicker mb-3">Analyse financière</div>
						<h2 className="mb-2 app-display-title">Reporting & Rentabilité</h2>
						<p className="app-page-description mb-3">
							Visualisez la performance de votre parc immobilier : rentabilité,
							taux d'occupation et flux de trésorerie.
						</p>
						<div className="flex flex-wrap items-center gap-2">
							<span className="app-filter-chip">{properties.length} biens</span>
							<span className="app-filter-chip">
								{leases.filter((l) => l.status === "active").length} baux actifs
							</span>
							<div className="ml-auto flex items-center gap-2">
								<label className="text-sm text-muted-foreground">Année :</label>
								<Select value={filterYear} onValueChange={setFilterYear}>
									<SelectTrigger className="h-8 w-[100px] text-sm">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{yearOptions.map((y) => (
											<SelectItem key={y} value={y}>
												{y}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Button size="sm" variant="outline" onClick={exportCsv}>
									<Download className="h-4 w-4 mr-1" />
									Exporter CSV
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="flex gap-4 mb-4 text-center w-full justify-content-center flex-direction-column">
				<StatCard
					value={`${totalRecettes.toFixed(0)} €`}
					label="Recettes"
					color="success"
				/>
				<StatCard
					value={`${totalDepenses.toFixed(0)} €`}
					label="Charges"
					color="danger"
				/>
				<StatCard
					value={`${totalSolde >= 0 ? "+" : ""}${totalSolde.toFixed(0)} €`}
					label="Solde net"
					color={totalSolde >= 0 ? "success" : "danger"}
				/>
				<StatCard
					value={`${avgOccupancy.toFixed(0)} %`}
					label="Taux d'occupation moy."
					color="info"
				/>
			</div>

			{/* Monthly cash flow */}
			<Card className="mb-4 app-panel-card">
				<CardHeader className="border-b py-3 px-4">
					<strong>Flux de trésorerie mensuel — {filterYear}</strong>
				</CardHeader>
				<CardContent>
					<Bar
						style={{ height: "260px" }}
						data={{
							labels: monthLabels,
							datasets: [
								{
									label: "Recettes (€)",
									backgroundColor: "rgba(21, 128, 61, 0.78)",
									data: recettesByMonth,
								},
								{
									label: "Charges (€)",
									backgroundColor: "rgba(234, 88, 12, 0.75)",
									data: depensesByMonth,
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

			{/* Per-property table */}
			<Card className="app-panel-card app-table-card">
				<CardHeader className="border-b py-3 px-4">
					<strong>Rentabilité par bien — {filterYear}</strong>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Bien</TableHead>
								<TableHead className="text-right">Recettes (€)</TableHead>
								<TableHead className="text-right">Charges (€)</TableHead>
								<TableHead className="text-right">Solde net (€)</TableHead>
								<TableHead className="text-right">Renta. brute</TableHead>
								<TableHead className="text-right">Renta. nette</TableHead>
								<TableHead className="text-right">Taux occupation</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{propertyStats.length === 0 ? (
								<TableEmptyRow colSpan={7} message="Aucun bien enregistré" />
							) : (
								propertyStats.map((stat) => {
									const solde = stat.recettes - stat.depenses;
									const rentaBrute =
										stat.purchase_price && stat.purchase_price > 0
											? ((stat.recettes *
													(12 /
														Number.parseInt(
															filterYear === currentYear
																? String(new Date().getMonth() + 1)
																: "12",
														))) /
													stat.purchase_price) *
												100
											: null;
									const rentaNette =
										stat.purchase_price && stat.purchase_price > 0
											? ((solde *
													(12 /
														Number.parseInt(
															filterYear === currentYear
																? String(new Date().getMonth() + 1)
																: "12",
														))) /
													stat.purchase_price) *
												100
											: null;
									const occupancy =
										(stat.occupiedMonths / stat.totalMonths) * 100;
									return (
										<TableRow key={stat.id}>
											<TableCell className="font-medium">
												{stat.label}
											</TableCell>
											<TableCell className="text-right text-green-600">
												{stat.recettes.toFixed(0)}
											</TableCell>
											<TableCell className="text-right text-rose-500">
												{stat.depenses.toFixed(0)}
											</TableCell>
											<TableCell
												className={`text-right font-semibold ${solde >= 0 ? "text-green-600" : "text-rose-500"}`}
											>
												{solde >= 0 ? "+" : ""}
												{solde.toFixed(0)}
											</TableCell>
											<TableCell className="text-right">
												{rentaBrute !== null ? (
													<Badge
														variant={rentaBrute >= 5 ? "default" : "secondary"}
													>
														{rentaBrute.toFixed(1)} %
													</Badge>
												) : (
													<span className="text-muted-foreground text-xs">
														N/A
													</span>
												)}
											</TableCell>
											<TableCell className="text-right">
												{rentaNette !== null ? (
													<Badge
														variant={rentaNette >= 3 ? "default" : "secondary"}
													>
														{rentaNette.toFixed(1)} %
													</Badge>
												) : (
													<span className="text-muted-foreground text-xs">
														N/A
													</span>
												)}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-2">
													<div className="w-16 bg-muted rounded-full h-1.5">
														<div
															className={`h-1.5 rounded-full ${occupancy >= 80 ? "bg-green-600" : occupancy >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
															style={{ width: `${Math.min(100, occupancy)}%` }}
														/>
													</div>
													<span className="text-sm">
														{Math.min(100, occupancy).toFixed(0)} %
													</span>
												</div>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Prévision de revenus — 12 prochains mois */}
			<Card className="mt-4 app-panel-card">
				<CardHeader className="border-b py-3 px-4 flex flex-row items-center justify-between">
					<strong>Prévision de revenus — 12 prochains mois</strong>
					<span className="text-sm text-muted-foreground">
						Basé sur {activeLeases.length} bail
						{activeLeases.length > 1 ? "x" : ""} actif
						{activeLeases.length > 1 ? "s" : ""}
						&nbsp;·&nbsp;Total projeté :{" "}
						<strong>{forecastTotal12.toFixed(0)} €</strong>
					</span>
				</CardHeader>
				<CardContent>
					{activeLeases.length === 0 ? (
						<p className="text-muted-foreground py-4 text-center">
							Aucun bail actif pour calculer la prévision.
						</p>
					) : (
						<>
							<Bar
								style={{ height: "220px" }}
								data={{
									labels: forecastData.map((m) => m.label),
									datasets: [
										{
											label: "Loyers attendus CC (€)",
											backgroundColor: "rgba(99, 102, 241, 0.72)",
											data: forecastData.map((m) => m.expected.toFixed(2)),
										},
									],
								}}
								options={{
									maintainAspectRatio: false,
									plugins: {
										legend: { display: false },
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
							<Table className="mt-3">
								<TableHeader>
									<TableRow>
										<TableHead>Mois</TableHead>
										<TableHead className="text-right">
											Revenus attendus CC (€)
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{forecastData.map((m) => (
										<TableRow key={m.key}>
											<TableCell>{m.label}</TableCell>
											<TableCell className="text-right font-medium text-indigo-600">
												{m.expected.toFixed(2)} €
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</>
					)}
				</CardContent>
			</Card>
		</>
	);
};

export default Reporting;
