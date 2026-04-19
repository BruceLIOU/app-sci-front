import { AppAlert } from "@/components/ui/app-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Lock, Unlock, XCircle } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import AssociateDataService from "../../../services/associate.service";
import OwnerConfigDataService, {
	type OwnerConfigData,
} from "../../../services/owner_config.service";
import PropertyDataService from "../../../services/property.service";
import VisitDataService from "../../../services/visit.service";
import { setOwnerProfileType } from "../../../store";
import http from "../../../utils/http-common";

interface Associate {
	id: number;
	civility: string;
	firstname: string;
	lastname: string;
	email: string | null;
	phone: string | null;
	role: string;
}

interface GoogleCalendar {
	id: string;
	summary: string;
	primary: boolean;
}

interface Property {
	id: number;
	name: string;
	address?: string;
	city?: string;
}

const TABS = ["owner", "google", "smtp", "imap", "cron"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = {
	owner: "Bailleurs",
	google: "Google Calendar",
	smtp: "Envoi de mail",
	imap: "Récup. mail Matera",
	cron: "Cron",
};

const Settings: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const [config, setConfig] = useState<OwnerConfigData>({});
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [gerants, setGerants] = useState<Associate[]>([]);
	const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendar[]>([]);
	const [googleConnected, setGoogleConnected] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const [googleCalendarsError, setGoogleCalendarsError] = useState(false);
	const [googleAlert, setGoogleAlert] = useState<{
		type: "success" | "danger" | "info";
		message: string;
	} | null>(null);
	const [activeTab, setActiveTab] = useState<Tab>("owner");
	const [showSmtpPass, setShowSmtpPass] = useState(false);
	const [showImapPass, setShowImapPass] = useState(false);
	const [properties, setProperties] = useState<Property[]>([]);
	const isSciProfile = (config.owner_profile_type || "INDIVIDUAL") === "SCI";
	const isIndividual =
		(config.owner_profile_type || "INDIVIDUAL") === "INDIVIDUAL";
	const isProfessional =
		(config.owner_profile_type || "INDIVIDUAL") === "PROFESSIONAL";

	const fetchGoogleCalendars = async () => {
		setGoogleCalendarsError(false);
		try {
			const rc = await http.get<GoogleCalendar[]>("/visits/google/calendars");
			setGoogleCalendars(rc.data);
		} catch (e: any) {
			const msg = e?.response?.data?.message || e.message || "";
			console.error("fetchGoogleCalendars error:", msg);
			setGoogleCalendarsError(true);
			setGoogleAlert({
				type: "danger",
				message: `Erreur chargement calendriers : ${msg}`,
			});
		}
	};

	useEffect(() => {
		OwnerConfigDataService.get()
			.then((r) => setConfig({ owner_profile_type: "INDIVIDUAL", ...r.data }))
			.catch(() => {});

		AssociateDataService.getAll()
			.then((r) => {
				const all: Associate[] = r.data;
				setGerants(
					all.filter(
						(a) =>
							a.role === "Gérant" ||
							a.role === "Gérant associé" ||
							a.role === "Bailleur principal",
					),
				);
			})
			.catch(() => {});

		VisitDataService.getGoogleStatus()
			.then((r) => {
				setGoogleConnected(r.data.connected);
				if (r.data.connected) fetchGoogleCalendars();
			})
			.catch(() => {});

		PropertyDataService.getAll()
			.then((r) => setProperties(r.data))
			.catch(() => {});
	}, []);

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const google = params.get("google");
		if (google === "success") {
			setGoogleConnected(true);
			setGoogleAlert({
				type: "success",
				message: "Google Calendar connecté avec succès !",
			});
			fetchGoogleCalendars();
			navigate("/admin/settings", { replace: true });
		} else if (google === "error") {
			setGoogleAlert({
				type: "danger",
				message:
					"Échec de la connexion à Google Calendar. Vérifiez vos identifiants OAuth.",
			});
			navigate("/admin/settings", { replace: true });
		}
	}, [location.search, navigate]);

	const handleGoogleReconnect = async () => {
		setGoogleLoading(true);
		try {
			await VisitDataService.disconnectGoogle();
			setGoogleConnected(false);
			setGoogleCalendars([]);
			setGoogleCalendarsError(false);
			setConfig((prev) => ({ ...prev, google_calendar_id: null }));
			const { data } = await VisitDataService.getGoogleAuthUrl();
			window.location.href = data.url;
		} catch {
			setGoogleAlert({
				type: "danger",
				message: "Erreur lors de la reconnexion Google.",
			});
			setGoogleLoading(false);
		}
	};

	const handleGoogleConnect = async () => {
		setGoogleLoading(true);
		try {
			const { data } = await VisitDataService.getGoogleAuthUrl();
			window.location.href = data.url;
		} catch {
			setGoogleAlert({
				type: "danger",
				message: "Impossible d'obtenir l'URL d'autorisation Google.",
			});
			setGoogleLoading(false);
		}
	};

	const handleGoogleDisconnect = async () => {
		setGoogleLoading(true);
		try {
			await VisitDataService.disconnectGoogle();
			setGoogleConnected(false);
			setGoogleCalendars([]);
			setGoogleCalendarsError(false);
			setConfig((prev) => ({ ...prev, google_calendar_id: null }));
			setGoogleAlert({ type: "info", message: "Google Calendar déconnecté." });
		} catch {
			setGoogleAlert({
				type: "danger",
				message: "Impossible de déconnecter Google Calendar.",
			});
		} finally {
			setGoogleLoading(false);
		}
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		setSaved(false);
		setConfig((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleGerantSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSaved(false);
		const id = e.target.value ? Number(e.target.value) : null;
		if (!id) {
			setConfig((prev) => ({
				...prev,
				manager_associate_id: null,
				manager_civility: "",
				manager_firstname: "",
				manager_lastname: "",
				manager_email: "",
				manager_phone: "",
			}));
			return;
		}
		const associate = gerants.find((a) => a.id === id);
		if (associate) {
			setConfig((prev) => ({
				...prev,
				manager_associate_id: associate.id,
				manager_civility: associate.civility || "",
				manager_firstname: associate.firstname || "",
				manager_lastname: associate.lastname || "",
				manager_email: associate.email || "",
				manager_phone: associate.phone || "",
			}));
		}
	};

	const handleSave = async () => {
		setSaving(true);
		setSaved(false);
		setError(null);
		try {
			const fd = new FormData();
			Object.entries(config).forEach(([k, v]) => {
				if (v != null && k !== "id") fd.append(k, String(v));
			});
			const r = await OwnerConfigDataService.update(fd);
			setConfig(r.data);
			if (r.data.owner_profile_type) {
				dispatch(
					setOwnerProfileType(
						r.data.owner_profile_type as "SCI" | "PROFESSIONAL" | "INDIVIDUAL",
					),
				);
			}
			setSaved(true);
		} catch (e: any) {
			setError(
				e?.response?.data?.message ||
					e.message ||
					"Erreur lors de la sauvegarde",
			);
		} finally {
			setSaving(false);
		}
	};

	const SaveButton = () => (
		<Button onClick={handleSave} disabled={saving}>
			{saving ? (
				<>
					<Spinner size="sm" className="mr-2" />
					Enregistrement…
				</>
			) : (
				"Enregistrer"
			)}
		</Button>
	);

	return (
		<div className="max-w-3xl">
			<Card className="mb-4 app-panel-card">
				<CardHeader className="border-b py-3 px-4">
					<strong>Paramètres</strong>
				</CardHeader>
				<CardContent className="p-0">
					{/* Tabs nav */}
					<div className="flex gap-1 border-b px-3 pt-3 flex-wrap">
						{TABS.map((tab) => (
							<button
								key={tab}
								type="button"
								className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
								onClick={() => setActiveTab(tab)}
							>
								{TAB_LABELS[tab]}
								{tab === "google" && (
									<Badge
										variant={googleConnected ? "default" : "secondary"}
										className="text-[0.65rem] px-1.5 py-0"
									>
										{googleConnected ? "Connecté" : "Non connecté"}
									</Badge>
								)}
							</button>
						))}
					</div>

					<div className="p-4">
						{/* Tab: Bailleurs */}
						{activeTab === "owner" && (
							<div>
								{saved && (
									<AppAlert
										color="success"
										dismissible
										onClose={() => setSaved(false)}
									>
										Paramètres enregistrés avec succès.
									</AppAlert>
								)}
								{error && <AppAlert color="danger">{error}</AppAlert>}

								<h6 className="text-xs font-semibold uppercase text-muted-foreground mb-3 mt-2">
									Profil bailleur
								</h6>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
									<div>
										<Label>Type de bailleur</Label>
										<select
											name="owner_profile_type"
											value={config.owner_profile_type || "INDIVIDUAL"}
											onChange={handleChange}
											className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
										>
											<option value="INDIVIDUAL">Bailleur particulier</option>
											<option value="PROFESSIONAL">
												Bailleur professionnel
											</option>
											<option value="SCI">
												SCI (Société Civile Immobilière)
											</option>
										</select>
									</div>
									{(isSciProfile || isProfessional) && (
										<div>
											<Label>Forme juridique</Label>
											<Input
												name="legal_form"
												value={config.legal_form || ""}
												onChange={handleChange}
												placeholder={isSciProfile ? "SCI" : "SARL, EIRL, etc."}
												className="mt-1"
											/>
										</div>
									)}
								</div>

								<div className="mb-3">
									<Label>
										{isSciProfile ? "Raison sociale" : "Nom du bailleur"}{" "}
										<span className="text-destructive">*</span>
									</Label>
									<Input
										name="name"
										value={config.name || ""}
										onChange={handleChange}
										placeholder={
											isSciProfile
												? "Nom de la SCI (sans la forme juridique)"
												: isProfessional
													? "Nom de l'entreprise ou de la personne"
													: "Nom du bailleur affiché dans les documents"
										}
										className="mt-1"
									/>
								</div>

								{(isSciProfile || isProfessional) && (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
										<div>
											<Label>SIRET</Label>
											<Input
												name="siret"
												value={config.siret || ""}
												onChange={handleChange}
												placeholder="123 456 789 00010"
												className="mt-1"
											/>
										</div>
										<div>
											<Label>RCS</Label>
											<Input
												name="rcs"
												value={config.rcs || ""}
												onChange={handleChange}
												placeholder="RCS Paris 123 456 789"
												className="mt-1"
											/>
										</div>
									</div>
								)}

								<div className="mb-3">
									<Label>
										{isSciProfile ? "Adresse du siège social" : "Adresse"}
									</Label>
									<Input
										name="address"
										value={config.address || ""}
										onChange={handleChange}
										placeholder="Numéro et nom de la rue"
										className="mt-1"
									/>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
									<div>
										<Label>Code postal</Label>
										<Input
											name="zipcode"
											value={config.zipcode || ""}
											onChange={handleChange}
											placeholder="75001"
											className="mt-1"
										/>
									</div>
									<div className="md:col-span-2">
										<Label>Ville</Label>
										<Input
											name="city"
											value={config.city || ""}
											onChange={handleChange}
											placeholder="Paris"
											className="mt-1"
										/>
									</div>
								</div>

								<div className="mb-4">
									<Label>IBAN (compte bancaire)</Label>
									<Input
										name="iban"
										value={config.iban || ""}
										onChange={handleChange}
										placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
										className="mt-1"
									/>
								</div>

								{(isSciProfile || isProfessional) && (
									<>
										<h6 className="text-xs font-semibold uppercase text-muted-foreground mb-3">
											{isSciProfile ? "Gérant" : "Responsable"}
										</h6>

										<div className="mb-3">
											<Label>
												{isSciProfile
													? "Sélectionner un gérant associé"
													: "Sélectionner un responsable"}
											</Label>
											<select
												value={config.manager_associate_id ?? ""}
												onChange={handleGerantSelect}
												disabled={gerants.length === 0}
												className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1 disabled:opacity-50"
											>
												<option value="">— Saisie manuelle —</option>
												{gerants.map((a) => (
													<option key={a.id} value={a.id}>
														{a.civility} {a.firstname} {a.lastname}
													</option>
												))}
											</select>
											<p className="text-xs text-muted-foreground mt-1">
												{gerants.length === 0
													? isSciProfile
														? "Aucun co-bailleur avec un rôle de gestion trouvé."
														: "Aucun responsable trouvé."
													: "La sélection remplit automatiquement les champs ci-dessous."}
											</p>
										</div>

										<div className="grid grid-cols-12 gap-3 mb-3">
											<div className="col-span-2">
												<Label>Civilité</Label>
												<select
													name="manager_civility"
													value={config.manager_civility || ""}
													onChange={handleChange}
													className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
												>
													<option value="">—</option>
													<option value="M.">M.</option>
													<option value="Mme">Mme</option>
												</select>
											</div>
											<div className="col-span-5">
												<Label>Prénom</Label>
												<Input
													name="manager_firstname"
													value={config.manager_firstname || ""}
													onChange={handleChange}
													className="mt-1"
												/>
											</div>
											<div className="col-span-5">
												<Label>Nom</Label>
												<Input
													name="manager_lastname"
													value={config.manager_lastname || ""}
													onChange={handleChange}
													className="mt-1"
												/>
											</div>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
											<div>
												<Label>Email</Label>
												<Input
													type="email"
													name="manager_email"
													value={config.manager_email || ""}
													onChange={handleChange}
													className="mt-1"
												/>
											</div>
											<div>
												<Label>Téléphone</Label>
												<Input
													name="manager_phone"
													value={config.manager_phone || ""}
													onChange={handleChange}
													placeholder="06 00 00 00 00"
													className="mt-1"
												/>
											</div>
										</div>
									</>
								)}

								<div className="flex justify-end">
									<SaveButton />
								</div>
							</div>
						)}

						{/* Tab: Google Calendar */}
						{activeTab === "google" && (
							<div>
								{googleAlert && (
									<AppAlert
										color={googleAlert.type}
										dismissible
										onClose={() => setGoogleAlert(null)}
									>
										{googleAlert.message}
									</AppAlert>
								)}

								{googleConnected ? (
									<>
										{googleCalendarsError ? (
											<AppAlert color="warning" className="mb-3">
												Impossible de charger la liste des calendriers. Les
												permissions ont peut-être changé. Déconnectez puis
												reconnectez votre compte Google pour autoriser les
												nouveaux accès.
												<div className="mt-2">
													<Button
														variant="outline"
														size="sm"
														onClick={handleGoogleReconnect}
														disabled={googleLoading}
													>
														{googleLoading && (
															<Spinner size="sm" className="mr-1" />
														)}
														Se reconnecter
													</Button>
												</div>
											</AppAlert>
										) : (
											<div className="mb-3">
												<Label>Calendrier à synchroniser</Label>
												<select
													name="google_calendar_id"
													value={config.google_calendar_id ?? ""}
													onChange={handleChange}
													className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
												>
													<option value="">
														— Calendrier principal (primary) —
													</option>
													{googleCalendars.map((cal) => (
														<option key={cal.id} value={cal.id}>
															{cal.summary}
															{cal.primary ? " (principal)" : ""}
														</option>
													))}
												</select>
												<p className="text-xs text-muted-foreground mt-1">
													Les visites seront synchronisées vers ce calendrier.
												</p>
											</div>
										)}
										<div className="flex justify-between items-center">
											<Button
												variant="outline"
												size="sm"
												onClick={handleGoogleDisconnect}
												disabled={googleLoading}
												className="text-destructive hover:text-destructive"
											>
												{googleLoading ? (
													<Spinner size="sm" className="mr-1" />
												) : (
													<XCircle className="h-4 w-4 mr-1" />
												)}
												Déconnecter Google Calendar
											</Button>
											<SaveButton />
										</div>
									</>
								) : (
									<div className="flex flex-col items-start gap-2">
										<p className="text-muted-foreground mb-2">
											Connectez votre compte Google pour synchroniser
											automatiquement vos visites avec Google Calendar.
										</p>
										<Button
											variant="outline"
											onClick={handleGoogleConnect}
											disabled={googleLoading}
										>
											{googleLoading ? (
												<Spinner size="sm" className="mr-2" />
											) : (
												<svg
													className="mr-2"
													width="16"
													height="16"
													viewBox="0 0 488 512"
													fill="currentColor"
												>
													<path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
												</svg>
											)}
											Connecter Google Calendar
										</Button>
									</div>
								)}
							</div>
						)}

						{/* Tab: SMTP */}
						{activeTab === "smtp" && (
							<div>
								{saved && (
									<AppAlert
										color="success"
										dismissible
										onClose={() => setSaved(false)}
									>
										Paramètres enregistrés avec succès.
									</AppAlert>
								)}
								{error && <AppAlert color="danger">{error}</AppAlert>}

								<h6 className="text-xs font-semibold uppercase text-muted-foreground mb-3 mt-2">
									Configuration SMTP (envoi de mails)
								</h6>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
									<div className="md:col-span-2">
										<Label>Serveur SMTP</Label>
										<Input
											name="smtp_host"
											value={config.smtp_host || ""}
											onChange={handleChange}
											placeholder="smtp.gmail.com"
											className="mt-1"
										/>
									</div>
									<div>
										<Label>Port</Label>
										<Input
											type="number"
											name="smtp_port"
											value={config.smtp_port ?? ""}
											onChange={handleChange}
											placeholder="587"
											className="mt-1"
										/>
									</div>
								</div>

								<div className="mb-3">
									<label className="flex items-center gap-2 text-sm cursor-pointer">
										<input
											type="checkbox"
											id="smtp_secure"
											name="smtp_secure"
											checked={!!config.smtp_secure}
											onChange={(e) => {
												setSaved(false);
												setConfig((prev) => ({
													...prev,
													smtp_secure: e.target.checked,
												}));
											}}
											className="h-4 w-4 rounded border-input"
										/>
										Connexion sécurisée (SSL/TLS — port 465)
									</label>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
									<div>
										<Label>Utilisateur (login)</Label>
										<Input
											name="smtp_user"
											value={config.smtp_user || ""}
											onChange={handleChange}
											placeholder="user@example.com"
											autoComplete="off"
											className="mt-1"
										/>
									</div>
									<div>
										<Label>Mot de passe</Label>
										<div className="flex mt-1">
											<Input
												type={showSmtpPass ? "text" : "password"}
												name="smtp_pass"
												value={config.smtp_pass || ""}
												onChange={handleChange}
												autoComplete="new-password"
												className="rounded-r-none"
											/>
											<button
												type="button"
												onClick={() => setShowSmtpPass((v) => !v)}
												className="flex items-center justify-center px-3 border border-l-0 border-input rounded-r-md bg-muted hover:bg-muted/80 transition-colors"
											>
												{showSmtpPass ? (
													<Unlock className="h-4 w-4" />
												) : (
													<Lock className="h-4 w-4" />
												)}
											</button>
										</div>
									</div>
								</div>

								<div className="mb-4">
									<Label>Adresse expéditeur (From)</Label>
									<Input
										name="smtp_from"
										value={config.smtp_from || ""}
										onChange={handleChange}
										placeholder="no-reply@example.com"
										className="mt-1"
									/>
									<p className="text-xs text-muted-foreground mt-1">
										Si vide, l&apos;adresse utilisateur sera utilisée.
									</p>
								</div>

								<div className="flex justify-end">
									<SaveButton />
								</div>
							</div>
						)}

						{/* Tab: IMAP */}
						{activeTab === "imap" && (
							<div>
								{saved && (
									<AppAlert
										color="success"
										dismissible
										onClose={() => setSaved(false)}
									>
										Paramètres enregistrés avec succès.
									</AppAlert>
								)}
								{error && <AppAlert color="danger">{error}</AppAlert>}

								<h6 className="text-xs font-semibold uppercase text-muted-foreground mb-3 mt-2">
									Configuration IMAP (récupération emails Matera)
								</h6>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
									<div className="md:col-span-2">
										<Label>Serveur IMAP</Label>
										<Input
											name="imap_host"
											value={config.imap_host || ""}
											onChange={handleChange}
											placeholder="imap.free.fr"
											className="mt-1"
										/>
									</div>
									<div>
										<Label>Port</Label>
										<Input
											type="number"
											name="imap_port"
											value={config.imap_port ?? ""}
											onChange={handleChange}
											placeholder="993"
											className="mt-1"
										/>
									</div>
								</div>

								<div className="mb-3">
									<label className="flex items-center gap-2 text-sm cursor-pointer">
										<input
											type="checkbox"
											id="imap_tls"
											name="imap_tls"
											checked={config.imap_tls !== false}
											onChange={(e) => {
												setSaved(false);
												setConfig((prev) => ({
													...prev,
													imap_tls: e.target.checked,
												}));
											}}
											className="h-4 w-4 rounded border-input"
										/>
										Utiliser TLS
									</label>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
									<div>
										<Label>Utilisateur (login)</Label>
										<Input
											name="imap_user"
											value={config.imap_user || ""}
											onChange={handleChange}
											placeholder="user@free.fr"
											autoComplete="off"
											className="mt-1"
										/>
									</div>
									<div>
										<Label>Mot de passe</Label>
										<div className="flex mt-1">
											<Input
												type={showImapPass ? "text" : "password"}
												name="imap_pass"
												value={config.imap_pass || ""}
												onChange={handleChange}
												autoComplete="new-password"
												className="rounded-r-none"
											/>
											<button
												type="button"
												onClick={() => setShowImapPass((v) => !v)}
												className="flex items-center justify-center px-3 border border-l-0 border-input rounded-r-md bg-muted hover:bg-muted/80 transition-colors"
											>
												{showImapPass ? (
													<Unlock className="h-4 w-4" />
												) : (
													<Lock className="h-4 w-4" />
												)}
											</button>
										</div>
									</div>
								</div>

								<h6 className="text-xs font-semibold uppercase text-muted-foreground mb-3 mt-4">
									Paramètres Matera
								</h6>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
									<div className="md:col-span-2">
										<Label>Email expéditeur Matera</Label>
										<Input
											name="matera_sender_email"
											value={config.matera_sender_email || ""}
											onChange={handleChange}
											placeholder="notif@matera.eu"
											className="mt-1"
										/>
										<p className="text-xs text-muted-foreground mt-1">
											Les emails reçus de cet expéditeur seront traités.
										</p>
									</div>
									<div>
										<Label>Bien associé</Label>
										<select
											name="matera_property_id"
											value={config.matera_property_id ?? ""}
											onChange={handleChange}
											disabled={properties.length === 0}
											className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1 disabled:opacity-50"
										>
											<option value="">— Aucun bien —</option>
											{properties.map((p) => (
												<option key={p.id} value={p.id}>
													{p.name}
													{p.city ? ` — ${p.city}` : ""}
												</option>
											))}
										</select>
										<p className="text-xs text-muted-foreground mt-1">
											Les charges seront liées à ce bien.
										</p>
									</div>
								</div>

								<div className="flex justify-end">
									<SaveButton />
								</div>
							</div>
						)}

						{/* Tab: Cron */}
						{activeTab === "cron" && (
							<div>
								{saved && (
									<AppAlert
										color="success"
										dismissible
										onClose={() => setSaved(false)}
									>
										Paramètres enregistrés. Le cron sera rechargé immédiatement.
									</AppAlert>
								)}
								{error && <AppAlert color="danger">{error}</AppAlert>}

								<h6 className="text-xs font-semibold uppercase text-muted-foreground mb-3 mt-2">
									Planification automatique (Cron)
								</h6>

								<div className="mb-3">
									<label className="flex items-center gap-2 text-sm cursor-pointer">
										<input
											type="checkbox"
											id="charge_cron_enabled"
											name="charge_cron_enabled"
											checked={config.charge_cron_enabled !== false}
											onChange={(e) => {
												setSaved(false);
												setConfig((prev) => ({
													...prev,
													charge_cron_enabled: e.target.checked,
												}));
											}}
											className="h-4 w-4 rounded border-input"
										/>
										Activer la récupération automatique des emails Matera
									</label>
								</div>

								<div className="max-w-lg mb-3">
									<Label>Schedule (syntaxe cron)</Label>
									<Input
										name="charge_cron_schedule"
										value={config.charge_cron_schedule || "0 8 * * *"}
										onChange={handleChange}
										placeholder="0 8 * * *"
										disabled={config.charge_cron_enabled === false}
										className="mt-1"
									/>
									<p className="text-xs text-muted-foreground mt-1">
										Exemples : <code>0 8 * * *</code> (chaque jour à 8h00) —{" "}
										<code>0 */6 * * *</code> (toutes les 6h) —{" "}
										<code>*/30 * * * *</code> (toutes les 30 min)
									</p>
								</div>

								<div className="flex justify-end">
									<SaveButton />
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default Settings;
