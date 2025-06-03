
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden">
        <div className="relative aspect-[16/9] md:aspect-[2/1]"> {/* Changed aspect ratio for a taller banner */}
          <Image
            src="https://www.shutterstock.com/image-vector/barbershop-grunge-seamless-background-mens-600nw-2335839235.jpg"
            alt="Barbershop pattern background with tools"
            layout="fill"
            objectFit="cover"
            className="opacity-80"
            data-ai-hint="barber tools pattern"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-black/50 p-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-headline text-white">
              Servicios de Barbería
            </h1>
            <p className="mt-4 text-base sm:text-lg md:text-xl max-w-xl mx-auto text-gray-200">
              Estilo y precisión en cada corte. Experimenta la barbería tradicional con un toque moderno.
            </p>
            <Button size="lg" className="mt-8 bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
              <Link href="/book">
                Reservar Cita
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
