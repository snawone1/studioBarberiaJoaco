import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Scissors, Sparkles, CalendarDays } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center text-center bg-secondary">
        <Image
          src="https://placehold.co/1600x900.png"
          alt="JoacoBarber Interior"
          layout="fill"
          objectFit="cover"
          className="opacity-30"
          data-ai-hint="barbershop luxury"
          priority
        />
        <div className="relative z-10 p-6 animate-slide-in-from-bottom">
          <h1 className="text-5xl md:text-7xl font-bold font-headline text-primary">
            JoacoBarber
          </h1>
          <p className="mt-4 text-xl md:text-2xl max-w-2xl mx-auto text-foreground">
            Experience Unparalleled Grooming & Style
          </p>
          <p className="mt-2 text-lg md:text-xl max-w-xl mx-auto text-muted-foreground">
            Where tradition meets modern sophistication.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/book">
              Book Your Appointment <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 font-headline">
            Why Choose <span className="text-primary">JoacoBarber</span>?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Scissors className="h-10 w-10 text-primary" />}
              title="Expert Barbers"
              description="Our skilled barbers are masters of their craft, dedicated to providing precision cuts and styles."
              href="/about"
            />
            <FeatureCard
              icon={<Sparkles className="h-10 w-10 text-primary" />}
              title="AI Style Advisor"
              description="Get personalized haircut recommendations powered by AI, tailored to your features and preferences."
              href="/style-advisor"
            />
            <FeatureCard
              icon={<CalendarDays className="h-10 w-10 text-primary" />}
              title="Easy Booking"
              description="Request your appointment online in just a few clicks. Convenience at your fingertips."
              href="/book"
            />
          </div>
        </div>
      </section>

      {/* Call to Action - Services */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-headline text-foreground">
            Discover Our <span className="text-primary">Premium Services</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            From classic cuts to modern styling, beard trims to luxurious shaves, we offer a full range of services to meet your grooming needs.
          </p>
          <Button size="lg" variant="outline" asChild>
            <Link href="/services">
              View All Services <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

function FeatureCard({ icon, title, description, href }: FeatureCardProps) {
  return (
    <Card className="text-center hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
          {icon}
        </div>
        <CardTitle className="text-2xl font-headline">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
        <Button variant="link" asChild className="mt-4 text-primary">
          <Link href={href}>
            Learn More <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
