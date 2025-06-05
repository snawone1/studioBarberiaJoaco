
'use server';

import type { AppointmentFormValues, SiteSettingsFormValues, StyleAdvisorFormValues, ProductFormValues } from '@/lib/schemas';
import { getStyleRecommendationWithServices } from '@/ai/flows/style-recommendation-with-services';
import type { Product } from '@/app/products/page'; // Product type is still fine to import
import { revalidatePath } from 'next/cache';

// Define initial productsData here - now empty
const initialProductsData: Product[] = [];


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
  console.log('Site Settings Update Received:', data);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, message: '¡Configuración del sitio guardada con éxito! (Simulado)' };
}

// Product Management Actions (Simulated)
let currentProducts: Product[] = [...initialProductsData]; // In-memory store for simulation

export async function getProducts(): Promise<Product[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  // console.log('Server: Returning products from getProducts:', currentProducts);
  return currentProducts;
}

export async function addProduct(data: ProductFormValues) {
  console.log('Adding Product (Simulated):', data);
  const newProduct: Product = {
    ...data,
    id: data.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // Generate ID if not present
  };
  currentProducts.push(newProduct); // Add to in-memory store
  // console.log('Server: currentProducts after add:', currentProducts);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  revalidatePath('/products'); // Revalidate the products page
  revalidatePath('/admin');     // Revalidate the admin page (if it displays product list directly)
  
  return { success: true, message: 'Producto añadido con éxito (Simulado).', product: newProduct };
}

export async function deleteProduct(productId: string) {
  console.log('Deleting Product (Simulated):', productId);
  currentProducts = currentProducts.filter(p => p.id !== productId); // Remove from in-memory store
  // console.log('Server: currentProducts after delete:', currentProducts);
  await new Promise(resolve => setTimeout(resolve, 1000));

  revalidatePath('/products'); // Revalidate the products page
  revalidatePath('/admin');     // Revalidate the admin page
  
  return { success: true, message: 'Producto eliminado con éxito (Simulado).' };
}

