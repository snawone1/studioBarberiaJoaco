'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/config/site';
import { cn } from '@/lib/utils';
import { Home, ShoppingBag, CalendarDays, LayoutDashboard, type LucideProps } from 'lucide-react';
import type React from 'react';

interface MainNavProps {
  items?: NavItem[];
}

const iconComponents: { [key: string]: React.FC<LucideProps> } = {
  Home,
  ShoppingBag,
  CalendarDays,
  LayoutDashboard,
};

export function MainNav({ items }: MainNavProps) {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-1"> {/* Reduced gap for tighter fit if needed */}
      {items?.map(
        (item, index) => {
          const IconComponent = item.iconName ? iconComponents[item.iconName] : null;
          const isActive = pathname === item.href;
          const isHomeActive = isActive && item.href === '/';

          return item.href && (
            <Link
              key={index}
              href={item.href}
              className={cn(
                'flex items-center text-sm font-medium transition-colors px-4 py-2 rounded-md', // Added padding and rounded-md
                isHomeActive 
                  ? 'bg-secondary text-primary' 
                  : isActive 
                  ? 'text-primary hover:text-primary/90' 
                  : 'text-foreground/80 hover:text-primary/80',
                item.disabled && 'cursor-not-allowed opacity-80'
              )}
            >
              {IconComponent && <IconComponent className={cn(
                "mr-2 h-4 w-4",
                isActive ? "text-primary" : "text-foreground/70"
              )} />}
              {item.title}
            </Link>
          )
        }
      )}
    </nav>
  );
}
