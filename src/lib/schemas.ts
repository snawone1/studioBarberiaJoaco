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
