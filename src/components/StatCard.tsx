import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type React from "react";

interface StatCardProps {
	value: React.ReactNode;
	label: string;
	color: string;
	sm?: number;
}

const accentMap: Record<string, { border: string; dot: string }> = {
	success: { border: "border-l-emerald-500", dot: "bg-emerald-500" },
	warning: { border: "border-l-amber-500", dot: "bg-amber-500" },
	danger: { border: "border-l-rose-500", dot: "bg-rose-500" },
	info: { border: "border-l-teal-600", dot: "bg-teal-600" },
	primary: { border: "border-l-blue-500", dot: "bg-blue-500" },
	secondary: { border: "border-l-slate-400", dot: "bg-slate-400" },
	dark: { border: "border-l-slate-700", dot: "bg-slate-700" },
	light: { border: "border-l-slate-300", dot: "bg-slate-300" },
};

const StatCard: React.FC<StatCardProps> = ({ value, label, color, sm = 4 }) => {
	const accent = accentMap[color] ?? accentMap.info;
	return (
		<Card
			className={cn(
				"border-l-[3px] mb-3 cursor-default select-none",
				"hover:-translate-y-0.5 hover:shadow-md transition-all duration-150",
				accent.border,
			)}
		>
			<CardContent className="p-4">
				<div className="text-[1.9rem] font-extrabold tracking-tight text-slate-900 dark:text-slate-50 leading-none tabular-nums">
					{value}
				</div>
				<div className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
					{label}
				</div>
			</CardContent>
		</Card>
	);
};

export default StatCard;
