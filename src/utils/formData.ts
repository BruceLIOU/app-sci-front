/**
 * Convertit un objet en FormData.
 * Les valeurs null/undefined sont ignorées.
 */
// biome-ignore lint/suspicious/noExplicitAny: type API non encore défini
export const toFormData = (obj: Record<string, any>): FormData => {
	const fd = new FormData();
	for (const [k, v] of Object.entries(obj)) {
		if (v != null) fd.append(k, String(v));
	}
	return fd;
};
