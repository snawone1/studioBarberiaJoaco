
import { z } from 'zod';

// Client-side Appointment Form Schema (used by react-hook-form)
export const clientAppointmentSchema = z.object({
  preferredDate: z.date({ required_error: "Por favor, selecciona una fecha."}),
  preferredTime: z.string().min(1, { message: "Por favor, selecciona un horario."}),
  services: z.array(z.string()).min(1, { message: "Por favor, selecciona al menos un servicio."}),
  selectedProducts: z.array(z.string()).optional(), // New field for selected products
  message: z.string().optional(),
});
export type ClientAppointmentFormValues = z.infer<typeof clientAppointmentSchema>;

// Server-side/Full Appointment Schema (used by server action)
// This now explicitly includes userId, which is added by the client before sending to the server.
export const appointmentSchema = clientAppointmentSchema.extend({
  userId: z.string().min(1, { message: "User ID is required." }),
});
export type AppointmentFormValues = z.infer<typeof appointmentSchema>;


// Style Advisor Form Schema
export const styleAdvisorSchema = z.object({
  hairType: z.string().min(1, { message: "Please select your hair type." }),
  faceShape: z.string().min(1, { message: "Please select your face shape." }),
  stylePreferences: z.string().min(3, { message: "Describe your style preferences (min 3 chars)." }),
});
export type StyleAdvisorFormValues = z.infer<typeof styleAdvisorSchema>;

// Login Form Schema
export const loginSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});
export type LoginFormData = z.infer<typeof loginSchema>;

// Register Form Schema
export const registerSchema = z.object({
  fullName: z.string().min(2, { message: "El nombre completo debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Correo electrónico inválido." }),
  phoneNumber: z.string().min(8, { message: "El número de teléfono debe tener al menos 8 dígitos." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"], // path of error
});
export type RegisterFormData = z.infer<typeof registerSchema>;

// Site Settings Form Schema
export const siteSettingsSchema = z.object({
  siteName: z.string().min(1, { message: "El nombre del sitio no puede estar vacío." }),
  siteDescription: z.string().min(1, { message: "La descripción del sitio no puede estar vacía." }),
});
export type SiteSettingsFormValues = z.infer<typeof siteSettingsSchema>;

// Product Form Schema
export const productSchema = z.object({
  id: z.string().optional(), // Optional for new products, required for existing
  name: z.string().min(3, { message: "El nombre del producto debe tener al menos 3 caracteres." }),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
  price: z.string().regex(/^ARS\$\s?\d+(\.\d{1,2})?$/, { message: "El precio debe estar en formato ARS$ XXXX o ARS$ XXXX.XX" }),
  imageSrc: z.string()
    .min(1, { message: "La URL de la imagen no puede estar vacía." })
    .url({ message: "Por favor, introduce una URL de imagen válida." })
    .refine(val => val.startsWith('http://') || val.startsWith('https://'), {
      message: "La URL debe empezar con http:// o https://",
    }),
  aiHint: z.string().min(2, { message: "La pista de IA debe tener al menos 2 caracteres." }),
  stock: z.coerce.number().min(0, { message: "El stock no puede ser negativo." }).optional().default(0),
});
export type ProductFormValues = z.infer<typeof productSchema>;

// Service Form Schema (for booking page)
export const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: "El nombre del servicio debe tener al menos 3 caracteres." }),
  description: z.string().min(5, { message: "La descripción debe tener al menos 5 caracteres." }),
  price: z.string().regex(/^ARS\$\s?\d+(\.\d{1,2})?$/, { message: "El precio debe estar en formato ARS$ XXXX o ARS$ XXXX.XX" }),
});
export type ServiceFormValues = z.infer<typeof serviceSchema>;

// Admin Edit User Form Schema
export const adminEditUserSchema = z.object({
  fullName: z.string().min(2, { message: "El nombre completo debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Correo electrónico inválido." }), // Included for form structure, but will be read-only
  phoneNumber: z.string().min(8, { message: "El número de teléfono debe tener al menos 8 dígitos." }),
});
export type AdminEditUserFormValues = z.infer<typeof adminEditUserSchema>;

// Home Page Service Card Schema
export const homePageServiceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: "El nombre del servicio debe tener al menos 3 caracteres." }),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
  iconName: z.string().min(1, { message: "El nombre del ícono no puede estar vacío." }),
  dataAiHint: z.string().min(2, { message: "La pista para IA debe tener al menos 2 caracteres." }),
  order: z.coerce.number().min(0).optional().default(0), // For ordering display
});
export type HomePageServiceFormValues = z.infer<typeof homePageServiceSchema>;
