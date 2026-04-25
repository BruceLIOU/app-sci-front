import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { LogOut, Moon, Settings, User } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import AuthService from "../../services/auth.service";
import { type RootState, setUser, updatePreferences } from "../../store";
import { Button } from "../ui/button";

const AppHeaderDropdown = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const user = useSelector((state: RootState) => state.auth.user);
	const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

	const initials = user?.name
		? user.name
				.split(" ")
				.map((w) => w[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "?";

	const avatarSrc = useMemo(() => {
		if (!user?.avatar) return null;
		if (/^(https?:|data:|blob:)/i.test(user.avatar)) return user.avatar;
		const apiBase =
			(import.meta.env.VITE_API_URL as string | undefined) ||
			"http://localhost:3000";
		return new URL(user.avatar, apiBase).toString();
	}, [user?.avatar]);

	const handleLogout = async () => {
		try {
			await AuthService.logout();
		} finally {
			dispatch(setUser(null));
			navigate("/login", { replace: true });
		}
	};

	const applyTheme = (dark: boolean) => {
		document.documentElement.setAttribute(
			"data-coreui-theme",
			dark ? "dark" : "light",
		);
		document.documentElement.classList.toggle("dark", dark);
		localStorage.setItem("app-theme", dark ? "dark" : "light");
	};

	const handleDarkMode = async (checked: boolean) => {
		applyTheme(checked);
		try {
			const fd = new FormData();
			fd.append("darkMode", String(checked));
			const { data } = await AuthService.updatePreferences(fd);
			dispatch(updatePreferences(data.preferences));
		} catch {
			applyTheme(!checked); // rollback
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="py-0 px-2 app-profile-trigger focus:outline-none border-none"
				>
					<Avatar className="h-8 w-8">
						{avatarSrc && !avatarLoadFailed ? (
							<AvatarImage
								src={avatarSrc}
								onError={() => setAvatarLoadFailed(true)}
							/>
						) : null}
						<AvatarFallback className="bg-primary text-primary-foreground text-xs">
							{initials}
						</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="pt-0 app-dropdown-menu"
				style={{ minWidth: "220px" }}
			>
				<DropdownMenuLabel className="bg-muted/50 py-2">
					<div className="text-sm truncate font-medium">{user?.name}</div>
					<div
						className="text-muted-foreground"
						style={{ fontSize: "0.72rem" }}
					>
						{user?.email}
					</div>
				</DropdownMenuLabel>

				<DropdownMenuSeparator />

				<DropdownMenuItem
					onClick={() => navigate("/admin/profile")}
					className="cursor-pointer"
				>
					<User className="mr-2 h-4 w-4" />
					Mon profil
				</DropdownMenuItem>

				<DropdownMenuItem
					onClick={() => navigate("/admin/settings")}
					className="cursor-pointer"
				>
					<Settings className="mr-2 h-4 w-4" />
					Paramètres
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				{/* Toggle darkMode inline */}
				<div className="px-3 py-2 flex items-center justify-between">
					<span className="text-sm flex items-center">
						<Moon className="mr-2 h-4 w-4" />
						Mode sombre
					</span>
					<Switch
						id="darkModeToggle"
						checked={user?.preferences?.darkMode || false}
						onCheckedChange={handleDarkMode}
					/>
				</div>

				<DropdownMenuSeparator />

				<DropdownMenuItem
					onClick={handleLogout}
					className="cursor-pointer text-destructive focus:text-destructive"
				>
					<LogOut className="mr-2 h-4 w-4" />
					Se déconnecter
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default AppHeaderDropdown;
