import { AppAlert } from "@/components/ui/app-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
	ArcElement,
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LinearScale,
	Tooltip,
} from "chart.js";
import {
	AlertTriangle,
	Calendar,
	Euro,
	FileText,
	Home,
	TrendingDown,
	TrendingUp,
	User,
	Wrench,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { DateUtils } from "src/utils/date";
import AuthService from "../../services/auth.service";
import ChargeDataService from "../../services/charge.service";
import LeaseDataService from "../../services/lease.service";
import MaintenanceDataService from "../../services/maintenance.service";
import OwnerConfigDataService, {
	type OwnerConfigData,
} from "../../services/owner_config.service";
import PaymentDataService from "../../services/payment.service";
import PropertyDataService from "../../services/property.service";
import TenantDataService from "../../services/tenant.service";
import VisitDataService from "../../services/visit.service";
import {
	type RootState,
	setOwnerProfileType,
	updatePreferences,
} from "../../store";
import SettingsOnboarding from "../admin/settings/SettingsOnboarding";

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	ArcElement,
	Tooltip,
	Legend,
);

const chargeTypeLabel: Record<string, string> = {
	assurance: "Assurance",
	taxe_fonciere: "Taxe foncière",
	entretien: "Entretien",
	travaux: "Travaux",
	charges_copro: "Charges copro",
	frais_gestion: "Frais gestion",
	autre: "Autre",
};
const CURRENT_YEAR = new Date().getFullYear().toString();
const parseAmount = (v: unknown) => Number.parseFloat(String(v || 0)) || 0;
// biome-ignore lint/suspicious/noExplicitAny: données API non typées
const toPaymentMonthKey = (p: any): string | null => {
	for (const field of [p.paid_date, p.due_date, p.month]) {
		const k = (field || "").slice(0, 7);
		if (/^\d{4}-\d{2}$/.test(k)) return k;
	}
	return null;
};
// biome-ignore lint/suspicious/noExplicitAny: données API non typées
const toPaymentYear = (p: any) => {
	const k = toPaymentMonthKey(p);
	return k ? k.slice(0, 4) : null;
};
// biome-ignore lint/suspicious/noExplicitAny: données API non typées
const toChargeYear = (c: any) => {
	const v = (c.date || "").slice(0, 4);
	return /^\d{4}$/.test(v) ? v : null;
};
const fmt = (n: number) => `${n.toFixed(0)} €`;
const CHARGE_COLORS = [
	"#6366f1",
	"#f43f5e",
	"#10b981",
	"#8b5cf6",
	"#f59e0b",
	"#64748b",
	"#06b6d4",
];

// ── Donut legend (horizontal layout) ─────────────────────────────────────────
const DonutLegend = ({
	items,
}: {
	items: { color: string; label: string; amount: number; total: number }[];
}) => (
	<div className="flex-1 flex flex-col justify-center gap-3 min-w-0">
		{items.map(({ color, label, amount, total }) => {
			const pct = total > 0 ? (amount / total) * 100 : 0;
			return (
				<div key={label} className="min-w-0">
					<div className="flex items-center justify-between gap-2 mb-1">
						<div className="flex items-center gap-1.5 min-w-0">
							<span
								className="w-2 h-2 rounded-full shrink-0"
								style={{ background: color }}
							/>
							<span className="text-xs text-muted-foreground truncate">
								{label}
							</span>
						</div>
						<div className="flex items-baseline gap-1 shrink-0">
							<span className="text-xs font-bold tabular-nums">
								{amount.toFixed(0)} €
							</span>
							<span className="text-[0.6rem] text-muted-foreground/50">
								{pct.toFixed(0)}%
							</span>
						</div>
					</div>
					<div className="h-1 rounded-full bg-muted overflow-hidden">
						<div
							className="h-full rounded-full transition-all duration-700"
							style={{ width: `${pct}%`, background: color }}
						/>
					</div>
				</div>
			);
		})}
	</div>
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
	const dispatch = useDispatch();
	const user = useSelector((state: RootState) => state.auth.user);
	// biome-ignore lint/suspicious/noExplicitAny: données API sans modèle TypeScript partagé
	const [properties, setProperties] = useState<any[]>([]);
	// biome-ignore lint/suspicious/noExplicitAny: données API sans modèle TypeScript partagé
	const [tenants, setTenants] = useState<any[]>([]);
	// biome-ignore lint/suspicious/noExplicitAny: données API sans modèle TypeScript partagé
	const [leases, setLeases] = useState<any[]>([]);
	// biome-ignore lint/suspicious/noExplicitAny: données API sans modèle TypeScript partagé
	const [payments, setPayments] = useState<any[]>([]);
	// biome-ignore lint/suspicious/noExplicitAny: données API sans modèle TypeScript partagé
	const [charges, setCharges] = useState<any[]>([]);
	// biome-ignore lint/suspicious/noExplicitAny: données API sans modèle TypeScript partagé
	const [visits, setVisits] = useState<any[]>([]);
	// biome-ignore lint/suspicious/noExplicitAny: données API sans modèle TypeScript partagé
	const [maintenances, setMaintenances] = useState<any[]>([]);
	const [ownerConfig, setOwnerConfig] = useState<OwnerConfigData>({
		owner_profile_type: "INDIVIDUAL",
	});
	const [googleConnected, setGoogleConnected] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const [onboardingSaving, setOnboardingSaving] = useState(false);
	const [onboardingSaved, setOnboardingSaved] = useState(false);
	const [onboardingError, setOnboardingError] = useState<string | null>(null);
	const [showOnboardingModal, setShowOnboardingModal] = useState(false);
	const [onboardingDismissed, setOnboardingDismissed] = useState(false);
	const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();

	useEffect(() => {
		Promise.all([
			PropertyDataService.getAll(),
			TenantDataService.getAll(),
			LeaseDataService.getAll(),
			PaymentDataService.getAll(),
			ChargeDataService.getAll(),
			VisitDataService.getAll(),
			OwnerConfigDataService.get(),
			VisitDataService.getGoogleStatus(),
			MaintenanceDataService.getAll(),
		])
			.then(([p, t, l, pay, chg, vis, ownerRes, googleRes, maint]) => {
				setProperties(p.data);
				// biome-ignore lint/suspicious/noExplicitAny: données API non typées
				setTenants(t.data.filter((x: any) => x.is_active !== false));
				setLeases(l.data);
				setPayments(pay.data);
				setCharges(chg.data);
				setVisits(vis.data);
				setOwnerConfig({ owner_profile_type: "INDIVIDUAL", ...ownerRes.data });
				setGoogleConnected(Boolean(googleRes.data?.connected));
				setMaintenances(maint.data);
			})
			.catch(console.error)
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		setOnboardingDismissed(
			window.localStorage.getItem("dashboard_onboarding_dismissed_v1") === "1",
		);
	}, []);

	const isOnboardingIncomplete = () => {
		const pt = ownerConfig.owner_profile_type || "INDIVIDUAL";
		const hasName = Boolean(ownerConfig.name?.trim());
		const hasSiret =
			(pt !== "PROFESSIONAL" && pt !== "SCI") ||
			(ownerConfig.siret || "").replace(/\D/g, "").length === 14;
		return !(
			hasName &&
			hasSiret &&
			Boolean(ownerConfig.smtp_host && ownerConfig.smtp_user)
		);
	};

	const shouldShowOnboardingPrompt =
		!onboardingDismissed && isOnboardingIncomplete();

	const isDarkTheme = document.documentElement.classList.contains("dark");
	const chartTextColor = isDarkTheme ? "#94a3b8" : "#64748b";
	const chartGridColor = isDarkTheme
		? "rgba(148,163,184,0.1)"
		: "rgba(100,116,139,0.1)";

	const handleSaveOnboarding = async () => {
		setOnboardingSaving(true);
		setOnboardingSaved(false);
		setOnboardingError(null);
		try {
			const fd = new FormData();
			for (const [k, v] of Object.entries(ownerConfig)) {
				if (v != null && k !== "id") fd.append(k, String(v));
			}
			const r = await OwnerConfigDataService.update(fd);
			setOwnerConfig(r.data);
			setOnboardingSaved(true);
			if (r.data.owner_profile_type)
				// biome-ignore lint/suspicious/noExplicitAny: cast nécessaire pour le type du store
				dispatch(setOwnerProfileType(r.data.owner_profile_type as any));
			const d = r.data;
			const done =
				Boolean(d.name?.trim()) &&
				((d.owner_profile_type !== "PROFESSIONAL" &&
					d.owner_profile_type !== "SCI") ||
					(d.siret || "").replace(/\D/g, "").length === 14) &&
				Boolean(d.smtp_host && d.smtp_user);
			if (done) {
				setShowOnboardingModal(false);
				setOnboardingDismissed(true);
				window.localStorage.setItem("dashboard_onboarding_dismissed_v1", "1");
			}
			// biome-ignore lint/suspicious/noExplicitAny: accès à la réponse d'erreur axios
		} catch (e: any) {
			setOnboardingError(
				e?.response?.data?.message ||
					e?.message ||
					"Erreur lors de la sauvegarde.",
			);
		} finally {
			setOnboardingSaving(false);
		}
	};

	const handleGoogleConnect = async () => {
		setGoogleLoading(true);
		try {
			const { data } = await VisitDataService.getGoogleAuthUrl();
			window.location.href = data.url;
		} finally {
			setGoogleLoading(false);
		}
	};

	const handleReopenOnboarding = () => {
		setOnboardingDismissed(false);
		window.localStorage.removeItem("dashboard_onboarding_dismissed_v1");
		setShowOnboardingModal(true);
	};

	const persistOnboardingTestStatus = async (status: {
		google: boolean;
		email: boolean;
	}) => {
		try {
			const fd = new FormData();
			fd.append("onboardingGoogleConnectionVerified", String(status.google));
			fd.append("onboardingEmailConnectionVerified", String(status.email));
			const { data } = await AuthService.updatePreferences(fd);
			if (data?.preferences) dispatch(updatePreferences(data.preferences));
		} catch (_) {}
	};

	// ── Computed ─────────────────────────────────────────────────────────────
	const yearOptions = Array.from(
		new Set(
			[...payments.map(toPaymentYear), ...charges.map(toChargeYear)].filter(
				Boolean,
			) as string[],
		),
	).sort((a, b) => b.localeCompare(a));

	const isAll = selectedYear === "all";
	const paymentsInScope = payments.filter(
		(p) => isAll || toPaymentYear(p) === selectedYear,
	);
	const chargesInScope = charges.filter(
		(c) => isAll || toChargeYear(c) === selectedYear,
	);
	const activeLeases = leases.filter((l) => l.status === "active");
	const openMaintenances = maintenances.filter(
		(m) => m.status === "open" || m.status === "in_progress",
	);
	const upcomingVisits = visits.filter((v) => {
		if (v.status && v.status !== "scheduled") return false;
		if (!isAll && (v.date || "").slice(0, 4) !== selectedYear) return false;
		const dt = new Date(`${v.date}T${v.time || "00:00"}:00`);
		return !Number.isNaN(dt.getTime()) && dt >= new Date();
	});

	const paidPayments = paymentsInScope.filter((p) => p.status === "paid");
	const totalPaid = paidPayments.reduce((s, p) => s + parseAmount(p.amount), 0);
	const totalPending = paymentsInScope
		.filter((p) => p.status === "pending" || p.status === "late")
		.reduce((s, p) => s + parseAmount(p.amount), 0);
	const totalExpected = paymentsInScope.reduce(
		(s, p) => s + parseAmount(p.amount),
		0,
	);
	const totalCharges = chargesInScope.reduce(
		(s, c) => s + parseAmount(c.amount),
		0,
	);
	const netBalance = totalPaid - totalCharges;
	const totalLate = paymentsInScope.filter((p) => p.status === "late").length;
	const recoveryRate =
		totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0;

	const paidByMonth: Record<string, number> = {};
	for (const p of paidPayments) {
		const k = toPaymentMonthKey(p);
		if (k) paidByMonth[k] = (paidByMonth[k] || 0) + parseAmount(p.amount);
	}
	const chargesByMonth: Record<string, number> = {};
	for (const c of chargesInScope) {
		const k = (c.date || "").slice(0, 7);
		if (/^\d{4}-\d{2}$/.test(k))
			chargesByMonth[k] = (chargesByMonth[k] || 0) + parseAmount(c.amount);
	}

	const chartMonthKeys = isAll
		? Array.from(
				new Set([...Object.keys(paidByMonth), ...Object.keys(chargesByMonth)]),
			)
				.sort()
				.slice(-12)
		: Array.from(
				{ length: 12 },
				(_, i) => `${selectedYear}-${String(i + 1).padStart(2, "0")}`,
			);

	const paidChartData = chartMonthKeys.map((k) => paidByMonth[k] || 0);
	const chargesChartData = chartMonthKeys.map((k) => chargesByMonth[k] || 0);

	const chargeTypeEntries = Object.entries(
		// biome-ignore lint/suspicious/noExplicitAny: données API non typées
		chargesInScope.reduce((acc: Record<string, number>, c: any) => {
			const t = c.type || "autre";
			acc[t] = (acc[t] || 0) + parseAmount(c.amount);
			return acc;
		}, {}),
	)
		.map(([t, a]) => [t, Number(a)] as [string, number])
		.sort((a, b) => b[1] - a[1]);

	const hasRentData = totalPaid > 0 || totalPending > 0;
	const hasChargeData = chargeTypeEntries.some(([, a]) => a > 0);

	const propertyMap = Object.fromEntries(
		properties.map((p) => [String(p.id), p]),
	);
	const tenantMap = Object.fromEntries(tenants.map((t) => [String(t.id), t]));
	const leaseMap = Object.fromEntries(leases.map((l) => [String(l.id), l]));

	const recentPayments = [...paymentsInScope]
		.sort((a, b) => {
			const da = a.paid_date || a.due_date || a.month || "";
			const db = b.paid_date || b.due_date || b.month || "";
			return db.localeCompare(da);
		})
		.slice(0, 5);

	const nextVisits = [...upcomingVisits]
		.sort((a, b) => {
			const da = `${a.date}T${a.time || "00:00"}`;
			const db = `${b.date}T${b.time || "00:00"}`;
			return da.localeCompare(db);
		})
		.slice(0, 4);

	const expiringLeases = activeLeases
		.filter((l) => {
			if (!l.end_date) return false;
			const daysLeft = (new Date(l.end_date).getTime() - Date.now()) / 86400000;
			return daysLeft >= 0 && daysLeft <= 90;
		})
		// biome-ignore lint/suspicious/noExplicitAny: données API non typées
		.sort((a: any, b: any) => a.end_date.localeCompare(b.end_date))
		.slice(0, 4);

	// Gradient factory for bar chart
	const makeGradient = (
		ctx: CanvasRenderingContext2D,
		// biome-ignore lint/suspicious/noExplicitAny: type Chart.js non exporté
		chartArea: any,
		colorTop: string,
		colorBot: string,
	) => {
		const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
		g.addColorStop(0, colorTop);
		g.addColorStop(1, colorBot);
		return g;
	};

	if (loading) {
		return (
			<div
				className="flex justify-center items-center"
				style={{ minHeight: 300 }}
			>
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<>
			{/* ── Hero dark ──────────────────────────────────────────────── */}
			<div
				className="relative rounded-2xl overflow-hidden mb-6"
				style={{
					background:
						"linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)",
				}}
			>
				{/* Glow decorations */}
				<div
					className="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
					style={{
						background: "radial-gradient(circle, #6366f1, transparent)",
					}}
				/>
				<div
					className="absolute -bottom-10 right-8 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none"
					style={{
						background: "radial-gradient(circle, #10b981, transparent)",
					}}
				/>

				{/* Header row */}
				<div className="relative flex items-start justify-between gap-4 px-6 pt-5 pb-0">
					<div>
						<h1 className="text-xl font-bold text-white tracking-tight">
							Tableau de bord
						</h1>
						<p className="text-slate-400 text-sm mt-0.5">
							{properties.length} bien{properties.length > 1 ? "s" : ""} ·{" "}
							{activeLeases.length} {activeLeases.length > 1 ? "baux" : "bail"}{" "}
							actif{activeLeases.length > 1 ? "s" : ""} ·{" "}
							{selectedYear === "all" ? "Toutes périodes" : selectedYear}
						</p>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						<Select value={selectedYear} onValueChange={setSelectedYear}>
							<SelectTrigger className="w-44 h-8 text-sm bg-white/10 border-white/20 text-white [&>svg]:text-white/50 hover:bg-white/15">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={CURRENT_YEAR}>
									Année en cours ({CURRENT_YEAR})
								</SelectItem>
								{yearOptions
									.filter((y) => y !== CURRENT_YEAR)
									.map((y) => (
										<SelectItem key={y} value={y}>
											{y}
										</SelectItem>
									))}
								<SelectItem value="all">Tout voir</SelectItem>
							</SelectContent>
						</Select>
						<Button
							variant="ghost"
							size="sm"
							className="h-8 text-xs text-white/60 hover:text-white hover:bg-white/10 border border-white/10"
							onClick={handleReopenOnboarding}
						>
							Onboarding
						</Button>
					</div>
				</div>

				{/* Financial KPIs strip */}
				<div className="relative grid grid-cols-2 sm:grid-cols-4 mt-5 border-t border-white/10">
					{[
						{
							key: "enc",
							label: "Encaissé",
							value: fmt(totalPaid),
							sub: "Loyers perçus",
							color: "#10b981",
						},
						{
							key: "dep",
							label: "Dépenses",
							value: fmt(totalCharges),
							sub: "Charges payées",
							color: "#f43f5e",
						},
						{
							key: "bal",
							label: "Balance",
							value: fmt(netBalance),
							sub: "Résultat net",
							color: netBalance >= 0 ? "#10b981" : "#f43f5e",
						},
						{
							key: "rec",
							label: "Recouvrement",
							value: `${recoveryRate.toFixed(0)} %`,
							sub:
								totalLate > 0
									? `${totalLate} retard${totalLate > 1 ? "s" : ""}`
									: "À jour",
							color:
								recoveryRate >= 90
									? "#10b981"
									: recoveryRate >= 70
										? "#f59e0b"
										: "#f43f5e",
						},
					].map(({ key, label, value, sub, color }, i) => (
						<div
							key={key}
							className={cn(
								"px-6 py-4",
								i % 2 === 0 && i < 3 && "border-r border-white/10",
								i < 2 && "border-b border-white/10 sm:border-b-0",
								i < 3 && "sm:border-r sm:border-white/10",
							)}
						>
							<div
								className="text-lg font-bold uppercase tracking-widest mb-1.5"
								style={{ color: `${color}80` }}
							>
								{label}
							</div>
							<div
								className="text-2xl font-extrabold tabular-nums leading-none tracking-tight"
								style={{ color }}
							>
								{value}
							</div>
							<div className="text-xs mt-1 text-slate-500">{sub}</div>
						</div>
					))}
				</div>
			</div>

			{/* ── Onboarding banner ─────────────────────────────────────── */}
			{shouldShowOnboardingPrompt && (
				<div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/50 px-4 py-3 mb-5 gap-4">
					<div className="flex items-center gap-2.5 min-w-0">
						<AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
						<span className="text-sm text-amber-800 dark:text-amber-300">
							Configuration incomplète — finalisez pour activer toutes les
							fonctionnalités.
						</span>
					</div>
					<Button
						size="sm"
						variant="outline"
						className="h-7 text-xs shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
						onClick={() => setShowOnboardingModal(true)}
					>
						Configurer
					</Button>
				</div>
			)}

			{/* ── Operational KPIs ──────────────────────────────────────── */}
			<div className="flex gap-4 mb-4 text-center w-full justify-content-center flex-direction-column">
				{[
					{
						label: "Biens",
						value: properties.length,
						sub: `${properties.length !== 1 ? "Biens dans" : "Bien dans"} le parc`,
						icon: Home,
						color: "#6366f1",
						path: "/admin/properties",
					},
					{
						label: "Locataires",
						value: tenants.length,
						sub: `Actif${tenants.length !== 1 ? "s" : ""}`,
						icon: User,
						color: "#0ea5e9",
						path: "/admin/tenants",
					},
					{
						label: "Baux",
						value: activeLeases.length,
						sub: "En cours",
						icon: FileText,
						color: "#10b981",
						path: "/admin/leases",
					},
					{
						label: "Visites",
						value: upcomingVisits.length,
						sub: "À venir",
						icon: Calendar,
						color: "#f59e0b",
						path: "/admin/visits",
					},
					{
						label: "Signalements",
						value: openMaintenances.length,
						sub: "En cours",
						icon: Wrench,
						color: "#f43f5e",
						path: "/admin/maintenance",
					},
				].map(({ label, value, sub, icon: Icon, color, path }) => (
					<button
						type="button"
						key={label}
						onClick={() => navigate(path)}
						className="flex justify-center relative rounded-xl bg-card border text-left w-full cursor-pointer select-none overflow-hidden transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 group"
					>
						{/* Colored top line */}
						<div
							className="absolute inset-x-0 top-0 h-0.5 transition-opacity group-hover:opacity-80"
							style={{
								background: `linear-gradient(90deg, ${color}, ${color}50)`,
							}}
						/>
						<div className="p-4 pt-4">
							<div className="flex items-start justify-between mb-3 gap-2">
								<div
									className="flex items-center justify-center rounded-xl w-9 h-9"
									style={{ background: `${color}15`, color }}
								>
									<Icon className="h-4 w-4" />
								</div>
								<span className="font-bold uppercase tracking-widest text-muted-foreground/40 mt-0.5 text-lg text-secondary">
									{label}
								</span>
							</div>
							<div className="flex justify-center gap-2 align-bottom items-end text-3xl font-extrabold tabular-nums leading-none tracking-tight">
								{value}
								<div className="text-xs text-muted-foreground mt-1.5">
									{sub}
								</div>
							</div>
						</div>
					</button>
				))}
			</div>

			{/* ── Bar chart + résumé ────────────────────────────────────── */}
			<div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
				<div className="md:col-span-8">
					<Card className="h-full">
						<CardHeader className="border-b py-3 px-5">
							<div className="flex items-center justify-between">
								<span className="font-semibold text-sm">Loyers vs charges</span>
								<div className="flex items-center gap-4 text-xs text-muted-foreground">
									<span className="flex items-center gap-1.5">
										<span
											className="w-2.5 h-2.5 rounded-sm"
											style={{ background: "#10b981" }}
										/>
										Loyers
									</span>
									<span className="flex items-center gap-1.5">
										<span
											className="w-2.5 h-2.5 rounded-sm"
											style={{ background: "#f43f5e" }}
										/>
										Charges
									</span>
								</div>
							</div>
						</CardHeader>
						<CardContent className="pt-4">
							{chartMonthKeys.length === 0 ? (
								<div
									className="flex items-center justify-center text-muted-foreground text-sm"
									style={{ height: 280 }}
								>
									Aucune donnée pour cette période
								</div>
							) : (
								<Bar
									data={{
										labels: chartMonthKeys.map((k) =>
											DateUtils.formatMonthYear(k),
										),
										datasets: [
											{
												label: "Loyers perçus",
												// biome-ignore lint/suspicious/noExplicitAny: type Chart.js non exporté
												backgroundColor: (ctx: any) => {
													const { chart } = ctx;
													const { chartArea, ctx: c } = chart;
													if (!chartArea) return "rgba(16,185,129,0.8)";
													const g = c.createLinearGradient(
														0,
														chartArea.top,
														0,
														chartArea.bottom,
													);
													g.addColorStop(0, "rgba(16,185,129,0.9)");
													g.addColorStop(1, "rgba(16,185,129,0.15)");
													return g;
												},
												borderColor: "rgba(16,185,129,0)",
												borderWidth: 0,
												borderRadius: 5,
												borderSkipped: false,
												data: paidChartData,
											},
											{
												label: "Charges payées",
												// biome-ignore lint/suspicious/noExplicitAny: type Chart.js non exporté
												backgroundColor: (ctx: any) => {
													const { chart } = ctx;
													const { chartArea, ctx: c } = chart;
													if (!chartArea) return "rgba(244,63,94,0.7)";
													const g = c.createLinearGradient(
														0,
														chartArea.top,
														0,
														chartArea.bottom,
													);
													g.addColorStop(0, "rgba(244,63,94,0.85)");
													g.addColorStop(1, "rgba(244,63,94,0.1)");
													return g;
												},
												borderWidth: 0,
												borderRadius: 5,
												borderSkipped: false,
												data: chargesChartData,
											},
										],
									}}
									options={{
										maintainAspectRatio: false,
										plugins: {
											legend: { display: false },
											tooltip: {
												backgroundColor: isDarkTheme ? "#1e293b" : "#fff",
												titleColor: chartTextColor,
												bodyColor: chartTextColor,
												borderColor: isDarkTheme ? "#334155" : "#f1f5f9",
												borderWidth: 1,
												padding: 12,
												cornerRadius: 8,
												callbacks: {
													// biome-ignore lint/suspicious/noExplicitAny: type Chart.js non exporté
													label: (ctx: any) =>
														` ${ctx.dataset.label} : ${(ctx.parsed.y || 0).toFixed(0)} €`,
													// biome-ignore lint/suspicious/noExplicitAny: type Chart.js non exporté
													afterBody: (items: any[]) => {
														const i = items?.[0]?.dataIndex ?? 0;
														return [
															"",
															` Balance : ${((paidChartData[i] || 0) - (chargesChartData[i] || 0)).toFixed(0)} €`,
														];
													},
												},
											},
										},
										scales: {
											x: {
												ticks: { color: chartTextColor, font: { size: 11 } },
												grid: { display: false },
												border: { display: false },
											},
											y: {
												beginAtZero: true,
												ticks: { color: chartTextColor, font: { size: 11 } },
												grid: { color: chartGridColor },
												border: { display: false },
											},
										},
									}}
									style={{ height: 280 }}
								/>
							)}
						</CardContent>
					</Card>
				</div>

				<div className="md:col-span-4">
					<Card className="h-full">
						<CardHeader className="border-b py-3 px-5">
							<span className="font-semibold text-sm">Résumé financier</span>
						</CardHeader>
						<CardContent className="pt-0">
							{[
								{
									label: "Loyers perçus",
									value: totalPaid,
									cls: "text-emerald-500",
								},
								{
									label: "Charges payées",
									value: totalCharges,
									cls: "text-rose-500",
								},
								{
									label: "Balance nette",
									value: netBalance,
									cls: netBalance >= 0 ? "text-emerald-500" : "text-rose-500",
								},
								{
									label: "En attente / retard",
									value: totalPending,
									cls: "text-amber-500",
								},
								{
									label: "Total attendu",
									value: totalExpected,
									cls: "text-foreground",
								},
							].map(({ label, value, cls }) => (
								<div
									key={label}
									className="flex justify-between items-center py-3 border-b last:border-0"
								>
									<span className="text-sm text-muted-foreground">{label}</span>
									<span
										className={cn("text-sm font-semibold tabular-nums", cls)}
									>
										{value.toFixed(0)} €
									</span>
								</div>
							))}

							{totalExpected > 0 && (
								<div className="mt-4 pt-1">
									<div className="flex justify-between items-baseline mb-2">
										<span className="text-xs text-muted-foreground">
											Taux de recouvrement
										</span>
										<span className="text-base font-bold tabular-nums">
											{recoveryRate.toFixed(0)} %
										</span>
									</div>
									<div className="h-2 rounded-full bg-muted overflow-hidden">
										<div
											className="h-full rounded-full transition-all duration-700"
											style={{
												width: `${Math.min(recoveryRate, 100)}%`,
												background:
													recoveryRate >= 90
														? "linear-gradient(90deg, #10b981, #34d399)"
														: recoveryRate >= 70
															? "linear-gradient(90deg, #f59e0b, #fbbf24)"
															: "linear-gradient(90deg, #f43f5e, #fb7185)",
											}}
										/>
									</div>
								</div>
							)}

							{totalLate > 0 && (
								<div className="flex items-center gap-2 mt-4 px-3 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50">
									<AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
									<span className="text-xs text-rose-700 dark:text-rose-400">
										{totalLate} paiement{totalLate > 1 ? "s" : ""} en retard
									</span>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>

			{/* ── Donuts ────────────────────────────────────────────────── */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
				{/* Loyers */}
				<Card>
					<CardHeader className="border-b py-3 px-5">
						<span className="font-semibold text-sm">
							Répartition des loyers
						</span>
					</CardHeader>
					<CardContent className="pt-5 pb-5">
						{!hasRentData ? (
							<div className="flex items-center justify-center text-sm text-muted-foreground py-12">
								Aucune donnée de loyer pour cette période
							</div>
						) : (
							<div className="flex items-center gap-6">
								<div
									className="relative shrink-0"
									style={{ width: 148, height: 148 }}
								>
									<Doughnut
										data={{
											labels: ["Perçus", "En attente / retard"],
											datasets: [
												{
													data: [totalPaid, totalPending],
													backgroundColor: ["#10b981", "#f59e0b"],
													borderColor: isDarkTheme ? "#0f172a" : "#fff",
													borderWidth: 3,
													hoverOffset: 8,
												},
											],
										}}
										options={{
											plugins: {
												legend: { display: false },
												tooltip: {
													backgroundColor: isDarkTheme ? "#1e293b" : "#fff",
													titleColor: chartTextColor,
													bodyColor: chartTextColor,
													borderColor: isDarkTheme ? "#334155" : "#f1f5f9",
													borderWidth: 1,
													padding: 10,
													cornerRadius: 8,
													callbacks: {
														// biome-ignore lint/suspicious/noExplicitAny: type Chart.js non exporté
														label: (ctx: any) =>
															` ${ctx.label} : ${(ctx.raw || 0).toFixed(0)} €`,
													},
												},
											},
										}}
										style={{ height: 148 }}
									/>
									<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
										<div className="text-lg font-extrabold tabular-nums leading-none">
											{totalPaid.toFixed(0)}
										</div>
										<div className="text-[0.6rem] text-muted-foreground mt-0.5 font-medium tracking-wide">
											€ perçus
										</div>
									</div>
								</div>
								<DonutLegend
									items={[
										{
											color: "#10b981",
											label: "Perçus",
											amount: totalPaid,
											total: totalPaid + totalPending,
										},
										{
											color: "#f59e0b",
											label: "En attente / retard",
											amount: totalPending,
											total: totalPaid + totalPending,
										},
									]}
								/>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Charges */}
				<Card>
					<CardHeader className="border-b py-3 px-5">
						<span className="font-semibold text-sm">
							Répartition des charges
						</span>
					</CardHeader>
					<CardContent className="pt-5 pb-5">
						{!hasChargeData ? (
							<div className="flex items-center justify-center text-sm text-muted-foreground py-12">
								Aucune charge pour cette période
							</div>
						) : (
							<div className="flex items-center gap-6">
								<div
									className="relative shrink-0"
									style={{ width: 148, height: 148 }}
								>
									<Doughnut
										data={{
											labels: chargeTypeEntries.map(
												([t]) => chargeTypeLabel[t] || t,
											),
											datasets: [
												{
													data: chargeTypeEntries.map(([, a]) => a),
													backgroundColor: CHARGE_COLORS,
													borderColor: isDarkTheme ? "#0f172a" : "#fff",
													borderWidth: 3,
													hoverOffset: 8,
												},
											],
										}}
										options={{
											plugins: {
												legend: { display: false },
												tooltip: {
													backgroundColor: isDarkTheme ? "#1e293b" : "#fff",
													titleColor: chartTextColor,
													bodyColor: chartTextColor,
													borderColor: isDarkTheme ? "#334155" : "#f1f5f9",
													borderWidth: 1,
													padding: 10,
													cornerRadius: 8,
													callbacks: {
														// biome-ignore lint/suspicious/noExplicitAny: type Chart.js non exporté
														label: (ctx: any) =>
															` ${ctx.label} : ${(ctx.raw || 0).toFixed(0)} €`,
													},
												},
											},
										}}
										style={{ height: 148 }}
									/>
									<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
										<div className="text-lg font-extrabold tabular-nums leading-none">
											{totalCharges.toFixed(0)}
										</div>
										<div className="text-[0.6rem] text-muted-foreground mt-0.5 font-medium tracking-wide">
											€ total
										</div>
									</div>
								</div>
								<DonutLegend
									items={chargeTypeEntries.slice(0, 6).map(([t, a], i) => ({
										color: CHARGE_COLORS[i] ?? "#64748b",
										label: chargeTypeLabel[t] || t,
										amount: a,
										total: totalCharges,
									}))}
								/>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* ── Activité récente ──────────────────────────────────── */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
				{/* Paiements récents */}
				<Card>
					<CardHeader className="border-b py-3 px-5">
						<div className="flex items-center justify-between">
							<span className="font-semibold text-sm">Paiements récents</span>
							<Button
								variant="secondary"
								size="sm"
								className="h-6 text-xs text-muted-foreground px-2"
								onClick={() => navigate("/admin/payments")}
							>
								Voir tout
							</Button>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						{recentPayments.length === 0 ? (
							<div className="flex items-center justify-center text-sm text-muted-foreground py-10">
								Aucun paiement pour cette période
							</div>
						) : (
							<div className="divide-y">
								{/* biome-ignore lint/suspicious/noExplicitAny: données API non typées */}
								{recentPayments.map((p: any, i: number) => {
									const lease = leaseMap[String(p.lease_id)];
									const tenant = lease
										? tenantMap[String(lease.tenant_id)]
										: null;
									const property = lease
										? propertyMap[String(lease.property_id)]
										: null;
									const statusColor =
										p.status === "paid"
											? "#10b981"
											: p.status === "late"
												? "#f43f5e"
												: "#f59e0b";
									const statusLabel =
										p.status === "paid"
											? "Payé"
											: p.status === "late"
												? "En retard"
												: "En attente";
									const dateStr = p.paid_date || p.due_date || p.month || "";
									return (
										<div
											key={p.id ?? i}
											className="flex items-center justify-between px-5 py-3 gap-3"
										>
											<div className="flex items-center gap-3 min-w-0">
												<div
													className="flex items-center justify-center w-7 h-7 rounded-full shrink-0"
													style={{ background: `${statusColor}20` }}
												>
													<Euro
														className="h-3 w-3"
														style={{ color: statusColor }}
													/>
												</div>
												<div className="min-w-0">
													<div className="text-sm font-medium truncate">
														{tenant
															? `${tenant.first_name} ${tenant.last_name}`
															: property?.address || `Bail #${p.lease_id}`}
													</div>
													<div className="text-xs text-muted-foreground">
														{dateStr ? dateStr.slice(0, 7) : "—"}
													</div>
												</div>
											</div>
											<div className="flex flex-col items-end shrink-0">
												<span className="text-sm font-semibold tabular-nums">
													{parseAmount(p.amount).toFixed(0)} €
												</span>
												<span
													className="text-[0.65rem] font-medium"
													style={{ color: statusColor }}
												>
													{statusLabel}
												</span>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Prochaines visites + Baux expirant */}
				<div className="flex flex-col gap-4">
					<Card>
						<CardHeader className="border-b py-3 px-5">
							<div className="flex items-center justify-between">
								<span className="font-semibold text-sm">
									Prochaines visites
								</span>
								<Button
									variant="secondary"
									size="sm"
									className="h-6 text-xs text-muted-foreground px-2"
									onClick={() => navigate("/admin/visits")}
								>
									Voir tout
								</Button>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							{nextVisits.length === 0 ? (
								<div className="flex items-center justify-center text-sm text-muted-foreground py-6">
									Aucune visite planifiée
								</div>
							) : (
								<div className="divide-y">
									{/* biome-ignore lint/suspicious/noExplicitAny: données API non typées */}
									{nextVisits.map((v: any, i: number) => {
										const property = propertyMap[String(v.property_id)];
										return (
											<div
												key={v.id ?? i}
												className="flex items-center gap-3 px-5 py-2.5"
											>
												<div className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 bg-amber-100 dark:bg-amber-950/40">
													<Calendar className="h-3 w-3 text-amber-500" />
												</div>
												<div className="min-w-0 flex-1">
													<div className="text-sm font-medium truncate">
														{property?.address || `Bien #${v.property_id}`}
													</div>
													<div className="text-xs text-muted-foreground">
														{v.date}
														{v.time ? ` · ${v.time}` : ""}
													</div>
												</div>
												{v.contact_name && (
													<span className="text-xs text-muted-foreground truncate max-w-[100px] shrink-0">
														{v.contact_name}
													</span>
												)}
											</div>
										);
									})}
								</div>
							)}
						</CardContent>
					</Card>

					{expiringLeases.length > 0 && (
						<Card>
							<CardHeader className="border-b py-3 px-5">
								<div className="flex items-center justify-between">
									<span className="font-semibold text-sm">
										Baux expirant bientôt
									</span>
									<span className="text-[0.65rem] font-medium text-rose-500 uppercase tracking-wide">
										90 jours
									</span>
								</div>
							</CardHeader>
							<CardContent className="p-0">
								<div className="divide-y">
									{/* biome-ignore lint/suspicious/noExplicitAny: données API non typées */}
									{expiringLeases.map((l: any, i: number) => {
										const property = propertyMap[String(l.property_id)];
										const tenant = tenantMap[String(l.tenant_id)];
										const daysLeft = Math.ceil(
											(new Date(l.end_date).getTime() - Date.now()) / 86400000,
										);
										return (
											<div
												key={l.id ?? i}
												className="flex items-center gap-3 px-5 py-2.5"
											>
												<div className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 bg-rose-100 dark:bg-rose-950/40">
													<FileText className="h-3 w-3 text-rose-500" />
												</div>
												<div className="min-w-0 flex-1">
													<div className="text-sm font-medium truncate">
														{property?.address || `Bail #${l.id}`}
													</div>
													<div className="text-xs text-muted-foreground truncate">
														{tenant
															? `${tenant.first_name} ${tenant.last_name}`
															: ""}
													</div>
												</div>
												<div
													className={cn(
														"text-xs font-bold shrink-0 tabular-nums",
														daysLeft <= 30 ? "text-rose-500" : "text-amber-500",
													)}
												>
													J-{daysLeft}
												</div>
											</div>
										);
									})}
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			{/* ── Onboarding modal ──────────────────────────────────────── */}
			<Dialog
				open={showOnboardingModal}
				onOpenChange={(open) => !open && setShowOnboardingModal(false)}
			>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto app-onboarding-modal">
					<DialogHeader>
						<DialogTitle>Configuration initiale</DialogTitle>
					</DialogHeader>
					{onboardingSaved && (
						<AppAlert
							color="success"
							dismissible
							onClose={() => setOnboardingSaved(false)}
						>
							Configuration enregistrée.
						</AppAlert>
					)}
					{onboardingError && (
						<AppAlert
							color="danger"
							dismissible
							onClose={() => setOnboardingError(null)}
						>
							{onboardingError}
						</AppAlert>
					)}
					<SettingsOnboarding
						mode="modal"
						config={ownerConfig}
						setConfig={setOwnerConfig}
						onSave={handleSaveOnboarding}
						saving={onboardingSaving}
						googleConnected={googleConnected}
						googleLoading={googleLoading}
						onGoogleConnect={handleGoogleConnect}
						properties={properties}
						openTab={() => navigate("/admin/settings")}
						initialTestStatus={{
							google: !!user?.preferences?.onboardingGoogleConnectionVerified,
							email: !!user?.preferences?.onboardingEmailConnectionVerified,
						}}
						onPersistTestStatus={persistOnboardingTestStatus}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default Dashboard;
