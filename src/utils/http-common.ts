import axios from "axios";

export default axios.create({
	baseURL: import.meta.env.VITE_API_URL
		? `${import.meta.env.VITE_API_URL}/api`
		: "/api",
	withCredentials: true, // envoie le cookie JWT httpOnly
});
