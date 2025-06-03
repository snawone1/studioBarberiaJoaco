import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Scissors, Sparkles, DollarSign, CheckCircle } from 'lucide-react'; // Using DollarSign for price

type Service = {
  id: string;
  name: string;
  description: string;
  price: string;
  features?: string[];
  icon?: React.ElementType;
};

const services: Service[] = [
  {
    id: 'classic-cut',
    name: 'Corte de Pelo Clásico',
    description: 'Un corte de pelo atemporal, realizado con precisión y estilo por nuestros expertos barberos.',
    price: 'ARS$ 3500',
    features: ['Consulta de estilo', 'Corte de precisión', 'Lavado y secado básico'],
    icon: Scissors,
  },
  {
    id: 'modern-style',
    name: 'Corte Moderno + Styling',
    description: 'Mantente a la vanguardia con un corte moderno y un peinado profesional adaptado a tu look.',
    price: 'ARS$ 4500',
    features: ['Consulta de tendencias', 'Corte personalizado', 'Productos premium', 'Styling profesional'],
    icon: Sparkles,
  },
  {
    id: 'classic-shave',
    name: 'Afeitado Clásico con Toallas Calientes',
    description: 'Experimenta el lujo de un afeitado tradicional con navaja, toallas calientes y productos calmantes.',
    price: 'ARS$ 3000',
    features: ['Preparación de la piel', 'Afeitado con navaja', 'Toallas calientes', 'Bálsamo aftershave'],
    icon: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> // Placeholder for razor icon
  },
  {
    id: 'beard-trim',
    name: 'Perfilado de Barba',
    description: 'Define y da forma a tu barba con un perfilado experto que realza tus facciones.',
    price: 'ARS$ 2000',
    features: ['Diseño de barba', 'Recorte y perfilado', 'Aceite para barba'],
    icon: Scissors, // Re-using scissors for general grooming
  },
  {
    id: 'coloring',
    name: 'Coloración',
    description: 'Renueva tu look con nuestros servicios de coloración, desde tonos naturales hasta los más audaces.',
    price: 'Desde ARS$ 6000',
    features: ['Asesoramiento de color', 'Aplicación profesional', 'Productos de calidad'],
    icon: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9.5 9.5 5 5"/><path d="m14.5 9.5-5 5"/></svg> // Placeholder for palette/brush icon
  },
];

export default function ServicesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <PageHeader
        title="Our Services"
        description="Explore our range of premium grooming services designed for the modern gentleman."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <Card key={service.id} className="flex flex-col hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-center mb-3">
                {service.icon && <service.icon className="h-8 w-8 text-primary mr-3" />}
                <CardTitle className="text-2xl font-headline">{service.name}</CardTitle>
              </div>
              <CardDescription className="text-base">{service.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              {service.features && service.features.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2 text-foreground">Includes:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between pt-4 border-t">
              <p className="text-2xl font-semibold text-primary mb-2 sm:mb-0 flex items-center">
                <DollarSign className="h-6 w-6 mr-1 opacity-70" />
                {service.price}
              </p>
              <Button asChild>
                <Link href="/book">Book Now</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
