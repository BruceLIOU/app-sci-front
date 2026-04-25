import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Plus, Trash2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DateUtils } from "src/utils/date";
import ViewControlBar from "../../../components/ViewControlBar";
import type { ViewMode } from "../../../components/ViewControlBar";
import useIsAdmin from "../../../hooks/useIsAdmin";
import PropertyDataService from "../../../services/property.service";
import Modal from "../modals/Modals";
import PropertyDetailModal from "./PropertyDetailModal";
import PropertyMap from "./PropertyMap";

// Ratio hauteur/largeur de l'image selon le nombre de colonnes de la grille
const gridImgRatio: Record<number, string> = {
	1: "21/9",
	2: "16/9",
	3: "4/3",
	4: "1/1",
};

const Properties = () => {
	const navigate = useNavigate();
	const [data, setData] = useState<any[]>([]);
	const [propertyId, setPropertyId] = useState<number | null>(null);
	const [modalVisible, setModalVisible] = useState(false);
	const [modalType, setModalType] = useState<string | null>(null);
	const [detailVisible, setDetailVisible] = useState(false);
	const [selectedProperty, setSelectedProperty] = useState<any>(null);
	const [viewMode, setViewMode] = useState<ViewMode>("vignette");
	const [gridCols, setGridCols] = useState<number>(2);
	const [filterType, setFilterType] = useState<string>("");
	const [filterCity, setFilterCity] = useState<string>("");
	const [filterPieces, setFilterPieces] = useState<string>("");

	const typeOptions = [...new Set(data.map((d) => d.type).filter(Boolean))];
	const cityOptions = [...new Set(data.map((d) => d.city).filter(Boolean))];
	const piecesOptions = [
		...new Set(data.map((d) => d.pieces).filter((p) => p != null)),
	].sort((a, b) => a - b);

	const hasFilter =
		filterType !== "" || filterCity !== "" || filterPieces !== "";

	const filteredData = data.filter((item) => {
		if (filterType && item.type !== filterType) return false;
		if (filterCity && item.city !== filterCity) return false;
		if (filterPieces && String(item.pieces) !== filterPieces) return false;
		return true;
	});

	const resetFilters = () => {
		setFilterType("");
		setFilterCity("");
		setFilterPieces("");
	};
	const isAdmin = useIsAdmin();

	const handleViewProperty = async (id: number) => {
		try {
			const response = await PropertyDataService.get(id);
			setSelectedProperty(response.data);
		} catch {
			setSelectedProperty(data.find((p) => p.id === id) ?? null);
		}
		setDetailVisible(true);
	};
	const handleEditProperty = (id: number) => {
		navigate(`/admin/properties/${id}/edit`);
	};
	const handleDeleteProperty = (id: number) => {
		setPropertyId(id);
		setModalType("delete");
		setModalVisible(true);
	};
	const handleCreateProperty = () => {
		navigate("/admin/properties/new");
	};

	const handleEditFromDetail = () => {
		setDetailVisible(false);
		navigate(`/admin/properties/${selectedProperty?.id}/edit`);
	};
	const handleDeleteFromDetail = () => {
		setDetailVisible(false);
		setPropertyId(selectedProperty?.id ?? null);
		setModalType("delete");
		setModalVisible(true);
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await PropertyDataService.getAll();
				setData(response.data);
			} catch (error: any) {
				console.log(error.message);
			}
		};
		fetchData();
	}, [modalVisible]);

	return (
		<>
			<div className="mb-4">
				<Card className="app-page-hero border-0">
					<CardContent className="p-0">
						<div className="app-page-kicker mb-3">Gestion locative</div>
						<h2 className="mb-2 app-display-title">Mes biens</h2>
						<p className="app-page-description mb-3">
							Gérez votre parc immobilier : appartements, maisons et locaux
							commerciaux.
						</p>
						<div className="flex flex-wrap items-center gap-2">
							<span className="app-filter-chip">
								{data.length} bien{data.length > 1 ? "s" : ""}
							</span>
							<span className="app-filter-chip">
								{data.filter((d) => d.is_rented).length} loué
								{data.filter((d) => d.is_rented).length > 1 ? "s" : ""}
							</span>
							{isAdmin && (
								<Button
									size="sm"
									onClick={handleCreateProperty}
									className="ml-auto"
								>
									<Plus className="h-4 w-4 mr-1" />
									Ajouter un bien
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="max-w-screen-xl mx-auto px-4">
				<div className="mb-3">
					<PropertyMap properties={data} onMarkerClick={handleViewProperty} />
				</div>

				<ViewControlBar
					viewMode={viewMode}
					onViewModeChange={setViewMode}
					supportedModes={["vignette", "list", "grid"]}
					gridCols={gridCols}
					onGridColsChange={setGridCols}
					filters={[
						{
							value: filterType,
							onChange: setFilterType,
							options: typeOptions.map((t) => ({ value: t, label: t })),
							placeholder: "Tous les types",
							width: 160,
						},
						{
							value: filterCity,
							onChange: setFilterCity,
							options: cityOptions.map((c) => ({ value: c, label: c })),
							placeholder: "Toutes les villes",
							width: 160,
						},
						{
							value: filterPieces,
							onChange: setFilterPieces,
							options: piecesOptions.map((p) => ({
								value: String(p),
								label: `${p} pièce${p > 1 ? "s" : ""}`,
							})),
							placeholder: "Nb de pièces",
							width: 140,
						},
					]}
					hasActiveFilter={hasFilter}
					onResetFilters={resetFilters}
					totalCount={data.length}
					filteredCount={filteredData.length}
					itemLabel="bien"
				/>
			</div>

			<div className="w-full px-4">
				{/* Vue vignettes */}
				{viewMode === "vignette" && (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{filteredData.map((item) => (
							<div
								key={item.id}
								className="rounded-xl border bg-card shadow-sm h-full cursor-pointer"
								onClick={() => handleViewProperty(item.id)}
							>
								<div
									style={{
										position: "relative",
										overflow: "hidden",
										borderTopLeftRadius: "calc(var(--radius) - 2px)",
										borderTopRightRadius: "calc(var(--radius) - 2px)",
									}}
								>
									{item.thumbnail ? (
										<img
											src={item.thumbnail}
											alt={item.type}
											style={{
												aspectRatio: "16/9",
												objectFit: "cover",
												width: "100%",
											}}
										/>
									) : (
										<div
											className="flex items-center justify-center bg-muted/30 border-b"
											style={{ aspectRatio: "16/9" }}
										>
											<span className="text-muted-foreground text-sm">
												Aucune photo
											</span>
										</div>
									)}
									{item.Tenants?.length > 0 && (
										<div
											style={{
												position: "absolute",
												top: 16,
												left: -26,
												width: 100,
												transform: "rotate(-45deg)",
												backgroundColor: "#2eb85c",
												color: "white",
												textAlign: "center",
												fontSize: "0.7rem",
												fontWeight: 600,
												padding: "4px 0",
												zIndex: 1,
											}}
										>
											Loué
										</div>
									)}
								</div>
								<div className="p-4">
									<h3 className="font-semibold text-base">
										{`${item.type} – ${item.city}`}
									</h3>
									<p className="text-sm text-muted-foreground">
										Nombre de pièces : {item.pieces}
										<br />
										Superficie : {item.area} m²
									</p>
									<div className="flex flex-wrap gap-2 justify-end mt-2">
										{isAdmin && (
											<Button
												variant="secondary"
												onClick={(e) => {
													e.stopPropagation();
													handleEditProperty(item.id);
												}}
											>
												<Pencil className="h-4 w-4" />
											</Button>
										)}
										{isAdmin && (
											<Button
												variant="secondary"
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteProperty(item.id);
												}}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										)}
									</div>
								</div>
								<div className="px-4 py-3 border-t text-sm text-muted-foreground">
									<small>{DateUtils.formatWithTime(item.createdAt)}</small>
								</div>
							</div>
						))}
					</div>
				)}

				{/* Vue liste */}
				{viewMode === "list" && (
					<div className="flex flex-col gap-2">
						{filteredData.map((item) => (
							<div
								key={item.id}
								className="rounded-xl border bg-card shadow-sm cursor-pointer"
								onClick={() => handleViewProperty(item.id)}
							>
								<div className="flex items-center">
									<div
										style={{
											position: "relative",
											flexShrink: 0,
											overflow: "hidden",
											borderTopLeftRadius: "calc(var(--radius) - 2px)",
											borderBottomLeftRadius: "calc(var(--radius) - 2px)",
										}}
									>
										{item.thumbnail ? (
											<img
												src={item.thumbnail}
												alt={item.type}
												style={{
													width: 100,
													height: 70,
													objectFit: "cover",
													display: "block",
													borderRadius:
														"calc(var(--radius) - 2px) 0 0 calc(var(--radius) - 2px)",
												}}
											/>
										) : (
											<div
												className="flex items-center justify-center bg-muted/30"
												style={{
													width: 100,
													height: 70,
													borderRadius:
														"calc(var(--radius) - 2px) 0 0 calc(var(--radius) - 2px)",
												}}
											>
												<span
													className="text-muted-foreground"
													style={{ fontSize: 10 }}
												>
													Aucune photo
												</span>
											</div>
										)}
										{item.Tenants?.length > 0 && (
											<div
												style={{
													position: "absolute",
													top: 12,
													left: -20,
													width: 80,
													transform: "rotate(-45deg)",
													backgroundColor: "#2eb85c",
													color: "white",
													textAlign: "center",
													fontSize: "0.6rem",
													fontWeight: 600,
													padding: "3px 0",
													zIndex: 1,
												}}
											>
												Loué
											</div>
										)}
									</div>
									<div className="flex items-center flex-1 py-2 gap-4 px-4">
										<strong className="mr-2" style={{ minWidth: 180 }}>
											{item.type} – {item.city}
										</strong>
										<span className="text-muted-foreground">
											{item.pieces} pièce{item.pieces > 1 ? "s" : ""}
										</span>
										<span className="text-muted-foreground">
											{item.area} m²
										</span>
										<small className="text-muted-foreground ml-auto">
											{DateUtils.formatWithTime(item.createdAt)}
										</small>
									</div>
									<div className="flex gap-2 mr-3" style={{ flexShrink: 0 }}>
										{isAdmin && (
											<Button
												variant="secondary"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													handleEditProperty(item.id);
												}}
											>
												<Pencil className="h-4 w-4" />
											</Button>
										)}
										{isAdmin && (
											<Button
												variant="secondary"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteProperty(item.id);
												}}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				)}

				{/* Vue grille personnalisée */}
				{viewMode === "grid" && (
					<div className="flex flex-wrap gap-4">
						{filteredData.map((item) => (
							<div
								key={item.id}
								style={{
									flex: `0 0 ${100 / gridCols}%`,
									maxWidth: `${100 / gridCols}%`,
								}}
							>
								<div
									className="rounded-xl border bg-card shadow-sm h-full cursor-pointer"
									onClick={() => handleViewProperty(item.id)}
								>
									<div
										style={{
											position: "relative",
											overflow: "hidden",
											borderTopLeftRadius: "calc(var(--radius) - 2px)",
											borderTopRightRadius: "calc(var(--radius) - 2px)",
										}}
									>
										{item.thumbnail ? (
											<img
												src={item.thumbnail}
												alt={item.type}
												style={{
													aspectRatio: gridImgRatio[gridCols],
													objectFit: "cover",
													width: "100%",
												}}
											/>
										) : (
											<div
												className="flex items-center justify-center bg-muted/30 border-b"
												style={{ aspectRatio: gridImgRatio[gridCols] }}
											>
												<span className="text-muted-foreground text-sm">
													Aucune photo
												</span>
											</div>
										)}
										{item.Tenants?.length > 0 && (
											<div
												style={{
													position: "absolute",
													top: 16,
													left: -26,
													width: 100,
													transform: "rotate(-45deg)",
													backgroundColor: "#2eb85c",
													color: "white",
													textAlign: "center",
													fontSize: "0.7rem",
													fontWeight: 600,
													padding: "4px 0",
													zIndex: 1,
												}}
											>
												Loué
											</div>
										)}
									</div>
									<div className="p-4">
										<h3 className="font-semibold text-base">
											{`${item.type} – ${item.city}`}
										</h3>
										<p className="text-sm text-muted-foreground">
											Nombre de pièces : {item.pieces}
											<br />
											Superficie : {item.area} m²
										</p>
										<div className="flex flex-wrap gap-2 justify-end mt-2">
											{isAdmin && (
												<Button
													variant="ghost"
													onClick={(e) => {
														e.stopPropagation();
														handleEditProperty(item.id);
													}}
												>
													<Pencil className="h-4 w-4" />
												</Button>
											)}
											{isAdmin && (
												<Button
													variant="ghost"
													onClick={(e) => {
														e.stopPropagation();
														handleDeleteProperty(item.id);
													}}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											)}
										</div>
									</div>
									<div className="px-4 py-3 border-t text-sm text-muted-foreground">
										<small>{DateUtils.formatWithTime(item.createdAt)}</small>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{detailVisible && (
				<PropertyDetailModal
					visible={detailVisible}
					property={selectedProperty}
					onClose={() => setDetailVisible(false)}
					onEdit={handleEditFromDetail}
					onDelete={handleDeleteFromDetail}
				/>
			)}

			{modalVisible && (
				<Modal
					type={modalType}
					entities="properties"
					modalVisible={modalVisible}
					setModalVisible={setModalVisible}
					data={data.filter((item) => item.id === propertyId)}
				/>
			)}
		</>
	);
};

export default Properties;
