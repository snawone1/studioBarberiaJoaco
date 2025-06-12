
'use server';

import type { AppointmentFormValues, SiteSettingsFormValues, StyleAdvisorFormValues, ProductFormValues, ServiceFormValues, AdminEditUserFormValues } from '@/lib/schemas';
import { getStyleRecommendationWithServices } from '@/ai/flows/style-recommendation-with-services';
import type { Product } from '@/app/products/page';
import { revalidatePath } from 'next/cache';
import { firestore } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp, updateDoc, getDoc, query, where, orderBy, setDoc } from 'firebase/firestore';
import { ALL_TIME_SLOTS } from '@/lib/constants';
import { siteConfig } from '@/config/site';

// Firestore collection references
const appointmentsCollectionRef = collection(firestore, 'appointments');
const productsCollectionRef = collection(firestore, 'products');
const usersCollectionRef = collection(firestore, 'users');
const servicesCollectionRef = collection(firestore, 'services');
const timeSlotSettingsCollectionRef = collection(firestore, 'timeSlotSettings');
const messageTemplatesCollectionRef = collection(firestore, 'messageTemplates');
const appSettingsCollectionRef = collection(firestore, 'appSettings');


// --- User Types ---
export type UserDetail = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
};


// --- Appointment Types ---
export type Appointment = {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  preferredDate: string;
  preferredTime: string;
  services: string[];
  message?: string;
  status: string;
  createdAt: string;
};

// --- Service Type ---
export type Service = {
  id: string;
  name: string;
  description: string;
  price: string;
  createdAt?: string;
};

// --- Time Slot Settings Types ---
export type TimeSlotSetting = {
  time: string;
  isActive: boolean;
};

// --- Message Template Type ---
export type MessageTemplate = {
  id: string; // e.g., 'confirmation', 'cancellation'
  content: string;
};

// --- Site Details Type ---
export type SiteDetails = {
  name: string;
  description: string;
};


// --- User Management Actions ---
export async function getUsers(): Promise<UserDetail[]> {
  try {
    const q = query(usersCollectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return [];
    }

    const users = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      let createdAtISO: string;

      if (data.createdAt && typeof data.createdAt === 'string') {
        createdAtISO = data.createdAt;
      } else if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdAtISO = data.createdAt.toDate().toISOString();
      } else {
        createdAtISO = new Date(0).toISOString();
      }

      const userDetail: UserDetail = {
        id: docSnap.id,
        fullName: data.fullName || 'N/A',
        email: data.email || 'N/A',
        phoneNumber: data.phoneNumber || 'N/A',
        createdAt: createdAtISO,
      };
      return userDetail;
    });
    return users;

  } catch (error: any) {
    console.error("Admin: Error fetching or mapping users from Firestore:", error);
    if (error.code === 'failed-precondition') {
        console.error("IMPORTANT: Firestore 'failed-precondition' error for users query. This might mean a composite index is required if you add more complex ordering or filtering. Check Firestore console for index suggestions.");
    } else {
        console.error("An unexpected error occurred while fetching users:", error.message, error.stack);
    }
    return [];
  }
}

export async function updateUserDetail(
  data: { userId: string; fullName: string; phoneNumber: string }
): Promise<{ success: boolean; message: string }> {
  console.log(`[updateUserDetail] Called for userId: ${data.userId} with data:`, data);
  try {
    const userDocRef = doc(firestore, 'users', data.userId);
    await updateDoc(userDocRef, {
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
    });
    console.log(`[updateUserDetail] User ${data.userId} details updated successfully.`);
    revalidatePath('/admin');
    return { success: true, message: 'Detalles del usuario actualizados con éxito.' };
  } catch (error: any) {
    console.error(`[updateUserDetail] Error updating user ${data.userId} details:`, error);
    return { success: false, message: `Error al actualizar los detalles del usuario: ${error.message}` };
  }
}


// --- Appointment Actions ---
export async function submitAppointmentRequest(data: AppointmentFormValues) {
  console.log("[submitAppointmentRequest] Received data with userId:", data.userId);
  try {
    const clientPreferredDate = data.preferredDate;

    const normalizedPreferredDateObject = new Date(clientPreferredDate);
    normalizedPreferredDateObject.setHours(0, 0, 0, 0);

    const preferredDateTimestamp = Timestamp.fromDate(normalizedPreferredDateObject);
    console.log("[submitAppointmentRequest] Normalized preferredDate to Timestamp:", preferredDateTimestamp.toDate().toISOString());

    const qCheck = query(
      appointmentsCollectionRef,
      where('preferredDate', '==', preferredDateTimestamp),
      where('preferredTime', '==', data.preferredTime),
      where('status', 'in', ['pending', 'confirmed'])
    );

    const existingAppointmentsSnap = await getDocs(qCheck);
    if (!existingAppointmentsSnap.empty) {
      console.log("[submitAppointmentRequest] Double booking detected for", preferredDateTimestamp.toDate().toISOString(), data.preferredTime);
      return { success: false, message: 'Este horario ya no está disponible. Por favor, elige otro.' };
    }

    const appointmentData = {
      userId: data.userId, 
      preferredDate: preferredDateTimestamp,
      preferredTime: data.preferredTime,
      services: data.services,
      message: data.message || '',
      status: 'pending',
      createdAt: Timestamp.now(),
    };
    console.log("[submitAppointmentRequest] Attempting to add appointment to Firestore with data:", JSON.stringify(appointmentData));
    await addDoc(appointmentsCollectionRef, appointmentData);
    console.log("[submitAppointmentRequest] Appointment added successfully with userId:", data.userId);
    revalidatePath('/book');
    revalidatePath('/admin');
    return { success: true, message: 'Solicitud de cita enviada con éxito. Nos pondremos en contacto contigo pronto para confirmar.' };
  } catch (error)
{
    console.error("[submitAppointmentRequest] Error submitting appointment to Firestore:", error);
    return { success: false, message: 'Error al enviar la solicitud de cita. Por favor, inténtalo de nuevo.' };
  }
}

export async function getAppointments(): Promise<Appointment[]> {
  try {
    const qAppointments = query(
      appointmentsCollectionRef,
      orderBy('preferredDate', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const appointmentSnapshot = await getDocs(qAppointments);

    if (appointmentSnapshot.empty) {
      return [];
    }

    const userIds = [...new Set(appointmentSnapshot.docs.map(docSnap => docSnap.data().userId as string).filter(id => !!id))];
    let usersMap: Map<string, { fullName?: string; email?: string; phoneNumber?: string }> = new Map();

    if (userIds.length > 0) {
      const MAX_USER_IDS_PER_QUERY = 30; 
      const userBatches: string[][] = [];
      for (let i = 0; i < userIds.length; i += MAX_USER_IDS_PER_QUERY) {
        userBatches.push(userIds.slice(i, i + MAX_USER_IDS_PER_QUERY));
      }

      for (const batchUserIds of userBatches) {
        if (batchUserIds.length === 0) continue; 
        const qUsers = query(collection(firestore, 'users'), where('uid', 'in', batchUserIds));
        const userSnapshot = await getDocs(qUsers);
        userSnapshot.docs.forEach(docSnap => {
          const userData = docSnap.data();
          usersMap.set(userData.uid, { 
            fullName: userData.fullName,
            email: userData.email,
            phoneNumber: userData.phoneNumber
          });
        });
      }
    }

    const appointments = appointmentSnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      let preferredDateISO: string;
      let createdAtISO: string;

      if (data.preferredDate && typeof data.preferredDate.toDate === 'function') {
        preferredDateISO = data.preferredDate.toDate().toISOString();
      } else {
        preferredDateISO = new Date(0).toISOString();
      }

      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdAtISO = data.createdAt.toDate().toISOString();
      } else {
        createdAtISO = new Date(0).toISOString();
      }

      const userDetails = usersMap.get(data.userId) || {};

      const appointment: Appointment = {
        id: docSnap.id,
        userId: data.userId || 'Unknown User',
        userName: userDetails.fullName || 'Nombre no disponible',
        userEmail: userDetails.email || 'Email no disponible',
        userPhone: userDetails.phoneNumber || 'Teléfono no disponible',
        preferredDate: preferredDateISO,
        preferredTime: data.preferredTime || 'N/A',
        services: Array.isArray(data.services) ? data.services : [],
        message: data.message || '',
        status: data.status || 'unknown',
        createdAt: createdAtISO,
      };
      return appointment;
    });
    return appointments;

  } catch (error: any) {
    console.error("Admin: Error fetching or mapping appointments from Firestore:", error);
     if (error.code === 'failed-precondition') {
        console.error("IMPORTANT: Firestore 'failed-precondition' error for admin appointments query. This OFTEN means a composite index is required for your query (e.g., for orderBy clauses on 'preferredDate' and 'createdAt'). Check the DETAILED error message in the Firebase/Next.js server console. It usually provides a link to create the missing index.");
    } else {
        console.error("An unexpected error occurred while fetching admin appointments:", error.message, error.stack);
    }
    return [];
  }
}

export async function getUserAppointments(userId: string): Promise<Appointment[]> {
  console.log(`[getUserAppointments] Top: Attempting to fetch appointments for user ID: ${userId}`);
  if (!userId) {
    console.warn("[getUserAppointments] Called with no userId. Returning empty array.");
    return [];
  }
  try {
    console.log(`[getUserAppointments] Constructing query for 'appointments', where 'userId' == '${userId}', orderBy 'preferredDate' asc, 'createdAt' desc.`);
    const qUserAppointments = query(
      appointmentsCollectionRef,
      where('userId', '==', userId),
      orderBy('preferredDate', 'asc'), 
      orderBy('createdAt', 'desc')
    );

    console.log(`[getUserAppointments] Executing query...`);
    const appointmentSnapshot = await getDocs(qUserAppointments);
    console.log(`[getUserAppointments] Query executed. Found ${appointmentSnapshot.docs.length} appointment documents for user ${userId}.`);

    if (appointmentSnapshot.empty) {
      console.log(`[getUserAppointments] Snapshot is empty. Will try querying without orderBy to check for data/index issues.`);
      const qSimpleUserAppointments = query(appointmentsCollectionRef, where('userId', '==', userId));
      const simpleSnapshot = await getDocs(qSimpleUserAppointments);
      if (simpleSnapshot.empty) {
        console.log(`[getUserAppointments] Simple query (no orderBy) also found 0 documents for user ${userId}. This suggests no data or userId mismatch.`);
      } else {
        console.warn(`[getUserAppointments] SIMPLE query (no orderBy) FOUND ${simpleSnapshot.docs.length} documents for user ${userId}. This STRONGLY SUGGESTS an issue with the COMPOSITE INDEX for 'userId' (asc), 'preferredDate' (asc) and 'createdAt' (desc). Please verify the index in Firestore, or check the server logs for a link to create it.`);
        simpleSnapshot.docs.forEach(docSnap => {
           console.log(`[getUserAppointments] Raw data from SIMPLE query for doc ${docSnap.id}:`, JSON.stringify(docSnap.data()));
        });
      }
      return [];
    }

    console.log(`[getUserAppointments] Mapping ${appointmentSnapshot.docs.length} documents...`);
    const appointmentsPromises = appointmentSnapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();

      let preferredDateISO: string;
      let createdAtISO: string;

      if (data.preferredDate && typeof data.preferredDate.toDate === 'function') {
        preferredDateISO = data.preferredDate.toDate().toISOString();
      } else {
        preferredDateISO = new Date(0).toISOString();
      }

      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdAtISO = data.createdAt.toDate().toISOString();
      } else {
        createdAtISO = new Date(0).toISOString();
      }

      const appointment: Appointment = {
        id: docSnap.id,
        userId: data.userId,
        preferredDate: preferredDateISO,
        preferredTime: data.preferredTime || 'N/A',
        services: Array.isArray(data.services) ? data.services : [],
        message: data.message || '',
        status: data.status || 'unknown',
        createdAt: createdAtISO,
      };
      return appointment;
    });

    const appointments = await Promise.all(appointmentsPromises);
    console.log(`[getUserAppointments] Successfully mapped ${appointments.length} appointments for user ${userId}. Final appointments count: ${appointments.length}`);
    return appointments;

  } catch (error: any) {
    console.error(`[getUserAppointments] Error fetching appointments for user ${userId}:`, error.message);
    if (error.code === 'failed-precondition') {
      console.error(`[getUserAppointments] Firestore 'failed-precondition' error. A composite index on 'userId' (asc), 'preferredDate' (asc), 'createdAt' (desc) is likely required in the 'appointments' collection. Check Firestore console for index suggestions, or the link usually provided in the detailed error message in the Firebase/Next.js server console. Error details: ${error.toString()}`);
    } else if (error.code === 'permission-denied') {
      console.error("[getUserAppointments] Firestore 'permission-denied' error. Check your Firestore security rules to ensure the authenticated user has read access to their appointments.");
    } else {
      console.error("[getUserAppointments] An unexpected error occurred:", error);
    }
    return [];
  }
}


export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed',
  currentUserId?: string 
) {
  console.log(`[updateAppointmentStatus] Called for ID: ${appointmentId} to status: ${newStatus}. CurrentUserID: ${currentUserId}`);
  try {
    const appointmentDocRef = doc(firestore, 'appointments', appointmentId);

    if (currentUserId && newStatus === 'cancelled') {
      const appointmentSnap = await getDoc(appointmentDocRef);
      if (!appointmentSnap.exists()) {
        console.warn(`[updateAppointmentStatus] Appointment ${appointmentId} not found for user cancellation.`);
        return { success: false, message: 'La cita no fue encontrada.' };
      }
      const appointmentData = appointmentSnap.data();
      if (appointmentData.userId !== currentUserId) {
        console.warn(`[updateAppointmentStatus] User ${currentUserId} does not own appointment ${appointmentId} (owner: ${appointmentData.userId}).`);
        return { success: false, message: 'No tienes permiso para cancelar esta cita.' };
      }
      if (appointmentData.status !== 'pending' && appointmentData.status !== 'confirmed') {
        console.warn(`[updateAppointmentStatus] Appointment ${appointmentId} is not 'pending' or 'confirmed' (status: ${appointmentData.status}), cannot be cancelled by user.`);
        return { success: false, message: 'Solo puedes solicitar cancelar citas que estén pendientes o confirmadas. Para otros casos, contacta al administrador.' };
      }
      console.log(`[updateAppointmentStatus] User ${currentUserId} is cancelling their own ${appointmentData.status} appointment ${appointmentId}.`);
    } else if (currentUserId && newStatus !== 'cancelled') {
      console.warn(`[updateAppointmentStatus] User ${currentUserId} attempted to change status to ${newStatus} for appointment ${appointmentId}. Not allowed through this specific user-facing cancel action.`);
      return { success: false, message: 'No tienes permiso para realizar esta acción.' };
    }

    await updateDoc(appointmentDocRef, { status: newStatus });
    console.log(`[updateAppointmentStatus] Appointment ${appointmentId} status updated to ${newStatus} in Firestore.`);
    revalidatePath('/admin'); 
    revalidatePath('/book');  
    return { success: true, message: `Estado de la cita actualizado a ${newStatus}.` };
  } catch (error) {
    console.error(`[updateAppointmentStatus] Error updating appointment ${appointmentId} status in Firestore:`, error);
    return { success: false, message: 'Error al actualizar el estado de la cita.' };
  }
}


export async function getBookedSlotsForDate(date: Date): Promise<string[]> {
  try {
    const targetDay = new Date(date);
    targetDay.setHours(0,0,0,0);

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
export async function getSiteDetails(): Promise<SiteDetails> {
  try {
    const siteDetailsDocRef = doc(appSettingsCollectionRef, 'siteDetails');
    const docSnap = await getDoc(siteDetailsDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        name: data.siteName || siteConfig.name,
        description: data.siteDescription || siteConfig.description,
      };
    }
    return { name: siteConfig.name, description: siteConfig.description };
  } catch (error) {
    console.error("Error fetching site details:", error);
    return { name: siteConfig.name, description: siteConfig.description };
  }
}

export async function submitSiteSettings(data: SiteSettingsFormValues): Promise<{ success: boolean; message: string }> {
  try {
    const siteDetailsDocRef = doc(appSettingsCollectionRef, 'siteDetails');
    await setDoc(siteDetailsDocRef, {
      siteName: data.siteName,
      siteDescription: data.siteDescription,
    }, { merge: true });
    
    revalidatePath('/admin/settings'); 
    revalidatePath('/'); 
    revalidatePath('/layout'); 

    return { success: true, message: 'Configuración del sitio guardada con éxito. Los cambios pueden tardar unos momentos en reflejarse completamente.' };
  } catch (error: any) {
    console.error("Error saving site settings to Firestore:", error);
    return { success: false, message: `Error al guardar la configuración del sitio: ${error.message}` };
  }
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
    revalidatePath('/admin/settings');
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
    revalidatePath('/admin/settings');
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
    revalidatePath('/admin/settings');
    revalidatePath('/admin');
    return { success: true, message: 'Producto eliminado con éxito de Firestore.' };
  } catch (error) {
    console.error("Error deleting product from Firestore:", error);
    return { success: false, message: 'Error al eliminar el producto de Firestore. Inténtalo de nuevo.' };
  }
}


// --- Service Management Actions ---
export async function getServices(): Promise<Service[]> {
  try {
    const q = query(servicesCollectionRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    const services = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || 'Unnamed Service',
        description: data.description || '',
        price: data.price || 'ARS$ 0',
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : undefined,
      } as Service;
    });
    return services;
  } catch (error) {
    console.error("Error fetching services from Firestore:", error);
    return [];
  }
}

export async function addService(data: ServiceFormValues) {
  try {
    const serviceDataToAdd = {
      name: data.name,
      description: data.description,
      price: data.price,
      createdAt: Timestamp.now()
    };
    const docRef = await addDoc(servicesCollectionRef, serviceDataToAdd);
    const newService: Service = {
      id: docRef.id,
      ...serviceDataToAdd,
      createdAt: serviceDataToAdd.createdAt.toDate().toISOString(),
    };
    revalidatePath('/admin/settings');
    revalidatePath('/book');
    return { success: true, message: 'Servicio añadido con éxito.', service: newService };
  } catch (error) {
    console.error("Error adding service to Firestore:", error);
    return { success: false, message: 'Error al añadir el servicio.' };
  }
}

export async function updateService(data: ServiceFormValues) {
  if (!data.id) {
    return { success: false, message: 'Service ID is missing for update.' };
  }
  try {
    const serviceDocRef = doc(firestore, 'services', data.id);
    const serviceDataToUpdate = {
      name: data.name,
      description: data.description,
      price: data.price,
    };
    await updateDoc(serviceDocRef, serviceDataToUpdate);

    const updatedDocSnap = await getDoc(serviceDocRef);
     if (!updatedDocSnap.exists()) {
        return { success: false, message: 'Failed to retrieve updated service.' };
    }
    const updatedData = updatedDocSnap.data();
    const updatedService: Service = {
      id: updatedDocSnap.id,
      name: updatedData.name,
      description: updatedData.description,
      price: updatedData.price,
      createdAt: updatedData.createdAt ? (updatedData.createdAt as Timestamp).toDate().toISOString() : undefined,
    };

    revalidatePath('/admin/settings');
    revalidatePath('/book');
    return { success: true, message: 'Servicio actualizado con éxito.', service: updatedService };
  } catch (error) {
    console.error("Error updating service in Firestore:", error);
    return { success: false, message: 'Error al actualizar el servicio.' };
  }
}

export async function deleteService(serviceId: string) {
  try {
    const serviceDocRef = doc(firestore, 'services', serviceId);
    await deleteDoc(serviceDocRef);
    revalidatePath('/admin/settings');
    revalidatePath('/book');
    return { success: true, message: 'Servicio eliminado con éxito.' };
  } catch (error) {
    console.error("Error deleting service from Firestore:", error);
    return { success: false, message: 'Error al eliminar el servicio.' };
  }
}

// --- Time Slot Settings Actions ---
export async function getTimeSlotSettings(): Promise<TimeSlotSetting[]> {
  try {
    const snapshot = await getDocs(timeSlotSettingsCollectionRef);
    const savedSettingsMap = new Map<string, boolean>();
    snapshot.forEach(docSnap => {
      savedSettingsMap.set(docSnap.id, docSnap.data().isActive as boolean);
    });

    const settings = ALL_TIME_SLOTS.map(time => ({
      time,
      isActive: savedSettingsMap.get(time) ?? true, // Default to true if not in Firestore
    }));
    return settings;
  } catch (error) {
    console.error("Error fetching time slot settings:", error);
    return ALL_TIME_SLOTS.map(time => ({ time, isActive: true })); // Fallback on error
  }
}

export async function updateTimeSlotSetting(time: string, isActive: boolean) {
  try {
    const settingDocRef = doc(timeSlotSettingsCollectionRef, time);
    await setDoc(settingDocRef, { time, isActive });
    revalidatePath('/admin/settings');
    revalidatePath('/book');
    return { success: true, message: `Time slot ${time} ${isActive ? 'activated' : 'deactivated'}.` };
  } catch (error) {
    console.error("Error updating time slot setting:", error);
    return { success: false, message: 'Failed to update time slot setting.' };
  }
}

// --- WhatsApp Message Template & Admin Contact Actions ---
const DEFAULT_CONFIRMATION_TEMPLATE = `Hola {{clientName}}, tu cita en ${siteConfig.name} para el {{appointmentDate}} a las {{appointmentTime}} ha sido CONFIRMADA. Servicios: {{servicesList}}. ¡Te esperamos!`;
const DEFAULT_CANCELLATION_TEMPLATE = `Hola {{clientName}}, lamentamos informarte que tu cita en ${siteConfig.name} para el {{appointmentDate}} a las {{appointmentTime}} (Servicios: {{servicesList}}) ha sido CANCELADA. Por favor, contáctanos si deseas reprogramar.`;
const DEFAULT_ADMIN_CONTACT_CANCELLATION_TEMPLATE = `Hola ${siteConfig.name}, quisiera solicitar la cancelación de mi cita.\nCliente: {{clientName}}\nFecha: {{appointmentDate}}\nHora: {{appointmentTime}}\nServicios: {{servicesList}}\nGracias.`;
const DEFAULT_ADMIN_CONTACT_QUERY_TEMPLATE = `Hola ${siteConfig.name}, tengo una consulta sobre mi cita.\nCliente: {{clientName}}\nFecha: {{appointmentDate}}\nHora: {{appointmentTime}}\nServicios: {{servicesList}}\nMi consulta es: [ESCRIBE TU CONSULTA AQUÍ]\nGracias.`;

export type MessageTemplateId = 'confirmation' | 'cancellation' | 'adminContactCancellationRequest' | 'adminContactQuery';

export async function getMessageTemplate(templateId: MessageTemplateId): Promise<string> {
  try {
    const templateDocRef = doc(messageTemplatesCollectionRef, templateId);
    const docSnap = await getDoc(templateDocRef);
    if (docSnap.exists()) {
      return docSnap.data().content as string;
    }
    // Default templates
    if (templateId === 'confirmation') return DEFAULT_CONFIRMATION_TEMPLATE;
    if (templateId === 'cancellation') return DEFAULT_CANCELLATION_TEMPLATE;
    if (templateId === 'adminContactCancellationRequest') return DEFAULT_ADMIN_CONTACT_CANCELLATION_TEMPLATE;
    if (templateId === 'adminContactQuery') return DEFAULT_ADMIN_CONTACT_QUERY_TEMPLATE;
    
    return `Contenido predeterminado para ${templateId} no encontrado.`;
  } catch (error) {
    console.error(`Error fetching message template ${templateId}:`, error);
    if (templateId === 'confirmation') return DEFAULT_CONFIRMATION_TEMPLATE;
    if (templateId === 'cancellation') return DEFAULT_CANCELLATION_TEMPLATE;
    if (templateId === 'adminContactCancellationRequest') return DEFAULT_ADMIN_CONTACT_CANCELLATION_TEMPLATE;
    if (templateId === 'adminContactQuery') return DEFAULT_ADMIN_CONTACT_QUERY_TEMPLATE;
    return `Error al cargar la plantilla para ${templateId}.`;
  }
}

export async function updateMessageTemplate(templateId: MessageTemplateId, content: string) {
  try {
    const templateDocRef = doc(messageTemplatesCollectionRef, templateId);
    await setDoc(templateDocRef, { content });
    revalidatePath('/admin/settings');
    return { success: true, message: `Plantilla de mensaje de ${templateId} actualizada.` };
  } catch (error) {
    console.error(`Error updating message template ${templateId}:`, error);
    return { success: false, message: `Error al actualizar la plantilla de ${templateId}.` };
  }
}

export async function getAdminPhoneNumber(): Promise<string | null> {
  try {
    const contactDetailsDocRef = doc(appSettingsCollectionRef, 'contactDetails');
    const docSnap = await getDoc(contactDetailsDocRef);
    if (docSnap.exists() && docSnap.data().adminPhoneNumber) {
      return docSnap.data().adminPhoneNumber as string;
    }
    return null; 
  } catch (error) {
    console.error("Error fetching admin phone number:", error);
    return null;
  }
}

export async function updateAdminPhoneNumber(phoneNumber: string) {
  try {
    const contactDetailsDocRef = doc(appSettingsCollectionRef, 'contactDetails');
    await setDoc(contactDetailsDocRef, { adminPhoneNumber: phoneNumber }, { merge: true });
    revalidatePath('/admin/settings');
    return { success: true, message: 'Número de teléfono del administrador actualizado.' };
  } catch (error) {
    console.error("Error updating admin phone number:", error);
    return { success: false, message: 'Error al actualizar el número de teléfono del administrador.' };
  }
}
    