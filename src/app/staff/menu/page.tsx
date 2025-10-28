
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Home, PlusCircle, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import type { Restaurant, MenuItem } from '@/types';
import Link from 'next/link';
import Image from 'next/image';

export default function ManageMenuPage() {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    const loggedInRestaurantData = localStorage.getItem('loggedInRestaurant');
    if (!loggedInRestaurantData) {
      router.push('/staff/login');
      return;
    }
    const loggedInRestaurant = JSON.parse(loggedInRestaurantData);

    const allRestaurantsData = localStorage.getItem('restaurants');
    const allRestaurants = allRestaurantsData ? JSON.parse(allRestaurantsData) : [];
    
    const currentRestaurant = allRestaurants.find((r: Restaurant) => r.id === loggedInRestaurant.id);
    setRestaurant(currentRestaurant || loggedInRestaurant);

    // Listen for storage changes to update menu
    const handleStorageChange = () => {
        const updatedRestaurantsData = localStorage.getItem('restaurants');
        const updatedRestaurants = updatedRestaurantsData ? JSON.parse(updatedRestaurantsData) : [];
        const updatedCurrentRestaurant = updatedRestaurants.find((r: Restaurant) => r.id === loggedInRestaurant.id);
        if(updatedCurrentRestaurant) {
            setRestaurant(updatedCurrentRestaurant);
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);

  }, [router]);

  const menuByCategory = restaurant?.menu.reduce((acc, item) => {
    if (!acc[item.category]) {
        acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (!restaurant) {
    return <div className="min-h-screen bg-secondary/30 flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-secondary/30">
        <header className="bg-card border-b sticky top-0 z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/staff/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Painel
                    </Link>
                </Button>
                 <div className="flex items-center gap-2 font-bold text-lg">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <h1 className="font-headline">Gerenciar Cardápio</h1>
                </div>
                 <Button variant="ghost" size="sm" asChild>
                    <Link href="/">
                        <Home className="mr-2 h-4 w-4" /> Página Inicial
                    </Link>
                </Button>
            </div>
        </header>

        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold font-headline">Cardápio de {restaurant.name}</h2>
                    <p className="text-muted-foreground">Veja e gerencie os itens do seu cardápio.</p>
                </div>
                <Button asChild>
                    <Link href="/staff/menu/add">
                        <PlusCircle className="mr-2" /> Adicionar Novo Item
                    </Link>
                </Button>
            </div>

            {restaurant.menu.length === 0 ? (
                <Card className="text-center py-16">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
                            <UtensilsCrossed className="h-12 w-12 text-primary"/>
                        </div>
                        <CardTitle className="mt-4">Seu cardápio está vazio!</CardTitle>
                        <CardDescription>Comece adicionando seu primeiro prato, bebida ou sobremesa.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button asChild size="lg">
                            <Link href="/staff/menu/add">
                                <PlusCircle className="mr-2" /> Adicionar Item
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                 Object.entries(menuByCategory!).map(([category, items]) => (
                    <div key={category} className="mb-12">
                        <h3 className="text-2xl font-bold font-headline mb-4 border-b-2 border-primary pb-2">{category}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {items.map(item => (
                                <Card key={item.id} className="overflow-hidden flex flex-col">
                                    <div className="relative h-40 w-full">
                                        <Image src={item.imageUrl} alt={item.name} layout="fill" objectFit="cover" data-ai-hint={item.imageHint} />
                                    </div>
                                    <CardHeader>
                                        <CardTitle>{item.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </CardContent>
                                    <CardFooter className="flex justify-between items-center">
                                        <p className="text-lg font-bold text-primary">${item.price.toFixed(2)}</p>
                                        {/* Edit/Delete buttons can go here */}
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </main>
    </div>
  );
}

