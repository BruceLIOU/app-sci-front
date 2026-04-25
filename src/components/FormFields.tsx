import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import React from "react";

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
				"flex min-h-[80px] w-full rounded-lg border border-border/60 bg-card px-3 py-2 text-sm shadow-sm transition-colors duration-150",
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
