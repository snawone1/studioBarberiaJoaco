
'use server';

import type { AppointmentFormValues, SiteSettingsFormValues, StyleAdvisorFormValues } from '@/lib/schemas';
import { getStyleRecommendationWithServices } from '@/ai/flows/style-recommendation-with-services';

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

export async function submitSiteSettings(data: SiteSettingsFormValues) {
  // In a real app, you'd save this to a database (e.g., Firestore).
  // These changes would then need to be read by your application, possibly
  // invalidating caches or re-fetching data for siteConfig.
  console.log('Site Settings Update Received:', data);

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // For this prototype, we always return success.
  // In a real app, handle potential errors during save.
  return { success: true, message: '¡Configuración del sitio guardada con éxito! (Simulado)' };
}
