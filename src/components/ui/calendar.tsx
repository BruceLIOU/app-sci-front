"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	...props
}: CalendarProps) {
	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={cn("p-4 select-none", className)}
			classNames={{
				months: "flex flex-col gap-4",
				month: "flex flex-col gap-3",
				caption: "flex justify-between items-center px-1",
				caption_label: "text-sm font-semibold text-foreground",
				nav: "flex items-center gap-1",
				nav_button: cn(
					"inline-flex items-center justify-center rounded-md h-7 w-7 bg-transparent",
					"text-muted-foreground hover:text-foreground hover:bg-muted/60",
					"transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
				),
				nav_button_previous: "",
				nav_button_next: "",
				table: "w-full border-collapse",
				head_row: "flex mb-1",
				head_cell:
					"text-muted-foreground w-9 text-center text-[0.75rem] font-medium pb-1",
				row: "flex w-full",
				cell: cn(
					"relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
					props.mode === "range"
						? "[&:has([aria-selected])]:bg-primary/10 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
						: "",
				),
				day: cn(
					"inline-flex items-center justify-center rounded-md h-9 w-9 text-sm bg-transparent",
					"font-normal transition-colors duration-150 cursor-pointer",
					"hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
					"aria-selected:opacity-100",
				),
				day_range_start: "rounded-l-md",
				day_range_end: "rounded-r-md",
				day_selected:
					"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-md font-semibold shadow-sm",
				day_today: "ring-1 ring-primary/50 text-primary font-semibold",
				day_outside:
					"text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-muted/30",
				day_disabled:
					"text-muted-foreground/30 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground/30",
				day_range_middle:
					"rounded-none aria-selected:bg-primary/10 aria-selected:text-foreground",
				day_hidden: "invisible",
				...classNames,
			}}
			components={{
				IconLeft: ({ ...iconProps }) => (
					<ChevronLeft className="h-4 w-4" {...iconProps} />
				),
				IconRight: ({ ...iconProps }) => (
					<ChevronRight className="h-4 w-4" {...iconProps} />
				),
			}}
			{...props}
		/>
	);
}
Calendar.displayName = "Calendar";

export { Calendar };
