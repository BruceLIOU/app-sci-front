import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type * as React from "react";
import { Button } from "./button";

type AlertColor =
	| "success"
	| "danger"
	| "warning"
	| "info"
	| "primary"
	| "secondary";

const colorClass: Record<AlertColor, string> = {
	success:
		"bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300",
	danger:
		"bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300",
	warning:
		"bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300",
	info: "bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-950/30 dark:border-teal-800 dark:text-teal-300",
	primary:
		"bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300",
	secondary:
		"bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300",
};

interface AppAlertProps {
	color?: AlertColor;
	dismissible?: boolean;
	onClose?: () => void;
	className?: string;
	children: React.ReactNode;
}

export function AppAlert({
	color = "info",
	dismissible,
	onClose,
	className,
	children,
}: AppAlertProps) {
	return (
		<div
			className={cn(
				"flex items-start gap-2 rounded-lg border px-4 py-3 text-sm mb-3",
				colorClass[color],
				className,
			)}
		>
			<span className="flex-1">{children}</span>
			{dismissible && onClose && (
				<Button
					type="button"
					onClick={onClose}
					className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
				>
					<X className="h-4 w-4" />
				</Button>
			)}
		</div>
	);
}
