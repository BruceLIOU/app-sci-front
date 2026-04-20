import { cn } from "@/lib/utils";
import type React from "react";

type StatusConfig = { label: string; className: string };

const BASE =
	"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";

const statusConfig: Record<string, StatusConfig> = {
	// Lease status
	active: {
		label: "Actif",
		className:
			"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
	},
	expired: {
		label: "Expiré",
		className:
			"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
	},
	terminated: {
		label: "Résilié",
		className:
			"bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
	},
	// Payment status
	paid: {
		label: "Payé",
		className:
			"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
	},
	pending: {
		label: "En attente",
		className:
			"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
	},
	late: {
		label: "En retard",
		className:
			"bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
	},
	// Inspection type
	entree: {
		label: "Entrée",
		className:
			"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
	},
	sortie: {
		label: "Sortie",
		className:
			"bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
	},
	// Inspection status
	completed: {
		label: "Complété",
		className:
			"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
	},
	// Charge type
	assurance: {
		label: "Assurance",
		className:
			"bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
	},
	taxe_fonciere: {
		label: "Taxe foncière",
		className:
			"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
	},
	entretien: {
		label: "Entretien",
		className:
			"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	},
	travaux: {
		label: "Travaux",
		className:
			"bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
	},
	charges_copro: {
		label: "Charges copro",
		className:
			"bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
	},
	frais_gestion: {
		label: "Frais gestion",
		className: "bg-slate-900 text-white dark:bg-slate-700 dark:text-slate-100",
	},
	autre: {
		label: "Autre",
		className:
			"bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
	},
	// Maintenance priority
	low: {
		label: "Faible",
		className:
			"bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
	},
	medium: {
		label: "Moyen",
		className:
			"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
	},
	high: {
		label: "Élevé",
		className:
			"bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
	},
	urgent: {
		label: "Urgent",
		className: "bg-rose-600 text-white dark:bg-rose-700",
	},
	// Maintenance status
	open: {
		label: "Ouvert",
		className:
			"bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
	},
	in_progress: {
		label: "En cours",
		className:
			"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	},
	resolved: {
		label: "Résolu",
		className:
			"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
	},
	closed: {
		label: "Fermé",
		className:
			"bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
	},
	// Notification type
	matera_charge: {
		label: "Charge MATERA",
		className:
			"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
	},
	email_sent: {
		label: "Email envoyé",
		className:
			"bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
	},
	// Tenant activity
	inactive: {
		label: "Inactif",
		className:
			"bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
	},
};

/** Maps inspection condition strings (free-form French) to a colour class. */
function conditionClassName(condition: string): string {
	if (condition === "Très bon état" || condition === "Bon état")
		return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
	if (condition === "État moyen")
		return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
	return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
}

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
	value: string;
	/** Override the label text from the config map. */
	label?: string;
	/** Pass true when value is a free-form inspection condition string. */
	isCondition?: boolean;
}

export function StatusBadge({
	value,
	label,
	isCondition = false,
	className,
	...props
}: StatusBadgeProps) {
	if (isCondition) {
		return (
			<span
				className={cn(BASE, conditionClassName(value), className)}
				{...props}
			>
				{label ?? value}
			</span>
		);
	}

	const config = statusConfig[value];
	const colorClass =
		config?.className ??
		"bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
	const text = label ?? config?.label ?? value;

	return (
		<span className={cn(BASE, colorClass, className)} {...props}>
			{text}
		</span>
	);
}
