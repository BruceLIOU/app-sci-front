import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import React, { useState, useEffect, useRef, useCallback } from "react";

interface AddressSuggestion {
	label: string;
	name: string;
	postcode: string;
	city: string;
	latitude: number;
	longitude: number;
}

interface AddressAutocompleteProps {
	value: string;
	onChange: (value: string) => void;
	onSelect: (data: {
		address: string;
		zipcode: string;
		city: string;
		latitude: string;
		longitude: string;
	}) => void;
	label?: string;
	required?: boolean;
	invalid?: boolean;
	feedbackInvalid?: string;
}

const AddressAutocomplete = ({
	value,
	onChange,
	onSelect,
	label = "Adresse",
	required,
	invalid,
	feedbackInvalid,
}: AddressAutocompleteProps) => {
	const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const userActive = useRef(false);

	const fetchSuggestions = useCallback(async (query: string) => {
		if (query.trim().length < 3) {
			setSuggestions([]);
			setOpen(false);
			return;
		}
		setLoading(true);
		try {
			const res = await fetch(
				`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=6&autocomplete=1`,
			);
			const data = await res.json();
			const items: AddressSuggestion[] = (data.features || []).map(
				// biome-ignore lint/suspicious/noExplicitAny: type GeoJSON non importé
				(f: any) => ({
					label: f.properties.label,
					name: f.properties.name,
					postcode: f.properties.postcode,
					city: f.properties.city,
					latitude: f.geometry.coordinates[1],
					longitude: f.geometry.coordinates[0],
				}),
			);
			setSuggestions(items);
			setOpen(items.length > 0);
		} catch {
			setSuggestions([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!userActive.current) return;
		if (debounceTimer.current) clearTimeout(debounceTimer.current);
		debounceTimer.current = setTimeout(() => fetchSuggestions(value), 300);
		return () => {
			if (debounceTimer.current) clearTimeout(debounceTimer.current);
		};
	}, [value, fetchSuggestions]);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			)
				setOpen(false);
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSelect = (suggestion: AddressSuggestion) => {
		onChange(suggestion.name);
		onSelect({
			address: suggestion.name,
			zipcode: suggestion.postcode,
			city: suggestion.city,
			latitude: String(suggestion.latitude),
			longitude: String(suggestion.longitude),
		});
		setSuggestions([]);
		setOpen(false);
	};

	return (
		<div ref={containerRef} className="relative space-y-1.5">
			{label && (
				<Label>
					{label}
					{required && <span className="text-rose-500 ml-1">*</span>}
					{loading && (
						<span className="ml-2 inline-block h-3 w-3 rounded-full border-2 border-current border-r-transparent animate-spin" />
					)}
				</Label>
			)}
			<Input
				type="text"
				value={value}
				required={required}
				autoComplete="off"
				className={cn(invalid && "border-rose-500 focus-visible:ring-rose-500")}
				onChange={(e) => {
					userActive.current = true;
					onChange(e.target.value);
				}}
				onFocus={() => suggestions.length > 0 && setOpen(true)}
				onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
				placeholder="Ex : 12 rue de la Paix, Paris"
			/>
			{invalid && feedbackInvalid && (
				<p className="text-xs text-rose-500">{feedbackInvalid}</p>
			)}
			{open && suggestions.length > 0 && (
				<ul className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-md max-h-60 overflow-y-auto">
					{suggestions.map((s) => (
						<li
							key={s.label}
							onMouseDown={() => handleSelect(s)}
							className="px-3 py-2 text-sm cursor-pointer hover:bg-muted transition-colors border-b last:border-0"
						>
							{s.label}
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

export default AddressAutocomplete;
