import { AppAlert } from "@/components/ui/app-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type React from "react";
import { useEffect, useState } from "react";
import AddressAutocomplete from "../../../components/AddressAutocomplete";
import {
	FormInputField,
	FormSelectField,
	FormTextareaField,
} from "../../../components/FormFields";
import PropertyDataService from "../../../services/property.service";
import TenantDataService from "../../../services/tenant.service";
import {
	propertyFormSchema,
	tenantFormSchema,
	toFieldErrors,
} from "../../../validation/schemas";

const ROOM_TYPES = [
	"Chambre",
	"Salon",
	"Séjour",
	"Salle de bain",
	"Salle d'eau",
	"WC / Toilettes",
	"Cuisine",
	"Cuisine ouverte",
	"Bureau",
	"Dressing",
	"Buanderie",
	"Garage",
	"Cave",
	"Grenier",
	"Terrasse",
	"Balcon",
	"Véranda",
	"Entrée / Hall",
	"Autre",
];
const FEATURE_LIST = [
	"Domotique",
	"Ballon eau chaude thermodynamique",
	"Chauffe-eau solaire",
	"Pompe à chaleur",
	"Climatisation",
	"Cheminée / Poêle",
	"Panneau solaire photovoltaïque",
	"Double vitrage",
	"Triple vitrage",
	"Parquet",
	"Cuisine équipée",
	"Fibre optique",
	"Alarme",
	"Interphone / Digicode",
	"Ascenseur",
	"Parking",
	"Box / Garage",
	"Cave",
	"Jardin",
	"Piscine",
];

interface CreateFormsProps {
	setModalVisible: (v: boolean) => void;
	entities: string;
	data?: any[];
}

const CreateForms = ({ setModalVisible, entities }: CreateFormsProps) => {
	const [validated, setValidated] = useState(false);
	const [properties, setProperties] = useState<any[]>([]);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [submitError, setSubmitError] = useState<string>("");

	// État pour la branche properties
	const [thumbnail, setThumbnail] = useState<File | null>(null);
	const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
	const [propertyImages, setPropertyImages] = useState<File[]>([]);
	const [imagePreviews, setImagePreviews] = useState<string[]>([]);
	const [rooms, setRooms] = useState<{ type: string; count: number }[]>([]);
	const [features, setFeatures] = useState<string[]>([]);
	const [newRoomType, setNewRoomType] = useState(ROOM_TYPES[0]);

	// État pour la branche tenants
	const [avatar, setAvatar] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

	const [inputValue, setInputValue] = useState<any>(
		entities === "tenants"
			? {
					civility: "MR",
					firstname: "",
					lastname: "",
					email: "",
					mobile: "",
					property_id: "",
					comments: "",
					previous_address: "",
					previous_zipcode: "",
					previous_city: "",
				}
			: {
					address: "",
					zipcode: "",
					city: "",
					type: "",
					pieces: "",
					area: "",
					latitude: "",
					longitude: "",
					comments: "",
				},
	);

	useEffect(() => {
		if (entities === "tenants") {
			PropertyDataService.getAll()
				.then((res) => setProperties(res.data))
				.catch((err) => console.log(err.message));
		}
	}, [entities]);

	const handleChangeInput = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const field = e.target.name;
		if (fieldErrors[field]) {
			setFieldErrors((prev) => ({ ...prev, [field]: "" }));
		}
		setInputValue({ ...inputValue, [e.target.name]: e.target.value });
	};

	const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setThumbnail(file);
			setThumbnailPreview(URL.createObjectURL(file));
		}
	};

	const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		setPropertyImages(files);
		setImagePreviews(files.map((f) => URL.createObjectURL(f)));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setValidated(true);
		setSubmitError("");

		const parsed =
			entities === "tenants"
				? tenantFormSchema.safeParse(inputValue)
				: propertyFormSchema.safeParse(inputValue);
		if (!parsed.success) {
			setFieldErrors(toFieldErrors(parsed.error));
			return;
		}

		setFieldErrors({});
		const formData = new FormData();
		Object.entries(inputValue).forEach(([key, val]) => {
			if (val !== "" && val !== null && val !== undefined)
				formData.append(key, String(val));
		});
		if (entities === "properties") {
			if (thumbnail) formData.append("thumbnail", thumbnail);
			propertyImages.forEach((img) => formData.append("images", img));
			if (rooms.length) formData.append("rooms", JSON.stringify(rooms));
			if (features.length)
				formData.append("features", JSON.stringify(features));
		}
		if (entities === "tenants" && avatar) {
			formData.append("avatar", avatar);
		}
		try {
			if (entities === "tenants") await TenantDataService.create(formData);
			else await PropertyDataService.create(formData);
			setModalVisible(false);
		} catch (error: any) {
			const apiErrors = error?.response?.data?.errors;
			if (apiErrors && typeof apiErrors === "object") {
				const nextErrors: Record<string, string> = {};
				Object.entries(apiErrors).forEach(([k, v]) => {
					nextErrors[k] = Array.isArray(v) ? String(v[0]) : String(v);
				});
				setFieldErrors(nextErrors);
			}
			setSubmitError(
				error?.response?.data?.message ||
					error.message ||
					"Erreur lors de la validation du formulaire.",
			);
		}
	};

	if (entities === "tenants") {
		return (
			<form
				className="grid grid-cols-2 gap-4"
				noValidate
				onSubmit={handleSubmit}
			>
				{submitError && (
					<div className="col-span-2">
						<AppAlert color="danger" className="mb-0">
							{submitError}
						</AppAlert>
					</div>
				)}
				{/* Avatar */}
				<div className="col-span-2 space-y-1.5">
					<Label>Photo du locataire</Label>
					<Input
						type="file"
						accept="image/*"
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) {
								setAvatar(file);
								setAvatarPreview(URL.createObjectURL(file));
							}
						}}
					/>
					{avatarPreview && (
						<div className="mt-2 flex items-center gap-2">
							<img
								src={avatarPreview}
								alt="Aperçu"
								className="rounded-full"
								style={{ width: 72, height: 72, objectFit: "cover" }}
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => {
									setAvatar(null);
									setAvatarPreview(null);
								}}
							>
								Supprimer
							</Button>
						</div>
					)}
				</div>
				<FormSelectField
					label="Civilité"
					name="civility"
					value={inputValue.civility}
					onChange={handleChangeInput}
				>
					<option value="MR">M.</option>
					<option value="MME">Mme</option>
				</FormSelectField>
				<FormInputField
					type="text"
					name="firstname"
					label="Prénom"
					placeholder="Prénom"
					value={inputValue.firstname}
					required
					error={fieldErrors.firstname}
					onChange={handleChangeInput}
				/>
				<FormInputField
					type="text"
					name="lastname"
					label="Nom"
					placeholder="Nom"
					value={inputValue.lastname}
					required
					error={fieldErrors.lastname}
					onChange={handleChangeInput}
				/>
				<FormInputField
					type="email"
					name="email"
					label="Email"
					placeholder="Email"
					value={inputValue.email}
					error={fieldErrors.email}
					onChange={handleChangeInput}
				/>
				<FormInputField
					type="text"
					name="mobile"
					label="Téléphone"
					placeholder="Téléphone"
					value={inputValue.mobile}
					onChange={handleChangeInput}
				/>
				<FormSelectField
					label="Bien associé"
					name="property_id"
					value={inputValue.property_id}
					onChange={handleChangeInput}
				>
					<option value="">-- Aucun bien --</option>
					{properties.map((p) => (
						<option
							key={p.id}
							value={p.id}
						>{`${p.type} - ${p.address}, ${p.city}`}</option>
					))}
				</FormSelectField>
				{/* Ancienne adresse */}
				<div className="col-span-2">
					<AddressAutocomplete
						label="Ancienne adresse"
						value={inputValue.previous_address}
						onChange={(val) =>
							setInputValue((prev: any) => ({ ...prev, previous_address: val }))
						}
						onSelect={(d) =>
							setInputValue((prev: any) => ({
								...prev,
								previous_address: d.address,
								previous_zipcode: d.zipcode,
								previous_city: d.city,
							}))
						}
					/>
				</div>
				<FormInputField
					type="text"
					name="previous_zipcode"
					label="CP ancienne adresse"
					placeholder="Code postal"
					value={inputValue.previous_zipcode}
					onChange={handleChangeInput}
				/>
				<FormInputField
					type="text"
					name="previous_city"
					label="Ville ancienne adresse"
					placeholder="Ville"
					value={inputValue.previous_city}
					onChange={handleChangeInput}
				/>
				{/* Commentaires */}
				<div className="col-span-2">
					<FormTextareaField
						name="comments"
						label="Commentaires"
						rows={3}
						placeholder="Notes, observations..."
						value={inputValue.comments}
						onChange={(e) =>
							setInputValue((prev: any) => ({
								...prev,
								comments: e.target.value,
							}))
						}
					/>
				</div>
				<div className="col-span-2 flex justify-end gap-2 pt-2 border-t">
					<Button
						type="button"
						variant="outline"
						onClick={() => setModalVisible(false)}
					>
						Annuler
					</Button>
					<Button type="submit">Ajouter</Button>
				</div>
			</form>
		);
	}

	return (
		<form className="grid grid-cols-2 gap-4" noValidate onSubmit={handleSubmit}>
			{submitError && (
				<div className="col-span-2">
					<AppAlert color="danger" className="mb-0">
						{submitError}
					</AppAlert>
				</div>
			)}
			{/* Adresse avec auto-complétion */}
			<div className="col-span-2">
				<AddressAutocomplete
					label="Adresse"
					required
					invalid={Boolean(fieldErrors.address)}
					feedbackInvalid={fieldErrors.address}
					value={inputValue.address}
					onChange={(val) =>
						setInputValue((prev: any) => ({ ...prev, address: val }))
					}
					onSelect={(data) =>
						setInputValue((prev: any) => ({ ...prev, ...data }))
					}
				/>
			</div>
			<FormInputField
				type="number"
				name="zipcode"
				label="Code postal"
				placeholder="Code postal"
				value={inputValue.zipcode}
				required
				error={fieldErrors.zipcode}
				onChange={handleChangeInput}
			/>
			<FormInputField
				type="text"
				name="city"
				label="Ville"
				placeholder="Ville"
				value={inputValue.city}
				required
				error={fieldErrors.city}
				onChange={handleChangeInput}
			/>
			<FormSelectField
				label="Type"
				name="type"
				value={inputValue.type}
				required
				error={fieldErrors.type}
				onChange={handleChangeInput}
			>
				<option value="" disabled>
					--Choisir--
				</option>
				<option value="Maison">Maison</option>
				<option value="Appartement">Appartement</option>
			</FormSelectField>
			<FormInputField
				type="number"
				name="pieces"
				label="Pièces"
				placeholder="Pièces"
				value={inputValue.pieces}
				required
				error={fieldErrors.pieces}
				onChange={handleChangeInput}
			/>
			<FormInputField
				type="number"
				name="area"
				label="Superficie (m²)"
				placeholder="Superficie"
				value={inputValue.area}
				required
				error={fieldErrors.area}
				onChange={handleChangeInput}
			/>

			{/* Coordonnées GPS */}
			<FormInputField
				type="text"
				name="latitude"
				label="Latitude"
				placeholder="Auto-détectée"
				value={inputValue.latitude}
				onChange={handleChangeInput}
			/>
			<FormInputField
				type="text"
				name="longitude"
				label="Longitude"
				placeholder="Auto-détectée"
				value={inputValue.longitude}
				onChange={handleChangeInput}
			/>

			{/* Photo principale */}
			<div className="col-span-2 space-y-1.5">
				<Label>Photo principale (vignette)</Label>
				<Input type="file" accept="image/*" onChange={handleThumbnailChange} />
				{thumbnailPreview && (
					<img
						src={thumbnailPreview}
						alt="Aperçu"
						className="mt-2 rounded"
						style={{ height: 120, objectFit: "cover" }}
					/>
				)}
			</div>

			{/* Galerie de photos */}
			<div className="col-span-2 space-y-1.5">
				<Label>Photos supplémentaires</Label>
				<Input
					type="file"
					accept="image/*"
					multiple
					onChange={handleImagesChange}
				/>
				{imagePreviews.length > 0 && (
					<div className="flex flex-wrap gap-2 mt-2">
						{imagePreviews.map((src, i) => (
							<img
								key={src}
								src={src}
								alt={`Aperçu ${i + 1}`}
								className="rounded"
								style={{ height: 80, objectFit: "cover" }}
							/>
						))}
					</div>
				)}
			</div>

			{/* Détail des pièces */}
			<div className="col-span-2">
				<hr />
				<strong>Détail des pièces</strong>
			</div>
			<div className="col-span-2">
				<div className="flex gap-2 items-center flex-wrap mb-2">
					<select
						className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						style={{ maxWidth: 220 }}
						value={newRoomType}
						onChange={(e) => setNewRoomType(e.target.value)}
					>
						{ROOM_TYPES.map((r) => (
							<option key={r} value={r}>
								{r}
							</option>
						))}
					</select>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() =>
							setRooms((prev) => [...prev, { type: newRoomType, count: 1 }])
						}
					>
						+ Ajouter
					</Button>
				</div>
				{rooms.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{rooms.map((room, i) => (
							<div
								key={`${room.type}-${room.count}`}
								className="flex items-center gap-1 border rounded px-2 py-1"
							>
								<span className="mr-1">{room.type}</span>
								<div className="flex items-center" style={{ width: 90 }}>
									<Input
										type="number"
										min={1}
										max={20}
										value={room.count}
										className="h-7 text-sm"
										onChange={(e) =>
											setRooms((prev) =>
												prev.map((r, idx) =>
													idx === i
														? { ...r, count: Number(e.target.value) }
														: r,
												),
											)
										}
									/>
									<span className="px-1 text-sm text-muted-foreground">×</span>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-6 w-6 p-0"
									onClick={() =>
										setRooms((prev) => prev.filter((_, idx) => idx !== i))
									}
								>
									✕
								</Button>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Caractéristiques */}
			<div className="col-span-2">
				<hr />
				<strong>Caractéristiques</strong>
			</div>
			<div className="col-span-2">
				<div className="flex flex-wrap gap-3">
					{FEATURE_LIST.map((feat) => (
						<label
							key={feat}
							className="flex items-center gap-1.5 text-sm cursor-pointer"
						>
							<input
								type="checkbox"
								id={`feat-create-${feat}`}
								checked={features.includes(feat)}
								onChange={(e) =>
									setFeatures((prev) =>
										e.target.checked
											? [...prev, feat]
											: prev.filter((f) => f !== feat),
									)
								}
								className="h-4 w-4 rounded border-input accent-primary"
							/>
							{feat}
						</label>
					))}
				</div>
			</div>

			{/* Commentaires */}
			<div className="col-span-2">
				<hr />
				<strong>Commentaires</strong>
			</div>
			<div className="col-span-2">
				<FormTextareaField
					name="comments"
					label=""
					rows={3}
					placeholder="Informations complémentaires sur le bien..."
					value={inputValue.comments}
					onChange={(e) =>
						setInputValue((prev: any) => ({
							...prev,
							comments: e.target.value,
						}))
					}
				/>
			</div>

			<div className="col-span-2 flex justify-end gap-2 pt-2 border-t">
				<Button
					type="button"
					variant="outline"
					onClick={() => setModalVisible(false)}
				>
					Annuler
				</Button>
				<Button type="submit">Ajouter</Button>
			</div>
		</form>
	);
};

export default CreateForms;
