
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  imageSrc: string;
  aiHint: string;
};

export const productsData: Product[] = [
  {
    id: 'pomade-strong',
    name: 'Pomada Fijación Fuerte',
    description: 'Controla tu cabello todo el día con nuestra pomada de alta fijación y acabado mate.',
    price: 'ARS$ 2800',
    imageSrc: 'https://placehold.co/400x400.png',
    aiHint: 'hair pomade product'
  },
  {
    id: 'beard-oil',
    name: 'Aceite para Barba Premium',
    description: 'Nutre e hidrata tu barba con nuestra mezcla de aceites esenciales. Aroma varonil y sofisticado.',
    price: 'ARS$ 2500',
    imageSrc: 'https://placehold.co/400x400.png',
    aiHint: 'beard oil bottle'
  },
  {
    id: 'after-shave-balm',
    name: 'Bálsamo After Shave Calmante',
    description: 'Alivia la irritación post-afeitado y deja tu piel suave y fresca. Sin alcohol.',
    price: 'ARS$ 2200',
    imageSrc: 'https://placehold.co/400x400.png',
    aiHint: 'after shave product'
  },
   {
    id: 'shampoo-invigorating',
    name: 'Shampoo Vigorizante',
    description: 'Limpieza profunda que revitaliza el cuero cabelludo y fortalece el cabello.',
    price: 'ARS$ 2000',
    imageSrc: 'https://placehold.co/400x400.png',
    aiHint: 'shampoo bottle modern'
  },
];

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <PageHeader
        title="Nuestros Productos"
        description="Descubre nuestra selección de productos premium para el cuidado del cabello y la barba."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {productsData.map((product) => (
          <Card key={product.id} className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow">
            <div className="relative aspect-square w-full">
              <Image
                src={product.imageSrc}
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
    </div>
  );
}
