
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
import { cn } from "@/lib/utils"
import { CalendarIcon, Loader2, Clock, ListChecks } from "lucide-react"
import { format } from "date-fns"
import { es } from 'date-fns/locale'; 
import Link from 'next/link';

import { PageHeader } from '@/components/page-header';
import { submitAppointmentRequest, getBookedSlotsForDate, getServices, type Service, getTimeSlotSettings, type TimeSlotSetting } from '@/app/actions';
import { type ClientAppointmentFormValues, clientAppointmentSchema, type AppointmentFormValues } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ALL_TIME_SLOTS } from '@/lib/constants';


const MIN_ADVANCE_BOOKING_MINUTES = 15;
const now = new Date(); 

export default function BookAppointmentPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth(); 
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = React.useState<string | undefined>(undefined);
  const [bookedSlots, setBookedSlots] = React.useState<string[]>([]);
  const [isLoadingBookedSlots, setIsLoadingBookedSlots] = React.useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [dynamicServices, setDynamicServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  const [activeTimeSlots, setActiveTimeSlots] = useState<TimeSlotSetting[]>([]);
  const [isLoadingSlotSettings, setIsLoadingSlotSettings] = useState(true);


  const form = useForm<ClientAppointmentFormValues>({
    resolver: zodResolver(clientAppointmentSchema),
    defaultValues: {
      services: [],
      preferredDate: undefined,
      preferredTime: '',
      message: '',
    },
  });

  useEffect(() => {
    async function fetchPageServices() {
      setIsLoadingServices(true);
      try {
        const fetchedServices = await getServices();
        setDynamicServices(fetchedServices);
      } catch (error) {
        console.error("Error fetching services for booking page:", error);
        toast({ title: 'Error', description: 'No se pudieron cargar los servicios disponibles.', variant: 'destructive' });
      } finally {
        setIsLoadingServices(false);
      }
    }

    async function fetchSlotSettings() {
      setIsLoadingSlotSettings(true);
      try {
        const settings = await getTimeSlotSettings();
        setActiveTimeSlots(settings);
      } catch (error) {
        console.error("Error fetching time slot settings from book/page:", error);
        toast({ title: 'Error', description: 'No se pudieron cargar las configuraciones de horarios.', variant: 'destructive' });
      } finally {
        setIsLoadingSlotSettings(false);
      }
    }

    fetchPageServices();
    fetchSlotSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Changed dependency from [toast] to [] to run once on mount


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
  }, [watchedDate, form, toast]);


  async function onSubmit(data: ClientAppointmentFormValues) {
    console.log("Submitting appointment with payload:", data);
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
          })
          .catch(fetchError => {
            console.error("Error re-fetching booked slots after submission:", fetchError);
          })
          .finally(() => {
            setIsLoadingBookedSlots(false);
          });
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
  
  return (
    <div className="container mx-auto px-4 py-12">
      <PageHeader
        title="Reservar Tu Cita"
        description="Completa el siguiente formulario para solicitar una cita. Nos pondremos en contacto contigo pronto para confirmar."
      />
      <div className="max-w-2xl mx-auto">
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
                        {ALL_TIME_SLOTS.map((slot) => {
                            const isToday = format(watchedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
                            let slotIsTooSoonOrPast = false;

                            if (isToday) {
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
                            const slotSetting = activeTimeSlots.find(s => s.time === slot);
                            const isSlotActive = slotSetting ? slotSetting.isActive : true;
                            const isDisabled = isSlotBooked || slotIsTooSoonOrPast || !isSlotActive;

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
                        {ALL_TIME_SLOTS.filter(slot => {
                            const isToday = format(watchedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
                            let slotIsTooSoonOrPast = false;
                            if (isToday) {
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
                            const slotSetting = activeTimeSlots.find(s => s.time === slot);
                            const isSlotActive = slotSetting ? slotSetting.isActive : true;
                            return !bookedSlots.includes(slot) && !slotIsTooSoonOrPast && isSlotActive;
                        }).length === 0 && (
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
                  ) : dynamicServices.length === 0 ? (
                     <p className="text-sm text-muted-foreground text-center py-4">
                        No hay servicios disponibles en este momento.
                     </p>
                  ) : (
                    <div className="space-y-2">
                      {dynamicServices.map((service) => (
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
                disabled={isLoading || !currentUser || isLoadingBookedSlots || isLoadingServices || isLoadingSlotSettings}
              >
              <Loader2 
                className={cn(
                  "mr-2 h-5 w-5 animate-spin",
                  (isLoading || isLoadingBookedSlots || isLoadingServices || isLoadingSlotSettings) ? "inline-block" : "hidden"
                )} 
              />
              {isLoading || isLoadingBookedSlots || isLoadingServices || isLoadingSlotSettings ? (
                'Procesando...'
              ) : (
                currentUser ? 'Solicitar Cita' : 'Inicia sesión para reservar'
              )}
            </Button>
            {!currentUser && (
                 <p className="text-sm text-center text-muted-foreground">
                    Debes <Link href="/login" className="underline text-primary hover:text-primary/80">iniciar sesión</Link> o <Link href="/register" className="underline text-primary hover:text-primary/80">registrarte</Link> para solicitar una cita.
                 </p>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}

