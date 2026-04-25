import { AppAlert } from "@/components/ui/app-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	FormInputField,
	FormSelectField,
} from "../../../components/FormFields";
import OwnerConfigDataService, {
	type OwnerConfigData,
} from "../../../services/owner_config.service";
import VisitDataService from "../../../services/visit.service";

interface Property {
	id: number;
	name: string;
	city?: string;
}

interface Props {
	config: OwnerConfigData;
	setConfig: React.Dispatch<React.SetStateAction<OwnerConfigData>>;
	onSave: () => Promise<void>;
	saving: boolean;
	googleConnected: boolean;
	googleLoading: boolean;
	onGoogleConnect: () => Promise<void>;
	properties: Property[];
	openTab?: (tab: "owner" | "google" | "smtp" | "imap" | "cron") => void;
	mode?: "card" | "modal";
	initialTestStatus?: { google?: boolean; email?: boolean };
	onPersistTestStatus?: (status: {
		google: boolean;
		email: boolean;
	}) => void | Promise<void>;
}

const ONBOARDING_DISMISSED_KEY = "settings_onboarding_hidden_v1";
const ONBOARDING_TEST_STATUS_KEY = "settings_onboarding_tests_v1";

const scheduleToFrequency = (schedule?: string) => {
	if (schedule === "*/30 * * * *") return "30min";
	if (schedule === "0 */6 * * *") return "6h";
	if (schedule === "0 8 * * *") return "daily";
	if (schedule === "0 8 * * 1") return "weekly";
	return "custom";
};

const frequencyToSchedule = (frequency: string) => {
	if (frequency === "30min") return "*/30 * * * *";
	if (frequency === "6h") return "0 */6 * * *";
	if (frequency === "daily") return "0 8 * * *";
	if (frequency === "weekly") return "0 8 * * 1";
	return "0 8 * * *";
};

const SettingsOnboarding: React.FC<Props> = ({
	config,
	setConfig,
	onSave,
	saving,
	googleConnected,
	googleLoading,
	onGoogleConnect,
	properties,
	openTab,
	mode = "card",
	initialTestStatus,
	onPersistTestStatus,
}) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [hidden, setHidden] = useState(false);
	const [siretLoading, setSiretLoading] = useState(false);
	const [siretMessage, setSiretMessage] = useState<string | null>(null);
	const [siretError, setSiretError] = useState<string | null>(null);
	const [googleTestLoading, setGoogleTestLoading] = useState(false);
	const [googleTestMessage, setGoogleTestMessage] = useState<string | null>(
		null,
	);
	const [googleTestError, setGoogleTestError] = useState<string | null>(null);
	const [googleConnectionVerified, setGoogleConnectionVerified] =
		useState(false);
	const [emailTestLoading, setEmailTestLoading] = useState(false);
	const [emailTestMessage, setEmailTestMessage] = useState<string | null>(null);
	const [emailTestError, setEmailTestError] = useState<string | null>(null);
	const [emailConnectionVerified, setEmailConnectionVerified] = useState(false);

	const [useMatera, setUseMatera] = useState(false);
	const [wantsGoogleSync, setWantsGoogleSync] = useState(false);
	const [materaFrequency, setMateraFrequency] = useState("daily");

	useEffect(() => {
		if (mode === "modal") {
			setHidden(false);
			return;
		}
		const dismissed = window.localStorage.getItem(ONBOARDING_DISMISSED_KEY);
		setHidden(dismissed === "1");
	}, [mode]);

	useEffect(() => {
		try {
			const hasProvidedStatus =
				initialTestStatus?.google !== undefined ||
				initialTestStatus?.email !== undefined;
			if (hasProvidedStatus) {
				setGoogleConnectionVerified(!!initialTestStatus?.google);
				setEmailConnectionVerified(!!initialTestStatus?.email);
				return;
			}

			const raw = window.localStorage.getItem(ONBOARDING_TEST_STATUS_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw);
			setGoogleConnectionVerified(!!parsed?.google);
			setEmailConnectionVerified(!!parsed?.email);
		} catch (_) {}
	}, [initialTestStatus?.google, initialTestStatus?.email]);

	const persistTestStatus = useCallback(
		(nextGoogle: boolean, nextEmail: boolean) => {
			window.localStorage.setItem(
				ONBOARDING_TEST_STATUS_KEY,
				JSON.stringify({ google: nextGoogle, email: nextEmail }),
			);
			onPersistTestStatus?.({ google: nextGoogle, email: nextEmail });
		},
		[onPersistTestStatus],
	);

	useEffect(() => {
		setUseMatera(
			Boolean(
				config.matera_sender_email || config.imap_user || config.imap_host,
			),
		);
		setWantsGoogleSync(Boolean(googleConnected || config.google_calendar_id));
		setMateraFrequency(scheduleToFrequency(config.charge_cron_schedule));
	}, [
		config.matera_sender_email,
		config.imap_user,
		config.imap_host,
		config.charge_cron_schedule,
		googleConnected,
		config.google_calendar_id,
	]);

	useEffect(() => {
		if (!googleConnected && googleConnectionVerified) {
			setGoogleConnectionVerified(false);
			persistTestStatus(false, emailConnectionVerified);
		}
	}, [
		googleConnected,
		googleConnectionVerified,
		emailConnectionVerified,
		persistTestStatus,
	]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: réinitialiser les tests SMTP quand les identifiants changent
	useEffect(() => {
		if (emailConnectionVerified) {
			setEmailConnectionVerified(false);
			persistTestStatus(googleConnectionVerified, false);
		}
	}, [config.smtp_host, config.smtp_user]);

	const profileDone = useMemo(() => {
		const profileType = config.owner_profile_type || "INDIVIDUAL";
		const hasName = Boolean(config.name?.trim());
		if (!hasName) return false;
		if (profileType === "PROFESSIONAL" || profileType === "SCI") {
			return Boolean(
				config.siret && String(config.siret).replace(/\D/g, "").length === 14,
			);
		}
		return true;
	}, [config.owner_profile_type, config.name, config.siret]);

	const materaDone = useMemo(() => {
		if (!useMatera) return true;
		return Boolean(
			config.matera_sender_email && config.imap_user && config.imap_host,
		);
	}, [
		useMatera,
		config.matera_sender_email,
		config.imap_user,
		config.imap_host,
	]);

	const googleDone = useMemo(() => {
		if (!wantsGoogleSync) return true;
		return googleConnected;
	}, [wantsGoogleSync, googleConnected]);

	const mailDone = useMemo(() => {
		return Boolean(config.smtp_host && config.smtp_user);
	}, [config.smtp_host, config.smtp_user]);

	const testGoogleConnection = async () => {
		setGoogleTestError(null);
		setGoogleTestMessage(null);
		setGoogleTestLoading(true);
		try {
			const { data } = await VisitDataService.testGoogleConnection();
			setGoogleTestMessage(data.message || "Connexion Google validee.");
			setGoogleConnectionVerified(true);
			persistTestStatus(true, emailConnectionVerified);
		} catch (e: any) {
			setGoogleTestError(
				e?.response?.data?.message || "Echec du test Google Calendar.",
			);
			setGoogleConnectionVerified(false);
			persistTestStatus(false, emailConnectionVerified);
		} finally {
			setGoogleTestLoading(false);
		}
	};

	const testEmailConnection = async () => {
		setEmailTestError(null);
		setEmailTestMessage(null);
		setEmailTestLoading(true);
		try {
			const fd = new FormData();
			Object.entries(config).forEach(([k, v]) => {
				if (v != null && k !== "id") fd.append(k, String(v));
			});
			const saveResponse = await OwnerConfigDataService.update(fd);
			setConfig((prev) => ({ ...prev, ...saveResponse.data }));
			const { data } = await OwnerConfigDataService.testEmailConnection();
			setEmailTestMessage(data.message || "Email de test envoye avec succes.");
			setEmailConnectionVerified(true);
			persistTestStatus(googleConnectionVerified, true);
		} catch (e: any) {
			setEmailTestError(e?.response?.data?.message || "Echec du test email.");
			setEmailConnectionVerified(false);
			persistTestStatus(googleConnectionVerified, false);
		} finally {
			setEmailTestLoading(false);
		}
	};

	const steps = [
		{
			title: "Profil bailleur",
			subtitle: "Type de bailleur et identification entreprise",
			done: profileDone,
		},
		{
			title: "Charges Matera",
			subtitle: "Import automatique et frequence",
			done: materaDone,
		},
		{
			title: "Google Calendar",
			subtitle: "Synchronisation des visites",
			done: googleDone,
			connectionVerified: googleConnectionVerified,
		},
		{
			title: "Envoi des mails",
			subtitle: "Configuration SMTP",
			done: mailDone,
			connectionVerified: emailConnectionVerified,
		},
	];

	const completedCount = steps.filter((step) => step.done).length;
	const progress = Math.round((completedCount / steps.length) * 100);

	const handleHide = () => {
		window.localStorage.setItem(ONBOARDING_DISMISSED_KEY, "1");
		setHidden(true);
	};

	const handleRestore = () => {
		window.localStorage.removeItem(ONBOARDING_DISMISSED_KEY);
		setHidden(false);
	};

	const lookupSiret = async () => {
		setSiretMessage(null);
		setSiretError(null);
		const normalized = String(config.siret || "").replace(/\D/g, "");
		if (normalized.length !== 14) {
			setSiretError("Le SIRET doit contenir 14 chiffres.");
			return;
		}

		setSiretLoading(true);
		try {
			const { data } = await OwnerConfigDataService.lookupSiret(normalized);
			setConfig((prev) => ({
				...prev,
				siret: data.siret || normalized,
				name: data.name || prev.name || "",
				legal_form: data.legal_form || prev.legal_form || "",
				address: data.address || prev.address || "",
				zipcode: data.zipcode || prev.zipcode || "",
				city: data.city || prev.city || "",
				rcs: data.rcs || prev.rcs || "",
			}));
			setSiretMessage(
				"Entreprise trouvee. Les informations ont ete pre-remplies.",
			);
		} catch (e: any) {
			setSiretError(
				e?.response?.data?.message ||
					"Impossible de recuperer les informations SIRET.",
			);
		} finally {
			setSiretLoading(false);
		}
	};

	const renderStep = () => {
		if (currentStep === 0) {
			return (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					<div>
						<FormSelectField
							label="Vous êtes :"
							value={config.owner_profile_type || "INDIVIDUAL"}
							onChange={(e) => {
								const ownerProfileType = e.target.value as
									| "SCI"
									| "PROFESSIONAL"
									| "INDIVIDUAL";
								setConfig((prev) => ({
									...prev,
									owner_profile_type: ownerProfileType,
								}));
							}}
						>
							<option value="INDIVIDUAL">Bailleur particulier</option>
							<option value="PROFESSIONAL">Bailleur professionnel</option>
							<option value="SCI">SCI</option>
						</FormSelectField>
					</div>

					<div>
						<FormInputField
							label="Nom affiché dans vos documents"
							value={config.name || ""}
							onChange={(e) =>
								setConfig((prev) => ({ ...prev, name: e.target.value }))
							}
							placeholder="Nom du bailleur ou de la société"
						/>
					</div>

					{((config.owner_profile_type || "INDIVIDUAL") === "PROFESSIONAL" ||
						(config.owner_profile_type || "INDIVIDUAL") === "SCI") && (
						<>
							<div className="md:col-span-1">
								<FormInputField
									label="SIRET"
									value={config.siret || ""}
									onChange={(e) =>
										setConfig((prev) => ({ ...prev, siret: e.target.value }))
									}
									placeholder="12345678900010"
								/>
							</div>
							<div className="flex items-end">
								<Button
									variant="outline"
									onClick={lookupSiret}
									disabled={siretLoading}
									className="w-full"
								>
									{siretLoading ? (
										<>
											<Spinner size="sm" className="mr-2" />
											Recherche...
										</>
									) : (
										"Recuperer depuis SIRET"
									)}
								</Button>
							</div>
						</>
					)}

					{siretMessage && (
						<div className="md:col-span-2">
							<AppAlert color="success" className="mb-0">
								{siretMessage}
							</AppAlert>
						</div>
					)}
					{siretError && (
						<div className="md:col-span-2">
							<AppAlert color="danger" className="mb-0">
								{siretError}
							</AppAlert>
						</div>
					)}
				</div>
			);
		}

		if (currentStep === 1) {
			return (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					<div className="md:col-span-2">
						<label className="flex items-center gap-2 text-sm cursor-pointer">
							<input
								type="checkbox"
								id="onboarding_matera"
								checked={useMatera}
								onChange={(e) => {
									const checked = e.target.checked;
									setUseMatera(checked);
									setConfig((prev) => ({
										...prev,
										charge_cron_enabled: checked,
									}));
								}}
								className="h-4 w-4 rounded border-input"
							/>
							Je souhaite recuperer automatiquement mes charges Matera depuis
							mes emails
						</label>
					</div>

					{useMatera && (
						<>
							<div>
								<FormInputField
									label="Email expéditeur Matera"
									value={config.matera_sender_email || ""}
									onChange={(e) =>
										setConfig((prev) => ({
											...prev,
											matera_sender_email: e.target.value,
										}))
									}
									placeholder="notif@matera.eu"
								/>
							</div>

							<div>
								<FormSelectField
									label="Fréquence de synchronisation"
									value={materaFrequency}
									onChange={(e) => {
										const value = e.target.value;
										setMateraFrequency(value);
										setConfig((prev) => ({
											...prev,
											charge_cron_enabled: true,
											charge_cron_schedule: frequencyToSchedule(value),
										}));
									}}
								>
									<option value="30min">Toutes les 30 minutes</option>
									<option value="6h">Toutes les 6 heures</option>
									<option value="daily">Chaque jour à 8h</option>
									<option value="weekly">Chaque lundi à 8h</option>
								</FormSelectField>
							</div>

							<div>
								<FormInputField
									label="Serveur IMAP"
									value={config.imap_host || ""}
									onChange={(e) =>
										setConfig((prev) => ({
											...prev,
											imap_host: e.target.value,
										}))
									}
									placeholder="imap.free.fr"
								/>
							</div>

							<div>
								<FormInputField
									label="Utilisateur IMAP"
									value={config.imap_user || ""}
									onChange={(e) =>
										setConfig((prev) => ({
											...prev,
											imap_user: e.target.value,
										}))
									}
									placeholder="user@provider.fr"
								/>
							</div>

							<div className="md:col-span-2">
								<FormSelectField
									label="Bien associé (optionnel)"
									value={config.matera_property_id ?? ""}
									onChange={(e) =>
										setConfig((prev) => ({
											...prev,
											matera_property_id: e.target.value || null,
										}))
									}
								>
									<option value="">Aucun bien</option>
									{properties.map((property) => (
										<option key={property.id} value={property.id}>
											{property.name}
											{property.city ? ` - ${property.city}` : ""}
										</option>
									))}
								</FormSelectField>
							</div>
						</>
					)}
				</div>
			);
		}

		if (currentStep === 2) {
			return (
				<div className="grid grid-cols-1 gap-3">
					<div>
						<label className="flex items-center gap-2 text-sm cursor-pointer">
							<input
								type="checkbox"
								id="onboarding_google"
								checked={wantsGoogleSync}
								onChange={(e) => setWantsGoogleSync(e.target.checked)}
								className="h-4 w-4 rounded border-input"
							/>
							Je veux synchroniser mes visites avec Google Calendar
						</label>
					</div>

					{wantsGoogleSync && (
						<div>
							{googleConnected ? (
								<div className="flex flex-wrap items-center gap-2">
									<AppAlert color="success" className="mb-0 flex-1">
										Votre compte Google est deja connecte.
									</AppAlert>
									<Button
										variant="outline"
										onClick={testGoogleConnection}
										disabled={googleTestLoading}
									>
										{googleTestLoading ? (
											<>
												<Spinner size="sm" className="mr-2" />
												Test en cours...
											</>
										) : (
											"Tester la liaison Google"
										)}
									</Button>
								</div>
							) : (
								<div className="flex flex-wrap items-center gap-2">
									<Button
										variant="outline"
										disabled={googleLoading}
										onClick={onGoogleConnect}
									>
										{googleLoading ? (
											<>
												<Spinner size="sm" className="mr-2" />
												Connexion en cours...
											</>
										) : (
											"Connecter Google Calendar"
										)}
									</Button>
									<Button variant="outline" onClick={() => openTab?.("google")}>
										Ouvrir les options avancees
									</Button>
								</div>
							)}
							{googleTestMessage && (
								<AppAlert color="success" className="mt-2 mb-0">
									{googleTestMessage}
								</AppAlert>
							)}
							{googleTestError && (
								<AppAlert color="danger" className="mt-2 mb-0">
									{googleTestError}
								</AppAlert>
							)}
						</div>
					)}
				</div>
			);
		}

		return (
			<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
				<div>
					<FormInputField
						label="Serveur SMTP"
						value={config.smtp_host || ""}
						onChange={(e) =>
							setConfig((prev) => ({ ...prev, smtp_host: e.target.value }))
						}
						placeholder="smtp.gmail.com"
					/>
				</div>
				<div>
					<FormInputField
						label="Utilisateur SMTP"
						value={config.smtp_user || ""}
						onChange={(e) =>
							setConfig((prev) => ({ ...prev, smtp_user: e.target.value }))
						}
						placeholder="user@example.com"
					/>
				</div>
				<div>
					<FormInputField
						label="Adresse expéditeur"
						value={config.smtp_from || ""}
						onChange={(e) =>
							setConfig((prev) => ({ ...prev, smtp_from: e.target.value }))
						}
						placeholder="no-reply@example.com"
					/>
				</div>

				<div className="md:col-span-3 flex flex-wrap gap-2">
					<Button
						variant="outline"
						onClick={testEmailConnection}
						disabled={
							emailTestLoading || !config.smtp_host || !config.smtp_user
						}
					>
						{emailTestLoading ? (
							<>
								<Spinner size="sm" className="mr-2" />
								Test en cours...
							</>
						) : (
							"Tester l'envoi email"
						)}
					</Button>
					<Button variant="outline" onClick={() => openTab?.("smtp")}>
						Ouvrir la configuration email complete
					</Button>
					<Button variant="outline" onClick={() => openTab?.("imap")}>
						Ouvrir la configuration IMAP complete
					</Button>
				</div>
				{emailTestMessage && (
					<div className="md:col-span-3">
						<AppAlert color="success" className="mb-0 mt-2">
							{emailTestMessage}
						</AppAlert>
					</div>
				)}
				{emailTestError && (
					<div className="md:col-span-3">
						<AppAlert color="danger" className="mb-0 mt-2">
							{emailTestError}
						</AppAlert>
					</div>
				)}
			</div>
		);
	};

	if (mode === "card" && hidden) {
		return (
			<Card className="mb-4 app-onboarding-card app-onboarding-card-min">
				<CardContent className="flex justify-between items-center gap-2 flex-wrap py-4">
					<div>
						<strong>Onboarding masque</strong>
						<div className="text-sm text-muted-foreground">
							Relancez le guide quand vous voulez.
						</div>
					</div>
					<Button variant="outline" onClick={handleRestore}>
						Afficher le guide
					</Button>
				</CardContent>
			</Card>
		);
	}

	const StepNav = () => (
		<div className="flex justify-between items-center flex-wrap gap-2">
			<div className="flex gap-2">
				<Button
					variant="outline"
					onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
					disabled={currentStep === 0}
				>
					Etape precedente
				</Button>
				<Button
					variant="outline"
					onClick={() =>
						setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))
					}
					disabled={currentStep === steps.length - 1}
				>
					Etape suivante
				</Button>
			</div>
			<Button onClick={onSave} disabled={saving}>
				{saving ? (
					<>
						<Spinner size="sm" className="mr-2" />
						Enregistrement...
					</>
				) : (
					"Enregistrer mes choix"
				)}
			</Button>
		</div>
	);

	const Header = ({ showHide }: { showHide?: boolean }) => (
		<div className="flex justify-between items-start flex-wrap gap-2 mb-3">
			<div>
				<div className="app-onboarding-kicker">NOUVEL UTILISATEUR</div>
				<h5 className="mb-1">Setup guide en 4 etapes</h5>
				<p className="text-sm text-muted-foreground mb-0">
					Configurez les points critiques de votre compte en moins de 3 minutes.
				</p>
			</div>
			<div className="flex items-center gap-2">
				<Badge variant="default">
					{completedCount}/{steps.length} completees
				</Badge>
				{showHide && (
					<Button variant="outline" size="sm" onClick={handleHide}>
						Masquer
					</Button>
				)}
			</div>
		</div>
	);

	const ProgressBar = () => (
		<div className="w-full bg-muted rounded-full h-2 mb-3">
			<div
				className="bg-emerald-500 h-2 rounded-full transition-all"
				style={{ width: `${progress}%` }}
			/>
		</div>
	);

	const StepList = () => (
		<div className="app-onboarding-steps mb-3">
			{steps.map((step, index) => (
				<button
					key={step.title}
					type="button"
					className={`app-onboarding-step ${index === currentStep ? "is-active" : ""} ${step.done ? "is-done" : ""}`}
					onClick={() => setCurrentStep(index)}
				>
					<span className="app-onboarding-step-index">{index + 1}</span>
					<span className="app-onboarding-step-content">
						<strong>{step.title}</strong>
						<small>{step.subtitle}</small>
						{step.connectionVerified !== undefined && (
							<Badge
								variant={step.connectionVerified ? "default" : "secondary"}
								className="app-onboarding-step-badge mt-1 text-[0.65rem]"
							>
								{step.connectionVerified ? "Liaison OK" : "A tester"}
							</Badge>
						)}
					</span>
				</button>
			))}
		</div>
	);

	if (mode === "modal") {
		return (
			<>
				<Header />
				<ProgressBar />
				<StepList />
				<div className="app-onboarding-panel mb-3">{renderStep()}</div>
				<StepNav />
			</>
		);
	}

	return (
		<Card className="mb-4 app-onboarding-card">
			<CardContent className="pt-4">
				<Header showHide />
				<ProgressBar />
				<StepList />
				<div className="app-onboarding-panel mb-3">{renderStep()}</div>
				<StepNav />
			</CardContent>
		</Card>
	);
};

export default SettingsOnboarding;
