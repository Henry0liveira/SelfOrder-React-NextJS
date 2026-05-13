"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, Loader2, Store } from 'lucide-react';
import { useCollection } from '@/firebase';
import type { Restaurant } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function RestaurantBrowserCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: restaurants, loading } = useCollection<Restaurant>('restaurants');
  const router = useRouter();

  const filteredRestaurants = useMemo(() => {
    const term = search.trim().toLowerCase();

    return [...restaurants]
      .filter((restaurant) => {
        if (!term) return true;

        return [restaurant.name, restaurant.code, restaurant.cuisineType, restaurant.description]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(term));
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [restaurants, search]);

  const openRestaurant = (code: string) => {
    setIsOpen(false);
    router.push(`/${code}`);
  };

  return (
    <Card className="mx-auto mt-6 w-full max-w-4xl border-white/60 bg-white/75 shadow-2xl backdrop-blur-md md:col-span-2">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Store className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-headline">Procurar restaurantes</CardTitle>
        <CardDescription>Veja os restaurantes disponíveis no sistema e entre direto no cardápio.</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button type="button" size="lg" className="h-12 w-full rounded-full">
              <Search className="h-4 w-4" />
              Procurar restaurantes
            </Button>
          </DialogTrigger>

          <DialogContent className="w-[calc(100vw-1rem)] max-w-2xl rounded-3xl sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-xl">Restaurantes disponíveis</DialogTitle>
              <DialogDescription>
                Escolha um restaurante para abrir o cardápio.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome, código ou cozinha"
                  className="pl-10"
                />
              </div>

              <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Carregando restaurantes...
                  </div>
                ) : filteredRestaurants.length > 0 ? (
                  filteredRestaurants.map((restaurant) => (
                    <button
                      key={restaurant.id}
                      type="button"
                      onClick={() => openRestaurant(restaurant.code)}
                      className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-muted/30 px-4 py-4 text-left transition-colors hover:bg-muted/60"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{restaurant.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {restaurant.cuisineType || restaurant.description || 'Restaurante disponível'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">Código: {restaurant.code}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </button>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                    Nenhum restaurante encontrado.
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}