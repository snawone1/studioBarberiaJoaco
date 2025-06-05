
'use server';

import type { AppointmentFormValues, SiteSettingsFormValues, StyleAdvisorFormValues, ProductFormValues } from '@/lib/schemas';
import { getStyleRecommendationWithServices } from '@/ai/flows/style-recommendation-with-services';
import type { Product } from '@/app/products/page';
import { revalidatePath } from 'next/cache';
import { firestore } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp, updateDoc, getDoc } from 'firebase/firestore';

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
      
      let imageSrcVal = 'https://placehold.co/400x400.png'; 
      if (typeof data.imageSrc === 'string' && (data.imageSrc.startsWith('http://') || data.imageSrc.startsWith('https://'))) {
        imageSrcVal = data.imageSrc;
      } else if (typeof data.imageSrc === 'string' && data.imageSrc.trim() !== '') {
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
        stock: typeof data.stock === 'number' ? data.stock : 0,
        createdAt: createdAt,
      } as Product; 
    });
    return products;
  } catch (error) {
    console.error("Error fetching products from Firestore:", error);
    return []; 
  }
}

export async function addProduct(data: ProductFormValues) {
  try {
    const productDataToAdd = {
      name: data.name,
      description: data.description,
      price: data.price,
      imageSrc: data.imageSrc, 
      aiHint: data.aiHint,
      stock: data.stock ?? 0,
      createdAt: Timestamp.now()
    };
    const docRef = await addDoc(productsCollectionRef, productDataToAdd);
    
    const newProduct: Product = {
      id: docRef.id,
      ...productDataToAdd,
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

export async function updateProduct(data: ProductFormValues) {
  if (!data.id) {
    return { success: false, message: 'Product ID is missing for update.' };
  }
  try {
    const productDocRef = doc(firestore, 'products', data.id);
    const productDataToUpdate = {
      name: data.name,
      description: data.description,
      price: data.price,
      imageSrc: data.imageSrc,
      aiHint: data.aiHint,
      stock: data.stock ?? 0,
      // Note: We are not updating createdAt here. 
      // If an 'updatedAt' field is desired, it should be added here:
      // updatedAt: Timestamp.now() 
    };
    await updateDoc(productDocRef, productDataToUpdate);
    
    // Fetch the full updated document to return consistent data including existing createdAt
    const updatedDocSnap = await getDoc(productDocRef);
    if (!updatedDocSnap.exists()) {
        return { success: false, message: 'Failed to retrieve updated product.' };
    }
    const updatedData = updatedDocSnap.data();

    const updatedProduct: Product = {
      id: updatedDocSnap.id,
      name: updatedData.name,
      description: updatedData.description,
      price: updatedData.price,
      imageSrc: updatedData.imageSrc, // Already validated or placeholder by getProducts or schema
      aiHint: updatedData.aiHint,
      stock: updatedData.stock,
      createdAt: updatedData.createdAt ? (updatedData.createdAt as Timestamp).toDate().toISOString() : undefined,
    };

    revalidatePath('/products');
    revalidatePath('/admin');
    
    return { success: true, message: 'Producto actualizado con éxito.', product: updatedProduct };
  } catch (error) {
    console.error("Error updating product in Firestore:", error);
    return { success: false, message: 'Error al actualizar el producto. Inténtalo de nuevo.' };
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
