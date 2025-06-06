
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from 'date-fns/locale'; // Import Spanish locale for date-fns

import { PageHeader } from '@/components/page-header';
import { submitAppointmentRequest } from '@/app/actions';
import { type AppointmentFormValues, appointmentSchema } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { useAuth } from '@/context/AuthContext'; // Import useAuth

const availableServices = [
  { id: 'classic-cut', label: 'Corte de Pelo Clásico' },
  { id: 'modern-style', label: 'Corte Moderno + Styling' },
  { id: 'classic-shave', label: 'Afeitado Clásico' },
  { id: 'beard-trim', label: 'Perfilado de Barba' },
  { id: 'coloring', label: 'Coloración' },
];

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", 
  "05:00 PM", "06:00 PM", "07:00 PM"
];

export default function BookAppointmentPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth(); // Get current user
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      userId: '', // Will be set before submitting
      services: [],
      preferredDate: undefined,
      preferredTime: '',
      message: '',
    },
  });

  async function onSubmit(data: AppointmentFormValues) {
    if (!currentUser) {
      toast({
        title: 'Error de Autenticación',
        description: 'Debes iniciar sesión para solicitar una cita.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const dataWithUser: AppointmentFormValues = {
      ...data,
      userId: currentUser.uid,
    };

    const result = await submitAppointmentRequest(dataWithUser);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: '¡Éxito!',
        description: result.message,
      });
      form.reset({ 
        userId: '', // Reset userId as well
        services: [], 
        preferredDate: undefined, 
        preferredTime: '', 
        message: '' 
      });
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="preferredDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Preferida</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setDate(new Date().getDate() -1)) || date < new Date("1900-01-01")
                          }
                          initialFocus
                          locale={es} // Add locale to calendar
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
                    <FormLabel>Hora Preferida</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un horario" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map(slot => (
                          <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="services"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Servicios</FormLabel>
                    <FormDescription>
                      Selecciona el/los servicio(s) que te interesan.
                    </FormDescription>
                  </div>
                  {availableServices.map((service) => (
                    <FormField
                      key={service.id}
                      control={form.control}
                      name="services"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={service.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
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
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {service.label}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensaje Adicional (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="¿Alguna petición específica o nota?"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading || !currentUser}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentUser ? 'Solicitar Cita' : 'Inicia sesión para reservar'}
            </Button>
            {!currentUser && (
                 <p className="text-sm text-center text-muted-foreground">
                    Debes <a href="/login" className="underline text-primary">iniciar sesión</a> o <a href="/register" className="underline text-primary">registrarte</a> para solicitar una cita.
                 </p>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
