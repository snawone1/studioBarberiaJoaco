
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors, Smile, Gem, Loader2, AlertTriangleIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getHomePageServices, type HomePageService } from '@/app/actions';

//  SVG Straight Razor
const StraightRazorIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6.343 17.657l10.607-10.607" />
    <path d="M6.343 17.657L3.515 20.485a2 2 0 002.828 0L8.465 18.364" />
    <path d="M16.95 7.05L20.485 3.515a2 2 0 00-2.828 0L14.828 5.636" />
    <path d="M8.464 18.364l7.072-7.072" />
  </svg>
);

// Custom SVG for Beard Trim (Beard + Scissors)
const BeardTrimIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 19.5C20 17.0147 17.9853 15 15.5 15H8.5C6.01472 15 4 17.0147 4 19.5V21h16v-1.5Z" /> {/* Beard shape */}
    {/* Scissors part */}
    <circle cx="7" cy="7" r="2.5" />
    <circle cx="17" cy="7" r="2.5" />
    <line x1="17" y1="9.5" x2="10" y2="14" />
    <line x1="7" y1="9.5" x2="14" y2="14" />
  </svg>
);

// Custom SVG for Facial Massage
const FacialMassageIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <ellipse cx="12" cy="13" rx="5" ry="7" />
    <circle cx="10" cy="11.5" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="14" cy="11.5" r="0.5" fill="currentColor" stroke="none" />
    <line x1="10" y1="15.5" x2="14" y2="15.5" />
    <path d="M6.5 15.5c-1-1-1.5-2.5-.5-4" />
    <path d="M17.5 15.5c1-1 1.5-2.5.5-4" />
  </svg>
);

const iconMap: { [key: string]: React.ElementType } = {
  Scissors: Scissors,
  Smile: Smile,
  Gem: Gem,
  StraightRazorIcon: StraightRazorIcon,
  BeardTrimIcon: BeardTrimIcon,
  FacialMassageIcon: FacialMassageIcon,
};


export default function HomePage() {
  const [services, setServices] = useState<HomePageService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadServices() {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedServices = await getHomePageServices();
        setServices(fetchedServices);
      } catch (e) {
        console.error("Failed to load home page services:", e);
        setError("No se pudieron cargar los servicios. Inténtalo de nuevo más tarde.");
      } finally {
        setIsLoading(false);
      }
    }
    loadServices();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 space-y-16 md:space-y-24">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[350px] md:h-[calc(70vh)] md:min-h-[450px] flex items-center justify-center text-center rounded-xl overflow-hidden shadow-2xl">
        <Image
          src="https://www.shutterstock.com/image-vector/barbershop-grunge-seamless-background-mens-600nw-2335839235.jpg"
          alt="Herramientas de barbería con patrón"
          fill={true}
          className="object-cover brightness-[0.4]"
          priority
          data-ai-hint="barber pattern"
        />
        <div className="relative z-10 p-6">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-3 tracking-tight font-headline">
            Servicios de Barbería
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-xl mx-auto">
            Estilo y precisión en cada corte. Experimenta la barbería tradicional con un toque moderno.
          </p>
          <Link href="/book">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-10 py-6 rounded-lg shadow-md transition-transform hover:scale-105">
              Reservar Turno
            </Button>
          </Link>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12">
        <h2 className="text-4xl font-bold text-center mb-12 font-headline text-primary">Nuestros Servicios</h2>
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Cargando servicios...</p>
          </div>
        )}
        {error && (
          <div className="text-center py-10 text-destructive flex flex-col items-center">
            <AlertTriangleIcon className="h-10 w-10 mb-2"/>
            <p className="text-lg">{error}</p>
          </div>
        )}
        {!isLoading && !error && services.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <Scissors className="h-12 w-12 mx-auto mb-3 opacity-50"/>
            <p className="text-lg">Actualmente no hay servicios destacados para mostrar.</p>
            <p className="text-sm">Por favor, añádelos desde el panel de administración.</p>
          </div>
        )}
        {!isLoading && !error && services.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {services.map((service) => {
              const IconComponent = iconMap[service.iconName] || Scissors; // Default to Scissors if iconName is not found
              return (
                <Card key={service.id} className="bg-card text-card-foreground shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl flex flex-col items-center text-center p-6 md:p-8">
                  <CardHeader className="p-0 mb-4">
                    <IconComponent className="h-12 w-12 md:h-14 md:w-14 text-primary" data-ai-hint={service.dataAiHint} />
                  </CardHeader>
                  <CardContent className="p-0 flex-grow flex flex-col justify-center">
                    <CardTitle className="text-xl md:text-2xl font-semibold mb-1 text-card-foreground font-headline">{service.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
