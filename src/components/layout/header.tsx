import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { MainNav } from '@/components/layout/main-nav';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Button } from '@/components/ui/button';
import {Scissors } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Scissors className="h-8 w-8 text-primary" />
          <span className="font-bold text-2xl font-headline text-primary">{siteConfig.name}</span>
        </Link>
        <MainNav items={siteConfig.mainNav} />
        <MobileNav items={siteConfig.mainNav} />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <Button asChild>
            <Link href="/book">Book Now</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
