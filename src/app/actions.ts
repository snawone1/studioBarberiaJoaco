'use server';

import { z } from 'zod';
import { getStyleRecommendationWithServices } from '@/ai/flows/style-recommendation-with-services';

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

export async function submitAppointmentRequest(data: AppointmentFormValues) {
  // In a real app, you'd save this to a database or send an email.
  console.log('Appointment Request Received:', data);

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate success/failure
  if (data.name.toLowerCase() === "error") {
    return { success: false, message: 'Failed to submit appointment. Please try again.' };
  }
  return { success: true, message: 'Appointment request sent successfully! We will contact you shortly to confirm.' };
}


// Style Advisor Form Schema
export const styleAdvisorSchema = z.object({
  hairType: z.string().min(1, { message: "Please select your hair type." }),
  faceShape: z.string().min(1, { message: "Please select your face shape." }),
  stylePreferences: z.string().min(3, { message: "Describe your style preferences (min 3 chars)." }),
});
export type StyleAdvisorFormValues = z.infer<typeof styleAdvisorSchema>;

export async function getAIStyleAdvice(data: StyleAdvisorFormValues) {
  try {
    const recommendation = await getStyleRecommendationWithServices({
      hairType: data.hairType,
      faceShape: data.faceShape,
      preferences: data.stylePreferences,
    });
    return { success: true, data: recommendation };
  } catch (error) {
    console.error('Error getting AI style advice:', error);
    return { success: false, message: 'Failed to get style advice. Please try again later.' };
  }
}
