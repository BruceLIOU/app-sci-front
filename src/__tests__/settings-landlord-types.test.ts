/**
 * Test des types de bailleurs adaptatifs
 * Vérifie que les champs s'affichent correctement selon le type sélectionné
 */

export const testScenarios = {
	// Scénario 1: Bailleur particulier (minimal)
	individual: {
		type: "INDIVIDUAL",
		expectedFields: ["name", "address", "zipcode", "city", "iban"],
		hiddenFields: [
			"legal_form",
			"siret",
			"rcs",
			"manager_civility",
			"manager_firstname",
			"manager_lastname",
			"manager_email",
			"manager_phone",
		],
		description: "Affiche uniquement les champs essentiels pour un particulier",
	},

	// Scénario 2: Bailleur professionnel
	professional: {
		type: "PROFESSIONAL",
		expectedFields: [
			"legal_form",
			"name",
			"siret",
			"rcs",
			"address",
			"zipcode",
			"city",
			"iban",
			"manager_civility",
			"manager_firstname",
			"manager_lastname",
			"manager_email",
			"manager_phone",
		],
		hiddenFields: [],
		description: "Affiche les champs professionnels + gestionnaire",
	},

	// Scénario 3: SCI
	sci: {
		type: "SCI",
		expectedFields: [
			"legal_form",
			"name",
			"siret",
			"rcs",
			"address",
			"zipcode",
			"city",
			"iban",
			"manager_civility",
			"manager_firstname",
			"manager_lastname",
			"manager_email",
			"manager_phone",
			"manager_associate_id",
		],
		hiddenFields: [],
		description: "Affiche tous les champs + sélection des co-gérants",
	},
};

// Vérification des labels adaptatifs
export const labelTests = {
	nameLabel: {
		INDIVIDUAL: "Nom du bailleur",
		PROFESSIONAL: "Nom du bailleur",
		SCI: "Raison sociale",
	},
	addressLabel: {
		INDIVIDUAL: "Adresse",
		PROFESSIONAL: "Adresse",
		SCI: "Adresse du siège social",
	},
	managerLabel: {
		INDIVIDUAL: "N/A",
		PROFESSIONAL: "Responsable",
		SCI: "Gérant",
	},
};
