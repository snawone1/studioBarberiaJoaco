
'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { getProducts } from '@/app/actions'; 
import { Loader2, PackageSearch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Update Product type to expect createdAt as a string (ISO string) and include stock
export type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  imageSrc: string; // Will always be a valid URL or placeholder from actions.ts
  aiHint: string;
  stock?: number;
  createdAt?: string; 
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()));
      } catch (err) {
        setError('Failed to load products. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <PageHeader
        title="Nuestros Productos"
        description="Descubre nuestra selección de productos premium para el cuidado del cabello y la barba."
      />
      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Cargando productos...</p>
        </div>
      )}
      {error && (
        <div className="text-center py-10">
          <p className="text-destructive text-lg">{error}</p>
        </div>
      )}
      {!isLoading && !error && products.length === 0 && (
        <div className="text-center py-20">
          <PackageSearch className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-xl">No hay productos disponibles en este momento.</p>
          <p className="text-muted-foreground text-sm">Vuelve a consultar más tarde o añade productos desde el panel de administración.</p>
        </div>
      )}
      {!isLoading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <Card key={product.id} className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow">
              <div className="relative aspect-square w-full">
                <Image
                  src={product.imageSrc}
                  alt={product.name}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint={product.aiHint}
                />
                 {typeof product.stock === 'number' && product.stock === 0 && (
                  <Badge variant="destructive" className="absolute top-2 right-2">Agotado</Badge>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-xl font-headline">{product.name}</CardTitle>
                <CardDescription className="text-sm h-16 overflow-hidden text-ellipsis">{product.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-lg font-semibold text-primary">{product.price}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                {typeof product.stock === 'number' && product.stock > 0 && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Stock: {product.stock}
                  </p>
                )}
                 {typeof product.stock === 'number' && product.stock === 0 && (
                  <p className="text-sm text-destructive">
                    Agotado
                  </p>
                )}
                 {typeof product.stock !== 'number' && (
                  <p className="text-sm text-muted-foreground">
                    Stock no disponible
                  </p>
                )}
                {/* Future: Add to cart button 
                <Button className="w-full">Añadir al Carrito</Button>
                */}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
