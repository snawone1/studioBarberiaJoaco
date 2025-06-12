
'use server';

import type { AppointmentFormValues, SiteSettingsFormValues, StyleAdvisorFormValues, ProductFormValues, ServiceFormValues } from '@/lib/schemas';
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


// --- User Management Actions ---
export async function getUsers(): Promise<UserDetail[]> {
  // console.log("Admin: Attempting to fetch users from Firestore...");
  try {
    const q = query(usersCollectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    // console.log(`Admin: Found ${querySnapshot.docs.length} user documents.`);

    if (querySnapshot.empty) {
      // console.warn("Admin: No users found in the 'users' collection or access denied by Firestore security rules.");
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
        // console.warn(`Admin: User ${docSnap.id} has invalid or missing createdAt. Firestore data:`, data.createdAt);
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
    // console.log(`Admin: Successfully mapped ${users.length} users.`);
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


// --- Appointment Actions ---
export async function submitAppointmentRequest(data: AppointmentFormValues) {
  // console.log("Server Action: submitAppointmentRequest received data:", data);
  try {
    const clientPreferredDate = data.preferredDate; 
    
    const normalizedPreferredDateObject = new Date(clientPreferredDate);
    normalizedPreferredDateObject.setHours(0, 0, 0, 0); 
    
    const preferredDateTimestamp = Timestamp.fromDate(normalizedPreferredDateObject);
    // console.log("Server Action: Normalized preferredDate to Timestamp:", preferredDateTimestamp.toDate().toISOString());

    const qCheck = query(
      appointmentsCollectionRef,
      where('preferredDate', '==', preferredDateTimestamp),
      where('preferredTime', '==', data.preferredTime),
      where('status', 'in', ['pending', 'confirmed'])
    );

    const existingAppointmentsSnap = await getDocs(qCheck);
    if (!existingAppointmentsSnap.empty) {
      // console.log("Server Action: Double booking detected for", preferredDateTimestamp.toDate().toISOString(), data.preferredTime);
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
    // console.log("Server Action: Attempting to add appointment to Firestore with data:", appointmentData);
    await addDoc(appointmentsCollectionRef, appointmentData);
    // console.log("Server Action: Appointment added successfully.");
    revalidatePath('/book'); 
    revalidatePath('/admin'); 
    return { success: true, message: 'Solicitud de cita enviada con éxito. Nos pondremos en contacto contigo pronto para confirmar.' };
  } catch (error) {
    console.error("Server Action: Error submitting appointment to Firestore:", error);
    return { success: false, message: 'Error al enviar la solicitud de cita. Por favor, inténtalo de nuevo.' };
  }
}

export async function getAppointments(): Promise<Appointment[]> {
  // console.log("Admin: Attempting to fetch appointments from Firestore (with orderBy)...");
  try {
    const qAppointments = query(
      appointmentsCollectionRef, 
      orderBy('preferredDate', 'desc'), 
      orderBy('createdAt', 'desc') 
    );
    // console.log("Admin: Using query with orderBy('preferredDate', 'desc'), orderBy('createdAt', 'desc').");

    const appointmentSnapshot = await getDocs(qAppointments);
    // console.log(`Admin: Found ${appointmentSnapshot.docs.length} appointment documents in total.`);
    
    if (appointmentSnapshot.empty) {
      // console.warn("Admin: No appointments matched the query. This could be due to Firestore security rules or no appointments existing.");
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
    // console.log(`Admin: Fetched details for ${usersMap.size} users.`);

    const appointments = appointmentSnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      let preferredDateISO: string;
      let createdAtISO: string;

      if (data.preferredDate && typeof data.preferredDate.toDate === 'function') {
        preferredDateISO = data.preferredDate.toDate().toISOString();
      } else {
        // console.warn(`Admin: Appointment ${docSnap.id} has invalid or missing preferredDate. Firestore data:`, data.preferredDate);
        preferredDateISO = new Date(0).toISOString(); 
      }

      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdAtISO = data.createdAt.toDate().toISOString();
      } else {
        // console.warn(`Admin: Appointment ${docSnap.id} has invalid or missing createdAt. Firestore data:`, data.createdAt);
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
    // console.log(`Admin: Successfully mapped ${appointments.length} appointments.`);
    return appointments; 

  } catch (error: any) { 
    console.error("Admin: Error fetching or mapping appointments from Firestore:", error);
     if (error.code === 'failed-precondition') { 
        console.error("IMPORTANT: Firestore 'failed-precondition' error. This OFTEN means a composite index is required for your query (e.g., for orderBy clauses). Check the DETAILED error message in the Firebase/Next.js server console. It usually provides a link to create the missing index if you haven't already or if it's still building.");
    } else {
        console.error("An unexpected error occurred while fetching appointments:", error.message, error.stack);
    }
    return [];
  }
}

export async function getUserAppointments(userId: string): Promise<Appointment[]> {
  // console.log(`Server Action: Attempting to fetch appointments for user ID: ${userId}`);
  if (!userId) {
    // console.warn("Server Action: getUserAppointments called with no userId.");
    return [];
  }
  try {
    const qUserAppointments = query(
      appointmentsCollectionRef,
      where('userId', '==', userId),
      orderBy('preferredDate', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const appointmentSnapshot = await getDocs(qUserAppointments);
    // console.log(`Server Action: Found ${appointmentSnapshot.docs.length} appointments for user ${userId}.`);

    if (appointmentSnapshot.empty) {
      return [];
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
      
      return {
        id: docSnap.id,
        userId: data.userId,
        preferredDate: preferredDateISO,
        preferredTime: data.preferredTime || 'N/A',
        services: Array.isArray(data.services) ? data.services : [],
        message: data.message || '',
        status: data.status || 'unknown',
        createdAt: createdAtISO,
      } as Appointment;
    });
    // console.log(`Server Action: Successfully mapped ${appointments.length} appointments for user ${userId}.`);
    return appointments;

  } catch (error: any) {
    console.error(`Server Action: Error fetching appointments for user ${userId}:`, error);
    if (error.code === 'failed-precondition') {
      console.error("IMPORTANT: Firestore 'failed-precondition' error for user appointments query. A composite index on 'userId' (asc), 'preferredDate' (desc), 'createdAt' (desc) might be required in the 'appointments' collection. Check Firestore console for index suggestions.");
    }
    return [];
  }
}

export async function updateAppointmentStatus(
  appointmentId: string, 
  newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed',
  currentUserId?: string // Optional: for client-side cancellation validation
) {
  // console.log(`Server Action: updateAppointmentStatus called for ID: ${appointmentId} to status: ${newStatus}. CurrentUserID: ${currentUserId}`);
  try {
    const appointmentDocRef = doc(firestore, 'appointments', appointmentId);

    if (currentUserId && newStatus === 'cancelled') {
      // Client is trying to cancel their own appointment
      const appointmentSnap = await getDoc(appointmentDocRef);
      if (!appointmentSnap.exists()) {
        return { success: false, message: 'La cita no fue encontrada.' };
      }
      const appointmentData = appointmentSnap.data();
      if (appointmentData.userId !== currentUserId) {
        return { success: false, message: 'No tienes permiso para cancelar esta cita.' };
      }
      if (appointmentData.status !== 'pending') {
        return { success: false, message: 'Solo puedes cancelar citas que estén pendientes.' };
      }
    } else if (currentUserId && newStatus !== 'cancelled') {
      return { success: false, message: 'No tienes permiso para realizar esta acción.' };
    }

    await updateDoc(appointmentDocRef, { status: newStatus });
    // console.log(`Server Action: Appointment ${appointmentId} status updated to ${newStatus} in Firestore.`);
    revalidatePath('/admin');
    revalidatePath('/book'); 
    return { success: true, message: `Estado de la cita actualizado a ${newStatus}.` };
  } catch (error) {
    console.error(`Server Action: Error updating appointment ${appointmentId} status in Firestore:`, error);
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
export async function submitSiteSettings(data: SiteSettingsFormValues) {
  // console.log('Site Settings Update Received by Server Action:', data);
  revalidatePath('/admin/settings'); 
  revalidatePath('/'); 
  return { success: true, message: 'Configuración del sitio procesada. Los cambios en nombre y descripción se reflejarán en breve (puede requerir refrescar la página o reconstrucción).' };
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
        // console.warn(`Product ID ${docSnap.id} has an imageSrc in Firestore that is not a valid http/https URL or is empty: "${data.imageSrc}". Defaulting to placeholder.`);
      } else if (!data.imageSrc) {
         // console.warn(`Product ID ${docSnap.id} is missing imageSrc in Firestore. Defaulting to placeholder.`);
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

    // Use ALL_TIME_SLOTS from the imported constants
    const settings = ALL_TIME_SLOTS.map(time => ({
      time,
      isActive: savedSettingsMap.get(time) ?? true, 
    }));
    return settings;
  } catch (error) {
    console.error("Error fetching time slot settings:", error);
    // Fallback to all active if Firestore read fails
    return ALL_TIME_SLOTS.map(time => ({ time, isActive: true }));
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

// --- WhatsApp Message Template Actions ---
const DEFAULT_CONFIRMATION_TEMPLATE = `Hola {{clientName}}, tu cita en ${siteConfig.name} para el {{appointmentDate}} a las {{appointmentTime}} ha sido CONFIRMADA. Servicios: {{servicesList}}. ¡Te esperamos!`;
const DEFAULT_CANCELLATION_TEMPLATE = `Hola {{clientName}}, lamentamos informarte que tu cita en ${siteConfig.name} para el {{appointmentDate}} a las {{appointmentTime}} (Servicios: {{servicesList}}) ha sido CANCELADA. Por favor, contáctanos si deseas reprogramar.`;

export async function getMessageTemplate(templateId: 'confirmation' | 'cancellation'): Promise<string> {
  try {
    const templateDocRef = doc(messageTemplatesCollectionRef, templateId);
    const docSnap = await getDoc(templateDocRef);
    if (docSnap.exists()) {
      return docSnap.data().content as string;
    }
    return templateId === 'confirmation' ? DEFAULT_CONFIRMATION_TEMPLATE : DEFAULT_CANCELLATION_TEMPLATE;
  } catch (error) {
    console.error(`Error fetching message template ${templateId}:`, error);
    return templateId === 'confirmation' ? DEFAULT_CONFIRMATION_TEMPLATE : DEFAULT_CANCELLATION_TEMPLATE;
  }
}

export async function updateMessageTemplate(templateId: 'confirmation' | 'cancellation', content: string) {
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
    
