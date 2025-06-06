
'use server';

import type { AppointmentFormValues, SiteSettingsFormValues, StyleAdvisorFormValues, ProductFormValues } from '@/lib/schemas';
import { getStyleRecommendationWithServices } from '@/ai/flows/style-recommendation-with-services';
import type { Product } from '@/app/products/page';
import { revalidatePath } from 'next/cache';
import { firestore } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp, updateDoc, getDoc } from 'firebase/firestore';

export async function submitAppointmentRequest(data: AppointmentFormValues) {
  const appointmentsCollectionRef = collection(firestore, 'appointments');
  try {
    const appointmentData = {
      userId: data.userId, // Save userId
      preferredDate: Timestamp.fromDate(data.preferredDate), // Convert JS Date to Firestore Timestamp
      preferredTime: data.preferredTime,
      services: data.services,
      message: data.message || '',
      status: 'pending', // Default status
      createdAt: Timestamp.now(),
    };
    await addDoc(appointmentsCollectionRef, appointmentData);
    return { success: true, message: 'Solicitud de cita enviada con éxito. Nos pondremos en contacto contigo pronto para confirmar.' };
  } catch (error) {
    console.error("Error submitting appointment to Firestore:", error);
    return { success: false, message: 'Error al enviar la solicitud de cita. Por favor, inténtalo de nuevo.' };
  }
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
      if (typeof data.imageSrc === 'string' && data.imageSrc.trim().startsWith('http')) {
        imageSrcVal = data.imageSrc;
      } else if (data.imageSrc && data.imageSrc.trim() !== '') { 
        console.warn(`Product ID ${doc.id} has an imageSrc in Firestore that is not a valid http/https URL or is empty: "${data.imageSrc}". Defaulting to placeholder.`);
      } else if (!data.imageSrc) {
        console.warn(`Product ID ${doc.id} is missing imageSrc in Firestore. Defaulting to placeholder.`);
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
    };
    await updateDoc(productDocRef, productDataToUpdate);
    
    const updatedDocSnap = await getDoc(productDocRef);
    if (!updatedDocSnap.exists()) {
        return { success: false, message: 'Failed to retrieve updated product.' };
    }
    const updatedData = updatedDocSnap.data();

    let imageSrcVal = 'https://placehold.co/400x400.png';
    if (typeof updatedData.imageSrc === 'string' && updatedData.imageSrc.trim().startsWith('http')) {
        imageSrcVal = updatedData.imageSrc;
    }

    const updatedProduct: Product = {
      id: updatedDocSnap.id,
      name: updatedData.name,
      description: updatedData.description,
      price: updatedData.price,
      imageSrc: imageSrcVal, 
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
