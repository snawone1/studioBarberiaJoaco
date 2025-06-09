
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { siteSettingsSchema, type SiteSettingsFormValues } from '@/lib/schemas';
import { submitSiteSettings } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { siteConfig } from '@/config/site';
import { Loader2, SettingsIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);

  const settingsForm = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      siteName: siteConfig.name,
      siteDescription: siteConfig.description,
    },
  });

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login?redirect=/admin/settings');
    } else if (!authLoading && currentUser && currentUser.email !== 'joacoadmin@admin.com') {
      router.push('/admin'); // Or a generic "access denied" page
      toast({
        title: 'Acceso Denegado',
        description: 'No tienes permiso para acceder a esta página.',
        variant: 'destructive',
      });
    }
  }, [currentUser, authLoading, router, toast]);

  // Reset form if siteConfig values (name or description) change.
  // This ensures the form reflects the latest saved values after HMR.
  useEffect(() => {
    settingsForm.reset({
      siteName: siteConfig.name,
      siteDescription: siteConfig.description,
    });
  }, [siteConfig.name, siteConfig.description, settingsForm]);


  async function onSiteSettingsSubmit(data: SiteSettingsFormValues) {
    setIsSubmittingSettings(true);
    const result = await submitSiteSettings(data);
    if (result.success) {
      toast({ title: '¡Configuración Guardada!', description: result.message });
      // After successful submission, siteConfig.ts will be updated by the AI.
      // The useEffect above will then pick up these changes upon HMR and reset the form.
    } else {
      toast({ title: 'Error', description: result.message || 'No se pudo guardar la configuración.', variant: 'destructive' });
    }
    setIsSubmittingSettings(false);
  }
  
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser || currentUser.email !== 'joacoadmin@admin.com') {
    // This case should be handled by the useEffect redirect, but good for safety
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

        {/* Placeholder for Services Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Servicios</CardTitle>
            <CardDescription>Añade, edita o elimina los servicios ofrecidos.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Próximamente: Configuración de servicios aquí.</p>
          </CardContent>
        </Card>

        {/* Placeholder for Business Hours Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Horarios de Atención</CardTitle>
            <CardDescription>Define los horarios disponibles para agendar citas.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Próximamente: Configuración de horarios aquí.</p>
          </CardContent>
        </Card>

        {/* Placeholder for WhatsApp Messages Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Mensajes de WhatsApp</CardTitle>
            <CardDescription>Personaliza los mensajes de confirmación y cancelación.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Próximamente: Configuración de plantillas de mensajes aquí.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
