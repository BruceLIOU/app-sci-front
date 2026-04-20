# Modernisation UI — Suivi des tâches

Statuts : `[ ]` pending · `[~]` en cours · `[x]` terminé

---

## Tâches terminées (session précédente)

- [x] **T1** — Composant `Sheet` (rightSheet/bottomSheet) — `src/components/ui/sheet.tsx`
- [x] **T2** — Dark mode Chart.js — `Comptability.tsx`, `Reporting.tsx`
- [x] **T3** — Modales legacy → Sheet/pages dédiées — `Modals.tsx`, `PropertyFormPage`, `TenantFormPage`
- [x] **T4** — Widgets stubs supprimés — `WidgetsBrand.tsx`, `WidgetsDropdown.tsx`
- [x] **T5** — `EntityTableCard.headerActions` + migration `Maintenance.tsx`
- [x] **T6** — StatCard dark mode — déjà OK

---

## T7 — Supprimer les classes CSS fantômes
**Statut : [x]** · Priorité : haute

Les classes `app-page-hero`, `app-page-kicker`, `app-display-title`, `app-page-description`,
`app-filter-chip`, `app-ghost-button`, `app-panel-card`, `app-table-card`, `app-calendar-card`
sont utilisées dans 8+ vues **mais ne sont définies nulle part** (ni dans `index.css` ni dans
aucun fichier CSS). Elles sont des no-ops visuels.

**Action :** Définir ces classes dans `src/index.css` avec `@utility` (Tailwind v4) ou les retirer
du JSX et remplacer par des classes Tailwind directes sur les éléments enfants.

**Recommandation :** définir les classes utiles (`app-page-hero`, `app-filter-chip`) en CSS plutôt
que de retirer — elles servent de marqueurs sémantiques réutilisables.

**Fichiers :**
- `src/index.css` ← ajouter les `@utility`
- `src/views/admin/comptability/Comptability.tsx`
- `src/views/admin/reporting/Reporting.tsx`
- `src/views/admin/declarations/Declarations.tsx`
- `src/views/admin/documents/Documents.tsx`
- `src/views/admin/visits/Visits.tsx`
- `src/views/admin/users/Users.tsx`

---

## T8 — Composant StatusBadge centralisé
**Statut : [x]** · Priorité : haute

6 vues implémentent leurs badges de statut avec des classes hardcodées (`bg-emerald-100
text-emerald-700`, `bg-rose-100`, etc.) sans dark mode. Pattern répété et incohérent.

**Action :** Créer `src/components/StatusBadge.tsx` — wrapper de `Badge` shadcn avec une map
`status → variant + label` pour les domaines suivants :
- Baux : `active` / `expired` / `terminated`
- Paiements : `paid` / `pending` / `late`
- Inspections : `entry` / `exit` / condition (A→E)
- Charges : type (assurance, taxe_fonciere, entretien…)
- Notifications : type (payment_reminder, lease_expiry, maintenance…)
- Priorités maintenance : `low` / `medium` / `high` / `urgent`

**Fichiers à migrer après création :**
- `src/views/admin/leases/Leases.tsx` (ligne 38-45, badges hardcodés)
- `src/views/admin/inspections/Inspections.tsx` (fonction `conditionBadgeClass`)
- `src/views/admin/charges/Charges.tsx` (fonction `typeBadgeClass`)
- `src/views/admin/notifications/Notifications.tsx` (`typeConfig.badgeClass`)
- `src/views/admin/tenants/Tenants.tsx` (badge inactif)
- `src/views/admin/payments/Payments.tsx` (badges semi-hardcodés)
- `src/views/admin/maintenance/Maintenance.tsx` (maps priorityBadge/statusBadge)

---

## T9 — Hero sections manquantes
**Statut : [x]** · Priorité : haute

10 vues n'ont pas de section hero (en-tête avec titre, description, chips de contexte).
Pattern de référence : `Comptability.tsx` lignes 217-252 (Card + app-page-hero + kicker + titre +
description + chips).

**Vues à doter d'un hero :**
1. `src/views/admin/properties/Properties.tsx`
2. `src/views/admin/tenants/Tenants.tsx`
3. `src/views/admin/leases/Leases.tsx`
4. `src/views/admin/inspections/Inspections.tsx`
5. `src/views/admin/payments/Payments.tsx`
6. `src/views/admin/charges/Charges.tsx`
7. `src/views/admin/associates/Associates.tsx`
8. `src/views/admin/maintenance/Maintenance.tsx`
9. `src/views/admin/notifications/Notifications.tsx`
10. `src/views/admin/settings/Settings.tsx`
11. `src/views/admin/profile/Profile.tsx`

**Contenu minimal par vue :**
```
kicker     : catégorie (ex. "Gestion locative")
titre      : nom de la vue (ex. "Mes biens")
description: phrase courte sur la fonction
chips      : compteurs contextuels (ex. "3 biens · 2 loués")
CTA        : bouton Ajouter (admin) si applicable
```

---

## T10 — Remplacer les selects natifs par shadcn Select
**Statut : [ ]** · Priorité : moyenne

12+ vues utilisent des `<select>` HTML natifs avec classes Tailwind manuelles au lieu du
composant `Select` shadcn (Radix). Le rendu est incohérent entre navigateurs et en dark mode.

**Vues prioritaires :**
- `src/views/admin/settings/Settings.tsx` (5+ selects natifs)
- `src/views/admin/leases/Leases.tsx` (filtre statut/type)
- `src/views/admin/inspections/Inspections.tsx`
- `src/views/admin/charges/Charges.tsx`
- `src/views/admin/maintenance/Maintenance.tsx` (filtres statut/priorité dans header)
- `src/views/admin/payments/Payments.tsx`

**Composant cible :** `src/components/ui/select.tsx` déjà présent (Radix Select).

**Note :** Les selects dans les formulaires (CreateForms/EditForms) utilisent `FormSelectField`
— vérifier si `FormSelectField` peut passer à shadcn Select sans casser la validation Zod.

---

## T11 — Dark mode : remplacer data-coreui-theme par classe CSS dark:
**Statut : [x]** · Priorité : basse

3 vues détectent le dark mode via `document.documentElement.getAttribute("data-coreui-theme")`
au lieu de la classe CSS `dark:` Tailwind. C'est fragile si le mécanisme de toggle change.

**Fichiers :**
- `src/views/admin/comptability/Comptability.tsx`
- `src/views/admin/reporting/Reporting.tsx`
- (Dashboard.tsx — même pattern)

**Action :** Remplacer la détection par `document.documentElement.classList.contains("dark")`
(plus robuste, cohérent avec Tailwind). Les variables `chartTextColor`/`chartGridColor` restent.

---

## T12 — Formulaires (CreateForms / EditForms) : layout page pleine
**Statut : [ ]** · Priorité : moyenne

`CreateForms.tsx` (832L) et `EditForms.tsx` (922L) sont rendus dans des pages dédiées
(`PropertyFormPage`, `TenantFormPage`) mais n'ont pas de layout page propre :
- Pas de séparateurs visuels entre sections (pas de `<Separator>` shadcn)
- Sections (`<hr>` + `<strong>`) peu esthétiques — remplacer par heading stylé
- Pas de sticky footer avec les boutons Annuler/Sauvegarder
- Le grid `grid-cols-2` peut déborder sur mobile

**Fichiers :**
- `src/views/admin/forms/CreateForms.tsx`
- `src/views/admin/forms/EditForms.tsx`

---

## T13 — ViewForms : enrichir la fiche de visualisation
**Statut : [ ]** · Priorité : basse

`ViewForms.tsx` (181L) affiche un locataire ou un bien en lecture seule dans un Sheet.
Le rendu actuel est minimaliste (grid de champs label/valeur).

**Action :** Ajouter avatar, sections structurées, badges de statut, info garant pour les
locataires ; thumbnail + galerie pour les biens.

---

## T14 — Dashboard : enrichir les widgets et KPIs
**Statut : [ ]** · Priorité : basse

Dashboard.tsx est fonctionnel mais les widgets peuvent être enrichis :
- Alertes actives (impayés, baux expirant) avec lien direct
- Prochaines visites (mini-calendrier ou liste)
- Rentabilité globale (chiffre clé issu du Reporting)

---

## Ordre d'exécution recommandé

1. **T7** — Classes CSS fantômes (rapide, prerequis pour cohérence)
2. **T8** — StatusBadge (composant transversal, débloque T9)
3. **T9** — Hero sections (impact visuel fort, beaucoup de vues)
4. **T11** — Dark mode détection (rapide, 3 fichiers)
5. **T10** — Selects shadcn (scope large, faire vue par vue)
6. **T12** — Formulaires layout (amélioration UX)
7. **T13** — ViewForms enrichi
8. **T14** — Dashboard widgets

---

## Références

- Pattern hero de référence : `src/views/admin/comptability/Comptability.tsx` lignes 217-252
- Pattern Badge correct : `src/views/admin/quittances/Quittances.tsx`
- Pattern table correcte : `src/views/admin/leases/Leases.tsx`
- Composants UI disponibles : `src/components/ui/` (badge, button, card, dialog, input, label,
  select, separator, sheet, spinner, switch, table, tooltip…)
