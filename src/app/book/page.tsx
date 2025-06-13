
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils"
import { CalendarIcon, Loader2, Clock, ListChecks, UserCircle, Briefcase, Trash2, AlertCircle, MessageSquare, HelpCircle, Phone, ShoppingBag, PackageSearch } from "lucide-react"
import { format } from "date-fns"
import { es } from 'date-fns/locale';
import Link from 'next/link';

import { PageHeader } from '@/components/page-header';
import {
  submitAppointmentRequest,
  getBookedSlotsForDate,
  getServices,
  type Service,
  getTimeSlotSettings,
  type TimeSlotSetting,
  getUserAppointments,
  updateAppointmentStatus,
  type Appointment,
  getAdminPhoneNumber,
  getMessageTemplate,
  type MessageTemplateId,
  getProducts, // Import getProducts
} from '@/app/actions';
import type { Product } from '@/app/products/page'; // Import Product type
import { type ClientAppointmentFormValues, clientAppointmentSchema, type AppointmentFormValues } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ALL_TIME_SLOTS } from '@/lib/constants';
import { siteConfig } from '@/config/site';


const MIN_ADVANCE_BOOKING_MINUTES = 15;
const now = new Date();

export default function BookAppointmentPage() {
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth(); 
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = React.useState<string | undefined>(undefined);
  const [bookedSlots, setBookedSlots] = React.useState<string[]>([]);
  const [isLoadingBookedSlots, setIsLoadingBookedSlots] = React.useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [allServices, setAllServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]); // State for products
  const [isLoadingProducts, setIsLoadingProducts] = useState(true); // Loading state for products


  const [activeTimeSlotSettings, setActiveTimeSlotSettings] = useState<TimeSlotSetting[]>([]);
  const [isLoadingSlotSettings, setIsLoadingSlotSettings] = useState(true);

  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [isLoadingMyAppointments, setIsLoadingMyAppointments] = useState(true);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCancellingAppointment, setIsCancellingAppointment] = useState(false);
  const [activeTab, setActiveTab] = useState("request");

  const [contactAdminDialogOpen, setContactAdminDialogOpen] = useState(false);
  const [selectedAppointmentForContact, setSelectedAppointmentForContact] = useState<Appointment | null>(null);
  const [isProcessingWhatsAppLink, setIsProcessingWhatsAppLink] = useState(false);


  const form = useForm<ClientAppointmentFormValues>({
    resolver: zodResolver(clientAppointmentSchema),
    defaultValues: {
      services: [],
      selectedProducts: [], // Initialize selectedProducts
      preferredDate: undefined,
      preferredTime: '',
      message: '',
    },
  });

  const serviceMap = useMemo(() => {
    return new Map(allServices.map(service => [service.id, service.name]));
  }, [allServices]);

  const productMap = useMemo(() => {
    return new Map(allProducts.map(product => [product.id, product.name]));
  }, [allProducts]);

  const fetchPageData = async () => {
    setIsLoadingServices(true);
    setIsLoadingProducts(true);
    setIsLoadingSlotSettings(true);
    try {
      const [fetchedServices, fetchedProducts, fetchedSlotSettings] = await Promise.all([
        getServices(),
        getProducts(), // Fetch products
        getTimeSlotSettings()
      ]);
      setAllServices(fetchedServices);
      setAllProducts(fetchedProducts.filter(p => (p.stock ?? 0) > 0)); // Only show products with stock
      setActiveTimeSlotSettings(fetchedSlotSettings);
    } catch (error) {
      console.error("Error fetching page data:", error);
      toast({ title: 'Error', description: 'No se pudieron cargar los datos necesarios para la reserva.', variant: 'destructive' });
    } finally {
      setIsLoadingServices(false);
      setIsLoadingProducts(false);
      setIsLoadingSlotSettings(false);
    }
  };

  const fetchUserAppointments = async () => {
    if (currentUser && !authLoading) {
      console.log(`BookPage: fetchUserAppointments called. currentUser UID: ${currentUser.uid}`);
      setIsLoadingMyAppointments(true);
      try {
        const userAppointments = await getUserAppointments(currentUser.uid);
        console.log("BookPage: Fetched user appointments from server action:", JSON.stringify(userAppointments, null, 2));
        setMyAppointments(userAppointments);
        // Ensure products are loaded for mapping in "Mis Citas" if not already loaded
        if (allProducts.length === 0 && !isLoadingProducts) {
          const fetchedProducts = await getProducts();
          setAllProducts(fetchedProducts);
        }

      } catch (error) {
        console.error("BookPage: Error fetching user appointments in client:", error);
        toast({ title: 'Error', description: 'No se pudieron cargar tus citas.', variant: 'destructive' });
      } finally {
        setIsLoadingMyAppointments(false);
      }
    } else if (!currentUser && !authLoading) {
      console.log("BookPage: fetchUserAppointments - no current user or auth is loading, clearing appointments.");
      setMyAppointments([]);
      setIsLoadingMyAppointments(false); 
    }
  };

  useEffect(() => {
    fetchPageData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'my-appointments' && !authLoading && currentUser) {
      fetchUserAppointments();
    } else if (activeTab === 'my-appointments' && !authLoading && !currentUser) {
      setMyAppointments([]);
      setIsLoadingMyAppointments(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, activeTab, authLoading]); 


  const watchedDate = form.watch('preferredDate');
  const formattedSelectedDate = watchedDate
    ? format(watchedDate, "'Para el' EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
    : "Selecciona una fecha primero";

  useEffect(() => {
    let isActive = true;

    const fetchBookedSlots = async () => {
      if (!watchedDate) {
        if (isActive) {
          setBookedSlots([]);
          setSelectedTimeSlot(undefined);
          form.setValue('preferredTime', '');
          setIsLoadingBookedSlots(false);
        }
        return;
      }

      if (isActive) {
        setSelectedTimeSlot(undefined);
        form.setValue('preferredTime', '');
        setIsLoadingBookedSlots(true);
      }

      try {
        const slots = await getBookedSlotsForDate(watchedDate);
        if (isActive) {
          setBookedSlots(slots);
        }
      } catch (error) {
        if (isActive) {
          console.error("Error fetching booked slots:", error);
          toast({ title: 'Error', description: 'No se pudieron cargar los horarios ocupados.', variant: 'destructive' });
          setBookedSlots([]);
        }
      } finally {
        if (isActive) {
          setIsLoadingBookedSlots(false);
        }
      }
    };

    fetchBookedSlots();

    return () => {
      isActive = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedDate]);


  async function onSubmit(data: ClientAppointmentFormValues) {
    if (!currentUser) {
      toast({
        title: 'Error de Autenticación',
        description: 'Debes iniciar sesión para solicitar una cita.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    let result;

    try {
      const payloadForServer: AppointmentFormValues = {
        ...data,
        userId: currentUser.uid,
        selectedProducts: data.selectedProducts || [], // Ensure it's an array
      };
      result = await submitAppointmentRequest(payloadForServer);
    } catch (error) {
      console.error("Unexpected error submitting appointment:", error);
      toast({
        title: 'Error Inesperado',
        description: 'Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(false);

    if (result.success) {
      toast({
        title: '¡Éxito!',
        description: result.message,
      });
      form.reset({
        services: [],
        selectedProducts: [],
        preferredDate: watchedDate,
        preferredTime: '',
        message: ''
      });
      setSelectedTimeSlot(undefined);
      if (watchedDate) {
        setIsLoadingBookedSlots(true);
        getBookedSlotsForDate(watchedDate)
          .then(newSlots => {
            setBookedSlots(newSlots);
            fetchUserAppointments();
          })
          .catch(fetchError => {
            console.error("Error re-fetching booked slots after submission:", fetchError);
          })
          .finally(() => {
            setIsLoadingBookedSlots(false);
          });
      } else {
         fetchUserAppointments();
      }
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
       if (result.message && result.message.includes('Este horario ya no está disponible')) {
          if (watchedDate) {
            setIsLoadingBookedSlots(true);
            getBookedSlotsForDate(watchedDate)
              .then(newSlots => {
                setBookedSlots(newSlots);
              })
              .catch(fetchError => {
                console.error("Error re-fetching booked slots after failed booking:", fetchError);
              })
              .finally(() => {
                setIsLoadingBookedSlots(false);
              });
          }
       }
    }
  }

  const handleUserCancelAppointment = async () => {
    if (!appointmentToCancel || !currentUser) return;
    setIsCancellingAppointment(true);
    const result = await updateAppointmentStatus(appointmentToCancel.id, 'cancelled', currentUser.uid);
    setIsCancellingAppointment(false);
    setIsCancelDialogOpen(false);

    if (result.success) {
      toast({ title: 'Cita Cancelada', description: result.message });
      fetchUserAppointments();
    } else {
      toast({ title: 'Error al Cancelar', description: result.message, variant: 'destructive' });
    }
    setAppointmentToCancel(null);
  };

  const handleOpenContactAdminDialog = (appointment: Appointment) => {
    setSelectedAppointmentForContact(appointment);
    setContactAdminDialogOpen(true);
  };

  const handleWhatsAppRedirect = async (type: 'adminContactCancellationRequest' | 'adminContactQuery') => {
    if (!selectedAppointmentForContact || !currentUser) {
      toast({ title: 'Error', description: 'No se pudo procesar la solicitud de contacto.', variant: 'destructive' });
      return;
    }
    setIsProcessingWhatsAppLink(true);
    try {
      const adminPhoneNumber = await getAdminPhoneNumber();
      if (!adminPhoneNumber) {
        toast({ title: 'Error', description: 'No se pudo obtener el número de contacto del administrador. Por favor, configura uno en el panel de administración.', variant: 'destructive' });
        setContactAdminDialogOpen(false); 
        setIsProcessingWhatsAppLink(false);
        return;
      }

      let messageContent = await getMessageTemplate(type);
      
      let currentServices = allServices;
      if (currentServices.length === 0 && !isLoadingServices) {
        currentServices = await getServices();
        setAllServices(currentServices);
      }
      
      let currentProducts = allProducts;
       if (currentProducts.length === 0 && !isLoadingProducts && selectedAppointmentForContact.selectedProducts && selectedAppointmentForContact.selectedProducts.length > 0) {
        currentProducts = await getProducts();
        setAllProducts(currentProducts);
      }


      const serviceNames = selectedAppointmentForContact.services.map(serviceId => {
        const serviceDetail = currentServices.find(s => s.id === serviceId);
        return serviceDetail ? serviceDetail.name : serviceId;
      });
      const servicesText = serviceNames.join(', ') || 'No especificados';

      const productNames = (selectedAppointmentForContact.selectedProducts || []).map(productId => {
        const productDetail = currentProducts.find(p => p.id === productId);
        return productDetail ? productDetail.name : productId;
      });
      const productsText = productNames.join(', ') || 'Ninguno';
      
      const clientName = currentUser.displayName || currentUser.email || 'Cliente';
      const apptDate = format(new Date(selectedAppointmentForContact.preferredDate), "PPP", { locale: es });
      const apptTime = selectedAppointmentForContact.preferredTime;

      messageContent = messageContent
        .replace(/\{\{clientName\}\}/g, clientName)
        .replace(/\{\{appointmentDate\}\}/g, apptDate)
        .replace(/\{\{appointmentTime\}\}/g, apptTime)
        .replace(/\{\{siteName\}\}/g, siteConfig.name)
        .replace(/\{\{servicesList\}\}/g, servicesText)
        .replace(/\{\{productsList\}\}/g, productsText);


      const cleanedAdminPhoneNumber = adminPhoneNumber.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${cleanedAdminPhoneNumber}?text=${encodeURIComponent(messageContent)}`;

      window.open(whatsappUrl, '_blank');
      setContactAdminDialogOpen(false);

    } catch (error) {
      console.error("Error preparing WhatsApp redirect:", error);
      toast({ title: 'Error', description: 'No se pudo generar el enlace de WhatsApp.', variant: 'destructive' });
    } finally {
      setIsProcessingWhatsAppLink(false);
    }
  };


  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'default';
      case 'confirmed': return 'secondary';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const currentlyActiveSlots = ALL_TIME_SLOTS.filter(slot => {
    const slotSetting = activeTimeSlotSettings.find(s => s.time === slot);
    return slotSetting ? slotSetting.isActive : true; 
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <PageHeader
        title="Reservar Tu Cita"
        description="Gestiona tus citas o solicita una nueva. ¡Te esperamos!"
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-2xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="request">Solicitar Cita</TabsTrigger>
          <TabsTrigger value="my-appointments">Mis Citas</TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="preferredDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-lg font-semibold">Fecha Preferida</FormLabel>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal text-base py-6",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-5 w-5 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setIsCalendarOpen(false);
                          }}
                          disabled={(date) =>
                            date < new Date(new Date().setDate(new Date().getDate() -1)) || date < new Date("1900-01-01")
                          }
                          initialFocus
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold flex items-center">
                      <Clock className="mr-2 h-5 w-5 text-primary" />
                      Horarios Disponibles
                    </FormLabel>
                    <p className="text-sm text-muted-foreground mb-3">{formattedSelectedDate}</p>

                    <div className="min-h-[70px] py-2">
                      {!watchedDate ? (
                        <p key="no-date" className="text-sm text-muted-foreground text-center">Por favor, selecciona una fecha para ver los horarios.</p>
                      ) : isLoadingBookedSlots || isLoadingSlotSettings ? (
                        <div key="loading-slots" className="flex justify-center items-center h-full">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="ml-2">Cargando horarios...</span>
                        </div>
                      ) : (
                        <div key="slots-grid" className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                          {currentlyActiveSlots.map((slot) => {
                              const isToday = watchedDate ? format(watchedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd') : false;
                              let slotIsTooSoonOrPast = false;

                              if (watchedDate && isToday) {
                                  const timeParts = slot.split(' ');
                                  const timeDigits = timeParts[0].split(':');
                                  let slotHours = parseInt(timeDigits[0]);
                                  const slotMinutes = parseInt(timeDigits[1]);
                                  const period = timeParts[1].toUpperCase();

                                  if (period === 'PM' && slotHours !== 12) slotHours += 12;
                                  else if (period === 'AM' && slotHours === 12) slotHours = 0;

                                  const slotStartDateTime = new Date(watchedDate);
                                  slotStartDateTime.setHours(slotHours, slotMinutes, 0, 0);

                                  const cutoffTime = new Date(new Date().getTime() + MIN_ADVANCE_BOOKING_MINUTES * 60 * 1000);

                                  if (slotStartDateTime <= cutoffTime) {
                                      slotIsTooSoonOrPast = true;
                                  }
                              }

                              const isSlotBooked = bookedSlots.includes(slot);
                              const isDisabled = isSlotBooked || slotIsTooSoonOrPast;

                              return (
                                 <Button
                                    key={slot}
                                    type="button"
                                    variant={selectedTimeSlot === slot && !isDisabled ? "default" : "outline"}
                                    className={cn(
                                      "w-full py-3 text-sm",
                                      selectedTimeSlot === slot && !isDisabled
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                        : isDisabled
                                          ? "text-muted-foreground bg-muted hover:bg-muted cursor-not-allowed"
                                          : "text-foreground hover:bg-muted"
                                    )}
                                    onClick={() => {
                                      if (!isDisabled) {
                                        setSelectedTimeSlot(slot);
                                        field.onChange(slot);
                                      }
                                    }}
                                    disabled={isDisabled}
                                  >
                                    {slot}
                                  </Button>
                              );
                          })}
                          {currentlyActiveSlots.filter(slot => {
                              const isToday = watchedDate ? format(watchedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd') : false;
                              let slotIsTooSoonOrPast = false;
                              if (watchedDate && isToday) {
                                  const timeParts = slot.split(' ');
                                  const timeDigits = timeParts[0].split(':');
                                  let slotHours = parseInt(timeDigits[0]);
                                  const slotMinutes = parseInt(timeDigits[1]);
                                  const period = timeParts[1].toUpperCase();
                                  if (period === 'PM' && slotHours !== 12) slotHours += 12;
                                  else if (period === 'AM' && slotHours === 12) slotHours = 0;
                                  const slotStartDateTime = new Date(watchedDate);
                                  slotStartDateTime.setHours(slotHours, slotMinutes, 0, 0);
                                  const cutoffTime = new Date(new Date().getTime() + MIN_ADVANCE_BOOKING_MINUTES * 60 * 1000);
                                  if (slotStartDateTime <= cutoffTime) slotIsTooSoonOrPast = true;
                              }
                              return !bookedSlots.includes(slot) && !slotIsTooSoonOrPast;
                          }).length === 0 && watchedDate && !isLoadingBookedSlots && !isLoadingSlotSettings && (
                             <p className="text-sm text-muted-foreground text-center col-span-full">
                               No hay horarios disponibles para esta fecha.
                             </p>
                          )}
                        </div>
                      )}
                    </div>
                    <FormMessage className="mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="services"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-lg font-semibold flex items-center">
                        <ListChecks className="mr-2 h-5 w-5 text-primary" />
                        Servicios
                      </FormLabel>
                      <FormDescription className="text-sm">
                        Selecciona el/los servicio(s) que te interesan.
                      </FormDescription>
                    </div>
                    {isLoadingServices ? (
                      <div className="flex justify-center items-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2">Cargando servicios...</span>
                      </div>
                    ) : allServices.length === 0 ? (
                       <p className="text-sm text-muted-foreground text-center py-4">
                          No hay servicios disponibles en este momento.
                       </p>
                    ) : (
                      <div className="space-y-2">
                        {allServices.map((service) => (
                          <FormField
                            key={service.id}
                            control={form.control}
                            name="services"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  className="flex flex-row items-center space-x-3 space-y-0 p-3 rounded-md hover:bg-muted transition-colors border"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(service.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), service.id])
                                          : field.onChange(
                                              (field.value || []).filter(
                                                (value) => value !== service.id
                                              )
                                            )
                                      }}
                                      className="h-5 w-5"
                                    />
                                  </FormControl>
                                  <div className="flex-grow">
                                    <FormLabel className="font-normal text-base cursor-pointer flex justify-between items-center w-full">
                                      <span>{service.name}</span>
                                      <span className="text-sm text-primary font-medium">{service.price}</span>
                                    </FormLabel>
                                    <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
                                  </div>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Products Selection Field */}
              <FormField
                control={form.control}
                name="selectedProducts"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-lg font-semibold flex items-center">
                        <ShoppingBag className="mr-2 h-5 w-5 text-primary" />
                        Encargar Productos (Opcional)
                      </FormLabel>
                      <FormDescription className="text-sm">
                        Añade productos a tu cita. Solo se muestran productos con stock.
                      </FormDescription>
                    </div>
                    {isLoadingProducts ? (
                      <div className="flex justify-center items-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2">Cargando productos...</span>
                      </div>
                    ) : allProducts.length === 0 ? (
                       <p className="text-sm text-muted-foreground text-center py-4">
                          No hay productos disponibles para encargar en este momento.
                       </p>
                    ) : (
                      <div className="space-y-2">
                        {allProducts.map((product) => (
                          <FormField
                            key={product.id}
                            control={form.control}
                            name="selectedProducts"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  className="flex flex-row items-center space-x-3 space-y-0 p-3 rounded-md hover:bg-muted transition-colors border"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(product.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), product.id])
                                          : field.onChange(
                                              (field.value || []).filter(
                                                (value) => value !== product.id
                                              )
                                            )
                                      }}
                                      className="h-5 w-5"
                                      disabled={(product.stock ?? 0) === 0}
                                    />
                                  </FormControl>
                                  <div className="flex-grow">
                                    <FormLabel className={cn("font-normal text-base cursor-pointer flex justify-between items-center w-full", (product.stock ?? 0) === 0 && "text-muted-foreground line-through")}>
                                      <span>{product.name}</span>
                                      <span className="text-sm text-primary font-medium">{product.price}</span>
                                    </FormLabel>
                                    {(product.stock ?? 0) === 0 && <p className="text-xs text-destructive">Agotado</p>}
                                    <p className={cn("text-xs text-muted-foreground mt-0.5", (product.stock ?? 0) === 0 && "line-through")}>{product.description}</p>
                                  </div>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">Mensaje Adicional (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="¿Alguna petición específica o nota?"
                        className="resize-none text-base p-3"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <Button
                  type="submit"
                  className="w-full py-6 text-lg"
                  disabled={isLoading || authLoading || !currentUser || isLoadingBookedSlots || isLoadingServices || isLoadingProducts || isLoadingSlotSettings}
                >
                <Loader2
                  className={cn(
                    "mr-2 h-5 w-5 animate-spin",
                    (isLoading || authLoading ||isLoadingBookedSlots || isLoadingServices || isLoadingProducts || isLoadingSlotSettings) ? "inline-block" : "hidden"
                  )}
                />
                {isLoading || isLoadingBookedSlots || isLoadingServices || isLoadingProducts || isLoadingSlotSettings ? (
                  'Procesando...'
                ) : authLoading ? (
                  'Cargando sesión...'
                ) : (
                  currentUser ? 'Solicitar Cita' : 'Inicia sesión para reservar'
                )}
              </Button>
              {!currentUser && !authLoading &&(
                   <p className="text-sm text-center text-muted-foreground">
                      Debes <Link href="/login?redirect=/book" className="underline text-primary hover:text-primary/80">iniciar sesión</Link> o <Link href="/register?redirect=/book" className="underline text-primary hover:text-primary/80">registrarte</Link> para solicitar una cita.
                   </p>
              )}
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="my-appointments" className="mt-6">
          {authLoading ? (
             <div className="flex justify-center items-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando tu sesión...</p>
            </div>
          ) :!currentUser ? (
            <Card className="text-center py-10">
              <CardHeader>
                <UserCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <CardTitle>Mis Citas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  <Link href="/login?redirect=/book" className="text-primary underline">Inicia sesión</Link> o <Link href="/register?redirect=/book" className="text-primary underline">regístrate</Link> para ver y gestionar tus citas.
                </p>
              </CardContent>
            </Card>
          ) : isLoadingMyAppointments || isLoadingServices || isLoadingProducts ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando tus citas...</p>
            </div>
          ) : myAppointments.length === 0 ? (
            <Card className="text-center py-10">
               <CardHeader>
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <CardTitle>No Tienes Citas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Aún no has solicitado ninguna cita.</p>
                <Button className="mt-4" onClick={() => setActiveTab("request")}>Solicitar una Cita</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myAppointments.map((appt) => (
                <Card key={appt.id} className="shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-sans">
                          {format(new Date(appt.preferredDate), "PPP", { locale: es })} - {appt.preferredTime}
                        </CardTitle>
                        <CardDescription className="text-xs pt-1">
                          Solicitada: {format(new Date(appt.createdAt), "Pp", { locale: es })}
                        </CardDescription>
                      </div>
                      <Badge variant={getStatusVariant(appt.status)} className="capitalize text-xs px-2 py-0.5">{appt.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4 space-y-2 text-sm">
                    <div>
                      <span className="font-semibold">Servicios: </span>
                      {appt.services.map(serviceId => serviceMap.get(serviceId) || serviceId).join(', ')}
                    </div>
                    {appt.selectedProducts && appt.selectedProducts.length > 0 && (
                       <div>
                        <span className="font-semibold">Productos Encargados: </span>
                        {appt.selectedProducts.map(productId => productMap.get(productId) || productId).join(', ') || 'Ninguno'}
                       </div>
                    )}
                    {appt.message && (
                      <div>
                        <span className="font-semibold">Tu Mensaje: </span>
                        {appt.message}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-3 border-t flex flex-wrap gap-2 justify-end">
                    {appt.status === 'pending' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => { setAppointmentToCancel(appt); setIsCancelDialogOpen(true); }}
                        disabled={isCancellingAppointment && appointmentToCancel?.id === appt.id}
                      >
                        {isCancellingAppointment && appointmentToCancel?.id === appt.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Cancelar Cita
                      </Button>
                    )}
                     {(appt.status === 'confirmed' || appt.status === 'pending' ) && ( 
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-primary text-primary hover:bg-primary/10"
                        onClick={() => handleOpenContactAdminDialog(appt)}
                      >
                        <Phone className="mr-2 h-4 w-4" /> Contactar Barbero
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {appointmentToCancel && (
        <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center"><AlertCircle className="h-5 w-5 mr-2 text-destructive"/>¿Confirmar Cancelación?</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que quieres cancelar tu cita para el
                <strong className="text-foreground"> {format(new Date(appointmentToCancel.preferredDate), "PPP", { locale: es })} a las {appointmentToCancel.preferredTime}</strong>?
                <br/>
                Servicios: {appointmentToCancel.services.map(serviceId => serviceMap.get(serviceId) || serviceId).join(', ')}.
                {appointmentToCancel.selectedProducts && appointmentToCancel.selectedProducts.length > 0 && (
                  <>
                  <br/>
                  Productos: {appointmentToCancel.selectedProducts.map(productId => productMap.get(productId) || productId).join(', ') || 'Ninguno'}.
                  </>
                )}
                <br/>
                {(appointmentToCancel.status === 'pending') && "Esta acción no se puede deshacer."}
                {(appointmentToCancel.status === 'confirmed') && "Si tu cita ya estaba confirmada, esta acción notificará al barbero tu solicitud de cancelación. No es una cancelación automática."}

              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setAppointmentToCancel(null)}>Cerrar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUserCancelAppointment}
                disabled={isCancellingAppointment}
                className={cn(isCancellingAppointment ? "" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground")}
              >
                {isCancellingAppointment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sí, Cancelar Cita
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {selectedAppointmentForContact && (
        <Dialog open={contactAdminDialogOpen} onOpenChange={(isOpen) => {
            setContactAdminDialogOpen(isOpen);
            if (!isOpen) setSelectedAppointmentForContact(null); 
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                Contactar al Barbero
              </DialogTitle>
              <DialogDescription>
                Selecciona una opción para comunicarte por WhatsApp sobre tu cita del <strong className="text-foreground">{format(new Date(selectedAppointmentForContact.preferredDate), "PPP", { locale: es })} a las {selectedAppointmentForContact.preferredTime}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-4">
              <Button
                variant="outline"
                onClick={() => handleWhatsAppRedirect('adminContactCancellationRequest')}
                disabled={isProcessingWhatsAppLink}
                className="justify-start text-left h-auto py-3"
              >
                {isProcessingWhatsAppLink ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-3 h-5 w-5 text-destructive" />}
                <div>
                  <p className="font-semibold">Solicitar Cancelación de Cita</p>
                  <p className="text-xs text-muted-foreground">Enviar un mensaje para pedir la cancelación.</p>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleWhatsAppRedirect('adminContactQuery')}
                disabled={isProcessingWhatsAppLink}
                 className="justify-start text-left h-auto py-3"
              >
                 {isProcessingWhatsAppLink ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HelpCircle className="mr-3 h-5 w-5 text-blue-500" />}
                <div>
                  <p className="font-semibold">Hacer una Consulta sobre esta Cita</p>
                  <p className="text-xs text-muted-foreground">Enviar un mensaje con tu pregunta.</p>
                </div>
              </Button>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">Cerrar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
