import Image from 'next/image';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Mail, MapPin, Phone, Users } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <PageHeader
        title="About JoacoBarber"
        description="Discover the story behind the finest barbershop experience in town."
      />

      <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <h2 className="text-3xl font-bold mb-4 font-headline text-primary">Our Philosophy</h2>
          <p className="text-lg text-muted-foreground mb-4">
            At JoacoBarber, we believe that a great haircut is more than just a trim – it's an experience. We blend traditional barbering techniques with modern styling to create a personalized look that reflects your unique personality. Our commitment to quality, craftsmanship, and exceptional customer service sets us apart.
          </p>
          <p className="text-lg text-muted-foreground">
            Step into our sophisticated and welcoming space, where you can relax, unwind, and leave looking and feeling your best. We are dedicated to providing a luxurious grooming experience for every client.
          </p>
        </div>
        <div className="rounded-lg overflow-hidden shadow-xl">
          <Image
            src="https://placehold.co/600x400.png"
            alt="JoacoBarber interior"
            width={600}
            height={400}
            className="w-full h-auto object-cover"
            data-ai-hint="barbershop modern"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <InfoCard
          icon={<MapPin className="w-8 h-8 text-primary" />}
          title="Location"
          text="Av. Corrientes 1234, CABA, Buenos Aires, Argentina"
        />
        <InfoCard
          icon={<Phone className="w-8 h-8 text-primary" />}
          title="Contact Us"
          text="Phone: +54 11 1234 5678"
          secondaryText="Email: contacto@joacobarber.com"
        />
        <InfoCard
          icon={<Clock className="w-8 h-8 text-primary" />}
          title="Hours of Operation"
          text="Mon - Fri: 9 AM - 8 PM"
          secondaryText="Saturday: 10 AM - 6 PM"
        />
      </div>
      
      <Card className="bg-secondary">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center text-primary">
            Meet Our Team
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-lg text-muted-foreground mb-8">
            Our team of professional barbers is passionate about their craft and dedicated to providing you with the highest quality service.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center">
                <Image
                  src={`https://placehold.co/200x200.png`}
                  alt={`Barber ${index + 1}`}
                  width={150}
                  height={150}
                  className="rounded-full mb-4 shadow-md"
                  data-ai-hint="barber portrait"
                />
                <h4 className="text-xl font-semibold font-headline text-foreground">Barber {index + 1}</h4>
                <p className="text-sm text-primary">Master Barber</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  text: string;
  secondaryText?: string;
}

function InfoCard({ icon, title, text, secondaryText }: InfoCardProps) {
  return (
    <Card className="text-center p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold font-headline mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground">{text}</p>
      {secondaryText && <p className="text-muted-foreground">{secondaryText}</p>}
    </Card>
  );
}
