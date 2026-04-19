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
import { Download } from "lucide-react";
import React, { useState, useEffect } from "react";
import { DateUtils } from "src/utils/date";
import StatCard from "../../../components/StatCard";
import TableEmptyRow from "../../../components/TableEmptyRow";
import AssociateDataService from "../../../services/associate.service";
import ChargeDataService from "../../../services/charge.service";
import PaymentDataService from "../../../services/payment.service";
import PropertyDataService from "../../../services/property.service";
import http from "../../../utils/http-common";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const Declarations = () => {
	const [year, setYear] = useState(currentYear);
	const [payments, setPayments] = useState<any[]>([]);
	const [charges, setCharges] = useState<any[]>([]);
	const [associates, setAssociates] = useState<any[]>([]);
	const [properties, setProperties] = useState<any[]>([]);
	const [generating, setGenerating] = useState(false);

	const handleGeneratePdf = async () => {
		setGenerating(true);
		try {
			const response = await http.get(`/pdf/declaration-2072?year=${year}`, {
				responseType: "blob",
			});
			const url = URL.createObjectURL(
				new Blob([response.data], { type: "application/pdf" }),
			);
			const a = document.createElement("a");
			a.href = url;
			a.download = `declaration_2072_S_${year}.pdf`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch {
			alert("Erreur lors de la génération du PDF.");
		} finally {
			setGenerating(false);
		}
	};

	useEffect(() => {
		PaymentDataService.getAll().then((r) => setPayments(r.data));
		ChargeDataService.getAll().then((r) => setCharges(r.data));
		AssociateDataService.getAll().then((r) => setAssociates(r.data));
		PropertyDataService.getAll().then((r) => setProperties(r.data));
	}, []);

	const yearPayments = payments.filter((p) => {
		if (p.status !== "paid") return false;
		const d = p.paid_date || p.due_date || "";
		return d.startsWith(String(year));
	});

	const totalRevenues = yearPayments.reduce(
		(s, p) => s + Number.parseFloat(p.amount || 0),
		0,
	);

	const yearCharges = charges.filter((c) =>
		(c.date || "").startsWith(String(year)),
	);

	const totalCharges = yearCharges.reduce(
		(s, c) => s + Number.parseFloat(c.amount || 0),
		0,
	);

	const netResult = totalRevenues - totalCharges;

	const byProperty = properties.map((p) => {
		const rev = yearPayments
			.filter((pay) => pay.property_id === p.id)
			.reduce((s, pay) => s + Number.parseFloat(pay.amount || 0), 0);
		const chg = yearCharges
			.filter((c) => c.property_id === p.id)
			.reduce((s, c) => s + Number.parseFloat(c.amount || 0), 0);
		return { ...p, revenues: rev, charges: chg, net: rev - chg };
	});

	const byAssociate = associates.map((a) => ({
		...a,
		share: Number.parseFloat(a.shares || 0),
		allocated: (netResult * Number.parseFloat(a.shares || 0)) / 100,
	}));

	return (
		<>
			<div className="flex flex-col md:flex-row gap-4 mb-4 no-print">
				<div className="md:flex-1">
					<Card className="app-page-hero h-full border-0">
						<CardContent className="p-0 relative">
							<div className="app-page-kicker mb-3">Declaration fiscale</div>
							<h2 className="mb-2 app-display-title">
								Preparation du formulaire 2072 simplifiee
							</h2>
							<p className="app-page-description mb-4">
								Controlez vos revenus, charges et quote-parts puis exportez la
								declaration annuelle au format PDF.
							</p>
							<div className="flex flex-wrap gap-2">
								<span className="app-filter-chip">Exercice {year}</span>
								<span className="app-filter-chip">
									{yearPayments.length} loyers percus
								</span>
								<span className="app-filter-chip">
									{yearCharges.length} charges deduites
								</span>
							</div>
						</CardContent>
					</Card>
				</div>
				<div className="md:w-80">
					<Card className="app-panel-card h-full border-0">
						<CardContent className="pt-4">
							<div
								className="uppercase font-semibold mb-2 text-xs tracking-wider"
								style={{ color: "var(--app-accent)" }}
							>
								Parametres
							</div>
							<h5 className="mb-3">Annee de declaration</h5>
							<select
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm mb-3"
								value={year}
								onChange={(e) => setYear(Number(e.target.value))}
							>
								{years.map((y) => (
									<option key={y} value={y}>
										{y}
									</option>
								))}
							</select>
							<Button
								className="w-full app-ghost-button"
								onClick={handleGeneratePdf}
								disabled={generating}
							>
								<Download className="mr-1 h-4 w-4" />
								{generating ? "Generation…" : "Generer le PDF 2072-S"}
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>

			<div className="grid grid-cols-3 gap-3 mb-4 text-center">
				<StatCard
					value={`${totalRevenues.toFixed(2)} €`}
					label={`Revenus locatifs ${year}`}
					color="success"
				/>
				<StatCard
					value={`${totalCharges.toFixed(2)} €`}
					label={`Charges deductibles ${year}`}
					color="danger"
				/>
				<StatCard
					value={`${netResult.toFixed(2)} €`}
					label={`Resultat net ${netResult >= 0 ? "(benefice)" : "(deficit)"}`}
					color={netResult >= 0 ? "info" : "warning"}
				/>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
				<Card className="app-panel-card app-table-card">
					<CardHeader className="border-b py-3 px-4">
						<strong>Revenus par bien — {year}</strong>
					</CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Bien</TableHead>
									<TableHead>Revenus</TableHead>
									<TableHead>Charges</TableHead>
									<TableHead>Net</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{byProperty.length === 0 ? (
									<TableEmptyRow colSpan={4} message="Aucun bien" />
								) : (
									byProperty.map((p) => (
										<TableRow key={p.id}>
											<TableCell>
												{p.type} - {p.city}
											</TableCell>
											<TableCell>{p.revenues.toFixed(2)} €</TableCell>
											<TableCell>{p.charges.toFixed(2)} €</TableCell>
											<TableCell>
												<strong
													className={
														p.net >= 0 ? "text-green-600" : "text-destructive"
													}
												>
													{p.net.toFixed(2)} €
												</strong>
											</TableCell>
										</TableRow>
									))
								)}
								<TableRow className="font-bold">
									<TableCell>TOTAL</TableCell>
									<TableCell>{totalRevenues.toFixed(2)} €</TableCell>
									<TableCell>{totalCharges.toFixed(2)} €</TableCell>
									<TableCell
										className={
											netResult >= 0 ? "text-green-600" : "text-destructive"
										}
									>
										{netResult.toFixed(2)} €
									</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				<Card className="app-panel-card app-table-card">
					<CardHeader className="border-b py-3 px-4">
						<strong>Quote-part par co-bailleur — {year}</strong>
					</CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Co-bailleur</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Parts</TableHead>
									<TableHead>Quote-part</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{byAssociate.length === 0 ? (
									<TableEmptyRow colSpan={4} message="Aucun co-bailleur" />
								) : (
									byAssociate.map((a) => (
										<TableRow key={a.id}>
											<TableCell>
												{a.civility || ""} {a.firstname} {a.lastname}
											</TableCell>
											<TableCell>
												<Badge
													variant={
														a.role === "Gérant" ? "default" : "secondary"
													}
												>
													{a.role}
												</Badge>
											</TableCell>
											<TableCell>{a.share.toFixed(2)} %</TableCell>
											<TableCell>
												<strong
													className={
														a.allocated >= 0
															? "text-green-600"
															: "text-destructive"
													}
												>
													{a.allocated.toFixed(2)} €
												</strong>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>

			<Card className="mb-4 app-panel-card app-table-card">
				<CardHeader className="border-b py-3 px-4">
					<strong>Detail des loyers percus — {year}</strong>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Locataire</TableHead>
								<TableHead>Bien</TableHead>
								<TableHead>Periode</TableHead>
								<TableHead>Date paiement</TableHead>
								<TableHead>Montant</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{yearPayments.length === 0 ? (
								<TableEmptyRow
									colSpan={5}
									message={`Aucun loyer percu pour ${year}`}
								/>
							) : (
								yearPayments.map((p) => (
									<TableRow key={p.id}>
										<TableCell>
											{p.Tenant
												? `${p.Tenant.firstname} ${p.Tenant.lastname}`
												: "-"}
										</TableCell>
										<TableCell>
											{p.Property
												? `${p.Property.type} - ${p.Property.city}`
												: "-"}
										</TableCell>
										<TableCell>{p.month || "-"}</TableCell>
										<TableCell>
											{DateUtils.formatShort(p.paid_date) || "-"}
										</TableCell>
										<TableCell>
											{Number.parseFloat(p.amount || 0).toFixed(2)} €
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Card className="app-panel-card app-table-card">
				<CardHeader className="border-b py-3 px-4">
					<strong>Detail des charges deductibles — {year}</strong>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Type</TableHead>
								<TableHead>Description</TableHead>
								<TableHead>Bien</TableHead>
								<TableHead>Frequence</TableHead>
								<TableHead>Montant annualise</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{yearCharges.length === 0 ? (
								<TableEmptyRow
									colSpan={5}
									message={`Aucune charge deductible pour ${year}`}
								/>
							) : (
								yearCharges.map((c) => {
									const a = Number.parseFloat(c.amount || 0);
									return (
										<TableRow key={c.id}>
											<TableCell>{c.type}</TableCell>
											<TableCell>{c.description || "-"}</TableCell>
											<TableCell>
												{c.Property
													? `${c.Property.type} - ${c.Property.city}`
													: "General"}
											</TableCell>
											<TableCell>{c.frequency}</TableCell>
											<TableCell>{a.toFixed(2)} €</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</>
	);
};

export default Declarations;
