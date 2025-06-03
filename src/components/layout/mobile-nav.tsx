'use client';

import * as React from 'react';
import Link, { type LinkProps } from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Scissors, Home, ShoppingBag, CalendarDays, LayoutDashboard, type LucideProps } from 'lucide-react';
import { siteConfig, type NavItem } from '@/config/site';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const iconComponents: { [key: string]: React.FC<LucideProps> } = {
  Home,
  ShoppingBag,
  CalendarDays,
  LayoutDashboard,
};

export function MobileNav({ items }: { items?: NavItem[] }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

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
      <SheetContent side="left" className="pr-0 bg-background text-foreground">
        <MobileLink
          href="/"
          className="flex items-center mb-4" // Added margin bottom
          onOpenChange={setOpen}
        >
          <Scissors className="mr-2 h-6 w-6 text-primary" />
          <span className="font-bold text-xl font-headline">{siteConfig.name}</span>
        </MobileLink>
        <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="flex flex-col space-y-2"> {/* Adjusted space-y */}
            {items?.map(
              (item) => {
                const IconComponent = item.iconName ? iconComponents[item.iconName] : null;
                const isActive = pathname === item.href;
                return item.href && (
                  <MobileLink
                    key={item.href}
                    href={item.href}
                    onOpenChange={setOpen}
                    className={cn(
                      "flex items-center py-2 px-3 rounded-md text-lg", // Added px-3 and rounded-md
                      isActive ? "bg-secondary text-primary" : "text-foreground/80 hover:text-primary hover:bg-secondary/50"
                    )}
                  >
                    {IconComponent && <IconComponent className={cn(
                      "mr-2 h-5 w-5", // Slightly larger icon
                       isActive ? "text-primary" : "text-foreground/70"
                    )} />}
                    {item.title}
                  </MobileLink>
                )
              }
            )}
          </div>
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
      className={cn('font-medium', className)} // Removed text-lg as it's in the map
      {...props}
    >
      {children}
    </Link>
  );
}
