
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { siteSettingsSchema, type SiteSettingsFormValues, productSchema, type ProductFormValues } from '@/lib/schemas';
import { submitSiteSettings, getProducts, addProduct, deleteProduct, updateProduct, getAppointments, type Appointment } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { siteConfig } from '@/config/site';
import { ShieldAlert, Settings, Users, CalendarCheck, Package, PlusCircle, Trash2, Loader2, Edit3, XCircle, PackageSearch, CalendarDays } from 'lucide-react';
import type { Product } from '@/app/products/page';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);

  const [isProductManagerOpen, setIsProductManagerOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [showAddEditProductForm, setShowAddEditProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isAppointmentManagerOpen, setIsAppointmentManagerOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

  const settingsForm = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      siteName: siteConfig.name,
      siteDescription: siteConfig.description,
    },
  });

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

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login?redirect=/admin');
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    if (isSettingsDialogOpen) {
      settingsForm.reset({
        siteName: siteConfig.name,
        siteDescription: siteConfig.description,
      });
    }
  }, [isSettingsDialogOpen, settingsForm]);
  
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

  async function fetchAppointmentsAdmin() {
    if (isAppointmentManagerOpen) {
      setIsLoadingAppointments(true);
      try {
        const fetchedAppointments = await getAppointments();
        setAppointments(fetchedAppointments); // Already sorted by action
      } catch (error) {
        toast({ title: 'Error', description: 'No se pudieron cargar las citas.', variant: 'destructive' });
      } finally {
        setIsLoadingAppointments(false);
      }
    }
  }

  useEffect(() => {
    fetchAppointmentsAdmin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAppointmentManagerOpen]);


  async function onSiteSettingsSubmit(data: SiteSettingsFormValues) {
    setIsSubmittingSettings(true);
    const result = await submitSiteSettings(data);
    if (result.success) {
      toast({ title: '¡Configuración Guardada!', description: result.message });
      setIsSettingsDialogOpen(false);
    } else {
      toast({ title: 'Error', description: result.message || 'No se pudo guardar la configuración.', variant: 'destructive' });
    }
    setIsSubmittingSettings(false);
  }

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
      if (editingProduct) {
        setProducts(prev => prev.map(p => p.id === result.product!.id ? result.product! : p).sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        }));
      } else {
        setProducts(prev => [...prev, result.product!].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        }));
      }
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
    switch (status.toLowerCase()) {
      case 'pending':
        return 'default'; // Primary color for pending
      case 'confirmed':
        return 'secondary'; // Or another distinct color like a green, if you add one
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };


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
          <DialogContent className="sm:max-w-2xl max-h-[calc(100vh-8rem)] flex flex-col">
            <DialogHeader>
              <DialogTitle className="font-sans">Gestionar Citas</DialogTitle>
              <DialogDescription>
                Visualiza las citas solicitadas. Próximamente: confirmar, cancelar.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow overflow-y-auto p-1 pr-2 -mr-1">
              {isLoadingAppointments ? (
                <div className="flex justify-center py-8"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <CalendarCheck className="h-12 w-12 mx-auto mb-2" />
                  <p>No hay citas para mostrar.</p>
                </div>
              ) : (
                <div className="space-y-4 p-2">
                  {appointments.map((appt) => (
                    <Card key={appt.id} className="shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg font-sans">
                              {format(new Date(appt.preferredDate), "PPP", { locale: es })} - {appt.preferredTime}
                            </CardTitle>
                            <CardDescription className="text-xs">ID Usuario: {appt.userId}</CardDescription>
                          </div>
                          <Badge variant={getStatusVariant(appt.status)} className="capitalize">{appt.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3 space-y-1 text-sm">
                        <div>
                          <span className="font-semibold">Servicios: </span>
                          {appt.services.join(', ')}
                        </div>
                        {appt.message && (
                          <div>
                            <span className="font-semibold">Mensaje: </span>
                            {appt.message}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground pt-1">
                          Solicitada: {format(new Date(appt.createdAt), "Pp", { locale: es })}
                        </div>
                      </CardContent>
                      {/* Future: Add actions like confirm/cancel here */}
                      {/* <CardFooter className="pt-3">
                        <Button size="sm" variant="outline" className="mr-2">Confirmar</Button>
                        <Button size="sm" variant="destructive">Cancelar Cita</Button>
                      </CardFooter> */}
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


        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium font-sans">
              Gestión de Usuarios
            </CardTitle>
            <Users className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Supervisa las cuentas y roles de los usuarios. (Funcionalidad futura)
            </p>
          </CardContent>
        </Card>
        
        <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
          <DialogTrigger asChild>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
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
                <FormField control={settingsForm.control} name="siteName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Sitio</FormLabel>
                      <FormControl><Input placeholder="Ej: JoacoBarber" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={settingsForm.control} name="siteDescription" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción del Sitio</FormLabel>
                      <FormControl><Textarea placeholder="Ej: La mejor barbería de la ciudad." className="resize-none" {...field} /></FormControl>
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

        {/* Product Manager Dialog & Trigger */}
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
                                  <DialogDescription>
                                    ¿Estás seguro de que quieres eliminar el producto "{product.name}"? Esta acción no se puede deshacer.
                                  </DialogDescription>
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
    </div>
  );
}
