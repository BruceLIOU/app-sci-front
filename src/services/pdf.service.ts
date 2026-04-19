import http from "../utils/http-common";

class PdfDataService {
	/** Génère le bail PDF, l'upload sur Cloudinary et crée les Documents en base */
	generateBail(leaseId: number) {
		return http.post(`/pdf/bail/${leaseId}`);
	}

	/** Génère une quittance PDF */
	generateQuittance(quittanceId: number) {
		return http.post(`/pdf/quittance/${quittanceId}`);
	}

	/** Génère un état des lieux PDF */
	generateEtatDesLieux(inspectionId: number) {
		return http.post(`/pdf/etat-des-lieux/${inspectionId}`);
	}

	/** Génère une attestation de loyer PDF */
	generateAttestation(leaseId: number) {
		return http.post(`/pdf/attestation/${leaseId}`);
	}

	/** Envoie le bail par email au locataire (génération à la volée) */
	emailBail(leaseId: number) {
		return http.post(`/pdf/bail/${leaseId}/email`);
	}

	/** Envoie une quittance par email au locataire */
	emailQuittance(quittanceId: number) {
		return http.post(`/pdf/quittance/${quittanceId}/email`);
	}

	/** Envoie un état des lieux par email au locataire */
	emailEtatDesLieux(inspectionId: number) {
		return http.post(`/pdf/etat-des-lieux/${inspectionId}/email`);
	}

	/** Retourne l'URL de prévisualisation directe du bail (sans sauvegarde) */
	previewBailUrl(leaseId: number): string {
		const base =
			// biome-ignore lint/suspicious/noExplicitAny: import.meta.env non typé avec Vite
			(import.meta as any).env?.VITE_API_URL ?? "http://localhost:3000/api";
		return `${base}/pdf/bail/${leaseId}/preview`;
	}
}

export default new PdfDataService();
