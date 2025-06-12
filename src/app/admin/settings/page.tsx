
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel, 
  FormMessage,
} from '@/components/ui/form';
import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/context/AuthContext';
import { siteSettingsSchema, type SiteSettingsFormValues, serviceSchema, type ServiceFormValues } from '@/lib/schemas';
import { 
  submitSiteSettings, 
  getServices, 
  addService, 
  updateService, 
  deleteService, 
  type Service,
  getTimeSlotSettings,
  updateTimeSlotSetting,
  type TimeSlotSetting,
  getMessageTemplate,
  updateMessageTemplate,
  getAdminPhoneNumber,
  updateAdminPhoneNumber,
  type MessageTemplateId,
} from '@/app/actions';
import { ALL_TIME_SLOTS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { siteConfig } from '@/config/site';
import { Loader2, SettingsIcon, PlusCircle, Edit3, Trash2, PackageSearch, ClockIcon, Check, X, MessageSquareIcon, InfoIcon, PhoneIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label as UiLabel } from '@/components/ui/label'; 

export default function AdminSettingsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);

  // States for Service Management
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [showAddEditServiceForm, setShowAddEditServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // States for Time Slot Management
  const [timeSlotSettingsList, setTimeSlotSettingsList] = useState<TimeSlotSetting[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  const [isUpdatingTimeSlot, setIsUpdatingTimeSlot] = useState<string | null>(null);

  // States for WhatsApp Message Templates & Admin Contact
  const [confirmationTemplate, setConfirmationTemplate] = useState('');
  const [cancellationTemplate, setCancellationTemplate] = useState('');
  const [adminContactCancellationTemplate, setAdminContactCancellationTemplate] = useState('');
  const [adminContactQueryTemplate, setAdminContactQueryTemplate] = useState('');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSubmittingTemplate, setIsSubmittingTemplate] = useState<MessageTemplateId | null>(null);
  
  const [adminPhoneNumber, setAdminPhoneNumber] = useState('');
  const [isLoadingAdminPhone, setIsLoadingAdminPhone] = useState(false);
  const [isSubmittingAdminPhone, setIsSubmittingAdminPhone] = useState(false);


  const availablePlaceholders = ['{{clientName}}', '{{appointmentDate}}', '{{appointmentTime}}', '{{siteName}}', '{{servicesList}}'];


  const settingsForm = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      siteName: siteConfig.name,
      siteDescription: siteConfig.description,
    },
  });

  const serviceForm = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 'ARS$ ',
    },
  });

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login?redirect=/admin/settings');
    } else if (!authLoading && currentUser && currentUser.email !== 'joacoadmin@admin.com') {
      router.push('/admin'); 
      toast({
        title: 'Acceso Denegado',
        description: 'No tienes permiso para acceder a esta página.',
        variant: 'destructive',
      });
    }
  }, [currentUser, authLoading, router, toast]);

  useEffect(() => {
    settingsForm.reset({
      siteName: siteConfig.name,
      siteDescription: siteConfig.description,
    });
  }, [siteConfig.name, siteConfig.description, settingsForm]);


  async function fetchAdminServices() {
    setIsLoadingServices(true);
    try {
      const fetchedServices = await getServices();
      setServices(fetchedServices.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; 
      }));
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los servicios.', variant: 'destructive' });
    } finally {
      setIsLoadingServices(false);
    }
  }

  async function fetchTimeSlotSettingsAdmin() {
    setIsLoadingTimeSlots(true);
    try {
      const fetchedSettings = await getTimeSlotSettings();
      setTimeSlotSettingsList(fetchedSettings);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los horarios.', variant: 'destructive' });
    } finally {
      setIsLoadingTimeSlots(false);
    }
  }

  async function fetchAdminContactSettings() {
    setIsLoadingAdminPhone(true);
    try {
      const phone = await getAdminPhoneNumber();
      if (phone) setAdminPhoneNumber(phone);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo cargar el número de teléfono del administrador.', variant: 'destructive' });
    } finally {
      setIsLoadingAdminPhone(false);
    }
  }

  async function fetchMessageTemplates() {
    setIsLoadingTemplates(true);
    try {
      const [
        confTemplate, 
        cancTemplate,
        adminCancTemplate,
        adminQueryTemplate
      ] = await Promise.all([
        getMessageTemplate('confirmation'),
        getMessageTemplate('cancellation'),
        getMessageTemplate('adminContactCancellationRequest'),
        getMessageTemplate('adminContactQuery')
      ]);
      setConfirmationTemplate(confTemplate);
      setCancellationTemplate(cancTemplate);
      setAdminContactCancellationTemplate(adminCancTemplate);
      setAdminContactQueryTemplate(adminQueryTemplate);

    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar las plantillas de mensajes.', variant: 'destructive' });
    } finally {
      setIsLoadingTemplates(false);
    }
  }

  useEffect(() => {
    if (currentUser?.email === 'joacoadmin@admin.com') {
      fetchAdminServices();
      fetchTimeSlotSettingsAdmin();
      fetchMessageTemplates();
      fetchAdminContactSettings();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);


  async function onSiteSettingsSubmit(data: SiteSettingsFormValues) {
    setIsSubmittingSettings(true);
    const result = await submitSiteSettings(data);
    if (result.success) {
      toast({ title: '¡Configuración Guardada!', description: result.message });
      // siteConfig.name = data.siteName; // This won't work as siteConfig is not reactive
      // siteConfig.description = data.siteDescription; // Update local config if necessary or re-fetch
      settingsForm.reset({ siteName: data.siteName, siteDescription: data.siteDescription });
    } else {
      toast({ title: 'Error', description: result.message || 'No se pudo guardar la configuración.', variant: 'destructive' });
    }
    setIsSubmittingSettings(false);
  }

  const handleAddNewServiceClick = () => {
    setEditingService(null);
    serviceForm.reset({
      name: '',
      description: '',
      price: 'ARS$ ',
    });
    setShowAddEditServiceForm(true);
  };

  const handleEditServiceClick = (service: Service) => {
    setEditingService(service);
    serviceForm.reset({
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
    });
    setShowAddEditServiceForm(true);
  };

  async function onServiceFormSubmit(data: ServiceFormValues) {
    setIsSubmittingService(true);
    let result;
    if (editingService && data.id) {
      result = await updateService(data);
    } else {
      result = await addService(data);
    }

    if (result.success && result.service) {
      toast({ title: editingService ? '¡Servicio Actualizado!' : '¡Servicio Añadido!', description: result.message });
      fetchAdminServices(); 
      serviceForm.reset({name: '', description: '', price: 'ARS$ '});
      setShowAddEditServiceForm(false);
      setEditingService(null);
    } else {
      toast({ title: 'Error', description: result.message || 'No se pudo guardar el servicio.', variant: 'destructive' });
    }
    setIsSubmittingService(false);
  }

  async function handleDeleteService(serviceId: string) {
    const result = await deleteService(serviceId);
    if (result.success) {
      toast({ title: '¡Servicio Eliminado!', description: result.message });
      setServices(prev => prev.filter(s => s.id !== serviceId));
    } else {
      toast({ title: 'Error', description: result.message || 'No se pudo eliminar el servicio.', variant: 'destructive' });
    }
  }

  async function handleTimeSlotToggle(time: string, isActive: boolean) {
    setIsUpdatingTimeSlot(time);
    const result = await updateTimeSlotSetting(time, isActive);
    if (result.success) {
      toast({ title: 'Horario Actualizado', description: `El horario ${time} ahora está ${isActive ? 'activo' : 'inactivo'}.` });
      setTimeSlotSettingsList(prev => 
        prev.map(slot => slot.time === time ? { ...slot, isActive } : slot)
      );
    } else {
      toast({ title: 'Error', description: result.message || 'No se pudo actualizar el horario.', variant: 'destructive' });
       fetchTimeSlotSettingsAdmin();
    }
    setIsUpdatingTimeSlot(null);
  }

  async function handleSaveTemplate(templateId: MessageTemplateId) {
    setIsSubmittingTemplate(templateId);
    let content = '';
    switch (templateId) {
      case 'confirmation': content = confirmationTemplate; break;
      case 'cancellation': content = cancellationTemplate; break;
      case 'adminContactCancellationRequest': content = adminContactCancellationTemplate; break;
      case 'adminContactQuery': content = adminContactQueryTemplate; break;
    }
    const result = await updateMessageTemplate(templateId, content);
    if (result.success) {
      toast({ title: 'Plantilla Guardada', description: result.message });
    } else {
      toast({ title: 'Error', description: result.message || 'No se pudo guardar la plantilla.', variant: 'destructive' });
    }
    setIsSubmittingTemplate(null);
  }

  async function handleSaveAdminPhoneNumber() {
    setIsSubmittingAdminPhone(true);
    // Basic validation for Argentinian numbers (can be improved)
    const cleanedPhone = adminPhoneNumber.replace(/\D/g, '');
    if (!cleanedPhone.startsWith('54') || cleanedPhone.length < 11 ) { // e.g. 54911... or 5411...
         toast({ title: 'Número Inválido', description: 'El formato debe ser Ej: 5491123456789 o 542211234567. Incluir código de país y área sin "+" ni espacios.', variant: 'destructive'});
         setIsSubmittingAdminPhone(false);
         return;
    }

    const result = await updateAdminPhoneNumber(adminPhoneNumber);
    if (result.success) {
      toast({ title: 'Número Guardado', description: result.message });
    } else {
      toast({ title: 'Error', description: result.message || 'No se pudo guardar el número.', variant: 'destructive' });
    }
    setIsSubmittingAdminPhone(false);
  }
  
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser || currentUser.email !== 'joacoadmin@admin.com') {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Redirigiendo...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <PageHeader
        title="Configuración del Sitio"
        description="Administra la configuración general, servicios, horarios y mensajes de tu aplicación."
        titleClassName="font-sans"
      />

      <div className="max-w-2xl mx-auto space-y-8">
        {/* General Site Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <SettingsIcon className="h-5 w-5 mr-2 text-primary" />
              Información General del Sitio
            </CardTitle>
            <CardDescription>
              Modifica el nombre y la descripción de tu sitio web. Estos cambios se reflejarán globalmente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...settingsForm}>
              <form onSubmit={settingsForm.handleSubmit(onSiteSettingsSubmit)} className="space-y-6">
                <FormField
                  control={settingsForm.control}
                  name="siteName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Sitio</FormLabel>
                      <FormControl><Input placeholder="Ej: JoacoBarber" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={settingsForm.control}
                  name="siteDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción del Sitio</FormLabel>
                      <FormControl><Textarea placeholder="Ej: La mejor barbería de la ciudad." className="resize-none" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmittingSettings}>
                    {isSubmittingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Admin Contact Configuration */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <PhoneIcon className="h-5 w-5 mr-2 text-primary" />
                    Contacto del Administrador (WhatsApp)
                </CardTitle>
                <CardDescription>
                    Configura el número de teléfono para que los clientes te contacten por WhatsApp.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoadingAdminPhone ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : (
                    <div>
                        <UiLabel htmlFor="adminPhoneNumber" className="text-base font-medium">Número de WhatsApp del Administrador</UiLabel>
                        <Input
                            id="adminPhoneNumber"
                            type="tel"
                            value={adminPhoneNumber}
                            onChange={(e) => setAdminPhoneNumber(e.target.value)}
                            placeholder="Ej: 5491123456789 (incluir código de país)"
                            className="mt-1"
                        />
                         <p className="text-xs text-muted-foreground mt-1">Incluir código de país y área sin el '+' ni espacios. Ej: 5491123456789</p>
                        <Button 
                            onClick={handleSaveAdminPhoneNumber} 
                            disabled={isSubmittingAdminPhone}
                            size="sm"
                            className="mt-3"
                        >
                            {isSubmittingAdminPhone && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Número
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>


        {/* Services Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Servicios</CardTitle>
            <CardDescription>Añade, edita o elimina los servicios ofrecidos. Estos servicios se mostrarán en la página de reservas.</CardDescription>
          </CardHeader>
          <CardContent>
            {!showAddEditServiceForm && (
              <Button onClick={handleAddNewServiceClick} className="mb-6 w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nuevo Servicio
              </Button>
            )}

            {showAddEditServiceForm && (
              <Card className="mb-6 bg-secondary/30 p-0">
                <CardHeader className="p-4">
                  <CardTitle className="font-sans text-lg">
                    {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <Form {...serviceForm}>
                    <form onSubmit={serviceForm.handleSubmit(onServiceFormSubmit)} className="space-y-4">
                      <FormField control={serviceForm.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Servicio</FormLabel>
                          <FormControl><Input placeholder="Ej: Corte Clásico" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={serviceForm.control} name="description" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl><Textarea placeholder="Describe el servicio..." {...field} rows={3} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={serviceForm.control} name="price" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio</FormLabel>
                          <FormControl><Input placeholder="ARS$ 1500" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => { setShowAddEditServiceForm(false); setEditingService(null); serviceForm.reset({name: '', description: '', price: 'ARS$ '}); }}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmittingService}>
                          {isSubmittingService && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {editingService ? 'Actualizar Servicio' : 'Añadir Servicio'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
            
            <h3 className="text-lg font-semibold mb-3 mt-4 text-foreground/90">Servicios Actuales</h3>
            {isLoadingServices ? (
              <div className="flex justify-center py-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : services.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground rounded-md border border-dashed p-8">
                <PackageSearch className="h-12 w-12 mx-auto mb-3 text-muted-foreground/70" />
                <p className="font-medium">No hay servicios configurados.</p>
                <p className="text-sm">Empieza añadiendo uno nuevo para que aparezcan en la página de reservas.</p>
              </div>
            ) : (
              <ScrollArea className={showAddEditServiceForm ? "max-h-[250px] overflow-y-auto border rounded-md p-1" : "max-h-[400px] overflow-y-auto border rounded-md p-1"}>
                <div className="space-y-3 p-3">
                  {services.map(service => (
                    <Card key={service.id} className="p-4 shadow-sm bg-card hover:bg-muted/20">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex-grow min-w-0 mb-2 sm:mb-0">
                                <p className="font-semibold text-card-foreground truncate" title={service.name}>{service.name}</p>
                                <p className="text-sm text-muted-foreground truncate" title={service.description}>{service.description}</p>
                                <p className="text-sm text-primary font-medium">{service.price}</p>
                            </div>
                            <div className="flex-shrink-0 space-x-2 flex">
                                <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-700 hover:bg-blue-500/10 px-2 py-1 h-auto" onClick={() => handleEditServiceClick(service)}>
                                <Edit3 className="h-4 w-4 mr-1 sm:mr-0" /> <span className="sm:hidden">Editar</span>
                                </Button> 
                                <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-red-700 hover:bg-red-500/10 px-2 py-1 h-auto">
                                    <Trash2 className="h-4 w-4 mr-1 sm:mr-0" /> <span className="sm:hidden">Eliminar</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                    <DialogTitle>Confirmar Eliminación</DialogTitle>
                                    <DialogDescription>
                                        ¿Estás seguro de que quieres eliminar el servicio "{service.name}"? Esta acción no se puede deshacer.
                                    </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter className="sm:justify-end">
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">Cancelar</Button>
                                    </DialogClose>
                                    <DialogClose asChild>
                                        <Button type="button" variant="destructive" onClick={() => handleDeleteService(service.id)}>Eliminar</Button>
                                    </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Business Hours Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-primary" />
                Horarios de Atención
            </CardTitle>
            <CardDescription>Define los horarios disponibles para agendar citas. Desactiva los horarios que no estarán disponibles.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTimeSlots ? (
              <div className="flex justify-center py-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : timeSlotSettingsList.length === 0 && ALL_TIME_SLOTS.length === 0 ? ( 
              <div className="text-center py-10 text-muted-foreground rounded-md border border-dashed p-8">
                <ClockIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/70" />
                <p className="font-medium">No hay horarios configurados en el sistema.</p>
                <p className="text-sm">Contacta a soporte si esto es un error.</p>
              </div>
            ) : timeSlotSettingsList.length === 0 && ALL_TIME_SLOTS.length > 0 ? ( 
                 <ScrollArea className="max-h-[400px] overflow-y-auto border rounded-md p-1">
                    <div className="space-y-1 p-3">
                      {ALL_TIME_SLOTS.map((slotTime) => (
                        <div key={slotTime} className="flex items-center justify-between p-3 rounded-md hover:bg-muted/30 transition-colors">
                          <UiLabel htmlFor={`timeslot-${slotTime.replace(/\s|:/g, '-')}`} className="text-base font-medium text-foreground cursor-pointer">
                            {slotTime}
                          </UiLabel>
                          <div className="flex items-center space-x-2">
                            {isUpdatingTimeSlot === slotTime ? (
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : (
                              <Switch
                                id={`timeslot-${slotTime.replace(/\s|:/g, '-')}`}
                                checked={true} 
                                onCheckedChange={(checked) => handleTimeSlotToggle(slotTime, checked)}
                                aria-label={`Activar o desactivar horario ${slotTime}`}
                              />
                            )}
                            <Check className="h-5 w-5 text-green-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                </ScrollArea>
            ) : (
              <ScrollArea className="max-h-[400px] overflow-y-auto border rounded-md p-1">
                <div className="space-y-1 p-3">
                  {timeSlotSettingsList.map((slotSetting) => (
                    <div key={slotSetting.time} className="flex items-center justify-between p-3 rounded-md hover:bg-muted/30 transition-colors">
                      <UiLabel htmlFor={`timeslot-${slotSetting.time.replace(/\s|:/g, '-')}`} className="text-base font-medium text-foreground cursor-pointer">
                        {slotSetting.time}
                      </UiLabel>
                      <div className="flex items-center space-x-2">
                        {isUpdatingTimeSlot === slotSetting.time ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                           <Switch
                            id={`timeslot-${slotSetting.time.replace(/\s|:/g, '-')}`}
                            checked={slotSetting.isActive}
                            onCheckedChange={(checked) => handleTimeSlotToggle(slotSetting.time, checked)}
                            aria-label={`Activar o desactivar horario ${slotSetting.time}`}
                          />
                        )}
                        {slotSetting.isActive ? 
                           <Check className="h-5 w-5 text-green-500" /> : 
                           <X className="h-5 w-5 text-destructive" />
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp Messages Configuration */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <MessageSquareIcon className="h-5 w-5 mr-2 text-primary" />
                    Plantillas de Mensajes de WhatsApp
                </CardTitle>
                <CardDescription>
                    Personaliza los mensajes para diferentes interacciones.
                    Utiliza los marcadores de posición disponibles para incluir detalles dinámicos.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {isLoadingTemplates ? (
                     <div className="flex justify-center py-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <UiLabel htmlFor="confirmationTemplate" className="text-base font-medium">Plantilla de Confirmación de Cita (Admin a Cliente)</UiLabel>
                            <Textarea
                                id="confirmationTemplate"
                                value={confirmationTemplate}
                                onChange={(e) => setConfirmationTemplate(e.target.value)}
                                placeholder="Escribe tu mensaje de confirmación aquí..."
                                rows={5}
                                className="text-sm"
                            />
                            <Button 
                                onClick={() => handleSaveTemplate('confirmation')} 
                                disabled={isSubmittingTemplate === 'confirmation'}
                                size="sm"
                                className="mt-2"
                            >
                                {isSubmittingTemplate === 'confirmation' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Confirmación (Admin)
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <UiLabel htmlFor="cancellationTemplate" className="text-base font-medium">Plantilla de Cancelación de Cita (Admin a Cliente)</UiLabel>
                            <Textarea
                                id="cancellationTemplate"
                                value={cancellationTemplate}
                                onChange={(e) => setCancellationTemplate(e.target.value)}
                                placeholder="Escribe tu mensaje de cancelación aquí..."
                                rows={5}
                                className="text-sm"
                            />
                            <Button 
                                onClick={() => handleSaveTemplate('cancellation')} 
                                disabled={isSubmittingTemplate === 'cancellation'}
                                size="sm"
                                className="mt-2"
                            >
                                {isSubmittingTemplate === 'cancellation' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Cancelación (Admin)
                            </Button>
                        </div>

                         <div className="space-y-2">
                            <UiLabel htmlFor="adminContactCancellationTemplate" className="text-base font-medium">Plantilla para "Solicitar Cancelación" (Cliente a Admin)</UiLabel>
                            <Textarea
                                id="adminContactCancellationTemplate"
                                value={adminContactCancellationTemplate}
                                onChange={(e) => setAdminContactCancellationTemplate(e.target.value)}
                                placeholder="Mensaje prellenado cuando el cliente quiere cancelar vía WhatsApp..."
                                rows={5}
                                className="text-sm"
                            />
                            <Button 
                                onClick={() => handleSaveTemplate('adminContactCancellationRequest')} 
                                disabled={isSubmittingTemplate === 'adminContactCancellationRequest'}
                                size="sm"
                                className="mt-2"
                            >
                                {isSubmittingTemplate === 'adminContactCancellationRequest' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Plantilla Cliente-Cancelación
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <UiLabel htmlFor="adminContactQueryTemplate" className="text-base font-medium">Plantilla para "Hacer Consulta" (Cliente a Admin)</UiLabel>
                            <Textarea
                                id="adminContactQueryTemplate"
                                value={adminContactQueryTemplate}
                                onChange={(e) => setAdminContactQueryTemplate(e.target.value)}
                                placeholder="Mensaje prellenado cuando el cliente tiene una consulta vía WhatsApp..."
                                rows={5}
                                className="text-sm"
                            />
                            <Button 
                                onClick={() => handleSaveTemplate('adminContactQuery')} 
                                disabled={isSubmittingTemplate === 'adminContactQuery'}
                                size="sm"
                                className="mt-2"
                            >
                                {isSubmittingTemplate === 'adminContactQuery' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Plantilla Cliente-Consulta
                            </Button>
                        </div>
                    </>
                )}
                 <Card className="mt-4 bg-secondary/30">
                    <CardHeader className="pb-2 pt-3">
                        <CardTitle className="text-sm font-medium flex items-center">
                            <InfoIcon className="h-4 w-4 mr-2 text-primary" />
                            Marcadores de Posición Disponibles
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-3">
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                            {availablePlaceholders.map(ph => <li key={ph}><code>{ph}</code></li>)}
                        </ul>
                         <p className="text-xs text-muted-foreground mt-2">Para la plantilla "Hacer Consulta", el cliente deberá añadir manualmente su pregunta donde dice `[ESCRIBE TU CONSULTA AQUÍ]`.</p>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
    
