
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { siteSettingsSchema, type SiteSettingsFormValues } from '@/lib/schemas';
import { submitSiteSettings } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { siteConfig } from '@/config/site';
import { ShieldAlert, Settings, Users, CalendarCheck, Loader2 } from 'lucide-react';

export default function AdminPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);

  const settingsForm = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      siteName: siteConfig.name,
      siteDescription: siteConfig.description,
    },
  });

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login?redirect=/admin');
    }
  }, [currentUser, loading, router]);

  async function onSiteSettingsSubmit(data: SiteSettingsFormValues) {
    setIsSubmittingSettings(true);
    const result = await submitSiteSettings(data);
    if (result.success) {
      toast({
        title: '¡Configuración Guardada!',
        description: result.message,
      });
      // In a real app, you might want to update siteConfig or trigger a re-fetch
      // For now, we can update the form defaults if the dialog is kept open
      // or simply close the dialog.
      // settingsForm.reset(data); // Optionally reset form to new values
      setIsSettingsDialogOpen(false); // Close dialog on success
    } else {
      toast({
        title: 'Error',
        description: result.message || 'No se pudo guardar la configuración.',
        variant: 'destructive',
      });
    }
    setIsSubmittingSettings(false);
  }
  
  useEffect(() => {
    // Reset form to current siteConfig values when dialog opens
    if (isSettingsDialogOpen) {
      settingsForm.reset({
        siteName: siteConfig.name,
        siteDescription: siteConfig.description,
      });
    }
  }, [isSettingsDialogOpen, settingsForm]);


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

  return (
    <div className="container mx-auto px-4 py-12">
      <PageHeader
        title="Admin Panel"
        description="Manage your application settings, content, and operations."
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
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium font-sans">
              Manage Appointments
            </CardTitle>
            <CalendarCheck className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View, confirm, or reschedule client appointments.
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium font-sans">
              User Management
            </CardTitle>
            <Users className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Oversee user accounts and roles.
            </p>
          </CardContent>
        </Card>
        <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
          <DialogTrigger asChild>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium font-sans">
                  Site Settings
                </CardTitle>
                <Settings className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Configure global site settings and preferences.
                </p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-sans">Configuración del Sitio</DialogTitle>
              <DialogDescription>
                Modifica el nombre y la descripción de tu sitio web. Estos cambios (simulados) se aplicarían globalmente.
              </DialogDescription>
            </DialogHeader>
            <Form {...settingsForm}>
              <form onSubmit={settingsForm.handleSubmit(onSiteSettingsSubmit)} className="space-y-4 py-4">
                <FormField
                  control={settingsForm.control}
                  name="siteName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Sitio</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: JoacoBarber" {...field} />
                      </FormControl>
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
                      <FormControl>
                        <Textarea
                          placeholder="Ej: La mejor barbería de la ciudad."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                     <Button type="button" variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmittingSettings}>
                    {isSubmittingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
