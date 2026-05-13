"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle, Trash2, Plus, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { MenuItem, Ingredient } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { MEASUREMENT_UNIT_OPTIONS } from '@/lib/measurement';
import { Switch } from '@/components/ui/switch';
import type { AddonOption, SizeOption } from '@/types';

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
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [sizesEnabled, setSizesEnabled] = useState(false);
  const [sizes, setSizes] = useState<SizeOption[]>([]);
  const [newSize, setNewSize] = useState<SizeOption>({ name: '', price: 0 });
  const [addonsEnabled, setAddonsEnabled] = useState(false);
  const [addons, setAddons] = useState<AddonOption[]>([]);
  const [newIngredient, setNewIngredient] = useState<Ingredient>({ name: '', quantity: 0, unit: 'g' });
  const [newAddon, setNewAddon] = useState<AddonOption>({ name: '', quantity: 0, unit: 'g', price: 0 });

  const handleAddIngredient = () => {
    if (!newIngredient.name.trim() || newIngredient.quantity <= 0) {
      toast({ title: "Ingrediente inválido", description: "Preencha o nome e a quantidade.", variant: "destructive" });
      return;
    }
    setIngredients([...ingredients, { ...newIngredient }]);
    setNewIngredient({ name: '', quantity: 0, unit: 'g' });
  };

  const handleAddSize = () => {
    if (!newSize.name.trim() || newSize.price <= 0) {
      toast({ title: 'Tamanho inválido', description: 'Preencha o nome e o preço.', variant: 'destructive' });
      return;
    }
    setSizes([...sizes, { ...newSize }]);
    setNewSize({ name: '', price: 0 });
    setSizesEnabled(true);
  };

  const handleRemoveSize = (index: number) => {
    const updated = [...sizes];
    updated.splice(index, 1);
    setSizes(updated);
  };

  const handleRemoveIngredient = (index: number) => {
    const updated = [...ingredients];
    updated.splice(index, 1);
    setIngredients(updated);
  };

  const handleAddAddon = () => {
    if (!newAddon.name.trim() || newAddon.quantity <= 0) {
      toast({ title: "Adicional inválido", description: "Preencha o nome e a quantidade.", variant: "destructive" });
      return;
    }

    setAddons([...addons, { ...newAddon }]);
    setNewAddon({ name: '', quantity: 0, unit: 'g', price: 0 });
    setAddonsEnabled(true);
  };

  const handleRemoveAddon = (index: number) => {
    const updated = [...addons];
    updated.splice(index, 1);
    setAddons(updated);
  };

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
            ingredients: ingredients,
            sizes: sizesEnabled ? sizes : [],
            addons: addonsEnabled ? addons : [],
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
          <CardDescription>Preencha os detalhes do novo item e seus ingredientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Item *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Hambúrguer Clássico" required disabled={isLoading} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Pratos Principais" required disabled={isLoading} />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Uma breve descrição do item." disabled={isLoading} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ex: 25.50" required disabled={isLoading} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL da Imagem *</Label>
              <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." required disabled={isLoading} />
            </div>

            {/* Ingredients Section */}
            <div className="md:col-span-2">
              <Separator className="my-2" />
              <div className="flex items-center gap-2 mt-4 mb-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                <Label className="text-base font-semibold">Ingredientes da Receita</Label>
                <span className="text-xs text-muted-foreground">(opcional)</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Defina os ingredientes e quantidades por porção. O estoque será descontado automaticamente quando o pedido for feito.
              </p>

              <div className="flex items-center justify-between gap-3 rounded-lg border p-3 mb-4 bg-muted/20">
                <div>
                  <p className="text-sm font-medium">Este prato possui adicionais?</p>
                  <p className="text-xs text-muted-foreground">Use isso para itens como açaí, onde o cliente escolhe complementos.</p>
                </div>
                <Switch checked={addonsEnabled} onCheckedChange={setAddonsEnabled} disabled={isLoading} />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border p-3 mb-4 bg-muted/20">
                <div>
                  <p className="text-sm font-medium">Este prato possui tamanhos?</p>
                  <p className="text-xs text-muted-foreground">Ex.: pequeno, médio e grande com preços diferentes.</p>
                </div>
                <Switch checked={sizesEnabled} onCheckedChange={setSizesEnabled} disabled={isLoading} />
              </div>

              {/* Existing ingredients */}
              {ingredients.length > 0 && (
                <div className="space-y-2 mb-4">
                  {ingredients.map((ing, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                      <span className="flex-1 text-sm font-medium">{ing.name}</span>
                      <Badge variant="secondary">{ing.quantity} {ing.unit}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveIngredient(index)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new ingredient row */}
              <div className="flex items-center gap-2 p-2 border-2 border-dashed border-muted rounded-lg">
                <Input
                  value={newIngredient.name}
                  onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                  placeholder="Nome do ingrediente..."
                  className="flex-1 h-9 text-sm"
                  disabled={isLoading}
                />
                <Input
                  type="number"
                  value={newIngredient.quantity || ''}
                  onChange={(e) => setNewIngredient({ ...newIngredient, quantity: parseFloat(e.target.value) || 0 })}
                  placeholder="Qtd"
                  className="w-20 h-9 text-sm"
                  disabled={isLoading}
                />
                <select
                  value={newIngredient.unit}
                  onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                  className="h-9 text-sm border border-input rounded-md px-2 bg-background"
                  disabled={isLoading}
                >
                  {MEASUREMENT_UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleAddIngredient}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {sizesEnabled && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Label className="text-base font-semibold">Tamanhos</Label>
                    <span className="text-xs text-muted-foreground">opcional</span>
                  </div>

                  {sizes.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {sizes.map((size, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                          <span className="flex-1 text-sm font-medium">{size.name}</span>
                          <Badge variant="secondary">R$ {size.price.toFixed(2)}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveSize(index)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-2 border-2 border-dashed border-muted rounded-lg">
                    <Input
                      value={newSize.name}
                      onChange={(e) => setNewSize({ ...newSize, name: e.target.value })}
                      placeholder="Ex: Pequeno, Médio, Grande"
                      className="flex-1 h-9 text-sm"
                      disabled={isLoading}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={newSize.price || ''}
                      onChange={(e) => setNewSize({ ...newSize, price: parseFloat(e.target.value) || 0 })}
                      placeholder="R$"
                      className="w-24 h-9 text-sm"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={handleAddSize}
                      disabled={isLoading}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {addonsEnabled && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Label className="text-base font-semibold">Adicionais do prato</Label>
                    <span className="text-xs text-muted-foreground">opcional</span>
                  </div>

                  {addons.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {addons.map((addon, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                          <span className="flex-1 text-sm font-medium">{addon.name}</span>
                          <Badge variant="secondary">R$ {addon.price.toFixed(2)}</Badge>
                          <Badge variant="secondary">{addon.quantity} {addon.unit}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveAddon(index)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
                      className="flex-1 h-9 text-sm"
                      disabled={isLoading}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={newAddon.price || ''}
                      onChange={(e) => setNewAddon({ ...newAddon, price: parseFloat(e.target.value) || 0 })}
                      placeholder="R$"
                      className="w-20 h-9 text-sm"
                      disabled={isLoading}
                    />
                    <Input
                      type="number"
                      value={newAddon.quantity || ''}
                      onChange={(e) => setNewAddon({ ...newAddon, quantity: parseFloat(e.target.value) || 0 })}
                      placeholder="Qtd"
                      className="w-20 h-9 text-sm"
                      disabled={isLoading}
                    />
                    <select
                      value={newAddon.unit}
                      onChange={(e) => setNewAddon({ ...newAddon, unit: e.target.value })}
                      className="h-9 text-sm border border-input rounded-md px-2 bg-background"
                      disabled={isLoading}
                    >
                      {MEASUREMENT_UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={handleAddAddon}
                      disabled={isLoading}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
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
