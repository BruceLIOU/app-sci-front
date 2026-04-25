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

interface EditFormsProps {
	setModalVisible: (v: boolean) => void;
	data: any[];
	entities: string;
}

const EditForms = ({ setModalVisible, data, entities }: EditFormsProps) => {
	const [validated, setValidated] = useState(false);
	const [properties, setProperties] = useState<any[]>([]);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [submitError, setSubmitError] = useState<string>("");
	const isTenant = entities === "tenants";

	// État pour la branche properties
	const [thumbnail, setThumbnail] = useState<File | null>(null);
	const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
		data[0]?.thumbnail || null,
	);
	const [removeThumbnail, setRemoveThumbnail] = useState(false);
	const [propertyImages, setPropertyImages] = useState<File[]>([]);
	const [existingImages, setExistingImages] = useState<string[]>(() => {
		try {
			return JSON.parse(data[0]?.images || "[]");
		} catch {
			return [];
		}
	});
	const [rooms, setRooms] = useState<{ type: string; count: number }[]>(() => {
		try {
			return JSON.parse(data[0]?.rooms || "[]");
		} catch {
			return [];
		}
	});
	const [features, setFeatures] = useState<string[]>(() => {
		try {
			return JSON.parse(data[0]?.features || "[]");
		} catch {
			return [];
		}
	});
	const [newRoomType, setNewRoomType] = useState(ROOM_TYPES[0]);

	// État pour la branche tenants
	const [avatar, setAvatar] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(
		data[0]?.avatar || null,
	);
	const [removeAvatar, setRemoveAvatar] = useState(false);

	const [inputValue, setInputValue] = useState<any>(
		isTenant
			? {
					civility: data[0]?.civility || "MR",
					firstname: data[0]?.firstname || "",
					lastname: data[0]?.lastname || "",
					email: data[0]?.email || "",
					mobile: data[0]?.mobile || "",
					property_id: data[0]?.property_id || "",
					comments: data[0]?.comments || "",
					previous_address: data[0]?.previous_address || "",
					previous_zipcode: data[0]?.previous_zipcode || "",
					previous_city: data[0]?.previous_city || "",
					guarantor_civility: data[0]?.guarantor_civility || "MR",
					guarantor_firstname: data[0]?.guarantor_firstname || "",
					guarantor_lastname: data[0]?.guarantor_lastname || "",
					guarantor_email: data[0]?.guarantor_email || "",
					guarantor_mobile: data[0]?.guarantor_mobile || "",
					guarantor_address: data[0]?.guarantor_address || "",
					guarantor_zipcode: data[0]?.guarantor_zipcode || "",
					guarantor_city: data[0]?.guarantor_city || "",
					monthly_income: data[0]?.monthly_income || "",
				}
			: {
					address: data[0]?.address || "",
					zipcode: data[0]?.zipcode || "",
					city: data[0]?.city || "",
					type: data[0]?.type || "",
					pieces: data[0]?.pieces || "",
					area: data[0]?.area || "",
					latitude: data[0]?.latitude || "",
					longitude: data[0]?.longitude || "",
					comments: data[0]?.comments || "",
					dpe_class: data[0]?.dpe_class || "",
					dpe_value: data[0]?.dpe_value || "",
					dpe_date: data[0]?.dpe_date || "",
					ges_class: data[0]?.ges_class || "",
					ges_value: data[0]?.ges_value || "",
					diagnostic_amiante: Boolean(data[0]?.diagnostic_amiante),
					diagnostic_plomb: Boolean(data[0]?.diagnostic_plomb),
					diagnostic_elec: Boolean(data[0]?.diagnostic_elec),
					diagnostic_gaz: Boolean(data[0]?.diagnostic_gaz),
					diagnostic_date: data[0]?.diagnostic_date || "",
				},
	);

	useEffect(() => {
		if (isTenant)
			PropertyDataService.getAll()
				.then((res) => setProperties(res.data))
				.catch((err) => console.log(err.message));
	}, [isTenant]);

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
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setValidated(true);
		setSubmitError("");

		const parsed = isTenant
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
		if (!isTenant) {
			if (removeThumbnail && !thumbnail)
				formData.append("removeThumbnail", "true");
			if (thumbnail) formData.append("thumbnail", thumbnail);
			propertyImages.forEach((img) => formData.append("images", img));
			if (propertyImages.length === 0)
				formData.append("keepImages", JSON.stringify(existingImages));
			formData.append("rooms", JSON.stringify(rooms));
			formData.append("features", JSON.stringify(features));
		}
		if (isTenant) {
			if (avatar) formData.append("avatar", avatar);
			else if (removeAvatar) formData.append("removeAvatar", "true");
		}
		try {
			if (isTenant) await TenantDataService.update(data[0].id, formData);
			else await PropertyDataService.update(data[0].id, formData);
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

	if (isTenant) {
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
				<div className="col-span-2">
					<Label>Photo du locataire</Label>
					{avatarPreview && !removeAvatar ? (
						<div className="flex items-center gap-3 mb-2">
							<img
								src={avatarPreview}
								alt="Avatar"
								className="rounded-full"
								style={{ width: 72, height: 72, objectFit: "cover" }}
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => {
									setRemoveAvatar(true);
									setAvatarPreview(null);
									setAvatar(null);
								}}
							>
								Supprimer la photo
							</Button>
						</div>
					) : null}
					<Input
						type="file"
						accept="image/*"
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) {
								setAvatar(file);
								setAvatarPreview(URL.createObjectURL(file));
								setRemoveAvatar(false);
							}
						}}
					/>
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
					value={inputValue.firstname}
					required
					error={fieldErrors.firstname}
					onChange={handleChangeInput}
				/>
				<FormInputField
					type="text"
					name="lastname"
					label="Nom"
					value={inputValue.lastname}
					required
					error={fieldErrors.lastname}
					onChange={handleChangeInput}
				/>
				<FormInputField
					type="email"
					name="email"
					label="Email"
					value={inputValue.email}
					error={fieldErrors.email}
					onChange={handleChangeInput}
				/>
				<FormInputField
					type="text"
					name="mobile"
					label="Téléphone"
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

				{/* Solvabilité */}
				<FormInputField
					type="number"
					name="monthly_income"
					label="Revenus mensuels nets (€)"
					placeholder="Ex : 2500"
					value={inputValue.monthly_income}
					onChange={handleChangeInput}
				/>

				{/* Garant */}
				<div className="col-span-2">
					<hr />
					<strong>Garant</strong>
				</div>
				<FormSelectField
					label="Civilité"
					name="guarantor_civility"
					value={inputValue.guarantor_civility}
					onChange={handleChangeInput}
				>
					<option value="MR">M.</option>
					<option value="MME">Mme</option>
				</FormSelectField>
				<FormInputField
					type="text"
					name="guarantor_firstname"
					label="Prénom du garant"
					placeholder="Prénom"
					value={inputValue.guarantor_firstname}
					onChange={handleChangeInput}
				/>
				<FormInputField
					type="text"
					name="guarantor_lastname"
					label="Nom du garant"
					placeholder="Nom"
					value={inputValue.guarantor_lastname}
					onChange={handleChangeInput}
				/>
				<FormInputField
					type="email"
					name="guarantor_email"
					label="Email du garant"
					placeholder="Email"
					value={inputValue.guarantor_email}
					error={fieldErrors.guarantor_email}
					onChange={handleChangeInput}
				/>
				<FormInputField
					type="text"
					name="guarantor_mobile"
					label="Téléphone du garant"
					placeholder="Téléphone"
					value={inputValue.guarantor_mobile}
					onChange={handleChangeInput}
				/>
				<div className="col-span-2">
					<AddressAutocomplete
						label="Adresse du garant"
						value={inputValue.guarantor_address}
						onChange={(val) =>
							setInputValue((prev: any) => ({
								...prev,
								guarantor_address: val,
							}))
						}
						onSelect={(d) =>
							setInputValue((prev: any) => ({
								...prev,
								guarantor_address: d.address,
								guarantor_zipcode: d.zipcode,
								guarantor_city: d.city,
							}))
						}
					/>
				</div>
				<FormInputField
					type="text"
					name="guarantor_zipcode"
					label="CP garant"
					placeholder="Code postal"
					value={inputValue.guarantor_zipcode}
					onChange={handleChangeInput}
				/>
				<FormInputField
					type="text"
					name="guarantor_city"
					label="Ville garant"
					placeholder="Ville"
					value={inputValue.guarantor_city}
					onChange={handleChangeInput}
				/>

				<div className="col-span-2 flex justify-end gap-2 pt-2 border-t">
					<Button
						type="button"
						variant="outline"
						onClick={() => setModalVisible(false)}
					>
						Annuler
					</Button>
					<Button type="submit">Modifier</Button>
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
				value={inputValue.zipcode}
				required
				error={fieldErrors.zipcode}
				onChange={handleChangeInput}
			/>
			<FormInputField
				type="text"
				name="city"
				label="Ville"
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
				value={inputValue.pieces}
				required
				error={fieldErrors.pieces}
				onChange={handleChangeInput}
			/>
			<FormInputField
				type="number"
				name="area"
				label="Superficie (m²)"
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
			<div className="col-span-2">
				<FormInputField
					label="Photo principale (vignette)"
					type="file"
					accept="image/*"
					onChange={handleThumbnailChange}
				/>
				{thumbnailPreview && (
					<div className="mt-2 flex items-start gap-2">
						<img
							src={thumbnailPreview}
							alt="Vignette"
							className="rounded"
							style={{ height: 120, objectFit: "cover" }}
						/>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-6 w-6 p-0"
							title="Supprimer la vignette"
							onClick={() => {
								setThumbnailPreview(null);
								setThumbnail(null);
								setRemoveThumbnail(true);
							}}
						>
							✕
						</Button>
					</div>
				)}
			</div>

			{/* Galerie de photos */}
			<div className="col-span-2">
				<FormInputField
					label="Photos supplémentaires"
					type="file"
					accept="image/*"
					multiple
					onChange={handleImagesChange}
				/>
				{existingImages.length > 0 && propertyImages.length === 0 && (
					<div className="mt-2">
						<small className="text-muted-foreground block mb-1">
							Photos actuelles :
						</small>
						<div className="flex flex-wrap gap-2">
							{existingImages.map((src, i) => (
								<div key={src} style={{ position: "relative" }}>
									<img
										src={src}
										alt={`Aperçu ${i + 1}`}
										className="rounded"
										style={{ height: 80, objectFit: "cover" }}
									/>
									<Button
										type="button"
										variant="destructive"
										size="sm"
										className="absolute top-0.5 right-0.5 h-5 w-5 p-0 text-[0.65rem]"
										title="Supprimer cette photo"
										onClick={() =>
											setExistingImages((prev) =>
												prev.filter((_, idx) => idx !== i),
											)
										}
									>
										✕
									</Button>
								</div>
							))}
						</div>
					</div>
				)}
				{propertyImages.length > 0 && (
					<div className="mt-2">
						<small className="text-muted-foreground block mb-1">
							Nouvelles photos :
						</small>
						<div className="flex flex-wrap gap-2">
							{propertyImages.map((file, i) => (
								<div
									key={`${file.name}-${file.size}`}
									style={{ position: "relative" }}
								>
									<img
										src={URL.createObjectURL(file)}
										alt={`Aperçu ${i + 1}`}
										className="rounded"
										style={{ height: 80, objectFit: "cover" }}
									/>
									<Button
										type="button"
										variant="destructive"
										size="sm"
										className="absolute top-0.5 right-0.5 h-5 w-5 p-0 text-[0.65rem]"
										title="Retirer cette photo"
										onClick={() =>
											setPropertyImages((prev) =>
												prev.filter((_, idx) => idx !== i),
											)
										}
									>
										✕
									</Button>
								</div>
							))}
						</div>
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
					<Select value={newRoomType} onValueChange={setNewRoomType}>
						<SelectTrigger className="w-[220px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{ROOM_TYPES.map((r) => (
								<SelectItem key={r} value={r}>
									{r}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
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
								id={`feat-edit-${feat}`}
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

			{/* Diagnostics */}
			<div className="col-span-2">
				<hr />
				<strong>Diagnostics</strong>
			</div>
			<FormSelectField
				label="Classe DPE"
				name="dpe_class"
				value={inputValue.dpe_class}
				onChange={handleChangeInput}
			>
				<option value="">-- Non renseigné --</option>
				{["A", "B", "C", "D", "E", "F", "G"].map((c) => (
					<option key={c} value={c}>
						{c}
					</option>
				))}
			</FormSelectField>
			<FormInputField
				type="number"
				name="dpe_value"
				label="DPE (kWh/m²/an)"
				placeholder="ex: 120"
				value={inputValue.dpe_value}
				onChange={handleChangeInput}
			/>
			<FormSelectField
				label="Classe GES"
				name="ges_class"
				value={inputValue.ges_class}
				onChange={handleChangeInput}
			>
				<option value="">-- Non renseigné --</option>
				{["A", "B", "C", "D", "E", "F", "G"].map((c) => (
					<option key={c} value={c}>
						{c}
					</option>
				))}
			</FormSelectField>
			<FormInputField
				type="number"
				name="ges_value"
				label="GES (kg CO₂/m²/an)"
				placeholder="ex: 25"
				value={inputValue.ges_value}
				onChange={handleChangeInput}
			/>
			<FormInputField
				type="date"
				name="dpe_date"
				label="Date DPE"
				value={inputValue.dpe_date}
				onChange={handleChangeInput}
			/>
			<FormInputField
				type="date"
				name="diagnostic_date"
				label="Date diagnostics"
				value={inputValue.diagnostic_date}
				onChange={handleChangeInput}
			/>
			<div className="col-span-2">
				<div className="flex flex-wrap gap-4">
					{[
						{ key: "diagnostic_amiante", label: "Amiante" },
						{ key: "diagnostic_plomb", label: "Plomb (CREP)" },
						{ key: "diagnostic_elec", label: "Électricité" },
						{ key: "diagnostic_gaz", label: "Gaz" },
					].map(({ key, label }) => (
						<label
							key={key}
							className="flex items-center gap-2 text-sm cursor-pointer"
						>
							<input
								type="checkbox"
								checked={Boolean(inputValue[key])}
								onChange={(e) =>
									setInputValue((prev: any) => ({
										...prev,
										[key]: e.target.checked,
									}))
								}
								className="h-4 w-4 rounded border-input accent-primary"
							/>
							{label}
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
				<Button type="submit">Modifier</Button>
			</div>
		</form>
	);
};

export default EditForms;
