
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Home, PlusCircle, UtensilsCrossed, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import type { Restaurant, MenuItem } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useDoc, useCollection, useFirestore } from '@/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';

export default function ManageMenuPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const { data: restaurant, loading: restaurantLoading } = useDoc<Restaurant>(
    'restaurants',
    user?.uid || ''
  );
  
  const { data: menuItems, loading: menuLoading } = useCollection<MenuItem>(
      user?.uid ? `restaurants/${user.uid}/menu` : ''
  );

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const loading = userLoading || restaurantLoading || menuLoading;

  const menuByCategory = menuItems?.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) {
        acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const handleEditClick = (item: MenuItem) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !user) return;

    setIsUpdating(true);
    const itemDocRef = doc(firestore, `restaurants/${user.uid}/menu`, selectedItem.id);

    try {
      await updateDoc(itemDocRef, {
        name: selectedItem.name,
        description: selectedItem.description,
        price: Number(selectedItem.price),
        category: selectedItem.category,
        imageUrl: selectedItem.imageUrl,
        imageHint: selectedItem.name.toLowerCase(),
      });

      toast({
        title: "Item Atualizado!",
        description: `${selectedItem.name} foi atualizado com sucesso.`,
      });
      
      setIsEditDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("Erro ao atualizar item: ", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o item.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };


  if (loading) {
    return <div className="min-h-screen bg-secondary/30 flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary"/></div>;
  }

  if (!user) {
      router.push('/staff/login');
      return null;
  }

  if (!restaurant) {
      return (
          <div className="min-h-screen bg-secondary/30 flex items-center justify-center text-center">
              <Card>
                  <CardHeader>
                      <CardTitle>Restaurante não encontrado</CardTitle>
                      <CardDescription>Não há um restaurante associado a esta conta.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Button asChild>
                          <Link href="/staff/dashboard">Voltar ao Painel</Link>
                      </Button>
                  </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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

              {menuItems && menuItems.length === 0 ? (
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
                   menuByCategory && Object.entries(menuByCategory).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, items]) => (
                      <div key={category} className="mb-12">
                          <h3 className="text-2xl font-bold font-headline mb-4 border-b-2 border-primary pb-2">{category}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                              {items.map(item => (
                                  <Card key={item.id} className="overflow-hidden flex flex-col">
                                      <div className="relative h-40 w-full">
                                          <Image src={item.imageUrl} alt={item.name} fill objectFit="cover" data-ai-hint={item.imageHint} />
                                      </div>
                                      <CardHeader>
                                          <CardTitle>{item.name}</CardTitle>
                                      </CardHeader>
                                      <CardContent className="flex-grow">
                                          <p className="text-sm text-muted-foreground">{item.description}</p>
                                      </CardContent>
                                      <CardFooter className="flex justify-between items-center bg-muted/50 pt-4">
                                          <p className="text-lg font-bold text-primary">${item.price.toFixed(2)}</p>
                                          <Button variant="outline" size="sm" onClick={() => handleEditClick(item)}>
                                            <Pencil className="mr-2 h-4 w-4"/>
                                            Editar
                                          </Button>
                                      </CardFooter>
                                  </Card>
                              ))}
                          </div>
                      </div>
                  ))
              )}
          </main>
      </div>

      {selectedItem && (
        <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Editar Item: {selectedItem.name}</DialogTitle>
              <DialogDescription>
                Faça alterações nos detalhes do item abaixo e clique em salvar.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateItem}>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nome</Label>
                        <Input id="name" value={selectedItem.name} onChange={(e) => setSelectedItem({...selectedItem, name: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">Categoria</Label>
                        <Input id="category" value={selectedItem.category} onChange={(e) => setSelectedItem({...selectedItem, category: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">Preço</Label>
                        <Input id="price" type="number" value={selectedItem.price} onChange={(e) => setSelectedItem({...selectedItem, price: parseFloat(e.target.value)})} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="imageUrl" className="text-right">URL da Imagem</Label>
                        <Input id="imageUrl" value={selectedItem.imageUrl} onChange={(e) => setSelectedItem({...selectedItem, imageUrl: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Descrição</Label>
                        <Textarea id="description" value={selectedItem.description} onChange={(e) => setSelectedItem({...selectedItem, description: e.target.value})} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>Cancelar</Button>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
