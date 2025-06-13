
'use client';

import * as React from 'react';
import Link, { type LinkProps } from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Scissors, Home, ShoppingBag, CalendarDays, LayoutDashboard, LogIn, LogOut, UserPlus, Loader2, type LucideProps } from 'lucide-react';
import { siteConfig, type NavItem } from '@/config/site';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet'; // Added SheetHeader and SheetTitle
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const iconComponents: { [key: string]: React.FC<LucideProps> } = {
  Home,
  ShoppingBag,
  CalendarDays,
  LayoutDashboard,
  LogIn,
  UserPlus,
  LogOut,
};

export function MobileNav({ items }: { items?: NavItem[] }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, loading } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: 'Cierre de sesión exitoso', description: 'Has cerrado sesión correctamente.' });
      setOpen(false); // Close the sheet
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast({ title: 'Error', description: 'No se pudo cerrar la sesión.', variant: 'destructive' });
    }
  };

  const filteredItems = items?.filter(item => {
    if (item.href === '/admin') {
      return currentUser?.email === 'joacoadmin@admin.com';
    }
    return true;
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden text-foreground"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0 bg-background text-foreground flex flex-col">
        <SheetHeader>
          <SheetTitle className="sr-only">Navegación Principal</SheetTitle> {/* Visually hidden title for accessibility */}
        </SheetHeader>
        <MobileLink
          href="/"
          className="flex items-center mb-4 pl-6 pt-2"  /* Added pt-2 to give space if SheetHeader takes any */
          onOpenChange={setOpen}
        >
          <Scissors className="mr-2 h-6 w-6 text-primary" />
          <span className="font-bold text-xl font-headline">{siteConfig.name}</span>
        </MobileLink>
        
        <div className="flex-grow overflow-y-auto pb-10 pl-6 space-y-2">
            {filteredItems?.map(
              (item) => {
                const IconComponent = item.iconName ? iconComponents[item.iconName] : null;
                const isActive = pathname === item.href;
                return item.href && (
                  <MobileLink
                    key={item.href}
                    href={item.href}
                    onOpenChange={setOpen}
                    className={cn(
                      "flex items-center py-2 px-3 rounded-md text-lg", 
                      isActive ? "bg-secondary text-primary" : "text-foreground/80 hover:text-primary hover:bg-secondary/50"
                    )}
                  >
                    {IconComponent && <IconComponent className={cn(
                      "mr-2 h-5 w-5", 
                       isActive ? "text-primary" : "text-foreground/70"
                    )} />}
                    {item.title}
                  </MobileLink>
                )
              }
            )}
        </div>

        <div className="mt-auto border-t border-border pt-4 pl-6 pr-4 pb-4 space-y-2">
          <Separator className="my-2 bg-border/50 -ml-6" />
          {loading ? (
            <Button variant="ghost" disabled className="w-full justify-start text-lg px-3 py-2 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Cargando...
            </Button>
          ) : currentUser ? (
            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-lg px-3 py-2 text-foreground/80 hover:text-primary hover:bg-secondary/50">
              <LogOut className="mr-2 h-5 w-5 text-foreground/70 group-hover:text-primary" />
              Cerrar Sesión
            </Button>
          ) : (
            <>
              <MobileLink href="/login" onOpenChange={setOpen} className="flex items-center py-2 px-3 rounded-md text-lg text-foreground/80 hover:text-primary hover:bg-secondary/50">
                <LogIn className="mr-2 h-5 w-5 text-foreground/70 group-hover:text-primary" />
                Iniciar Sesión
              </MobileLink>
              <MobileLink href="/register" onOpenChange={setOpen} className="flex items-center py-2 px-3 rounded-md text-lg text-foreground/80 hover:text-primary hover:bg-secondary/50">
                <UserPlus className="mr-2 h-5 w-5 text-foreground/70 group-hover:text-primary" />
                Registrarse
              </MobileLink>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface MobileLinkProps extends LinkProps {
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

function MobileLink({
  href,
  onOpenChange,
  className,
  children,
  ...props
}: MobileLinkProps) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={() => {
        router.push(href.toString());
        onOpenChange?.(false);
      }}
      className={cn('font-medium', className)}
      {...props}
    >
      {children}
    </Link>
  );
}
