
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors, Smile, Gem } from 'lucide-react';

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
    {/* Capa cara (ovalo simple ) */}
    <ellipse cx="12" cy="13" rx="5" ry="7" />
    {/* Eyes (dots) */}
    <circle cx="10" cy="11.5" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="14" cy="11.5" r="0.5" fill="currentColor" stroke="none" />
    {/* Mouth (line) */}
    <line x1="10" y1="15.5" x2="14" y2="15.5" />
    {/* Hands (curves on cheeks) */}
    <path d="M6.5 15.5c-1-1-1.5-2.5-.5-4" />
    <path d="M17.5 15.5c1-1 1.5-2.5.5-4" />
  </svg>
);

const services = [
  { name: "Corte de pelo", description: "Estilos clásicos y modernos.", icon: Scissors, dataAiHint: "haircut barber" },
  { name: "Afeitado", description: "Afeitado tradicional con navaja.", icon: StraightRazorIcon, dataAiHint: "shave razor" },
  { name: "Corte de barba", description: "Define y cuida tu barba.", icon: BeardTrimIcon, dataAiHint: "beard trim grooming" },
  { name: "Corte para niños", description: "Cortes divertidos y cómodos.", icon: Smile, dataAiHint: "kids haircut child" },
  { name: "Afeitado característico", description: "Experiencia de afeitado premium.", icon: Gem, dataAiHint: "premium shave luxury" },
  { name: "Masaje facial", description: "Relajación y cuidado de la piel.", icon: FacialMassageIcon, dataAiHint: "facial massage care" },
];

export default function HomePage() {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {services.map((service) => (
            <Card key={service.name} className="bg-card text-card-foreground shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl flex flex-col items-center text-center p-6 md:p-8">
              <CardHeader className="p-0 mb-4">
                <service.icon className="h-12 w-12 md:h-14 md:w-14 text-primary" />
              </CardHeader>
              <CardContent className="p-0 flex-grow flex flex-col justify-center">
                <CardTitle className="text-xl md:text-2xl font-semibold mb-1 text-card-foreground font-headline">{service.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
