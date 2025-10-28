"use client";

import { LogOut, UtensilsCrossed, ClipboardList, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function StaffDashboardPage() {
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState('');

  useEffect(() => {
    // In a real app, you'd get this from a proper session
    const loggedInRestaurant = localStorage.getItem('loggedInRestaurant');
    if (!loggedInRestaurant) {
      router.push('/staff/login');
    } else {
      setRestaurantName(JSON.parse(loggedInRestaurant).name);
    }
  }, [router]);
  
  const handleLogout = () => {
    localStorage.removeItem('loggedInRestaurant');
    router.push('/staff/login');
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-2 font-bold text-lg">
                    <UtensilsCrossed className="h-6 w-6 text-primary" />
                    <span className="font-headline">{restaurantName}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
            </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold font-headline">Staff Dashboard</h1>
            <p className="text-muted-foreground text-lg">Selecione uma opção para começar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link href="/staff/orders" className="block transform hover:scale-105 transition-transform duration-300">
                <Card className="h-full shadow-xl text-center">
                    <CardHeader>
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
                            <ClipboardList className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-headline">Ver Pedidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>Acompanhe os pedidos dos clientes em tempo real.</CardDescription>
                    </CardContent>
                </Card>
            </Link>
            
            <Link href="#" className="block transform hover:scale-105 transition-transform duration-300">
                 <Card className="h-full shadow-xl text-center opacity-50 cursor-not-allowed">
                    <CardHeader>
                         <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary mb-4">
                            <BookOpen className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-2xl font-headline">Gerenciar Cardápio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>Adicione, edite ou remova itens do seu cardápio. (Em breve)</CardDescription>
                    </CardContent>
                </Card>
            </Link>
        </div>
      </main>
    </div>
  );
}
