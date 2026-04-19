import http from "../utils/http-common";

class QuittanceDataService {
	getAll() {
		return http.get("/quittances");
	}
	get(id: number) {
		return http.get(`/quittances/${id}`);
	}
	create(data: FormData) {
		return http.post("/quittances", data);
	}
	update(id: number, data: FormData) {
		return http.put(`/quittances/${id}`, data);
	}
	delete(id: number) {
		return http.delete(`/quittances/${id}`);
	}
	bulkDelete(ids: number[]) {
		const fd = new FormData();
		fd.append("ids", JSON.stringify(ids));
		return http.post("/quittances/bulk-delete", fd);
	}
	bulkGeneratePdf(ids: number[]) {
		const fd = new FormData();
		fd.append("ids", JSON.stringify(ids));
		return http.post("/quittances/bulk-pdf", fd);
	}
	bulkEmail(ids: number[]) {
		const fd = new FormData();
		fd.append("ids", JSON.stringify(ids));
		return http.post("/quittances/bulk-email", fd);
	}
}

export default new QuittanceDataService();
