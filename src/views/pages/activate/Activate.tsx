import { AppAlert } from "@/components/ui/app-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import UserDataService from "../../../services/user.service";

type Status = "loading" | "success" | "error";

const Activate = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [status, setStatus] = useState<Status>("loading");
	const [message, setMessage] = useState("");
	const [email, setEmail] = useState("");

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const token = params.get("token");

		if (!token) {
			setStatus("error");
			setMessage("Lien d'activation invalide. Aucun token trouvé.");
			return;
		}

		UserDataService.activate(token)
			.then(({ data }) => {
				setStatus("success");
				setMessage(data.message);
				setEmail(data.email || "");
			})
			.catch((err) => {
				setStatus("error");
				setMessage(err.response?.data?.message || "Une erreur s'est produite.");
			});
	}, [location.search]);

	return (
		<div className="bg-muted min-h-screen flex flex-row items-center">
			<div className="container mx-auto">
				<div className="flex justify-center">
					<div className="w-full max-w-sm mx-4">
						<Card className="p-4 shadow-sm">
							<CardContent className="text-center">
								<div className="mb-4">
									<h2 className="font-bold text-xl mb-1">Pilotage Immo</h2>
									<p className="text-muted-foreground text-sm">
										Activation de votre compte
									</p>
								</div>

								{status === "loading" && (
									<div className="py-4">
										<Spinner size="lg" className="text-primary" />
										<p className="mt-3 text-muted-foreground">
											Validation en cours…
										</p>
									</div>
								)}

								{status === "success" && (
									<>
										<AppAlert color="success" className="text-left mb-4">
											<strong>Compte activé !</strong> {message}
											{email && (
												<div className="mt-1 text-sm">
													Email : <strong>{email}</strong>
												</div>
											)}
										</AppAlert>
										<p className="text-muted-foreground text-sm mb-4">
											Connectez-vous en demandant un lien de connexion sur la
											page de login.
										</p>
										<Button
											className="w-full"
											onClick={() => navigate("/login")}
										>
											Aller à la page de connexion
										</Button>
									</>
								)}

								{status === "error" && (
									<>
										<AppAlert color="danger" className="text-left mb-4">
											{message}
										</AppAlert>
										<Button variant="link" onClick={() => navigate("/login")}>
											Retour à la connexion
										</Button>
									</>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Activate;
