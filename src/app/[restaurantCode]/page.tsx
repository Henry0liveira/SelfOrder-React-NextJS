import { findRestaurantByCode } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import { CartProvider } from '@/hooks/use-cart';
import MenuView from '@/components/menu-view';
import { UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';

type Props = {
  params: {
    restaurantCode: string;
  };
};

export default async function MenuPage({ params }: Props) {
  const restaurant = findRestaurantByCode(params.restaurantCode);

  if (!restaurant) {
    notFound();
  }

  return (
    <CartProvider>
        <div className="min-h-screen bg-background">
            <header className="bg-card border-b sticky top-0 z-40">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-2">
                        <UtensilsCrossed className="h-6 w-6 text-primary" />
                        <h1 className="text-xl font-bold font-headline">{restaurant.name}</h1>
                    </Link>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <MenuView restaurant={restaurant} />
            </main>
        </div>
    </CartProvider>
  );
}
