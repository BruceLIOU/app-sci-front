import { AppAlert } from "@/components/ui/app-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import type React from "react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import AuthService from "../../../services/auth.service";
import type { RootState } from "../../../store";

const normalizeCode = (value: string) =>
	value
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "")
		.slice(0, 6);

const Login = () => {
	const navigate = useNavigate();
	const user = useSelector((state: RootState) => state.auth.user);

	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [loading, setLoading] = useState(false);
	const [step, setStep] = useState<"request" | "verify">("request");
	const [error, setError] = useState<string | null>(null);
	const [info, setInfo] = useState<string | null>(null);

	useEffect(() => {
		if (user) navigate("/dashboard", { replace: true });
	}, [user, navigate]);

	const handleRequestCode = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim()) return;
		setLoading(true);
		setError(null);
		try {
			await AuthService.requestLogin(email.trim());
			setStep("verify");
			setInfo(
				"Si votre email est connu, un code de connexion à 6 caractères vient d’être envoyé.",
			);
		} catch {
			setError(
				"Impossible de contacter le serveur. Vérifiez que le backend est démarré.",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyCode = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim() || code.length !== 6) return;
		setLoading(true);
		setError(null);
		try {
			await AuthService.verifyLogin(email.trim(), code);
			navigate("/dashboard", { replace: true });
			// biome-ignore lint/suspicious/noExplicitAny: err non-typé depuis axios
		} catch (err: any) {
			setError(err?.response?.data?.message || "Code invalide ou expiré.");
		} finally {
			setLoading(false);
		}
	};

	const handleResend = async () => {
		if (!email.trim()) return;
		setLoading(true);
		setError(null);
		try {
			await AuthService.requestLogin(email.trim());
			setCode("");
			setInfo("Un nouveau code a été envoyé si votre email est connu.");
		} catch {
			setError("Impossible de renvoyer le code pour le moment.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="app-login-shell flex flex-row items-center">
			<div className="app-login-content py-4 lg:py-5 w-full">
				<div className="flex justify-center items-center gap-8 flex-wrap">
					<div className="app-login-showcase p-4 lg:p-5 max-w-lg">
						<div className="app-page-kicker mb-3">
							Gestion locative nouvelle generation
						</div>
						<h1 className="app-login-showcase-title mb-3">
							Un espace de pilotage plus clair pour vos biens, vos flux et vos
							equipes.
						</h1>
						<p className="app-login-note mb-4">
							Centralisez les biens, locataires, baux, paiements et documents
							dans une interface plus contemporaine, plus lisible et orientee
							action.
						</p>

						<div className="app-kpi-inline">
							<div className="app-kpi-inline-item">
								<div className="app-kpi-inline-value">1</div>
								<div className="app-kpi-inline-label">
									entree unique pour toute l'activite
								</div>
							</div>
							<div className="app-kpi-inline-item">
								<div className="app-kpi-inline-value">24/7</div>
								<div className="app-kpi-inline-label">
									acces a vos donnees et alertes
								</div>
							</div>
							<div className="app-kpi-inline-item">
								<div className="app-kpi-inline-value">6</div>
								<div className="app-kpi-inline-label">
									caracteres a saisir pour se connecter
								</div>
							</div>
						</div>
					</div>

					<Card className="app-login-panel p-4 border-0 w-full max-w-sm">
						<CardContent className="text-center pt-0">
							<div className="mb-4">
								<h2 className="font-bold text-xl mb-1">Connexion securisee</h2>
								<p className="text-muted-foreground text-sm mb-0">
									Recevez un code de connexion temporaire par email
								</p>
							</div>

							{error && (
								<AppAlert
									color="danger"
									dismissible
									onClose={() => setError(null)}
									className="text-left mb-3"
								>
									{error}
								</AppAlert>
							)}

							{info && (
								<AppAlert
									color="success"
									dismissible
									onClose={() => setInfo(null)}
									className="text-left mb-3"
								>
									{info}
								</AppAlert>
							)}

							{step === "verify" ? (
								<form
									onSubmit={handleVerifyCode}
									className="text-left space-y-3"
								>
									<div className="space-y-1.5">
										<Label htmlFor="email-readonly" className="font-semibold">
											Adresse email
										</Label>
										<Input
											id="email-readonly"
											className="app-login-input"
											value={email}
											readOnly
										/>
									</div>
									<div className="space-y-1.5">
										<Label htmlFor="code" className="font-semibold">
											Code de connexion
										</Label>
										<Input
											className="app-login-input text-center"
											id="code"
											type="text"
											inputMode="text"
											autoComplete="one-time-code"
											value={code}
											onChange={(e) => setCode(normalizeCode(e.target.value))}
											placeholder="ABC123"
											maxLength={6}
											required
											autoFocus
											style={{ letterSpacing: "0.35em", fontWeight: 700 }}
										/>
									</div>
									<Button
										type="submit"
										className="w-full py-2 app-login-button"
										disabled={loading || code.length !== 6}
									>
										{loading ? <Spinner size="sm" className="mr-2" /> : null}
										Se connecter avec le code
									</Button>
									<div className="flex justify-between items-center gap-3 pt-1">
										<Button
											type="button"
											variant="link"
											className="p-0 h-auto"
											onClick={() => {
												setStep("request");
												setCode("");
												setInfo(null);
												setError(null);
											}}
										>
											Changer d&apos;email
										</Button>
										<Button
											type="button"
											variant="link"
											className="p-0 h-auto"
											onClick={handleResend}
											disabled={loading}
										>
											Renvoyer un code
										</Button>
									</div>
								</form>
							) : (
								<form
									onSubmit={handleRequestCode}
									className="text-left space-y-3"
								>
									<div className="space-y-1.5">
										<Label htmlFor="email" className="font-semibold">
											Adresse email
										</Label>
										<Input
											className="app-login-input"
											id="email"
											type="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder="votre@email.com"
											required
											autoFocus
										/>
									</div>
									<Button
										type="submit"
										className="w-full py-2 app-login-button"
										disabled={loading}
									>
										{loading ? <Spinner size="sm" className="mr-2" /> : null}
										Recevoir un code de connexion
									</Button>
								</form>
							)}

							{step === "request" && (
								<p
									className="text-muted-foreground mt-4 mb-0"
									style={{ fontSize: "0.75rem" }}
								>
									Aucun mot de passe requis — connexion sécurisée par code email
									à usage unique
								</p>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default Login;
