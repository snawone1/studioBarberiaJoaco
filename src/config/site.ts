import type { LucideIcon } from 'lucide-react'; // Keep for potential other uses, or remove if not needed elsewhere
// Remove direct lucide-react icon imports for mainNav here
// import { Home, ShoppingBag, CalendarDays, LayoutDashboard } from 'lucide-react'; 

export type NavItem = {
  title: string;
  href: string;
  iconName?: string; // Changed from icon?: LucideIcon
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
  name: "joaco",
  description: "Estilo y precisión en cada corte. Experimenta la barbería tradicional con un toque moderno.",
  mainNav: [
    { title: "Inicio", href: "/", iconName: "Home" },
    { title: "Productos", href: "/products", iconName: "ShoppingBag" },
    { title: "Citas", href: "/book", iconName: "CalendarDays" },
    { title: "Panel Admin", href: "/admin", iconName: "LayoutDashboard" },
  ],
  links: {
    // Add social media links here if available
    // instagram: "https://instagram.com/joacobarber",
  }
};
