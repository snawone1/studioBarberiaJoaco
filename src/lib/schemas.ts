
import { z } from 'zod';

// Appointment Form Schema
export const appointmentSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().min(8, { message: "Phone number seems too short." }),
  preferredDate: z.date({ required_error: "Please select a date."}),
  preferredTime: z.string().min(1, { message: "Please select a time slot."}),
  services: z.array(z.string()).min(1, { message: "Please select at least one service."}),
  message: z.string().optional(),
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
  imageSrc: z.string().url({ message: "Por favor, introduce una URL de imagen válida." }),
  aiHint: z.string().min(2, { message: "La pista de IA debe tener al menos 2 caracteres." }),
  stock: z.coerce.number().min(0, { message: "El stock no puede ser negativo." }).optional().default(0),
});
export type ProductFormValues = z.infer<typeof productSchema>;

