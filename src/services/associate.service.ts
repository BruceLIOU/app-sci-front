import http from "../utils/http-common";

class AssociateDataService {
	getAll() {
		return http.get("/associates");
	}
	get(id: number) {
		return http.get(`/associates/${id}`);
	}
	create(data: FormData) {
		return http.post("/associates", data);
	}
	update(id: number, data: FormData) {
		return http.put(`/associates/${id}`, data);
	}
	delete(id: number) {
		return http.delete(`/associates/${id}`);
	}
}

export default new AssociateDataService();
