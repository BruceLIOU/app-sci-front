import http from "../utils/http-common";

class InspectionDataService {
	getAll() {
		return http.get("/inspections");
	}
	get(id: number) {
		return http.get(`/inspections/${id}`);
	}
	create(data: FormData) {
		return http.post("/inspections", data);
	}
	update(id: number, data: FormData) {
		return http.put(`/inspections/${id}`, data);
	}
	delete(id: number) {
		return http.delete(`/inspections/${id}`);
	}
}

export default new InspectionDataService();
