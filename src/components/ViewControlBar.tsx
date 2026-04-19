import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Columns3, FilterX, LayoutGrid, List } from "lucide-react";
import type React from "react";

// ─── Types exportés ────────────────────────────────────────────────────────────

export type ViewMode = "vignette" | "list" | "grid";

export interface FilterConfig {
	value: string;
	onChange: (value: string) => void;
	options: Array<{ value: string; label: string }>;
	placeholder: string;
	width?: number;
}

interface ViewControlBarProps {
	viewMode?: ViewMode;
	onViewModeChange?: (mode: ViewMode) => void;
	supportedModes?: ViewMode[];
	gridCols?: number;
	onGridColsChange?: (cols: number) => void;
	filters?: FilterConfig[];
	hasActiveFilter?: boolean;
	onResetFilters?: () => void;
	totalCount: number;
	filteredCount?: number;
	itemLabel?: string;
	itemLabelPlural?: string;
}

// ─── Icône grille colonnes ─────────────────────────────────────────────────────

const GridColIcon = ({ cols }: { cols: number }) => {
	const gap = 2;
	const total = 28;
	const colW = (total - gap * (cols - 1)) / cols;
	return (
		<svg
			width={total}
			height={18}
			viewBox={`0 0 ${total} 18`}
			fill="currentColor"
		>
			<title>{cols} colonnes</title>
			{Array.from({ length: cols }).map((_, i) => (
				<rect
					// biome-ignore lint/suspicious/noArrayIndexKey: index positionnel stable
					key={i}
					x={i * (colW + gap)}
					y={0}
					width={colW}
					height={18}
					rx={2}
				/>
			))}
		</svg>
	);
};

const modeIcons: Record<ViewMode, React.ReactNode> = {
	vignette: <LayoutGrid className="h-4 w-4" />,
	list: <List className="h-4 w-4" />,
	grid: <Columns3 className="h-4 w-4" />,
};

const modeTooltips: Record<ViewMode, string> = {
	vignette: "Vignettes",
	list: "Liste",
	grid: "Grille personnalisée",
};

// ─── Composant ────────────────────────────────────────────────────────────────

const ViewControlBar: React.FC<ViewControlBarProps> = ({
	viewMode,
	onViewModeChange,
	supportedModes,
	gridCols,
	onGridColsChange,
	filters = [],
	hasActiveFilter = false,
	onResetFilters,
	totalCount,
	filteredCount,
	itemLabel = "élément",
	itemLabelPlural,
}) => {
	const pluralLabel = itemLabelPlural ?? `${itemLabel}s`;
	const showModes = (supportedModes?.length ?? 0) > 0 && !!onViewModeChange;
	const showGridCols =
		viewMode === "grid" && gridCols != null && !!onGridColsChange;
	const showFilters = filters.length > 0;

	return (
		<TooltipProvider delayDuration={300}>
			<div className="flex items-center flex-wrap gap-2 py-3 mb-4">
				{/* Boutons de mode */}
				{showModes && (
					<div className="flex rounded-md border border-input overflow-hidden">
						{supportedModes?.map((mode) => (
							<Tooltip key={mode}>
								<TooltipTrigger asChild>
									<button
										type="button"
										onClick={() => onViewModeChange?.(mode)}
										className={cn(
											"px-2.5 py-1.5 transition-colors",
											viewMode === mode
												? "bg-primary text-primary-foreground"
												: "bg-background text-muted-foreground hover:bg-muted",
										)}
									>
										{modeIcons[mode]}
									</button>
								</TooltipTrigger>
								<TooltipContent>{modeTooltips[mode]}</TooltipContent>
							</Tooltip>
						))}
					</div>
				)}

				{/* Sélecteur de colonnes */}
				{showGridCols && (
					<div className="flex rounded-md border border-input overflow-hidden">
						{[1, 2, 3, 4].map((n) => (
							<Tooltip key={n}>
								<TooltipTrigger asChild>
									<button
										type="button"
										onClick={() => onGridColsChange?.(n)}
										className={cn(
											"px-2 py-1.5 transition-colors",
											gridCols === n
												? "bg-primary text-primary-foreground"
												: "bg-background text-muted-foreground hover:bg-muted",
										)}
									>
										<GridColIcon cols={n} />
									</button>
								</TooltipTrigger>
								<TooltipContent>{`${n} colonne${n > 1 ? "s" : ""}`}</TooltipContent>
							</Tooltip>
						))}
					</div>
				)}

				{showModes && showFilters && (
					<div className="w-px h-5 bg-border mx-1" />
				)}

				{/* Filtres */}
				{filters.map((f, i) => (
					<select
						// biome-ignore lint/suspicious/noArrayIndexKey: FilterConfig sans identifiant stable
						key={i}
						style={{ width: f.width ?? 160 }}
						value={f.value}
						onChange={(e) => f.onChange(e.target.value)}
						className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					>
						<option value="">{f.placeholder}</option>
						{f.options.map((o) => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</select>
				))}

				{/* Reset + badge */}
				{hasActiveFilter && onResetFilters && filteredCount != null && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="h-8 gap-1.5 text-xs"
								onClick={onResetFilters}
							>
								<FilterX className="h-3.5 w-3.5" />
								<span className="inline-flex items-center rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 text-[0.65rem] font-semibold">
									{filteredCount}/{totalCount}
								</span>
							</Button>
						</TooltipTrigger>
						<TooltipContent>Réinitialiser les filtres</TooltipContent>
					</Tooltip>
				)}

				{/* Compteur */}
				{!hasActiveFilter && (
					<span className="text-xs text-muted-foreground ml-1">
						{totalCount} {totalCount > 1 ? pluralLabel : itemLabel}
					</span>
				)}
			</div>
		</TooltipProvider>
	);
};

export default ViewControlBar;
