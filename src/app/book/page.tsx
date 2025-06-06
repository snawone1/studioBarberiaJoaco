
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
import { CalendarIcon, Loader2, Clock } from "lucide-react"
import { format } from "date-fns"
import { es } from 'date-fns/locale'; 
import Link from 'next/link';

import { PageHeader } from '@/components/page-header';
import { submitAppointmentRequest, getBookedSlotsForDate } from '@/app/actions';
import { type ClientAppointmentFormValues, clientAppointmentSchema, type AppointmentFormValues } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const availableServices = [
  { id: 'classic-cut', label: 'Corte de Pelo Clásico' },
  { id: 'modern-style', label: 'Corte Moderno + Styling' },
  { id: 'classic-shave', label: 'Afeitado Clásico' },
  { id: 'beard-trim', label: 'Perfilado de Barba' },
  { id: 'coloring', label: 'Coloración' },
];

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", 
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", 
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM"
];

const MIN_ADVANCE_BOOKING_MINUTES = 15;

export default function BookAppointmentPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth(); 
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = React.useState<string | undefined>(undefined);
  const [bookedSlots, setBookedSlots] = React.useState<string[]>([]);
  const [isLoadingBookedSlots, setIsLoadingBookedSlots] = React.useState(false);

  const form = useForm<ClientAppointmentFormValues>({
    resolver: zodResolver(clientAppointmentSchema),
    defaultValues: {
      services: [],
      preferredDate: undefined,
      preferredTime: '',
      message: '',
    },
  });

  const watchedDate = form.watch('preferredDate');
  const formattedSelectedDate = watchedDate 
    ? format(watchedDate, "'Para el' EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) 
    : "Selecciona una fecha primero";

  useEffect(() => {
    if (watchedDate) {
      const fetchBookedSlots = async () => {
        setIsLoadingBookedSlots(true);
        setBookedSlots([]); 
        try {
          const slots = await getBookedSlotsForDate(watchedDate);
          setBookedSlots(slots);
        } catch (error) {
          console.error("Error fetching booked slots:", error);
          toast({ title: 'Error', description: 'No se pudieron cargar los horarios ocupados.', variant: 'destructive' });
        } finally {
          setIsLoadingBookedSlots(false);
        }
      };
      fetchBookedSlots();
    } else {
      setBookedSlots([]); 
      setIsLoadingBookedSlots(false);
    }
  }, [watchedDate, toast]);


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
    
    const payloadForServer: AppointmentFormValues = {
      ...data,
      userId: currentUser.uid,
    };

    const result = await submitAppointmentRequest(payloadForServer);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: '¡Éxito!',
        description: result.message,
      });
      form.reset({ 
        services: [], 
        preferredDate: undefined, 
        preferredTime: '', 
        message: '' 
      });
      setSelectedTimeSlot(undefined);
      if (watchedDate) {
        setIsLoadingBookedSlots(true);
        getBookedSlotsForDate(watchedDate)
          .then(setBookedSlots)
          .catch(console.error)
          .finally(() => setIsLoadingBookedSlots(false));
      }
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }
  }

  const now = new Date(); 

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
                  <Popover>
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
                          form.setValue('preferredTime', ''); 
                          setSelectedTimeSlot(undefined);
                          
                          if (selectedTimeSlot && date) {
                            const isSelectedDateToday = format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
                            if (isSelectedDateToday) {
                                const timeParts = selectedTimeSlot.split(' ');
                                const timeDigits = timeParts[0].split(':');
                                let hours = parseInt(timeDigits[0]);
                                const minutes = parseInt(timeDigits[1]);
                                const period = timeParts[1].toUpperCase();

                                if (period === 'PM' && hours !== 12) hours += 12;
                                else if (period === 'AM' && hours === 12) hours = 0; 
                                
                                const slotStartDateTime = new Date(date);
                                slotStartDateTime.setHours(hours, minutes, 0, 0);
                                
                                const cutoffTime = new Date(now.getTime() + MIN_ADVANCE_BOOKING_MINUTES * 60 * 1000);

                                if (slotStartDateTime <= cutoffTime) {
                                  // This part is handled by the general bookedSlots and time validation logic
                                }
                            }
                          } else if (!date) {
                             form.setValue('preferredTime', '');
                             setSelectedTimeSlot(undefined);
                             setBookedSlots([]);
                          }
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
                  {!watchedDate && (
                    <p className="text-sm text-muted-foreground py-4 text-center">Por favor, selecciona una fecha para ver los horarios.</p>
                  )}
                  {watchedDate && isLoadingBookedSlots && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">Cargando horarios...</span>
                    </div>
                  )}
                  {watchedDate && !isLoadingBookedSlots && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {timeSlots.map((slot) => {
                        const isToday = watchedDate && format(watchedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
                        let isDisabledByTime = false;

                        if (isToday && watchedDate) {
                          const timeParts = slot.split(' ');
                          const timeDigits = timeParts[0].split(':');
                          let slotHours = parseInt(timeDigits[0]);
                          const slotMinutes = parseInt(timeDigits[1]);
                          const period = timeParts[1].toUpperCase();

                          if (period === 'PM' && slotHours !== 12) slotHours += 12;
                          else if (period === 'AM' && slotHours === 12) slotHours = 0; 

                          const slotStartDateTime = new Date(watchedDate);
                          slotStartDateTime.setHours(slotHours, slotMinutes, 0, 0);
                          
                          const cutoffTime = new Date(now.getTime() + MIN_ADVANCE_BOOKING_MINUTES * 60 * 1000);

                          if (slotStartDateTime <= cutoffTime) {
                            isDisabledByTime = true;
                          }
                        }
                        
                        const isBooked = bookedSlots.includes(slot);
                        const isDisabled = isDisabledByTime || isBooked;
                        
                        return (
                          <Button
                            key={slot}
                            type="button"
                            variant={selectedTimeSlot === slot && !isDisabled ? "default" : "outline"}
                            className={cn(
                              "w-full py-3 text-sm",
                              selectedTimeSlot === slot && !isDisabled
                                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                                : "text-foreground hover:bg-muted",
                              isDisabled && "opacity-50 cursor-not-allowed hover:bg-muted text-muted-foreground line-through"
                            )}
                            onClick={() => {
                              if (!isDisabled) {
                                setSelectedTimeSlot(slot);
                                field.onChange(slot);
                              }
                            }}
                            disabled={isDisabled}
                            title={isBooked ? "Horario no disponible" : isDisabledByTime ? "Horario no disponible (muy pronto)" : ""}
                          >
                            {slot}
                          </Button>
                        );
                      })}
                    </div>
                  )}
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
                    <FormLabel className="text-lg font-semibold">Servicios</FormLabel>
                    <FormDescription className="text-sm">
                      Selecciona el/los servicio(s) que te interesan.
                    </FormDescription>
                  </div>
                  <div className="space-y-2">
                    {availableServices.map((service) => (
                      <FormField
                        key={service.id}
                        control={form.control}
                        name="services"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={service.id}
                              className="flex flex-row items-center space-x-3 space-y-0 p-2 rounded-md hover:bg-muted transition-colors"
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
                              <FormLabel className="font-normal text-base cursor-pointer">
                                {service.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
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
            <Button type="submit" className="w-full py-6 text-lg" disabled={isLoading || !currentUser || isLoadingBookedSlots}>
              {(isLoading || isLoadingBookedSlots) && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {currentUser ? 'Solicitar Cita' : 'Inicia sesión para reservar'}
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
