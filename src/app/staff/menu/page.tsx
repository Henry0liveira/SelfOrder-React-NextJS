"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Home, PlusCircle, UtensilsCrossed, Loader2, Pencil, Trash2, Plus, Minus, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import type { Restaurant, MenuItem, Ingredient } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useDoc, useCollection, useFirestore } from '@/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MEASUREMENT_UNIT_OPTIONS } from '@/lib/measurement';
import { Switch } from '@/components/ui/switch';
import type { AddonOption } from '@/types';

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
  const [newIngredient, setNewIngredient] = useState<Ingredient>({ name: '', quantity: 0, unit: 'g' });
  const [newAddon, setNewAddon] = useState<AddonOption>({ name: '', quantity: 0, unit: 'g', price: 0, category: '' });
  const [addonsEnabled, setAddonsEnabled] = useState(false);

  const loading = userLoading || restaurantLoading || menuLoading;

  const menuByCategory = menuItems?.reduce((acc, item) => {
    const category = item.category || 'Sem Categoria';
    if (!acc[category]) {
        acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const handleEditClick = (item: MenuItem) => {
    setSelectedItem({ ...item, ingredients: item.ingredients || [] });
    setAddonsEnabled((item.addons || []).length > 0);
    setNewAddon({ name: '', quantity: 0, unit: 'g', price: 0 });
    setIsEditDialogOpen(true);
  };

  const handleAddAddon = () => {
    if (!newAddon.name.trim() || newAddon.quantity <= 0) {
      toast({ title: "Adicional inválido", description: "Preencha o nome e a quantidade.", variant: "destructive" });
      return;
    }
    if (!selectedItem) return;
    setSelectedItem({
      ...selectedItem,
      addons: [...(selectedItem.addons || []), { ...newAddon }],
    });
    setNewAddon({ name: '', quantity: 0, unit: 'g', price: 0, category: '' });
    setAddonsEnabled(true);
  };

  const handleRemoveAddon = (index: number) => {
    if (!selectedItem) return;
    const updated = [...(selectedItem.addons || [])];
    updated.splice(index, 1);
    setSelectedItem({ ...selectedItem, addons: updated });
  };

  const handleAddIngredient = () => {
    if (!newIngredient.name.trim() || newIngredient.quantity <= 0) {
      toast({ title: "Ingrediente inválido", description: "Preencha o nome e a quantidade.", variant: "destructive" });
      return;
    }
    if (!selectedItem) return;
    setSelectedItem({
      ...selectedItem,
      ingredients: [...(selectedItem.ingredients || []), { ...newIngredient }]
    });
    setNewIngredient({ name: '', quantity: 0, unit: 'g' });
  };

  const handleRemoveIngredient = (index: number) => {
    if (!selectedItem) return;
    const updated = [...(selectedItem.ingredients || [])];
    updated.splice(index, 1);
    setSelectedItem({ ...selectedItem, ingredients: updated });
  };

  const handleUpdateIngredientField = (index: number, field: keyof Ingredient, value: string | number) => {
    if (!selectedItem) return;
    const updated = [...(selectedItem.ingredients || [])];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedItem({ ...selectedItem, ingredients: updated });
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
        ingredients: selectedItem.ingredients || [],
        addons: addonsEnabled ? (selectedItem.addons || []) : [],
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
                      <p className="text-muted-foreground">Gerencie itens e ingredientes de cada receita.</p>
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
                                          {item.ingredients && item.ingredients.length > 0 && (
                                            <div className="mt-3">
                                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                                <FlaskConical className="h-3 w-3" />
                                                <span>{item.ingredients.length} ingrediente(s)</span>
                                              </div>
                                              <div className="flex flex-wrap gap-1">
                                                {item.ingredients.slice(0, 3).map((ing, i) => (
                                                  <Badge key={i} variant="outline" className="text-xs">{ing.name}</Badge>
                                                ))}
                                                {item.ingredients.length > 3 && (
                                                  <Badge variant="outline" className="text-xs">+{item.ingredients.length - 3}</Badge>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                      </CardContent>
                                      <CardFooter className="flex justify-between items-center bg-muted/50 pt-4">
                                          <p className="text-lg font-bold text-primary">R${item.price.toFixed(2)}</p>
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Item: {selectedItem.name}</DialogTitle>
              <DialogDescription>
                Faça alterações nos detalhes e ingredientes do item abaixo.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateItem}>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nome</Label>
                        <Input id="name" value={selectedItem.name} onChange={(e) => setSelectedItem({...selectedItem, name: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">Categoria</Label>
                        <Input id="category" value={selectedItem.category} onChange={(e) => setSelectedItem({...selectedItem, category: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">Preço (R$)</Label>
                        <Input id="price" type="number" value={selectedItem.price} onChange={(e) => setSelectedItem({...selectedItem, price: parseFloat(e.target.value)})} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                        <Label htmlFor="imageUrl" className="text-right">URL da Imagem</Label>
                        <Input id="imageUrl" value={selectedItem.imageUrl} onChange={(e) => setSelectedItem({...selectedItem, imageUrl: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Descrição</Label>
                        <Textarea id="description" value={selectedItem.description} onChange={(e) => setSelectedItem({...selectedItem, description: e.target.value})} className="col-span-3" />
                    </div>

                    {/* Ingredients Section */}
                    <Separator />
                    <div className="col-span-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FlaskConical className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-base">Ingredientes da Receita</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">
                        Defina os ingredientes e quantidades necessárias por porção. O estoque será descontado automaticamente a cada pedido.
                      </p>

                      <div className="flex items-center justify-between gap-3 rounded-lg border p-3 mb-4 bg-muted/20">
                        <div>
                          <p className="text-sm font-medium">Este prato possui adicionais?</p>
                          <p className="text-xs text-muted-foreground">Ex.: açaí com granola, banana e leite em pó.</p>
                        </div>
                        <Switch checked={addonsEnabled} onCheckedChange={setAddonsEnabled} />
                      </div>

                      {/* Existing ingredients */}
                      {selectedItem.ingredients && selectedItem.ingredients.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {selectedItem.ingredients.map((ing, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                              <Input
                                value={ing.name}
                                onChange={(e) => handleUpdateIngredientField(index, 'name', e.target.value)}
                                placeholder="Ingrediente"
                                className="flex-1 h-8 text-sm"
                              />
                              <Input
                                type="number"
                                value={ing.quantity}
                                onChange={(e) => handleUpdateIngredientField(index, 'quantity', parseFloat(e.target.value))}
                                placeholder="Qtd"
                                className="w-20 h-8 text-sm"
                              />
                              <select
                                value={ing.unit}
                                onChange={(e) => handleUpdateIngredientField(index, 'unit', e.target.value)}
                                className="h-8 text-sm border border-input rounded-md px-2 bg-background"
                              >
                                {MEASUREMENT_UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleRemoveIngredient(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add new ingredient */}
                      <div className="flex items-center gap-2 p-2 border-2 border-dashed border-muted rounded-lg">
                        <Input
                          value={newIngredient.name}
                          onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                          placeholder="Novo ingrediente..."
                          className="flex-1 h-8 text-sm"
                        />
                        <Input
                          type="number"
                          value={newIngredient.quantity || ''}
                          onChange={(e) => setNewIngredient({ ...newIngredient, quantity: parseFloat(e.target.value) || 0 })}
                          placeholder="Qtd"
                          className="w-20 h-8 text-sm"
                        />
                        <select
                          value={newIngredient.unit}
                          onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                          className="h-8 text-sm border border-input rounded-md px-2 bg-background"
                        >
                          {MEASUREMENT_UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleAddIngredient}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {addonsEnabled && (
                        <div className="mt-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Label className="text-base font-semibold">Adicionais do prato</Label>
                            <span className="text-xs text-muted-foreground">opcional</span>
                          </div>

                          {selectedItem.addons && selectedItem.addons.length > 0 && (
                            <div className="space-y-2 mb-4">
                              {selectedItem.addons.map((addon, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                  <Input
                                    value={addon.name}
                                    onChange={(e) => {
                                      const updated = [...(selectedItem.addons || [])];
                                      updated[index] = { ...updated[index], name: e.target.value };
                                      setSelectedItem({ ...selectedItem, addons: updated });
                                    }}
                                    placeholder="Nome do adicional"
                                    className="flex-1 h-8 text-sm"
                                  />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={addon.price}
                                    onChange={(e) => {
                                      const updated = [...(selectedItem.addons || [])];
                                      updated[index] = { ...updated[index], price: parseFloat(e.target.value) || 0 };
                                      setSelectedItem({ ...selectedItem, addons: updated });
                                    }}
                                    placeholder="R$"
                                    className="w-24 h-8 text-sm"
                                  />
                                  <Input
                                    type="number"
                                    value={addon.quantity}
                                    onChange={(e) => {
                                      const updated = [...(selectedItem.addons || [])];
                                      updated[index] = { ...updated[index], quantity: parseFloat(e.target.value) || 0 };
                                      setSelectedItem({ ...selectedItem, addons: updated });
                                    }}
                                    placeholder="Qtd"
                                    className="w-20 h-8 text-sm"
                                  />
                                  <Input
                                    value={addon.category || ''}
                                    onChange={(e) => {
                                      const updated = [...(selectedItem.addons || [])];
                                      updated[index] = { ...updated[index], category: e.target.value };
                                      setSelectedItem({ ...selectedItem, addons: updated });
                                    }}
                                    placeholder="Categoria (opcional)"
                                    className="w-36 h-8 text-sm"
                                  />
                                  <select
                                    value={addon.unit}
                                    onChange={(e) => {
                                      const updated = [...(selectedItem.addons || [])];
                                      updated[index] = { ...updated[index], unit: e.target.value };
                                      setSelectedItem({ ...selectedItem, addons: updated });
                                    }}
                                    className="h-8 text-sm border border-input rounded-md px-2 bg-background"
                                  >
                                    {MEASUREMENT_UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                                  </select>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => handleRemoveAddon(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2 p-2 border-2 border-dashed border-muted rounded-lg">
                            <Input
                              value={newAddon.name}
                              onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
                              placeholder="Nome do adicional..."
                              className="flex-1 h-8 text-sm"
                            />
                            <Input
                              type="number"
                              step="0.01"
                              value={newAddon.price || ''}
                              onChange={(e) => setNewAddon({ ...newAddon, price: parseFloat(e.target.value) || 0 })}
                              placeholder="R$"
                              className="w-20 h-8 text-sm"
                            />
                            <Input
                              type="number"
                              value={newAddon.quantity || ''}
                              onChange={(e) => setNewAddon({ ...newAddon, quantity: parseFloat(e.target.value) || 0 })}
                              placeholder="Qtd"
                              className="w-20 h-8 text-sm"
                            />
                            <Input
                              value={newAddon.category || ''}
                              onChange={(e) => setNewAddon({ ...newAddon, category: e.target.value })}
                              placeholder="Categoria (opcional)"
                              className="w-36 h-8 text-sm"
                            />
                            <select
                              value={newAddon.unit}
                              onChange={(e) => setNewAddon({ ...newAddon, unit: e.target.value })}
                              className="h-8 text-sm border border-input rounded-md px-2 bg-background"
                            >
                              {MEASUREMENT_UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={handleAddAddon}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" type="button" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>Cancelar</Button>
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
