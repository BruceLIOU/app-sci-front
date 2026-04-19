import http from "../utils/http-common";

class PaymentDataService {
	getAll() {
		return http.get("/payments");
	}
	get(id: number) {
		return http.get(`/payments/${id}`);
	}
	create(data: FormData) {
		return http.post("/payments", data);
	}
	update(id: number, data: FormData) {
		return http.put(`/payments/${id}`, data);
	}
	delete(id: number) {
		return http.delete(`/payments/${id}`);
	}
	bulkDelete(ids: number[]) {
		const fd = new FormData();
		fd.append("ids", JSON.stringify(ids));
		return http.post("/payments/bulk-delete", fd);
	}
}

export default new PaymentDataService();
