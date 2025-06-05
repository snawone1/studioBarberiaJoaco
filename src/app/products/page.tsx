
'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { getProducts } from '@/app/actions'; // Importar la acción
import { Loader2 } from 'lucide-react';

// Update Product type to expect createdAt as a string (ISO string)
export type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  imageSrc: string;
  aiHint: string;
  createdAt?: string; // Changed from Timestamp to string, optional if not always present
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
        setProducts(fetchedProducts);
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
        <div className="text-center py-10">
          <p className="text-muted-foreground text-lg">No hay productos disponibles en este momento.</p>
        </div>
      )}
      {!isLoading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <Card key={product.id} className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow">
              <div className="relative aspect-square w-full">
                <Image
                  src={product.imageSrc || 'https://placehold.co/400x400.png'} // Fallback si imageSrc está vacío
                  alt={product.name}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint={product.aiHint}
                />
              </div>
              <CardHeader>
                <CardTitle className="text-xl font-headline">{product.name}</CardTitle>
                <CardDescription className="text-sm h-16 overflow-hidden">{product.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-lg font-semibold text-primary">{product.price}</p>
              </CardContent>
              {/* Future: Add to cart button 
              <CardFooter>
                <Button className="w-full">Añadir al Carrito</Button>
              </CardFooter>
              */}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
