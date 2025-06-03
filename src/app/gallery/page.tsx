import Image from 'next/image';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from '@/components/ui/card';

type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  category: 'interior' | 'barbers' | 'hairstyles';
  aiHint: string;
};

const galleryImages: GalleryImage[] = [
  { id: 'int1', src: 'https://placehold.co/600x400.png', alt: 'Barbershop Interior 1', category: 'interior', aiHint: 'barbershop interior elegant' },
  { id: 'int2', src: 'https://placehold.co/600x450.png', alt: 'Barbershop Interior 2', category: 'interior', aiHint: 'barber chairs luxury' },
  { id: 'int3', src: 'https://placehold.co/650x400.png', alt: 'Barbershop Detail', category: 'interior', aiHint: 'grooming products shelf' },
  { id: 'bar1', src: 'https://placehold.co/400x500.png', alt: 'Barber Joaco', category: 'barbers', aiHint: 'barber portrait smiling' },
  { id: 'bar2', src: 'https://placehold.co/400x550.png', alt: 'Barber at work', category: 'barbers', aiHint: 'barber cutting hair' },
  { id: 'bar3', src: 'https://placehold.co/450x500.png', alt: 'Barber Luis', category: 'barbers', aiHint: 'barber stylish' },
  { id: 'hair1', src: 'https://placehold.co/500x600.png', alt: 'Modern Hairstyle', category: 'hairstyles', aiHint: 'mens haircut modern' },
  { id: 'hair2', src: 'https://placehold.co/500x650.png', alt: 'Classic Cut', category: 'hairstyles', aiHint: 'classic mens hairstyle' },
  { id: 'hair3', src: 'https://placehold.co/550x600.png', alt: 'Beard Style', category: 'hairstyles', aiHint: 'styled beard' },
  { id: 'hair4', src: 'https://placehold.co/500x500.png', alt: 'Fade Haircut', category: 'hairstyles', aiHint: 'fade haircut men' },
];

const categories = [
  { value: 'all', label: 'All' },
  { value: 'interior', label: 'Interior' },
  { value: 'barbers', label: 'Our Barbers' },
  { value: 'hairstyles', label: 'Hairstyles' },
];

export default function GalleryPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <PageHeader
        title="Gallery"
        description="A glimpse into the JoacoBarber experience and the styles we create."
      />
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-8">
          {categories.map(cat => (
            <TabsTrigger key={cat.value} value={cat.value}>{cat.label}</TabsTrigger>
          ))}
        </TabsList>
        
        {categories.map(cat => (
          <TabsContent key={cat.value} value={cat.value}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {galleryImages
                .filter(img => cat.value === 'all' || img.category === cat.value)
                .map((image) => (
                  <Card key={image.id} className="overflow-hidden group hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-0">
                      <div className="aspect-w-3 aspect-h-4 sm:aspect-w-1 sm:aspect-h-1">
                         <Image
                          src={image.src}
                          alt={image.alt}
                          width={600}
                          height={image.category === 'hairstyles' || image.category === 'barbers' ? 700 : 400}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          data-ai-hint={image.aiHint}
                        />
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>
            {galleryImages.filter(img => cat.value === 'all' || img.category === cat.value).length === 0 && (
              <p className="text-center text-muted-foreground py-8">No images in this category yet.</p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
