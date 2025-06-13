
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { siteConfig } from '@/config/site';
import { MainNav } from '@/components/layout/main-nav';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Button } from '@/components/ui/button';
import { Scissors, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState } from 'react';
import { getSiteDetails } from '@/app/actions';

export function Header() {
  const { currentUser, logout, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [dynamicSiteName, setDynamicSiteName] = useState(siteConfig.name);

  useEffect(() => {
    async function fetchSiteName() {
      try {
        const details = await getSiteDetails();
        if (details && details.name) {
          setDynamicSiteName(details.name);
        }
      } catch (error) {
        console.error("Failed to fetch site name for header:", error);
        // Fallback to static config name if there's an error
        setDynamicSiteName(siteConfig.name);
      }
    }
    fetchSiteName();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: 'Cierre de sesión exitoso', description: 'Has cerrado sesión correctamente.' });
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast({ title: 'Error', description: 'No se pudo cerrar la sesión.', variant: 'destructive' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Scissors className="h-7 w-7 text-primary" />
          <span className="font-bold text-2xl font-headline text-primary">{dynamicSiteName}</span>
        </Link>
        <MobileNav items={siteConfig.mainNav} /> {/* Pass auth state and functions to MobileNav */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          <MainNav items={siteConfig.mainNav} />
          {/* Auth buttons for desktop, hidden on small screens */}
          <div className="hidden md:flex items-center space-x-2">
            {loading ? (
              <Button variant="outline" className="border-primary text-primary" disabled>
                Cargando...
              </Button>
            ) : currentUser ? (
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="text-foreground/80" asChild>
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Iniciar Sesión
                  </Link>
                </Button>
                <Button variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                  <Link href="/register">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Registrarse
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
