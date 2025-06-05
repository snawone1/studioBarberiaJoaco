
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { siteSettingsSchema, type SiteSettingsFormValues, productSchema, type ProductFormValues } from '@/lib/schemas';
import { submitSiteSettings, getProducts, addProduct, deleteProduct } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { siteConfig } from '@/config/site';
import { ShieldAlert, Settings, Users, CalendarCheck, Package, PlusCircle, Trash2, Loader2, Edit3, XCircle } from 'lucide-react';
import type { Product } from '@/app/products/page';

export default function AdminPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Site Settings State
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);

  // Product Management State
  const [isProductManagerOpen, setIsProductManagerOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [showAddProductForm, setShowAddProductForm] = useState(false);

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
      imageSrc: '',
      aiHint: '',
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
        setProducts(fetchedProducts);
      } catch (error) {
        toast({ title: 'Error', description: 'No se pudieron cargar los productos.', variant: 'destructive' });
      } finally {
        setIsLoadingProducts(false);
      }
    }
  }

  useEffect(() => {
    fetchProductsAdmin();
  }, [isProductManagerOpen]);


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

  async function onAddProductSubmit(data: ProductFormValues) {
    setIsSubmittingProduct(true);
    const result = await addProduct(data);
    if (result.success && result.product) {
      toast({ title: '¡Producto Añadido!', description: result.message });
      setProducts(prev => [...prev, result.product!]);
      productForm.reset();
      setShowAddProductForm(false);
    } else {
      toast({ title: 'Error', description: result.message || 'No se pudo añadir el producto.', variant: 'destructive' });
    }
    setIsSubmittingProduct(false);
  }

  async function handleDeleteProduct(productId: string) {
    // Optional: Add a confirmation dialog here
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
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium font-sans">
              Gestionar Citas
            </CardTitle>
            <CalendarCheck className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Visualiza, confirma o reprograma las citas de los clientes. (Funcionalidad futura)
            </p>
          </CardContent>
        </Card>
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
        
        {/* Site Settings Card & Dialog */}
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

        {/* Product Management Card & Dialog */}
        <Dialog open={isProductManagerOpen} onOpenChange={setIsProductManagerOpen}>
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
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-sans">Gestionar Productos</DialogTitle>
              <DialogDescription>
                Visualiza, añade o elimina productos de tu inventario. Los cambios son simulados.
              </DialogDescription>
            </DialogHeader>

            {!showAddProductForm && (
              <Button onClick={() => { productForm.reset(); setShowAddProductForm(true); }} className="mb-4">
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Producto Nuevo
              </Button>
            )}

            {showAddProductForm && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="font-sans text-lg">Nuevo Producto</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...productForm}>
                    <form onSubmit={productForm.handleSubmit(onAddProductSubmit)} className="space-y-4">
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
                      <FormField control={productForm.control} name="price" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio</FormLabel>
                          <FormControl><Input placeholder="ARS$ 1500" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
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
                        <Button type="button" variant="outline" onClick={() => setShowAddProductForm(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmittingProduct}>
                          {isSubmittingProduct && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Añadir Producto
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
            
            <h3 className="text-lg font-semibold mb-2 font-sans">Productos Actuales</h3>
            {isLoadingProducts ? (
              <div className="flex justify-center py-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : products.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay productos para mostrar.</p>
            ) : (
              <ScrollArea className="h-[300px] border rounded-md">
                <div className="p-4 space-y-3">
                  {products.map(product => (
                    <Card key={product.id} className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.price}</p>
                        </div>
                        <div className="space-x-2">
                           {/* <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600">
                            <Edit3 className="h-4 w-4" />
                          </Button>  */}
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)} className="h-8 w-8 text-destructive hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}

            <DialogFooter className="mt-6">
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
