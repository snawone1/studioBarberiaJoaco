
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  title: string;
  href: string;
  iconName?: string; 
  disabled?: boolean;
  external?: boolean;
};

export type SiteConfig = {
  name: string;
  description: string;
  mainNav: NavItem[];
  links: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
  }
};

export const siteConfig: SiteConfig = {
  name: "Barberia Joaco",
  description: "Tu experiencia de barbería elevada. Estilo, precisión y cuidado profesional.",
  mainNav: [
    { title: "Inicio", href: "/", iconName: "Home" },
    { title: "Productos", href: "/products", iconName: "ShoppingBag" },
    { title: "Citas", href: "/book", iconName: "CalendarDays" },
    { title: "Panel Admin", href: "/admin", iconName: "LayoutDashboard" },
  ],
  links: {
    //instagram: "https://instagram.com/joacobarber",
  }
};
