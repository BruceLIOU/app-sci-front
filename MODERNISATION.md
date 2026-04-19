# Modernisation UI — Suivi des tâches

Statuts : `[ ]` pending · `[~]` en cours · `[x]` terminé

---

## T1 — Composant Sheet (rightSheet / bottomSheet)
**Statut : [x]**

Créer `src/components/ui/sheet.tsx` basé sur `@radix-ui/react-dialog` (déjà installé).
- Variante `right` : slide-in depuis la droite, largeur 420–500px, full-height
- Variante `bottom` : slide-in depuis le bas, max-h 85vh, full-width
- Props : `open`, `onOpenChange`, `title`, `children`, `side?: "right" | "bottom"`
- Overlay sombre + fermeture au clic/Escape

**Fichiers :**
- `src/components/ui/sheet.tsx` ← à créer

---

## T2 — Dark mode graphiques (Comptability + Reporting)
**Statut : [x]**

Dashboard.tsx a déjà le pattern `isDarkMode` via MutationObserver. Appliquer à :
- `src/views/admin/comptability/Comptability.tsx`
- `src/views/admin/reporting/Reporting.tsx`

Couleurs adaptatives :
- Labels/grille : `isDarkMode ? "#94a3b8" : "#64748b"`
- Fond tooltip : `isDarkMode ? "#1e293b" : "#ffffff"`
- Datasets : variables conditionnelles (pas de couleurs hardcodées)

---

## T3 — Migrer les modales legacy → Sheet
**Statut : [x]**

Properties.tsx et Tenants.tsx utilisent encore `src/views/admin/modals/Modals.tsx` (legacy).

Cibles :
- Formulaires créer/éditer → `Sheet side="right"`
- Confirmation suppression → garder `DeleteModal` (shadcn Dialog)
- Détail/view → `Sheet side="right"`

Fichiers à modifier :
- `src/views/admin/properties/Properties.tsx`
- `src/views/admin/tenants/Tenants.tsx`
- `src/views/admin/forms/CreateForms.tsx`
- `src/views/admin/forms/EditForms.tsx`
- `src/views/admin/forms/ViewForms.tsx`

Fichiers à supprimer après migration :
- `src/views/admin/modals/Modals.tsx` (si plus importé nulle part)

---

## T4 — Widgets stubs
**Statut : [x]** — stubs non importés, supprimés (WidgetsDropdown.tsx, WidgetsBrand.tsx).

`src/views/widgets/WidgetsDropdown.tsx` et `WidgetsBrand.tsx` retournent `null`.
- Vérifier si importés dans Dashboard.tsx ou ailleurs
- Si non utilisés : supprimer les fichiers et les imports
- Si utilisés : implémenter avec cartes shadcn (KPIs récupérés des services)

---

## T5 — Uniformiser le pattern listes/tables
**Statut : [x]**

6 vues utilisent `EntityTableCard`, 7 utilisent `Table` directement.
Vues à migrer vers un wrapper cohérent :
- `src/views/admin/reporting/Reporting.tsx`
- `src/views/admin/comptability/Comptability.tsx`
- `src/views/admin/documents/Documents.tsx`
- `src/views/admin/notifications/Notifications.tsx`
- `src/views/admin/users/Users.tsx`
- `src/views/admin/declarations/Declarations.tsx`
- `src/views/admin/maintenance/Maintenance.tsx`

Option : créer un `TableCard` plus léger (sans bouton Add) pour les vues sans CRUD.

---

## T6 — StatCard dark mode
**Statut : [x]** — classes dark: déjà présentes (dark:text-slate-50 / dark:text-slate-400), aucune modification nécessaire.

Vérifier `src/components/StatCard.tsx` :
- Les couleurs `accentMap` doivent fonctionner en dark mode
- Ajouter `dark:` variants si les couleurs sont hardcodées

---

## Ordre d'exécution

1. T1 — Sheet (prérequis pour T3)
2. T6 — StatCard dark (rapide, isolé)
3. T2 — Charts dark mode (2 fichiers)
4. T3 — Modales → Sheet (dépend T1, impact fort)
5. T4 — Widgets (décision + nettoyage)
6. T5 — Tables (scope large, en dernier)
