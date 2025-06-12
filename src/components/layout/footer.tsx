'use client';

import { siteConfig } from '@/config/site'; // Keep for fallback or static parts
import { Mail, MapPin, Phone } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getSiteDetails } from '@/app/actions';

export function Footer() {
  const [dynamicSiteName, setDynamicSiteName] = useState(siteConfig.name);

  useEffect(() => {
    async function fetchSiteName() {
      try {
        const details = await getSiteDetails();
        if (details && details.name) {
          setDynamicSiteName(details.name);
        }
      } catch (error) {
        console.error("Failed to fetch site name for footer:", error);
        // Fallback to static config name if there's an error
        setDynamicSiteName(siteConfig.name);
      }
    }
    fetchSiteName();
  }, []);

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-headline font-semibold text-primary mb-4">{dynamicSiteName}</h3>
            <p className="text-sm">Joaco calidad de servicio</p>
          </div>
          <div>
            <h3 className="text-lg font-headline font-semibold mb-4">Contacto</h3>
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
            <h3 className="text-lg font-headline font-semibold mb-4">Horarios</h3>
            <ul className="space-y-2 text-sm">
              <li>Lunes - Viernes: 9:00 AM - 5:00 PM</li>
              <li>Sabado - Domingo: 10:00 AM - 6:00 PM</li>
              <li></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} {dynamicSiteName}.Derechos reservados a snawDEV Studio.</p>
        </div>
      </div>
    </footer>
  );
}
