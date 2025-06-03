export type NavItem = {
  title: string;
  href: string;
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
  name: "JoacoBarber",
  description: "Luxury barbershop offering premium grooming services and AI style advice in Argentina.",
  mainNav: [
    { title: "Home", href: "/" },
    { title: "About Us", href: "/about" },
    { title: "Services", href: "/services" },
    { title: "Gallery", href: "/gallery" },
    { title: "Book Appointment", href: "/book" },
    { title: "Style Advisor", href: "/style-advisor" },
    { title: "Admin Panel", href: "/admin" },
  ],
  links: {
    // Add social media links here if available
    // instagram: "https://instagram.com/joacobarber",
  }
};
