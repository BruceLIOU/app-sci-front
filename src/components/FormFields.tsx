import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type React from "react";

type InputProps = Omit<React.ComponentProps<"input">, "label"> & {
	label: string;
	required?: boolean;
	error?: string;
};

type SelectProps = Omit<React.ComponentProps<"select">, "label"> & {
	label: string;
	required?: boolean;
	error?: string;
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
				error ? "border-rose-500 focus-visible:ring-rose-500" : "",
				className,
			)}
		/>
		{error && <p className="text-xs text-rose-500">{error}</p>}
	</div>
);

type TextareaProps = Omit<React.ComponentProps<"textarea">, "label"> & {
	label: string;
	required?: boolean;
	error?: string;
};

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
				"flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
				"placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
				"disabled:cursor-not-allowed disabled:opacity-50 resize-none",
				error ? "border-rose-500 focus-visible:ring-rose-500" : "",
				className,
			)}
		/>
		{error && <p className="text-xs text-rose-500">{error}</p>}
	</div>
);

export const FormSelectField: React.FC<SelectProps> = ({
	label,
	required = false,
	error,
	children,
	className,
	...props
}) => (
	<div className="space-y-1.5">
		<Label>
			{label}
			{required && <span className="text-rose-500 ml-1">*</span>}
		</Label>
		<select
			{...props}
			required={required}
			className={cn(
				"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
				"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
				"disabled:cursor-not-allowed disabled:opacity-50",
				error ? "border-rose-500 focus-visible:ring-rose-500" : "",
				className,
			)}
		>
			{children}
		</select>
		{error && <p className="text-xs text-rose-500">{error}</p>}
	</div>
);
