import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, isValid, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import React, { useState } from "react";

type InputProps = Omit<React.ComponentProps<"input">, "label"> & {
	label: React.ReactNode;
	required?: boolean;
	error?: string;
};

type TextareaProps = Omit<React.ComponentProps<"textarea">, "label"> & {
	label: React.ReactNode;
	required?: boolean;
	error?: string;
};

type SelectProps = {
	label: React.ReactNode;
	name?: string;
	value?: string;
	onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
	required?: boolean;
	disabled?: boolean;
	error?: string;
	className?: string;
	children: React.ReactNode;
};

export const FormInputField: React.FC<InputProps> = ({
	label,
	required = false,
	error,
	className,
	...props
}) => (
	<div className="space-y-1.5">
		<Label>
			{label}
			{required && <span className="text-rose-500 ml-1">*</span>}
		</Label>
		<Input
			{...props}
			required={required}
			className={cn(
				error ? "border-rose-500 focus-visible:ring-rose-500/20" : "",
				className,
			)}
		/>
		{error && <p className="text-xs text-rose-500">{error}</p>}
	</div>
);

export const FormTextareaField: React.FC<TextareaProps> = ({
	label,
	required = false,
	error,
	className,
	...props
}) => (
	<div className="space-y-1.5">
		<Label>
			{label}
			{required && <span className="text-rose-500 ml-1">*</span>}
		</Label>
		<textarea
			{...props}
			required={required}
			className={cn(
				"flex min-h-20 w-full rounded-lg border border-border/60 bg-card px-3 py-2 text-sm shadow-sm transition-colors duration-150",
				"placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/15 focus-visible:ring-offset-0",
				"disabled:cursor-not-allowed disabled:opacity-50 resize-none",
				error ? "border-rose-500 focus-visible:ring-rose-500/20" : "",
				className,
			)}
		/>
		{error && <p className="text-xs text-rose-500">{error}</p>}
	</div>
);

// Extrait les options depuis des <option> JSX children
function extractOptions(
	children: React.ReactNode,
): { value: string; label: string }[] {
	const items: { value: string; label: string }[] = [];
	React.Children.forEach(children, (child) => {
		if (!React.isValidElement(child)) return;
		// biome-ignore lint/suspicious/noExplicitAny: option element props
		const props = child.props as any;
		if (child.type === "option") {
			items.push({
				value: String(props.value ?? ""),
				label: String(props.children ?? ""),
			});
		}
	});
	return items;
}

export const FormSelectField: React.FC<SelectProps> = ({
	label,
	name,
	value,
	onChange,
	required = false,
	disabled = false,
	error,
	children,
	className,
}) => {
	const options = extractOptions(children);
	const placeholder =
		options.find((o) => o.value === "")?.label ?? "Sélectionner…";
	const items = options.filter((o) => o.value !== "");

	const handleValueChange = (newValue: string) => {
		if (onChange) {
			onChange({
				target: { name: name ?? "", value: newValue },
			} as React.ChangeEvent<HTMLSelectElement>);
		}
	};

	return (
		<div className="space-y-1.5">
			<Label>
				{label}
				{required && <span className="text-rose-500 ml-1">*</span>}
			</Label>
			<Select
				name={name}
				value={value || ""}
				onValueChange={handleValueChange}
				disabled={disabled}
				required={required}
			>
				<SelectTrigger
					className={cn(error ? "border-rose-500" : "", className)}
				>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{items.map((item) => (
						<SelectItem key={item.value} value={item.value}>
							{item.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{error && <p className="text-xs text-rose-500">{error}</p>}
		</div>
	);
};

type DateFieldProps = {
	label: React.ReactNode;
	name?: string;
	/** Valeur attendue au format ISO yyyy-MM-dd */
	value?: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	required?: boolean;
	disabled?: boolean;
	error?: string;
	placeholder?: string;
	className?: string;
};

export const FormDateField: React.FC<DateFieldProps> = ({
	label,
	name,
	value,
	onChange,
	required = false,
	disabled = false,
	error,
	placeholder = "Choisir une date…",
	className,
}) => {
	const [open, setOpen] = useState(false);

	// Convertit la valeur ISO (yyyy-MM-dd) en objet Date pour le Calendar
	const selected: Date | undefined = (() => {
		if (!value) return undefined;
		const d = parse(value, "yyyy-MM-dd", new Date());
		return isValid(d) ? d : undefined;
	})();

	const handleSelect = (day: Date | undefined) => {
		if (!day) return;
		const iso = format(day, "yyyy-MM-dd");
		onChange?.({
			target: { name: name ?? "", value: iso },
		} as React.ChangeEvent<HTMLInputElement>);
		setOpen(false);
	};

	return (
		<div className="space-y-1.5">
			<Label>
				{label}
				{required && <span className="text-rose-500 ml-1">*</span>}
			</Label>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						type="button"
						variant="secondary"
						disabled={disabled}
						className={cn(
							"w-full justify-start text-left font-normal h-10",
							!selected && "text-muted-foreground",
							error ? "border-rose-500" : "",
							className,
						)}
					>
						<CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
						{selected
							? format(selected, "dd/MM/yyyy", { locale: fr })
							: placeholder}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0 shadow-lg" align="start">
					<Calendar
						mode="single"
						selected={selected}
						onSelect={handleSelect}
						locale={fr}
						initialFocus
					/>
				</PopoverContent>
			</Popover>
			{error && <p className="text-xs text-rose-500">{error}</p>}
		</div>
	);
};
