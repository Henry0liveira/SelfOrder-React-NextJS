"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, AlertTriangle, Plus, Pencil, Trash2, Loader2, FlaskConical, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Restaurant, StockItem, MenuItem } from '@/types';
import Link from 'next/link';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

const UNIT_OPTIONS = ['g', 'kg', 'ml', 'L', 'unidade', 'colher (sopa)', 'colher (chá)', 'xícara', 'fatia', 'pitada'];

export default function StockPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const { data: restaurant, loading: restaurantLoading } = useDoc<Restaurant>('restaurants', user?.uid || '');
  const { data: stockItems, loading: stockLoading } = useCollection<StockItem>(
    user?.uid ? `restaurants/${user.uid}/stock` : ''
  );
  const { data: menuItems, loading: menuLoading } = useCollection<MenuItem>(
    user?.uid ? `restaurants/${user.uid}/menu` : ''
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [formData, setFormData] = useState({ name: '', currentStock: 0, unit: 'g', minStock: 0 });
  const [isSaving, setIsSaving] = useState(false);

  const loading = userLoading || restaurantLoading || stockLoading;

  // Compute required ingredients across all menu items
  const requiredIngredients = useMemo(() => {
    if (!menuItems) return new Set<string>();
    const names = new Set<string>();
    menuItems.forEach(item => {
      (item.ingredients || []).forEach(ing => names.add(ing.name));
    });
    return names;
  }, [menuItems]);

  const lowStockItems = stockItems?.filter(item =>
    item.minStock !== undefined && item.currentStock <= item.minStock
  ) || [];

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', currentStock: 0, unit: 'g', minStock: 0 });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      currentStock: item.currentStock,
      unit: item.unit,
      minStock: item.minStock || 0,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !formData.name.trim()) return;
    setIsSaving(true);
    try {
      // Use ingredient name as document ID (normalized)
      const docId = editingItem?.id || formData.name.toLowerCase().replace(/\s+/g, '_');
      const stockRef = doc(firestore, `restaurants/${user.uid}/stock`, docId);
      await setDoc(stockRef, {
        name: formData.name,
        currentStock: Number(formData.currentStock),
        unit: formData.unit,
        minStock: Number(formData.minStock),
        lastUpdated: serverTimestamp(),
      }, { merge: true });

      toast({ title: "Estoque salvo!", description: `${formData.name} atualizado com sucesso.` });
      setIsDialogOpen(false);
    } catch (err) {
      toast({ title: "Erro", description: "Não foi possível salvar o estoque.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: StockItem) => {
    if (!user) return;
    const stockRef = doc(firestore, `restaurants/${user.uid}/stock`, item.id);
    await deleteDoc(stockRef);
    toast({ title: "Item removido", description: `${item.name} foi removido do estoque.` });
  };

  const getStockPercentage = (item: StockItem) => {
    if (!item.minStock || item.minStock === 0) return 100;
    // Show relative to minStock * 3 as "full"
    return Math.min(100, Math.round((item.currentStock / (item.minStock * 3)) * 100));
  };

  const getStockStatus = (item: StockItem): 'ok' | 'low' | 'out' => {
    if (item.currentStock <= 0) return 'out';
    if (item.minStock && item.currentStock <= item.minStock) return 'low';
    return 'ok';
  };

  if (loading) {
    return <div className="min-h-screen bg-secondary/30 flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!user) {
    router.push('/staff/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/staff/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Painel</Link>
          </Button>
          <div className="flex items-center gap-2 font-bold text-lg">
            <Package className="h-6 w-6 text-primary" />
            <h1 className="font-headline">Controle de Estoque</h1>
          </div>
          <Button size="sm" onClick={handleOpenAdd}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Item
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold font-headline">Estoque de {restaurant?.name}</h2>
          <p className="text-muted-foreground">O estoque é atualizado automaticamente quando pedidos são realizados.</p>
        </div>

        {/* Alerts */}
        {lowStockItems.length > 0 && (
          <Card className="mb-6 border-amber-400 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                {lowStockItems.length} item(s) com estoque baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lowStockItems.map(item => (
                  <Badge key={item.id} variant="outline" className="text-amber-700 border-amber-400">
                    {item.name}: {item.currentStock} {item.unit}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Required but not tracked ingredients */}
        {menuItems && menuItems.length > 0 && (() => {
          const trackedNames = new Set(stockItems?.map(s => s.name.toLowerCase()) || []);
          const missing = Array.from(requiredIngredients).filter(name => !trackedNames.has(name.toLowerCase()));
          if (missing.length === 0) return null;
          return (
            <Card className="mb-6 border-blue-400 bg-blue-50 dark:bg-blue-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-base">
                  <FlaskConical className="h-4 w-4" />
                  Ingredientes não rastreados no estoque
                </CardTitle>
                <CardDescription>Estes ingredientes estão nas receitas mas não têm entrada no estoque.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {missing.map(name => (
                    <Badge key={name} variant="outline" className="text-blue-700 border-blue-400 cursor-pointer"
                      onClick={() => {
                        setFormData({ name, currentStock: 0, unit: 'g', minStock: 0 });
                        setEditingItem(null);
                        setIsDialogOpen(true);
                      }}>
                      + {name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Stock table */}
        {!stockItems || stockItems.length === 0 ? (
          <Card className="text-center py-16">
            <CardHeader>
              <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
                <Package className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="mt-4">Estoque vazio</CardTitle>
              <CardDescription>Adicione ingredientes ao estoque para monitorar o consumo automaticamente.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleOpenAdd}><Plus className="mr-2 h-4 w-4" /> Adicionar Item ao Estoque</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stockItems.sort((a, b) => {
              const sa = getStockStatus(a);
              const sb = getStockStatus(b);
              const order = { out: 0, low: 1, ok: 2 };
              return order[sa] - order[sb];
            }).map(item => {
              const status = getStockStatus(item);
              return (
                <Card key={item.id} className={`relative overflow-hidden ${status === 'out' ? 'border-red-400' : status === 'low' ? 'border-amber-400' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{item.name}</CardTitle>
                        <CardDescription className="text-xs">{item.unit}</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(item)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between mb-2">
                      <span className={`text-2xl font-bold ${status === 'out' ? 'text-red-600' : status === 'low' ? 'text-amber-600' : 'text-foreground'}`}>
                        {item.currentStock.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-sm text-muted-foreground">{item.unit}</span>
                    </div>
                    {item.minStock !== undefined && item.minStock > 0 && (
                      <>
                        <Progress value={getStockPercentage(item)} className="h-2 mb-1" />
                        <p className="text-xs text-muted-foreground">Mínimo: {item.minStock} {item.unit}</p>
                      </>
                    )}
                    {status === 'out' && (
                      <Badge variant="destructive" className="mt-2 text-xs">Sem estoque</Badge>
                    )}
                    {status === 'low' && (
                      <Badge className="mt-2 text-xs bg-amber-500 text-white">Estoque baixo</Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Item do Estoque' : 'Adicionar ao Estoque'}</DialogTitle>
            <DialogDescription>Informe o ingrediente e a quantidade disponível.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Ingrediente</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Farinha de trigo" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade Atual</Label>
                <Input type="number" value={formData.currentStock} onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full h-10 text-sm border border-input rounded-md px-3 bg-background"
                >
                  {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Estoque Mínimo (alerta)</Label>
              <Input type="number" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })} placeholder="0 = sem alerta" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
