import { AppAlert } from "@/components/ui/app-alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import type React from "react";
import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AuthService from "../../../services/auth.service";
import {
	type RootState,
	updatePreferences,
	updateProfile,
} from "../../../store";

const Profile: React.FC = () => {
	const dispatch = useDispatch();
	const user = useSelector((state: RootState) => state.auth.user);

	const [name, setName] = useState(user?.name || "");
	const [saving, setSaving] = useState(false);
	const [avatarUploading, setAvatarUploading] = useState(false);
	const [alert, setAlert] = useState<{
		type: "success" | "danger";
		message: string;
	} | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleProfileSave = async () => {
		setSaving(true);
		setAlert(null);
		try {
			const fd = new FormData();
			fd.append("name", name);
			const { data } = await AuthService.updateProfile(fd);
			dispatch(updateProfile({ name: data.name }));
			setAlert({ type: "success", message: "Profil mis à jour." });
		} catch {
			setAlert({ type: "danger", message: "Erreur lors de la mise à jour." });
		} finally {
			setSaving(false);
		}
	};

	const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setAvatarPreview(URL.createObjectURL(file));
	};

	const handleAvatarUpload = async () => {
		const file = fileInputRef.current?.files?.[0];
		if (!file) return;
		setAvatarUploading(true);
		setAlert(null);
		try {
			const fd = new FormData();
			fd.append("avatar", file);
			const { data } = await AuthService.uploadAvatar(fd);
			dispatch(updateProfile({ avatar: data.avatar }));
			setAvatarPreview(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
			setAlert({ type: "success", message: "Avatar mis à jour." });
		} catch {
			setAlert({
				type: "danger",
				message: "Erreur lors de l'upload de l'avatar.",
			});
		} finally {
			setAvatarUploading(false);
		}
	};

	const handleDarkMode = async (checked: boolean) => {
		try {
			const fd = new FormData();
			fd.append("darkMode", String(checked));
			const { data } = await AuthService.updatePreferences(fd);
			dispatch(updatePreferences(data.preferences));
			document.documentElement.setAttribute(
				"data-coreui-theme",
				checked ? "dark" : "light",
			);
			document.documentElement.classList.toggle("dark", checked);
		} catch {
			/* ignore */
		}
	};

	if (!user) return null;

	const initials = (user.name || "")
		.split(" ")
		.map((w) => w[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	const currentAvatar = avatarPreview || user.avatar;

	return (
		<>
			{alert && (
				<AppAlert
					color={alert.type}
					dismissible
					onClose={() => setAlert(null)}
					className="mb-3"
				>
					{alert.message}
				</AppAlert>
			)}

			<div className="flex justify-center">
				<div className="w-full max-w-lg">
					{/* Carte profil */}
					<Card className="mb-4">
						<CardHeader className="border-b py-3 px-4">
							<strong>Mon profil</strong>
						</CardHeader>
						<CardContent className="pt-4">
							{/* Avatar */}
							<div className="flex items-center gap-3 mb-4">
								<Avatar className="h-16 w-16">
									{currentAvatar ? <AvatarImage src={currentAvatar} /> : null}
									<AvatarFallback className="bg-primary text-primary-foreground text-lg">
										{initials}
									</AvatarFallback>
								</Avatar>
								<div>
									<div className="font-semibold text-base">{user.name}</div>
									<div className="text-muted-foreground text-sm">
										{user.email}
									</div>
									<Badge
										variant={user.role === "admin" ? "default" : "secondary"}
										className="mt-1"
									>
										{user.role === "admin" ? "Administrateur" : "Lecteur"}
									</Badge>
								</div>
							</div>

							{/* Upload avatar */}
							<div className="mb-4 p-3 border rounded">
								<Label className="font-semibold mb-2 block">
									Changer l&apos;avatar
								</Label>
								<div className="flex items-center gap-2">
									<Input
										type="file"
										accept="image/*"
										ref={fileInputRef}
										onChange={handleAvatarChange}
										className="text-sm"
									/>
									<Button
										type="button"
										variant="secondary"
										size="sm"
										onClick={handleAvatarUpload}
										disabled={!avatarPreview || avatarUploading}
									>
										{avatarUploading ? (
											<Spinner size="sm" className="mr-1" />
										) : null}
										Enregistrer
									</Button>
								</div>
							</div>

							<div className="space-y-3">
								<div className="space-y-1.5">
									<Label>Nom affiché</Label>
									<Input
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="Votre nom"
									/>
								</div>
								<div className="space-y-1.5">
									<Label>Email</Label>
									<Input value={user.email} disabled />
								</div>
							</div>

							<Button
								type="button"
								className="mt-4"
								onClick={handleProfileSave}
								disabled={saving}
							>
								{saving ? <Spinner size="sm" className="mr-1" /> : null}
								Enregistrer
							</Button>
						</CardContent>
					</Card>

					{/* Carte préférences */}
					<Card>
						<CardHeader className="border-b py-3 px-4">
							<strong>Préférences</strong>
						</CardHeader>
						<CardContent className="pt-4">
							<div className="flex items-center justify-between">
								<Label htmlFor="darkMode">Mode sombre</Label>
								<Switch
									id="darkMode"
									checked={user.preferences?.darkMode || false}
									onCheckedChange={handleDarkMode}
								/>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
};

export default Profile;
