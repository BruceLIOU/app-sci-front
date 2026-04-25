import {
	BookUser,
	Building2,
	Calendar,
	ClipboardList,
	Euro,
	FileText,
	Folder,
	Home,
	LayoutDashboard,
	List,
	TrendingUp,
	User,
	Users,
	Wrench,
} from "lucide-react";
import type React from "react";

export interface NavItem {
	type: "item" | "title";
	name: string;
	to?: string;
	icon?: React.ReactNode;
	roles?: ("admin" | "viewer")[];
}

const _nav: NavItem[] = [
	{
		type: "item",
		name: "Tableau de bord",
		to: "/dashboard",
		icon: <LayoutDashboard className="w-5 h-5" />,
	},
	{ type: "title", name: "Gestion locative" },
	{
		type: "item",
		name: "Mes biens",
		to: "/admin/properties",
		icon: <Home className="w-5 h-5" />,
	},
	{
		type: "item",
		name: "Mes locataires",
		to: "/admin/tenants",
		icon: <User className="w-5 h-5" />,
	},
	{
		type: "item",
		name: "Baux",
		to: "/admin/leases",
		icon: <FileText className="w-5 h-5" />,
	},
	{
		type: "item",
		name: "États des lieux",
		to: "/admin/inspections",
		icon: <ClipboardList className="w-5 h-5" />,
	},
	{
		type: "item",
		name: "Calendrier visites",
		to: "/admin/visits",
		icon: <Calendar className="w-5 h-5" />,
	},
	{
		type: "item",
		name: "Maintenance",
		to: "/admin/maintenance",
		icon: <Wrench className="w-5 h-5" />,
	},
	{
		type: "item",
		name: "Prestataires",
		to: "/admin/providers",
		icon: <BookUser className="w-5 h-5" />,
	},
	{ type: "title", name: "Finance", roles: ["admin"] },
	{
		type: "item",
		name: "Paiements",
		to: "/admin/payments",
		icon: <Euro className="w-5 h-5" />,
		roles: ["admin"],
	},
	{
		type: "item",
		name: "Quittances",
		to: "/admin/quittances",
		icon: <List className="w-5 h-5" />,
		roles: ["admin"],
	},
	{
		type: "item",
		name: "Charges",
		to: "/admin/charges",
		icon: <Building2 className="w-5 h-5" />,
		roles: ["admin"],
	},
	{
		type: "item",
		name: "Comptabilité",
		to: "/admin/comptability",
		icon: <TrendingUp className="w-5 h-5" />,
		roles: ["admin"],
	},
	{
		type: "item",
		name: "Reporting",
		to: "/admin/reporting",
		icon: <TrendingUp className="w-5 h-5" />,
		roles: ["admin"],
	},
	{ type: "title", name: "Bailleurs" },
	{
		type: "item",
		name: "Co-bailleurs",
		to: "/admin/associates",
		icon: <Users className="w-5 h-5" />,
	},
	{
		type: "item",
		name: "Déclaration 2072",
		to: "/admin/declarations",
		icon: <TrendingUp className="w-5 h-5" />,
		roles: ["admin"],
	},
	{
		type: "item",
		name: "Documents",
		to: "/admin/documents",
		icon: <Folder className="w-5 h-5" />,
	},
	{ type: "title", name: "Application", roles: ["admin"] },
	{
		type: "item",
		name: "Utilisateurs",
		to: "/admin/users",
		icon: <Users className="w-5 h-5" />,
		roles: ["admin"],
	},
];

export default _nav;
