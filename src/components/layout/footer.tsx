import { siteConfig } from '@/config/site';
import { Mail, MapPin, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-headline font-semibold text-primary mb-4">{siteConfig.name}</h3>
            <p className="text-sm">Experience luxury grooming and expert styling at JoacoBarber. Your satisfaction is our priority.</p>
          </div>
          <div>
            <h3 className="text-lg font-headline font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-primary" />
                Av. Corrientes 1234, Buenos Aires, Argentina
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-primary" />
                +54 11 1234 5678
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-primary" />
                contacto@joacobarber.com
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-headline font-semibold mb-4">Hours</h3>
            <ul className="space-y-2 text-sm">
              <li>Monday - Friday: 9:00 AM - 8:00 PM</li>
              <li>Saturday: 10:00 AM - 6:00 PM</li>
              <li>Sunday: Closed</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
