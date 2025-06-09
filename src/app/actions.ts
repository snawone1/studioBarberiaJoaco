
'use server';

import type { AppointmentFormValues, SiteSettingsFormValues, StyleAdvisorFormValues, ProductFormValues } from '@/lib/schemas';
import { getStyleRecommendationWithServices } from '@/ai/flows/style-recommendation-with-services';
import type { Product } from '@/app/products/page';
import { revalidatePath } from 'next/cache';
import { firestore } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp, updateDoc, getDoc, query, where, orderBy } from 'firebase/firestore';

// Firestore collection references
const appointmentsCollectionRef = collection(firestore, 'appointments');
const productsCollectionRef = collection(firestore, 'products');

// --- Appointment Types ---
export type Appointment = {
  id: string;
  userId: string;
  preferredDate: string; // ISO string for client
  preferredTime: string;
  services: string[];
  message?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | string;
  createdAt: string; // ISO string for client
};

// --- Appointment Actions ---
export async function submitAppointmentRequest(data: AppointmentFormValues) {
  console.log("Server Action: submitAppointmentRequest received data:", data);
  try {
    // Explicitly normalize preferredDate to the start of the day in the client's local timezone,
    // then convert to Firestore Timestamp. This ensures consistency.
    const clientPreferredDate = data.preferredDate; // Original JS Date from client
    
    // Create a new Date object to avoid mutating the original 'data.preferredDate' if it's used elsewhere
    const normalizedPreferredDateObject = new Date(clientPreferredDate);
    normalizedPreferredDateObject.setHours(0, 0, 0, 0); // Set to midnight in local timezone
    
    const preferredDateTimestamp = Timestamp.fromDate(normalizedPreferredDateObject);
    console.log("Server Action: Normalized preferredDate to Timestamp:", preferredDateTimestamp.toDate().toISOString());


    // Server-side double booking check using the normalized timestamp
    const qCheck = query(
      appointmentsCollectionRef,
      where('preferredDate', '==', preferredDateTimestamp),
      where('preferredTime', '==', data.preferredTime),
      where('status', 'in', ['pending', 'confirmed'])
    );

    const existingAppointmentsSnap = await getDocs(qCheck);
    if (!existingAppointmentsSnap.empty) {
      console.log("Server Action: Double booking detected for", preferredDateTimestamp.toDate().toISOString(), data.preferredTime);
      return { success: false, message: 'Este horario ya no está disponible. Por favor, elige otro.' };
    }

    const appointmentData = {
      userId: data.userId,
      preferredDate: preferredDateTimestamp, // Store the normalized timestamp
      preferredTime: data.preferredTime,
      services: data.services,
      message: data.message || '',
      status: 'pending',
      createdAt: Timestamp.now(),
    };
    console.log("Server Action: Attempting to add appointment to Firestore with data:", appointmentData);
    await addDoc(appointmentsCollectionRef, appointmentData);
    console.log("Server Action: Appointment added successfully.");
    revalidatePath('/book'); // Revalidate booking page to update booked slots
    revalidatePath('/admin'); // Revalidate admin page if appointments are shown there
    return { success: true, message: 'Solicitud de cita enviada con éxito. Nos pondremos en contacto contigo pronto para confirmar.' };
  } catch (error) {
    console.error("Server Action: Error submitting appointment to Firestore:", error);
    return { success: false, message: 'Error al enviar la solicitud de cita. Por favor, inténtalo de nuevo.' };
  }
}

export async function getAppointments(): Promise<Appointment[]> {
  console.log("Admin: Attempting to fetch appointments from Firestore...");
  try {
    const q = query(appointmentsCollectionRef, orderBy('preferredDate', 'desc'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    console.log(`Admin: Found ${querySnapshot.docs.length} appointment documents in total.`);
    
    if (querySnapshot.empty) {
      console.log("Admin: No appointments matched the query (or collection is empty/inaccessible due to rules/missing index).");
      return [];
    }

    const appointments = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      let preferredDateISO: string;
      let createdAtISO: string;

      if (data.preferredDate && typeof data.preferredDate.toDate === 'function') {
        preferredDateISO = data.preferredDate.toDate().toISOString();
      } else {
        console.warn(`Admin: Appointment ${docSnap.id} has invalid or missing preferredDate. Firestore data:`, data.preferredDate);
        preferredDateISO = new Date(0).toISOString(); // Default to epoch as a fallback
      }

      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdAtISO = data.createdAt.toDate().toISOString();
      } else {
        console.warn(`Admin: Appointment ${docSnap.id} has invalid or missing createdAt. Firestore data:`, data.createdAt);
        createdAtISO = new Date(0).toISOString(); // Default to epoch as a fallback
      }
      
      const appointment: Appointment = {
        id: docSnap.id,
        userId: data.userId || 'Unknown User', // Robust default
        preferredDate: preferredDateISO,
        preferredTime: data.preferredTime || 'N/A', // Robust default
        services: Array.isArray(data.services) ? data.services : [], // Robust default
        message: data.message || '',
        status: data.status || 'unknown', // Robust default
        createdAt: createdAtISO,
      };
      // console.log(`Admin: Mapped appointment ${docSnap.id}:`, JSON.stringify(appointment)); // Optional: very verbose
      return appointment;
    });
    console.log(`Admin: Successfully mapped ${appointments.length} appointments.`);
    return appointments;

  } catch (error: any) { // Catch specific error type if known, otherwise 'any'
    console.error("Admin: Error fetching or mapping appointments from Firestore:", error);
    // Check if error is a FirestoreException and if it suggests creating an index
     if (error.code === 'failed-precondition') { // Firestore error codes are typically strings
        console.error("Firestore 'failed-precondition' error. This often means an index is required. Check the detailed error message in the Firebase console for a link to create the index. Message:", error.message);
    }
    return [];
  }
}

export async function getBookedSlotsForDate(date: Date): Promise<string[]> {
  try {
    // Normalize the input date to the start of the day to match how preferredDate is stored
    const targetDay = new Date(date);
    targetDay.setHours(0,0,0,0); // Set to start of the day for consistent comparison

    const q = query(
      appointmentsCollectionRef,
      where('preferredDate', '==', Timestamp.fromDate(targetDay)),
      where('status', 'in', ['pending', 'confirmed'])
    );
    const querySnapshot = await getDocs(q);
    const bookedSlots = querySnapshot.docs.map(docSnap => docSnap.data().preferredTime as string);
    return bookedSlots;
  } catch (error) {
    console.error("Error fetching booked slots:", error);
    return [];
  }
}


// --- AI Style Advice Actions ---
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

// --- Site Settings Actions ---
export async function submitSiteSettings(data: SiteSettingsFormValues) {
  console.log('Site Settings Update Received:', data);
  // This is a simulated action, no Firestore interaction for now.
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, message: '¡Configuración del sitio guardada con éxito! (Simulado)' };
}

// --- Product Management Actions ---
export async function getProducts(): Promise<Product[]> {
  try {
    const querySnapshot = await getDocs(productsCollectionRef);
    const products = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      let imageSrcVal = 'https://placehold.co/400x400.png';
      if (typeof data.imageSrc === 'string' && (data.imageSrc.startsWith('http://') || data.imageSrc.startsWith('https://'))) {
        imageSrcVal = data.imageSrc;
      } else if (data.imageSrc && data.imageSrc.trim() !== '') {
        console.warn(`Product ID ${docSnap.id} has an imageSrc in Firestore that is not a valid http/https URL or is empty: "${data.imageSrc}". Defaulting to placeholder.`);
      } else if (!data.imageSrc) {
         console.warn(`Product ID ${docSnap.id} is missing imageSrc in Firestore. Defaulting to placeholder.`);
      }
      
      return {
        id: docSnap.id,
        name: data.name || 'Unnamed Product',
        description: data.description || '',
        price: data.price || 'ARS$ 0',
        imageSrc: imageSrcVal,
        aiHint: data.aiHint || '',
        stock: typeof data.stock === 'number' ? data.stock : 0,
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : undefined,
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
    if (typeof updatedData.imageSrc === 'string' && (updatedData.imageSrc.startsWith('http://') || updatedData.imageSrc.startsWith('https://'))) {
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

    
