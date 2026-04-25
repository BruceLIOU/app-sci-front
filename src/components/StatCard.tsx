import { cn } from "@/lib/utils";
import type React from "react";

interface StatCardProps {
	value: React.ReactNode;
	label: string;
	color: string;
	sm?: number;
}

const accentMap: Record<string, { bar: string; bg: string; bgDark: string }> = {
	success: {
		bar: "bg-emerald-500",
		bg: "bg-emerald-50",
		bgDark: "dark:bg-emerald-950/30",
	},
	warning: {
		bar: "bg-amber-500",
		bg: "bg-amber-50",
		bgDark: "dark:bg-amber-950/30",
	},
	danger: {
		bar: "bg-rose-500",
		bg: "bg-rose-50",
		bgDark: "dark:bg-rose-950/30",
	},
	info: { bar: "bg-teal-600", bg: "bg-teal-50", bgDark: "dark:bg-teal-950/30" },
	primary: {
		bar: "bg-blue-500",
		bg: "bg-blue-50",
		bgDark: "dark:bg-blue-950/30",
	},
	secondary: {
		bar: "bg-slate-400",
		bg: "bg-slate-50",
		bgDark: "dark:bg-slate-800/40",
	},
	dark: {
		bar: "bg-slate-700",
		bg: "bg-slate-100",
		bgDark: "dark:bg-slate-800/50",
	},
	light: {
		bar: "bg-slate-300",
		bg: "bg-slate-50",
		bgDark: "dark:bg-slate-800/30",
	},
};

const StatCard: React.FC<StatCardProps> = ({ value, label, color, sm = 4 }) => {
	const accent = accentMap[color] ?? accentMap.info;
	return (
		<div
			className={cn(
				"rounded-xl overflow-hidden cursor-default select-none mb-3 w-52",
				"border border-slate-200 dark:border-slate-600/50",
				accent.bg,
				accent.bgDark,
				"shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150",
			)}
		>
			<div className={cn("h-1 w-full", accent.bar)} />
			<div className="px-4 py-4">
				<div className="text-2xl font-extrabold tracking-tight leading-none tabular-nums text-slate-800 dark:text-slate-100">
					{value}
				</div>
				<div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 leading-snug">
					{label}
				</div>
			</div>
		</div>
	);
};

export default StatCard;
