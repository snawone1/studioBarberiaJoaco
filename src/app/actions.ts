
'use server';

import type { AppointmentFormValues, SiteSettingsFormValues, StyleAdvisorFormValues, ProductFormValues } from '@/lib/schemas';
import { getStyleRecommendationWithServices } from '@/ai/flows/style-recommendation-with-services';
import type { Product } from '@/app/products/page';
import { revalidatePath } from 'next/cache';
import { firestore } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';

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

// Product Management Actions with Firestore
const productsCollectionRef = collection(firestore, 'products');

export async function getProducts(): Promise<Product[]> {
  try {
    const querySnapshot = await getDocs(productsCollectionRef);
    const products = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : undefined;
      
      let imageSrcVal = 'https://placehold.co/400x400.png'; // Default to placeholder
      if (typeof data.imageSrc === 'string' && (data.imageSrc.startsWith('http://') || data.imageSrc.startsWith('https://'))) {
        imageSrcVal = data.imageSrc;
      } else if (typeof data.imageSrc === 'string' && data.imageSrc.trim() !== '') {
        // If it's a string but not a full URL, maybe it's a relative path or a malformed one.
        // For now, we still default to placeholder. Could be refined if specific relative paths are expected.
        console.warn(`Product ID ${doc.id} has an imageSrc that is a string but not a valid http/https URL: "${data.imageSrc}". Defaulting to placeholder.`);
      } else if (data.imageSrc && typeof data.imageSrc !== 'string') {
        console.warn(`Product ID ${doc.id} has a non-string imageSrc. Type: ${typeof data.imageSrc}. Value:`, data.imageSrc, ". Defaulting to placeholder.");
      }


      return {
        id: doc.id,
        name: data.name || 'Unnamed Product',
        description: data.description || '',
        price: data.price || 'ARS$ 0',
        imageSrc: imageSrcVal,
        aiHint: data.aiHint || '',
        createdAt: createdAt,
      } as Product; 
    });
    return products;
  } catch (error) {
    console.error("Error fetching products from Firestore:", error);
    return []; // Return empty array on error
  }
}

export async function addProduct(data: ProductFormValues) {
  try {
    const productDataToAdd = {
      name: data.name,
      description: data.description,
      price: data.price,
      imageSrc: data.imageSrc, // This comes from a Zod validated URL string
      aiHint: data.aiHint,
      createdAt: Timestamp.now()
    };
    const docRef = await addDoc(productsCollectionRef, productDataToAdd);
    
    const newProduct: Product = {
      id: docRef.id,
      name: productDataToAdd.name,
      description: productDataToAdd.description,
      price: productDataToAdd.price,
      imageSrc: productDataToAdd.imageSrc,
      aiHint: productDataToAdd.aiHint,
      createdAt: productDataToAdd.createdAt.toDate().toISOString(), 
    };

    revalidatePath('/products');
    revalidatePath('/admin');
    
    return { success: true, message: 'Producto añadido con éxito a Firestore.', product: newProduct };
  } catch (error) {
    console.error("Error adding product to Firestore:", error);
    return { success: false, message: 'Error al añadir el producto a Firestore. Inténtalo de nuevo.' };
  }
}

export async function deleteProduct(productId: string) {
  try {
    const productDocRef = doc(firestore, 'products', productId);
    await deleteDoc(productDocRef);

    revalidatePath('/products');
    revalidatePath('/admin');
    
    return { success: true, message: 'Producto eliminado con éxito de Firestore.' };
  } catch (error) {
    console.error("Error deleting product from Firestore:", error);
    return { success: false, message: 'Error al eliminar el producto de Firestore. Inténtalo de nuevo.' };
  }
}
