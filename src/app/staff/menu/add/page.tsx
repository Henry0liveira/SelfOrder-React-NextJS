
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { Restaurant, MenuItem } from '@/types';
import { Textarea } from '@/components/ui/textarea';

export default function AddMenuItemPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const loggedInRestaurantData = localStorage.getItem('loggedInRestaurant');
    if (!loggedInRestaurantData) {
      toast({ title: "Erro", description: "Sessão não encontrada. Por favor, faça login novamente.", variant: "destructive"});
      router.push('/staff/login');
      return;
    }
    const loggedInRestaurant = JSON.parse(loggedInRestaurantData);

    const newItem: MenuItem = {
        id: `item-${Date.now()}`,
        name,
        description,
        price: parseFloat(price),
        category,
        imageUrl,
        imageHint: name.toLowerCase(),
    };

    const allRestaurantsData = localStorage.getItem('restaurants');
    let allRestaurants: Restaurant[] = allRestaurantsData ? JSON.parse(allRestaurantsData) : [];

    // Find and update the specific restaurant's menu
    const restaurantIndex = allRestaurants.findIndex(r => r.id === loggedInRestaurant.id);

    if (restaurantIndex > -1) {
        allRestaurants[restaurantIndex].menu.push(newItem);
        
        // Save the updated list of all restaurants back to localStorage
        localStorage.setItem('restaurants', JSON.stringify(allRestaurants));

        // Also update the loggedInRestaurant item if it's stored separately and needs to be in sync
        localStorage.setItem('loggedInRestaurant', JSON.stringify(allRestaurants[restaurantIndex]));
        
        // Trigger a storage event to notify other tabs/windows (like the menu page)
        window.dispatchEvent(new Event('storage'));

        toast({
            title: "Item Adicionado!",
            description: `${name} foi adicionado ao seu cardápio.`,
        });
        
        router.push('/staff/menu');

    } else {
        toast({ title: "Erro", description: "Não foi possível encontrar o restaurante para adicionar o item.", variant: "destructive"});
        setIsLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/50 p-4">
      <Card className="w-full max-w-2xl mx-auto shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Adicionar Novo Item ao Cardápio</CardTitle>
          <CardDescription>Preencha os detalhes do novo item.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Item</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Hambúrguer Clássico" required disabled={isLoading} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Pratos Principais" required disabled={isLoading} />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Uma breve descrição do item." required disabled={isLoading} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço</Label>
              <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ex: 25.50" required disabled={isLoading} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL da Imagem</Label>
              <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." required disabled={isLoading} />
            </div>

            <div className="md:col-span-2 flex justify-end items-center gap-4 mt-4">
                <Button variant="ghost" asChild disabled={isLoading}>
                    <Link href="/staff/menu">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Adicionando...' : 'Adicionar Item'}
                    {!isLoading && <PlusCircle className="ml-2 h-4 w-4" />}
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

