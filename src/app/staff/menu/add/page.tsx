
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
import type { MenuItem } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AddMenuItemPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [isLoading, setIsLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado para adicionar um item.", variant: "destructive"});
      router.push('/staff/login');
      return;
    }
    
    if (!name || !price || !category || !imageUrl) {
        toast({ title: "Campos obrigatórios", description: "Por favor, preencha todos os campos obrigatórios.", variant: "destructive"});
        return;
    }

    setIsLoading(true);

    try {
        const menuCollectionRef = collection(firestore, 'restaurants', user.uid, 'menu');
        
        await addDoc(menuCollectionRef, {
            name,
            description,
            price: parseFloat(price),
            category,
            imageUrl,
            imageHint: name.toLowerCase(),
            createdAt: serverTimestamp()
        });

        toast({
            title: "Item Adicionado!",
            description: `${name} foi adicionado ao seu cardápio.`,
        });
        
        router.push('/staff/menu');

    } catch (error) {
        console.error("Erro ao adicionar item do cardápio: ", error);
        toast({ title: "Erro", description: "Não foi possível adicionar o item ao cardápio.", variant: "destructive"});
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
