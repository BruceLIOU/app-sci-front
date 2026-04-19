import L from "leaflet";
import type React from "react";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix icônes Leaflet avec les bundlers
(L.Icon.Default.prototype as any)._getIconUrl = undefined;
L.Icon.Default.mergeOptions({
	iconRetinaUrl:
		"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
	iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
	shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface PropertyMapProps {
	properties: {
		id: number;
		address: string;
		city: string;
		type: string;
		pieces: number;
		area: number;
		latitude?: number | null;
		longitude?: number | null;
	}[];
	onMarkerClick: (id: number) => void;
}

const FitBounds: React.FC<{ positions: [number, number][] }> = ({
	positions,
}) => {
	const map = useMap();
	useEffect(() => {
		if (positions.length === 1) {
			map.setView(positions[0], 13);
		} else if (positions.length > 1) {
			map.fitBounds(L.latLngBounds(positions), {
				padding: [40, 40],
				maxZoom: 14,
			});
		}
	}, [positions.length]);
	return null;
};

const PropertyMap: React.FC<PropertyMapProps> = ({
	properties,
	onMarkerClick,
}) => {
	const geolocated = properties.filter(
		(p) => p.latitude && p.longitude,
	) as ((typeof properties)[number] & {
		latitude: number;
		longitude: number;
	})[];

	if (geolocated.length === 0) {
		return (
			<div
				className="d-flex align-items-center justify-content-center bg-light rounded border"
				style={{ height: 300 }}
			>
				<span className="text-medium-emphasis">
					Aucun bien géolocalisé — renseignez des adresses pour afficher la
					carte
				</span>
			</div>
		);
	}

	const positions: [number, number][] = geolocated.map((p) => [
		p.latitude,
		p.longitude,
	]);
	const defaultCenter: [number, number] = positions[0];

	return (
		<MapContainer
			center={defaultCenter}
			zoom={5}
			style={{ height: 360, width: "100%", borderRadius: 8 }}
			scrollWheelZoom={false}
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<FitBounds positions={positions} />
			{geolocated.map((property) => (
				<Marker
					key={property.id}
					position={[property.latitude, property.longitude]}
					eventHandlers={{ click: () => onMarkerClick(property.id) }}
				>
					<Popup>
						<strong>
							{property.type} – {property.city}
						</strong>
						<br />
						{property.address}
						<br />
						{property.pieces} pièces · {property.area} m²
						<br />
						<a
							href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${property.address}, ${property.city}`)}`}
							target="_blank"
							rel="noopener noreferrer"
							style={{ fontSize: "0.8rem" }}
						>
							Itinéraire →
						</a>
					</Popup>
				</Marker>
			))}
		</MapContainer>
	);
};

export default PropertyMap;
