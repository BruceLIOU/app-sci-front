import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default:
					"app-btn-primary text-primary-foreground shadow-sm hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(15,118,110,0.35)] active:translate-y-0 active:shadow-sm",
				destructive:
					"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(220,38,38,0.3)] active:translate-y-0",
				outline:
					"border border-border/70 bg-card text-foreground shadow-sm hover:bg-primary/5 hover:border-primary/40 hover:text-primary hover:-translate-y-px active:translate-y-0",
				secondary:
					"bg-muted/80 text-secondary-foreground border border-border/50 shadow-sm hover:bg-muted hover:-translate-y-px active:translate-y-0",
				ghost:
					"text-muted-foreground hover:bg-primary/8 hover:text-primary active:bg-primary/12",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-8 rounded-md px-3 text-xs",
				lg: "h-11 px-8",
				icon: "h-10 w-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
