
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/config/site';
import { cn } from '@/lib/utils';
import { Home, ShoppingBag, CalendarDays, LayoutDashboard, type LucideProps } from 'lucide-react';
import type React from 'react';
import { useAuth } from '@/context/AuthContext';

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
  const { currentUser } = useAuth();

  const filteredItems = items?.filter(item => {
    if (item.href === '/admin') {
      return currentUser?.email === 'joacoadmin@admin.com';
    }
    return true;
  });

  return (
    <nav className="hidden md:flex items-center gap-1"> {/* Reduced gap for tighter fit if needed */}
      {filteredItems?.map(
        (item, index) => {
          const IconComponent = item.iconName ? iconComponents[item.iconName] : null;
          const isActive = pathname === item.href;

          return item.href && (
            <Link
              key={index}
              href={item.href}
              className={cn(
                'flex items-center text-sm font-medium transition-colors px-4 py-2 rounded-md', 
                isActive 
                  ? 'bg-secondary text-primary' 
                  : 'text-foreground/80 hover:text-primary/80 hover:bg-secondary/50',
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
