

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogPrimitiveDescription, // Renamed to avoid conflict
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Form, FormLabel, FormControl, FormField, FormItem, FormMessage
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { productSchema, type ProductFormValues, adminEditUserSchema, type AdminEditUserFormValues } from '@/lib/schemas';
import { 
  getProducts, 
  addProduct, 
  deleteProduct, 
  updateProduct, 
  getAppointments, 
  updateAppointmentStatus, 
  type Appointment,
  getUsers,
  type UserDetail,
  updateUserDetail,
  getMessageTemplate,
  getServices,
} from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { siteConfig } from '@/config/site';
import { ShieldAlert, Settings, Users, CalendarCheck, Package, PlusCircle, Trash2, Loader2, Edit3, XCircle, PackageSearch, CalendarDays, UserCircle2, CheckCircle, XIcon, PlayCircle, Phone, Mail, MessageSquare, ShoppingBag, ArrowLeft } from 'lucide-react';
import type { Product } from '@/app/products/page';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useForm } from 'react-hook-form'; 
import { zodResolver } from '@hookform/resolvers/zod'; 
import type { Service } from '@/app/actions';


type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

// Helper function to create a displayable date from a UTC date string
const getDisplayableDate = (isoString: string): Date => {
  const d = new Date(isoString);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

export default function AdminPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isProductManagerOpen, setIsProductManagerOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [showAddEditProductForm, setShowAddEditProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isAppointmentManagerOpen, setIsAppointmentManagerOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [activeAppointmentTab, setActiveAppointmentTab] = useState<AppointmentStatus | 'all'>('pending');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  const [isUserManagerOpen, setIsUserManagerOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<UserDetail[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDetail | null>(null);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isSubmittingUserEdit, setIsSubmittingUserEdit] = useState(false);


  const [isConfirmAppointmentDialogOpen, setIsConfirmAppointmentDialogOpen] = useState(false);
  const [appointmentToConfirm, setAppointmentToConfirm] = useState<Appointment | null>(null);
  const [sendWhatsAppNotification, setSendWhatsAppNotification] = useState(true);

  const [isCancelAppointmentDialogOpen, setIsCancelAppointmentDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [sendCancelWhatsAppNotification, setSendCancelWhatsAppNotification] = useState(true);

  // For mapping service and product IDs to names in appointment cards
  const [serviceMap, setServiceMap] = useState<Map<string, string>>(new Map());
  const [productMapAdmin, setProductMapAdmin] = useState<Map<string, string>>(new Map());


  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 'ARS$ ',
      imageSrc: 'https://placehold.co/400x400.png',
      aiHint: '',
      stock: 0,
    },
  });

  const userEditForm = useForm<AdminEditUserFormValues>({
    resolver: zodResolver(adminEditUserSchema),
    defaultValues: {
      fullName: '',
      email: '', 
      phoneNumber: '',
    },
  });

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login?redirect=/admin');
    }
  }, [currentUser, loading, router]);
  
  async function fetchProductsAdmin() {
    if (isProductManagerOpen) {
      setIsLoadingProducts(true);
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        }));
      } catch (error) {
        toast({ title: 'Error', description: 'No se pudieron cargar los productos.', variant: 'destructive' });
      } finally {
        setIsLoadingProducts(false);
      }
    }
  }

  useEffect(() => {
    fetchProductsAdmin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProductManagerOpen]);

  async function fetchAppointmentsAndRelatedDataAdmin() {
     if (currentUser?.email === 'joacoadmin@admin.com') {
      setIsLoadingAppointments(true);
      try {
        const [fetchedAppointments, fetchedServices, fetchedProductsList] = await Promise.all([
          getAppointments(),
          getServices(),
          getProducts()
        ]);
        
        setAppointments(fetchedAppointments); 

        const newServiceMap = new Map<string, string>();
        fetchedServices.forEach(service => newServiceMap.set(service.id, service.name));
        setServiceMap(newServiceMap);

        const newProductMap = new Map<string, string>();
        fetchedProductsList.forEach(product => newProductMap.set(product.id, product.name));
        setProductMapAdmin(newProductMap);

      } catch (error) {
        toast({ title: 'Error', description: 'No se pudieron cargar las citas o datos relacionados.', variant: 'destructive' });
        console.error("Admin Page: Error fetching appointments or related data:", error);
      } finally {
        setIsLoadingAppointments(false);
      }
    }
  }

  useEffect(() => {
    if (currentUser?.email === 'joacoadmin@admin.com' && isAppointmentManagerOpen) {
        fetchAppointmentsAndRelatedDataAdmin();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAppointmentManagerOpen, currentUser]);


  async function fetchAllUsersAdmin() {
    if (currentUser?.email === 'joacoadmin@admin.com' && isUserManagerOpen) {
      setIsLoadingUsers(true);
      try {
        const fetchedUsers = await getUsers();
        setAllUsers(fetchedUsers);
      } catch (error) {
        toast({ title: 'Error', description: 'No se pudieron cargar los usuarios.', variant: 'destructive' });
        console.error("Admin Page: Error fetching users:", error);
      } finally {
        setIsLoadingUsers(false);
      }
    }
  }

  useEffect(() => {
    fetchAllUsersAdmin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserManagerOpen, currentUser]);

  const handleAddNewProductClick = () => {
    setEditingProduct(null);
    productForm.reset({
      name: '',
      description: '',
      price: 'ARS$ ',
      imageSrc: 'https://placehold.co/400x400.png',
      aiHint: '',
      stock: 0,
    });
    setShowAddEditProductForm(true);
  };

  const handleEditProductClick = (product: Product) => {
    setEditingProduct(product);
    productForm.reset({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      imageSrc: product.imageSrc,
      aiHint: product.aiHint,
      stock: product.stock ?? 0,
    });
    setShowAddEditProductForm(true);
  };

  async function onProductFormSubmit(data: ProductFormValues) {
    setIsSubmittingProduct(true);
    let result;
    if (editingProduct && data.id) {
      result = await updateProduct(data);
    } else {
      result = await addProduct(data);
    }

    if (result.success && result.product) {
      toast({ title: editingProduct ? '¡Producto Actualizado!' : '¡Producto Añadido!', description: result.message });
      fetchProductsAdmin(); 
      productForm.reset({name: '', description: '', price: 'ARS$ ', imageSrc: 'https://placehold.co/400x400.png', aiHint: '', stock: 0,});
      setShowAddEditProductForm(false);
      setEditingProduct(null);
    } else {
      toast({ title: 'Error', description: result.message || 'No se pudo guardar el producto.', variant: 'destructive' });
    }
    setIsSubmittingProduct(false);
  }

  async function handleDeleteProduct(productId: string) {
    const result = await deleteProduct(productId);
    if (result.success) {
      toast({ title: '¡Producto Eliminado!', description: result.message });
      setProducts(prev => prev.filter(p => p.id !== productId));
    } else {
      toast({ title: 'Error', description: result.message || 'No se pudo eliminar el producto.', variant: 'destructive' });
    }
  }
  
  const openConfirmAppointmentDialog = (appointment: Appointment) => {
    setAppointmentToConfirm(appointment);
    setSendWhatsAppNotification(true); 
    setIsConfirmAppointmentDialogOpen(true);
  };

  const handleActualConfirmAppointment = async () => {
    if (!appointmentToConfirm) return;

    setIsUpdatingStatus(appointmentToConfirm.id);
    setIsConfirmAppointmentDialogOpen(false); 

    const result = await updateAppointmentStatus(appointmentToConfirm.id, 'confirmed');
    
    if (result.success) {
      toast({ title: 'Éxito', description: 'Cita confirmada con éxito.' });
      fetchAppointmentsAndRelatedDataAdmin(); 

      if (sendWhatsAppNotification && appointmentToConfirm.userPhone && appointmentToConfirm.userName) {
        try {
          let messageContent = await getMessageTemplate('confirmation');
          const clientName = appointmentToConfirm.userName;
          const apptDate = format(getDisplayableDate(appointmentToConfirm.preferredDate), "PPP", { locale: es });
          const apptTime = appointmentToConfirm.preferredTime;
          
          const serviceNames = appointmentToConfirm.services.map(serviceId => serviceMap.get(serviceId) || serviceId);
          const servicesText = serviceNames.join(', ') || 'No especificados';

          const productNames = (appointmentToConfirm.selectedProducts || []).map(productId => productMapAdmin.get(productId) || productId);
          const productsText = productNames.join(', ') || 'Ninguno';
          
          messageContent = messageContent
            .replace(/\{\{clientName\}\}/g, clientName)
            .replace(/\{\{appointmentDate\}\}/g, apptDate)
            .replace(/\{\{appointmentTime\}\}/g, apptTime)
            .replace(/\{\{siteName\}\}/g, siteConfig.name)
            .replace(/\{\{servicesList\}\}/g, servicesText)
            .replace(/\{\{productsList\}\}/g, productsText);

          const cleanedPhoneNumber = appointmentToConfirm.userPhone.replace(/\D/g, '');
          const whatsappUrl = `https://wa.me/${cleanedPhoneNumber}?text=${encodeURIComponent(messageContent)}`;
          window.open(whatsappUrl, '_blank');
        } catch (templateError) {
          console.error("Error processing WhatsApp template for confirmation:", templateError);
          toast({ title: 'Error de Plantilla', description: 'No se pudo generar el mensaje de WhatsApp.', variant: 'destructive' });
        }
      }
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
    
    setIsUpdatingStatus(null);
    setAppointmentToConfirm(null);
  };

  const openCancelAppointmentDialog = (appointment: Appointment) => {
    setAppointmentToCancel(appointment);
    setSendCancelWhatsAppNotification(true); 
    setIsCancelAppointmentDialogOpen(true);
  };

  const handleActualCancelAppointment = async () => {
    if (!appointmentToCancel) return;

    setIsUpdatingStatus(appointmentToCancel.id);
    setIsCancelAppointmentDialogOpen(false); 

    const result = await updateAppointmentStatus(appointmentToCancel.id, 'cancelled');

    if (result.success) {
      toast({ title: 'Éxito', description: 'Cita cancelada con éxito.'});
      fetchAppointmentsAndRelatedDataAdmin();

      if (sendCancelWhatsAppNotification && appointmentToCancel.userPhone && appointmentToCancel.userName) {
        try {
          let messageContent = await getMessageTemplate('cancellation');
          const clientName = appointmentToCancel.userName;
          const apptDate = format(getDisplayableDate(appointmentToCancel.preferredDate), "PPP", { locale: es });
          const apptTime = appointmentToCancel.preferredTime;
          
          const serviceNames = appointmentToCancel.services.map(serviceId => serviceMap.get(serviceId) || serviceId);
          const servicesText = serviceNames.join(', ') || 'No especificados';

          const productNames = (appointmentToCancel.selectedProducts || []).map(productId => productMapAdmin.get(productId) || productId);
          const productsText = productNames.join(', ') || 'Ninguno';

          messageContent = messageContent
            .replace(/\{\{clientName\}\}/g, clientName)
            .replace(/\{\{appointmentDate\}\}/g, apptDate)
            .replace(/\{\{appointmentTime\}\}/g, apptTime)
            .replace(/\{\{siteName\}\}/g, siteConfig.name)
            .replace(/\{\{servicesList\}\}/g, servicesText)
            .replace(/\{\{productsList\}\}/g, productsText);
          
          const cleanedPhoneNumber = appointmentToCancel.userPhone.replace(/\D/g, '');
          const whatsappUrl = `https://wa.me/${cleanedPhoneNumber}?text=${encodeURIComponent(messageContent)}`;
          window.open(whatsappUrl, '_blank');
        } catch (templateError) {
          console.error("Error processing WhatsApp template for cancellation:", templateError);
          toast({ title: 'Error de Plantilla', description: 'No se pudo generar el mensaje de WhatsApp.', variant: 'destructive' });
        }
      }
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
    setIsUpdatingStatus(null);
    setAppointmentToCancel(null);
  };
  
  const handleUpdateAppointmentStatus = async (appointmentId: string, newStatus: AppointmentStatus) => {
    const appointment = appointments.find(a => a.id === appointmentId);

    if (!appointment) {
      toast({ title: 'Error', description: 'No se encontró la cita.', variant: 'destructive' });
      return;
    }

    if (newStatus === 'confirmed') {
      openConfirmAppointmentDialog(appointment);
    } else if (newStatus === 'cancelled') {
      openCancelAppointmentDialog(appointment);
    } else { 
      setIsUpdatingStatus(appointmentId);
      const result = await updateAppointmentStatus(appointmentId, newStatus);
      if (result.success) {
        toast({ title: 'Éxito', description: result.message });
        fetchAppointmentsAndRelatedDataAdmin(); 
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
      setIsUpdatingStatus(null);
    }
  };

  const handleWhatsAppRedirect = (user: UserDetail) => {
    if (!user.phoneNumber) {
      toast({ title: 'Error', description: 'Este usuario no tiene un número de teléfono registrado.', variant: 'destructive'});
      return;
    }
    const cleanedPhoneNumber = user.phoneNumber.replace(/\D/g, '');
    const message = encodeURIComponent(`Hola ${user.fullName}, te contacto desde ${siteConfig.name} con respecto a tus servicios.`);
    const whatsappUrl = `https://wa.me/${cleanedPhoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEditUserClick = (user: UserDetail) => {
    setEditingUser(user);
    userEditForm.reset({
      fullName: user.fullName,
      email: user.email, 
      phoneNumber: user.phoneNumber,
    });
    setIsEditUserDialogOpen(true);
  };

  async function onUserEditFormSubmit(data: AdminEditUserFormValues) {
    if (!editingUser) return;
    setIsSubmittingUserEdit(true);

    const result = await updateUserDetail({
      userId: editingUser.id,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
    });

    if (result.success) {
      toast({ title: '¡Usuario Actualizado!', description: result.message });
      fetchAllUsersAdmin(); 
      setIsEditUserDialogOpen(false);
      setEditingUser(null);
    } else {
      toast({ title: 'Error', description: result.message || 'No se pudo actualizar el usuario.', variant: 'destructive' });
    }
    setIsSubmittingUserEdit(false);
  }


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Redirigiendo a inicio de sesión...</p>
      </div>
    );
  }
  
   if (currentUser.email !== 'joacoadmin@admin.com') {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <PageHeader title="Acceso Denegado" description="No tienes permiso para ver esta página." titleClassName="font-sans" />
        <Button onClick={() => router.push('/')}>Volver al Inicio</Button>
      </div>
    );
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'default'; 
      case 'confirmed': return 'secondary'; 
      case 'completed': return 'secondary'; 
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };
  
  const appointmentTabs: { label: string; value: AppointmentStatus | 'all' }[] = [
    { label: "Pendientes", value: "pending" },
    { label: "Confirmadas", value: "confirmed" },
    { label: "Realizadas", value: "completed" },
    { label: "Canceladas", value: "cancelled" },
    { label: "Todas", value: "all" },
  ];

  const filteredAppointments = appointments.filter(appt => {
    if (activeAppointmentTab === 'all') return true;
    return appt.status?.toLowerCase() === activeAppointmentTab.toLowerCase();
  });


  return (
    <div className="container mx-auto px-4 py-12">
      <PageHeader
        title="Panel de Administración"
        description="Gestiona la configuración, el contenido y las operaciones de tu aplicación."
        titleClassName="font-sans"
      />
      
      <Card className="mb-8 border-green-500 border-l-4 bg-green-50 dark:bg-green-900/20">
        <CardContent className="p-4">
          <div className="flex items-start">
            <ShieldAlert className="h-6 w-6 text-green-600 dark:text-green-400 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 font-sans">Acceso Autorizado</h3>
              <p className="text-sm text-green-700 dark:text-green-500">
                Bienvenido al Panel de Administración, {currentUser.email}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Appointment Manager Dialog & Trigger */}
        <Dialog open={isAppointmentManagerOpen} onOpenChange={setIsAppointmentManagerOpen}>
          <DialogTrigger asChild>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium font-sans">
                  Gestionar Citas
                </CardTitle>
                <CalendarDays className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visualiza y gestiona las citas de los clientes.
                </p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl md:max-w-4xl max-h-[calc(100vh-8rem)] flex flex-col">
            <DialogHeader>
              <DialogTitle className="font-sans text-2xl">Gestionar Citas</DialogTitle>
              <DialogDescription>
                Filtra y actualiza el estado de las citas solicitadas.
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeAppointmentTab} onValueChange={(value) => setActiveAppointmentTab(value as AppointmentStatus | 'all')} className="w-full mt-4">
              <TabsList className="flex w-full overflow-x-auto pb-2 justify-start md:grid md:grid-cols-5 md:overflow-visible">
                {appointmentTabs.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value} className="whitespace-nowrap">{tab.label}</TabsTrigger>
                ))}
              </TabsList>
            
              <ScrollArea className="flex-grow overflow-y-auto p-1 pr-2 -mr-1 mt-4 max-h-[calc(100vh-20rem)]">
                {isLoadingAppointments ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <CalendarCheck className="h-12 w-12 mx-auto mb-2" />
                    <p>No hay citas para mostrar en esta sección.</p>
                  </div>
                ) : (
                  <div className="space-y-4 p-2">
                    {filteredAppointments.map((appt) => (
                      <Card key={appt.id} className="shadow-md">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg font-sans">
                                {format(getDisplayableDate(appt.preferredDate), "PPP", { locale: es })} - {appt.preferredTime}
                              </CardTitle>
                              <div className="text-sm text-muted-foreground flex items-center mt-1">
                                <UserCircle2 className="h-4 w-4 mr-1 text-primary"/> 
                                {appt.userName || 'Nombre no disponible'}
                              </div>
                               {appt.userPhone && (
                                <div className="text-xs text-muted-foreground flex items-center mt-1">
                                  <Phone className="h-3 w-3 mr-1.5 text-primary/80"/> {appt.userPhone}
                                </div>
                              )}
                              {appt.userEmail && (
                                <div className="text-xs text-muted-foreground flex items-center mt-1">
                                  <Mail className="h-3 w-3 mr-1.5 text-primary/80"/> {appt.userEmail}
                                </div>
                              )}
                            </div>
                            <Badge variant={getStatusVariant(appt.status)} className="capitalize">{appt.status}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-3 space-y-1 text-sm">
                          <div>
                            <span className="font-semibold">Servicios: </span>
                            {appt.services.map(id => serviceMap.get(id) || id).join(', ')}
                          </div>
                           {appt.selectedProducts && appt.selectedProducts.length > 0 && (
                            <div>
                              <span className="font-semibold">Productos: </span>
                               {appt.selectedProducts.map(id => productMapAdmin.get(id) || id).join(', ')}
                            </div>
                          )}
                          {appt.message && (
                            <div>
                              <span className="font-semibold">Mensaje: </span>
                              {appt.message}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground pt-1">
                            Solicitada: {format(getDisplayableDate(appt.createdAt), "Pp", { locale: es })}
                          </div>
                        </CardContent>
                        <CardFooter className="pt-3 border-t flex flex-wrap gap-2 justify-end">
                          {isUpdatingStatus === appt.id ? (
                             <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          ) : (
                            <>
                              {appt.status === 'pending' && (
                                <>
                                  <Button size="sm" variant="outline" className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleUpdateAppointmentStatus(appt.id, 'confirmed')}>
                                    <CheckCircle className="mr-2 h-4 w-4"/> Confirmar
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleUpdateAppointmentStatus(appt.id, 'cancelled')}>
                                    <XIcon className="mr-2 h-4 w-4"/> Cancelar
                                  </Button>
                                </>
                              )}
                              {appt.status === 'confirmed' && (
                                <>
                                  <Button size="sm" variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700" onClick={() => handleUpdateAppointmentStatus(appt.id, 'completed')}>
                                     <PlayCircle className="mr-2 h-4 w-4"/> Marcar Realizada
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleUpdateAppointmentStatus(appt.id, 'cancelled')}>
                                     <XIcon className="mr-2 h-4 w-4"/> Cancelar
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Tabs>
            <DialogFooter className="mt-auto pt-4 border-t">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cerrar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Manager Dialog & Trigger */}
        <Dialog open={isUserManagerOpen} onOpenChange={setIsUserManagerOpen}>
          <DialogTrigger asChild>
             <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium font-sans">
                  Gestionar Usuarios
                </CardTitle>
                <Users className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visualiza y contacta a los usuarios registrados.
                </p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[calc(100vh-8rem)] flex flex-col">
            <DialogHeader>
              <DialogTitle className="font-sans text-2xl">Gestionar Usuarios</DialogTitle>
              <DialogDescription>
                Lista de todos los usuarios registrados en el sistema.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow overflow-y-auto p-1 pr-2 -mr-1 mt-4 max-h-[calc(100vh-16rem)]">
              {isLoadingUsers ? (
                <div className="flex justify-center py-8"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
              ) : allUsers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2" />
                  <p>No hay usuarios registrados para mostrar.</p>
                </div>
              ) : (
                <div className="space-y-3 p-2">
                  {allUsers.map((user) => (
                    <Card key={user.id} className="shadow-sm">
                      <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-lg font-sans flex items-center">
                          <UserCircle2 className="h-5 w-5 mr-2 text-primary" />
                          {user.fullName}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1 pb-3">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-muted-foreground">{user.email}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                           <span className="text-muted-foreground">{user.phoneNumber || 'No registrado'}</span>
                        </div>
                         <div className="flex items-center text-xs text-muted-foreground/80 pt-1">
                          <CalendarDays className="h-3 w-3 mr-1.5" />
                          Registrado: {format(getDisplayableDate(user.createdAt), "PPP 'a las' p", { locale: es })}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-3 border-t">
                        <div className="flex justify-end space-x-2 w-full">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditUserClick(user)}
                              className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Edit3 className="mr-2 h-4 w-4"/> Editar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleWhatsAppRedirect(user)}
                              disabled={!user.phoneNumber}
                              className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                            >
                              <MessageSquare className="mr-2 h-4 w-4"/> Enviar WhatsApp
                            </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
            <DialogFooter className="mt-auto pt-4 border-t">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cerrar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Link href="/admin/settings" passHref>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium font-sans">
                  Configuración del Sitio
                </CardTitle>
                <Settings className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Configura los ajustes y preferencias globales del sitio.
                </p>
              </CardContent>
            </Card>
        </Link>

        <Dialog open={isProductManagerOpen} onOpenChange={(isOpen) => { setIsProductManagerOpen(isOpen); if (!isOpen) { setShowAddEditProductForm(false); setEditingProduct(null); productForm.reset({name: '', description: '', price: 'ARS$ ', imageSrc: 'https://placehold.co/400x400.png', aiHint: '', stock: 0,}); }}}>
          <DialogTrigger asChild>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium font-sans">
                  Gestionar Productos
                </CardTitle>
                <Package className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Añade, edita o elimina productos de tu tienda.
                </p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl max-h-[calc(100vh-8rem)] flex flex-col">
            <DialogHeader>
              <DialogTitle className="font-sans">Gestionar Productos</DialogTitle>
              <DialogDescription>
                Visualiza, añade, edita o elimina productos de tu inventario.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-grow overflow-y-auto p-1 pr-2 -mr-1">
              {!showAddEditProductForm && (
                <Button onClick={handleAddNewProductClick} className="mb-4">
                  <PlusCircle className="mr-2 h-4 w-4" /> Añadir Producto Nuevo
                </Button>
              )}

              {showAddEditProductForm && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="font-sans text-lg">
                      {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...productForm}>
                      <form onSubmit={productForm.handleSubmit(onProductFormSubmit)} className="space-y-4">
                        <FormField control={productForm.control} name="name" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Producto</FormLabel>
                            <FormControl><Input placeholder="Ej: Cera Moldeadora" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={productForm.control} name="description" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl><Textarea placeholder="Describe el producto..." {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField control={productForm.control} name="price" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Precio</FormLabel>
                              <FormControl><Input placeholder="ARS$ 1500" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={productForm.control} name="stock" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stock</FormLabel>
                              <FormControl><Input type="number" placeholder="0" {...field} 
                                onChange={event => field.onChange(+event.target.value)}
                              /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <FormField control={productForm.control} name="imageSrc" render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL de Imagen</FormLabel>
                            <FormControl><Input placeholder="https://placehold.co/400x400.png" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={productForm.control} name="aiHint" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pista para IA (Keywords)</FormLabel>
                            <FormControl><Input placeholder="Ej: cera cabello" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="flex justify-end space-x-2 pt-2">
                          <Button type="button" variant="outline" onClick={() => { setShowAddEditProductForm(false); setEditingProduct(null); productForm.reset({name: '', description: '', price: 'ARS$ ', imageSrc: 'https://placehold.co/400x400.png', aiHint: '', stock: 0,}); }}>Cancelar</Button>
                          <Button type="submit" disabled={isSubmittingProduct}>
                            {isSubmittingProduct && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingProduct ? 'Actualizar Producto' : 'Añadir Producto'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}
              
              <h3 className="text-lg font-semibold mb-2 font-sans mt-4">Productos Actuales</h3>
              {isLoadingProducts ? (
                <div className="flex justify-center py-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : products.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <PackageSearch className="h-12 w-12 mx-auto mb-2" />
                  <p>No hay productos para mostrar.</p>
                  <p className="text-sm">Empieza añadiendo uno nuevo.</p>
                </div>
              ) : (
                <div className={showAddEditProductForm ? "max-h-[200px] overflow-y-auto border rounded-md" : "max-h-[400px] overflow-y-auto border rounded-md"}>
                  <div className="p-4 space-y-3">
                    {products.map(product => (
                      <Card key={product.id} className="p-3">
                         <div className="flex items-center space-x-4">
                          <div className="relative w-16 h-16 aspect-square flex-shrink-0">
                            <Image
                              src={product.imageSrc} 
                              alt={product.name}
                              fill
                              className="rounded-md object-cover"
                              data-ai-hint={product.aiHint || 'product image'}
                              unoptimized={!!(product.imageSrc && product.imageSrc.startsWith('data:'))}
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="font-semibold truncate" title={product.name}>{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.price}</p>
                            <p className="text-sm text-muted-foreground">
                              Stock: {typeof product.stock === 'number' ? product.stock : 'N/A'}
                            </p>
                          </div>
                          <div className="flex-shrink-0 space-x-1 sm:space-x-2">
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700" onClick={() => handleEditProductClick(product)}>
                              <Edit3 className="h-4 w-4" />
                            </Button> 
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Confirmar Eliminación</DialogTitle>
                                  <AlertDialogPrimitiveDescription>
                                    ¿Estás seguro de que quieres eliminar el producto "{product.name}"? Esta acción no se puede deshacer.
                                  </AlertDialogPrimitiveDescription>
                                </DialogHeader>
                                <DialogFooter className="sm:justify-end">
                                  <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                      Cancelar
                                    </Button>
                                  </DialogClose>
                                  <DialogClose asChild>
                                    <Button type="button" variant="destructive" onClick={() => handleDeleteProduct(product.id)}>
                                      Eliminar
                                    </Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>

            <DialogFooter className="mt-auto pt-4 border-t">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cerrar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {appointmentToConfirm && (
        <AlertDialog open={isConfirmAppointmentDialogOpen} onOpenChange={(isOpen) => {
          setIsConfirmAppointmentDialogOpen(isOpen);
          if (!isOpen) setAppointmentToConfirm(null);
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Cita</AlertDialogTitle>
              <AlertDialogPrimitiveDescription>
                Estás a punto de confirmar la siguiente cita:
                <br />
                <span className="mt-2 text-sm text-foreground space-y-1">
                  <strong>Cliente:</strong> {appointmentToConfirm.userName || 'N/A'}
                  <br />
                  <strong>Fecha:</strong> {format(getDisplayableDate(appointmentToConfirm.preferredDate), "PPP", { locale: es })}
                  <br />
                  <strong>Hora:</strong> {appointmentToConfirm.preferredTime}
                  <br />
                  <strong>Servicios:</strong> {appointmentToConfirm.services.map(id => serviceMap.get(id) || id).join(', ')}
                  {appointmentToConfirm.selectedProducts && appointmentToConfirm.selectedProducts.length > 0 && (
                    <>
                      <br />
                      <strong>Productos:</strong> {appointmentToConfirm.selectedProducts.map(id => productMapAdmin.get(id) || id).join(', ')}
                    </>
                  )}
                </span>
              </AlertDialogPrimitiveDescription>
            </AlertDialogHeader>
            <div className="flex items-center space-x-2 my-4">
              <Checkbox
                id="sendWhatsApp"
                checked={sendWhatsAppNotification}
                onCheckedChange={(checked) => setSendWhatsAppNotification(checked as boolean)}
                disabled={!appointmentToConfirm.userPhone || !appointmentToConfirm.userName}
              />
              <Label htmlFor="sendWhatsApp" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Enviar notificación de confirmación por WhatsApp al cliente
              </Label>
            </div>
             {(!appointmentToConfirm.userPhone || !appointmentToConfirm.userName) && sendWhatsAppNotification && (
                <p className="text-xs text-destructive -mt-2 mb-2">
                    No se puede enviar WhatsApp: falta el número de teléfono o el nombre del cliente.
                </p>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setAppointmentToConfirm(null);
                setIsConfirmAppointmentDialogOpen(false);
              }}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleActualConfirmAppointment} disabled={isUpdatingStatus === appointmentToConfirm.id}>
                {isUpdatingStatus === appointmentToConfirm.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Cita
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {appointmentToCancel && (
        <AlertDialog 
          open={isCancelAppointmentDialogOpen} 
          onOpenChange={(isOpen) => {
            setIsCancelAppointmentDialogOpen(isOpen);
            if (!isOpen) setAppointmentToCancel(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Cancelación</AlertDialogTitle>
              <AlertDialogPrimitiveDescription>
                Estás a punto de cancelar la siguiente cita:
                <br />
                <span className="mt-2 text-sm text-foreground space-y-1">
                  <strong>Cliente:</strong> {appointmentToCancel.userName || 'N/A'}
                  <br />
                  <strong>Fecha:</strong> {format(getDisplayableDate(appointmentToCancel.preferredDate), "PPP", { locale: es })}
                  <br />
                  <strong>Hora:</strong> {appointmentToCancel.preferredTime}
                  <br />
                  <strong>Servicios:</strong> {appointmentToCancel.services.map(id => serviceMap.get(id) || id).join(', ')}
                  {appointmentToCancel.selectedProducts && appointmentToCancel.selectedProducts.length > 0 && (
                     <>
                      <br />
                      <strong>Productos:</strong> {appointmentToCancel.selectedProducts.map(id => productMapAdmin.get(id) || id).join(', ')}
                    </>
                  )}
                </span>
              </AlertDialogPrimitiveDescription>
            </AlertDialogHeader>
            <div className="flex items-center space-x-2 my-4">
              <Checkbox
                id="sendCancelWhatsApp"
                checked={sendCancelWhatsAppNotification}
                onCheckedChange={(checked) => setSendCancelWhatsAppNotification(checked as boolean)}
                disabled={!appointmentToCancel.userPhone || !appointmentToCancel.userName}
              />
              <Label htmlFor="sendCancelWhatsApp" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Enviar notificación de cancelación por WhatsApp al cliente
              </Label>
            </div>
             {(!appointmentToCancel.userPhone || !appointmentToCancel.userName) && sendCancelWhatsAppNotification && (
                <p className="text-xs text-destructive -mt-2 mb-2">
                    No se puede enviar WhatsApp: falta el número de teléfono o el nombre del cliente.
                </p>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setAppointmentToCancel(null);
                setIsCancelAppointmentDialogOpen(false);
              }}>
                Cerrar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleActualCancelAppointment} 
                disabled={isUpdatingStatus === appointmentToCancel.id}
                className={cn(buttonVariants({variant: "destructive"}))}
              >
                {isUpdatingStatus === appointmentToCancel.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Cancelación
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {editingUser && (
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-sans">Editar Usuario: {editingUser.fullName}</DialogTitle>
              <DialogDescription>
                Modifica los detalles del usuario. El correo electrónico no se puede cambiar.
              </DialogDescription>
            </DialogHeader>
            <Form {...userEditForm}>
              <form onSubmit={userEditForm.handleSubmit(onUserEditFormSubmit)} className="space-y-4 py-4">
                <FormField
                  control={userEditForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userEditForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico (No editable)</FormLabel>
                      <FormControl><Input {...field} disabled /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userEditForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Teléfono</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmittingUserEdit}>
                    {isSubmittingUserEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
