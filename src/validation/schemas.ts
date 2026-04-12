import { z } from 'zod'

export const tenantFormSchema = z.object({
  firstname: z.string().min(1, 'Le prénom est requis.'),
  lastname: z.string().min(1, 'Le nom est requis.'),
  email: z.email('Email invalide.').optional().or(z.literal('')),
})

export const propertyFormSchema = z.object({
  address: z.string().min(1, "L'adresse est requise."),
  zipcode: z.string().min(1, 'Le code postal est requis.'),
  city: z.string().min(1, 'La ville est requise.'),
  type: z.string().min(1, 'Le type est requis.'),
  pieces: z.string().min(1, 'Le nombre de pieces est requis.'),
  area: z.string().min(1, 'La superficie est requise.'),
})

export const leaseFormSchema = z.object({
  property_id: z.string().min(1, 'Le bien est requis.'),
  start_date: z.string().min(1, 'La date de debut est requise.'),
  rent_amount: z
    .string()
    .min(1, 'Le loyer est requis.')
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, 'Le loyer doit etre un nombre positif.'),
  charges_amount: z
    .string()
    .refine((v) => v === '' || (!isNaN(Number(v)) && Number(v) >= 0), 'Les charges doivent etre un nombre positif.'),
  deposit_amount: z
    .string()
    .refine((v) => v === '' || (!isNaN(Number(v)) && Number(v) >= 0), 'Le depot doit etre un nombre positif.'),
})

export const chargeFormSchema = z.object({
  amount: z
    .string()
    .min(1, 'Le montant est requis.')
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, 'Le montant doit etre un nombre positif.'),
  date: z.string().min(1, 'La date est requise.'),
})

export const paymentFormSchema = z.object({
  month: z.string().min(1, 'Le mois est requis.'),
  amount: z
    .string()
    .min(1, 'Le montant est requis.')
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, 'Le montant doit etre un nombre positif.'),
  status: z.enum(['pending', 'paid', 'late'], 'Statut invalide.'),
})

export const associateFormSchema = z.object({
  lastname: z.string().min(1, 'Le nom est requis.'),
  email: z.email('Email invalide.').optional().or(z.literal('')),
  shares: z
    .string()
    .min(1, 'Les parts sont requises.')
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100, 'Les parts doivent etre entre 0 et 100.'),
})

export const inspectionFormSchema = z.object({
  property_id: z.string().min(1, 'Le bien est requis.'),
  date: z.string().min(1, 'La date est requise.'),
})

export const quittanceFormSchema = z.object({
  period: z.string().min(1, 'La periode est requise.'),
  rent_amount: z
    .string()
    .min(1, 'Le loyer est requis.')
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, 'Le loyer doit etre un nombre positif.'),
  charges_amount: z
    .string()
    .refine((v) => v === '' || (!isNaN(Number(v)) && Number(v) >= 0), 'Les charges doivent etre un nombre positif.'),
  issue_date: z.string().min(1, "La date d'emission est requise."),
})

export function toFieldErrors(error: z.ZodError): Record<string, string> {
  return error.issues.reduce((acc, issue) => {
    const key = String(issue.path[0] ?? '_')
    if (!acc[key]) acc[key] = issue.message
    return acc
  }, {} as Record<string, string>)
}
