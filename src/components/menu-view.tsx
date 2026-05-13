
"use client";

import Image from 'next/image';
import { PlusCircle, Loader2, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Restaurant, MenuItem } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface MenuViewProps {
    restaurant: Restaurant;
    menuItems: MenuItem[];
}

export default function MenuView({ restaurant, menuItems }: MenuViewProps) {
    const { addToCart, loading: cartLoading } = useCart();
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [selectedAddonNames, setSelectedAddonNames] = useState<string[]>([]);
    const [isAddonDialogOpen, setIsAddonDialogOpen] = useState(false);

    const openCustomizationDialog = (item: MenuItem) => {
        setSelectedItem(item);
        setSelectedAddonNames([]);
        setIsAddonDialogOpen(true);
    };

    const handleConfirmAddons = () => {
        if (!selectedItem) return;
        const selectedAddons = (selectedItem.addons || []).filter((addon) => selectedAddonNames.includes(addon.name));
        addToCart(selectedItem, selectedAddons);
        setIsAddonDialogOpen(false);
        setSelectedItem(null);
        setSelectedAddonNames([]);
    };
    
    const menuByCategory = menuItems.reduce((acc, item) => {
        const category = item.category || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {} as Record<string, MenuItem[]>);


    return (
        <div className="relative">
            {Object.entries(menuByCategory).map(([category, items]) => (
                <div key={category} className="mb-12">
                    <h2 className="text-3xl font-bold font-headline mb-6 border-b-2 border-primary pb-2">{category}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map(item => (
                            <Card key={item.id} className="overflow-hidden flex flex-col group transition-shadow hover:shadow-xl">
                                <CardHeader className="p-0">
                                    <div className="relative h-48 w-full">
                                        <Image src={item.imageUrl} alt={item.name} layout="fill" objectFit="cover" className="transition-transform group-hover:scale-105" data-ai-hint={item.imageHint}/>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 flex-grow">
                                    <CardTitle className="text-xl font-semibold mb-1">{item.name}</CardTitle>
                                    <CardDescription>{item.description}</CardDescription>
                                </CardContent>
                                <CardFooter className="p-4 flex justify-between items-center">
                                    <p className="text-lg font-bold text-primary">${item.price.toFixed(2)}</p>
                                    <Button onClick={() => openCustomizationDialog(item)} size="sm" disabled={cartLoading}>
                                        {cartLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />} 
                                        Personalizar
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}

            <Dialog open={isAddonDialogOpen} onOpenChange={setIsAddonDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Personalize seu pedido</DialogTitle>
                        <DialogDescription>
                            Ajuste os adicionais de {selectedItem?.name} antes de adicionar ao carrinho.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        {selectedItem?.addons && selectedItem.addons.length > 0 ? (
                            selectedItem.addons.map((addon) => {
                                const checked = selectedAddonNames.includes(addon.name);
                                return (
                                    <label key={addon.name} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                                        <Checkbox
                                            checked={checked}
                                            onCheckedChange={(value) => {
                                                setSelectedAddonNames((current) =>
                                                    value
                                                        ? [...current, addon.name]
                                                        : current.filter((name) => name !== addon.name)
                                                );
                                            }}
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-medium">{addon.name}</span>
                                                <span className="text-sm text-primary font-semibold">+ R$ {addon.price.toFixed(2)}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{addon.quantity} {addon.unit}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </label>
                                );
                            })
                        ) : (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                Este prato não possui adicionais cadastrados. Você pode confirmar para adicionar ao carrinho.
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAddonDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleConfirmAddons} disabled={!selectedItem}>Adicionar ao carrinho</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
