"use client";

import Image from 'next/image';
import { PlusCircle, Loader2, ChevronRight, Star, Clock, Bike, ArrowLeft, Flame } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Restaurant, MenuItem } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface MenuViewProps {
  restaurant: Restaurant;
  menuItems: MenuItem[];
}

export default function MenuView({ restaurant, menuItems }: MenuViewProps) {
  const { addToCart, loading: cartLoading } = useCart();
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedAddonNames, setSelectedAddonNames] = useState<string[]>([]);
  const [selectedSizeName, setSelectedSizeName] = useState<string>('');
  const [selectedObservation, setSelectedObservation] = useState('');
  const [isAddonDialogOpen, setIsAddonDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const resetCustomizationState = () => {
    setSelectedItem(null);
    setSelectedAddonNames([]);
    setSelectedSizeName('');
    setSelectedObservation('');
  };

  const openCustomizationDialog = (item: MenuItem) => {
    setSelectedItem(item);
    setSelectedAddonNames([]);
    setSelectedSizeName(item.sizes?.[0]?.name || '');
    setSelectedObservation('');
    setIsAddonDialogOpen(true);
  };

  const handleConfirmAddons = () => {
    if (!selectedItem) return;
    const selectedAddons = (selectedItem.addons || []).filter((addon) =>
      selectedAddonNames.includes(addon.name)
    );
    const selectedSize = selectedItem.sizes?.find((size) => size.name === selectedSizeName);
    addToCart(selectedItem, selectedAddons, selectedSize, selectedObservation);
    setIsAddonDialogOpen(false);
    resetCustomizationState();
  };

  // Build categories
  const categories = ['Todos', ...Array.from(new Set(menuItems.map((i) => i.category || 'Outros')))];

  const filteredItems =
    selectedCategory === 'Todos'
      ? menuItems
      : menuItems.filter((i) => (i.category || 'Outros') === selectedCategory);

  const menuByCategory =
    selectedCategory === 'Todos'
      ? filteredItems.reduce((acc, item) => {
          const cat = item.category || 'Outros';
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(item);
          return acc;
        }, {} as Record<string, MenuItem[]>)
      : { [selectedCategory]: filteredItems };

  const promotedItems = menuItems.filter((i) => i.promoted);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#e5f8d6]">
      <div className="absolute inset-0 -z-20">
        <Image
          src="/516e33fc-cdf5-4c05-928b-a1e0529dbaab.png"
          alt="Padrão de fundo verde"
          fill
          priority
          className="object-cover opacity-35"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/55 via-white/70 to-[#eef9e3]/90" />

      {/* Hero / Restaurant Banner */}
      <div className="relative mx-auto mb-6 max-w-6xl overflow-hidden rounded-b-[2rem] bg-white/85 shadow-[0_24px_80px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="relative h-56 w-full sm:h-64 lg:h-72">
          {restaurant.bannerUrl ? (
            <Image
              src={restaurant.bannerUrl}
              alt={restaurant.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center">
              <span className="text-white text-6xl font-bold opacity-20 select-none">
                {restaurant.name?.charAt(0)}
              </span>
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Restaurant Info */}
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1 sm:text-3xl">{restaurant.name}</h1>
              <p className="text-gray-500 text-sm mb-3 max-w-2xl">{restaurant.cuisineType || restaurant.description || 'Restaurante'}</p>
            </div>
            {restaurant.logoUrl && (
              <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow border border-gray-100 flex-shrink-0">
                <Image src={restaurant.logoUrl} alt="Logo" fill className="object-cover" />
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold text-gray-800">{restaurant.rating ?? '—'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-green-500" />
              <span>{restaurant.deliveryTime ?? '25–40 min'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bike className="w-4 h-4 text-green-500" />
              <span>{restaurant.deliveryFee != null ? `R$ ${Number(restaurant.deliveryFee).toFixed(2)}` : 'Grátis'}</span>
            </div>
            {restaurant.hours && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{restaurant.hours}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-32 sm:px-6">
        {/* Promoted section */}
        {promotedItems.length > 0 && selectedCategory === 'Todos' && (
          <div className="mb-8 rounded-[1.75rem] bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-bold text-gray-900">Destaques</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {promotedItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openCustomizationDialog(item)}
                  className="flex overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative w-28 flex-shrink-0">
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" data-ai-hint={item.imageHint} />
                  </div>
                  <div className="p-3 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-0.5">
                        <span className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</span>
                        <Badge className="bg-orange-100 text-orange-600 border-0 text-[10px] px-1.5 py-0 flex-shrink-0">Destaque</Badge>
                      </div>
                      <p className="text-gray-500 text-xs line-clamp-2">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-gray-900">R$ {item.price.toFixed(2)}</span>
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <PlusCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Chips */}
        <div className="sticky top-16 z-20 mb-6 -mx-4 bg-gradient-to-b from-white/80 to-transparent px-4 py-2 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  selectedCategory === cat
                    ? 'bg-green-500 text-white border-green-500 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid by Category */}
        {Object.entries(menuByCategory).map(([category, items]) => (
          <div key={category} className="mb-10">
            {(selectedCategory === 'Todos' || Object.keys(menuByCategory).length > 1) && (
              <h2 className="text-xl font-bold text-gray-900 mb-4 drop-shadow-sm">{category}</h2>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white/90 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative h-44 w-full sm:h-48">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      data-ai-hint={item.imageHint}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1 leading-tight">{item.name}</h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-lg font-bold text-gray-900">
                        R$ {item.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => openCustomizationDialog(item)}
                        disabled={cartLoading}
                        className="flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50"
                      >
                        {cartLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <PlusCircle className="w-3.5 h-3.5" />
                        )}
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">Nenhum item nesta categoria.</p>
          </div>
        )}
      </div>

      {/* Addon Dialog */}
      <Dialog open={isAddonDialogOpen} onOpenChange={setIsAddonDialogOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-2xl rounded-3xl sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Monte seu pedido</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Ajuste os detalhes de <span className="font-medium text-gray-700">{selectedItem?.name}</span> e deixe uma observação se precisar.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-1 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div className="space-y-3">
              <div className="rounded-2xl bg-muted/40 p-4">
                <p className="text-sm font-semibold text-gray-800">Observações</p>
                <p className="text-xs text-gray-500 mb-2">Ex.: sem cebola, ponto da carne, molho à parte.</p>
                <Textarea
                  value={selectedObservation}
                  onChange={(e) => setSelectedObservation(e.target.value)}
                  placeholder="Escreva aqui sua observação"
                  className="min-h-[96px] resize-none rounded-2xl border-gray-200 bg-white"
                />
              </div>

            {selectedItem?.sizes && selectedItem.sizes.length > 0 && (
              <div className="space-y-3 rounded-xl border border-gray-200 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">Escolha o tamanho</p>
                  <p className="text-xs text-gray-400">Os tamanhos têm preços diferentes.</p>
                </div>
                <RadioGroup value={selectedSizeName} onValueChange={setSelectedSizeName} className="space-y-2">
                  {selectedItem.sizes.map((size) => (
                    <label key={size.name} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                      <RadioGroupItem value={size.name} />
                      <div className="flex-1 flex items-center justify-between gap-3">
                        <span className="font-medium text-gray-800 text-sm">{size.name}</span>
                        <span className="text-sm text-green-600 font-semibold">R$ {size.price.toFixed(2)}</span>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            )}
            </div>

            {selectedItem?.addons && selectedItem.addons.length > 0 ? (
              (() => {
                const cats = Array.from(new Set((selectedItem.addons || []).map((a) => a.category || 'Geral')));
                return (
                  <div className="space-y-3 rounded-2xl border border-gray-200 p-3 sm:p-4">
                    {cats.map((cat) => (
                      <div key={cat} className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">{cat}</p>
                        <div className="space-y-2">
                          {(selectedItem.addons || []).filter((a) => (a.category || 'Geral') === cat).map((addon) => {
                            const checked = selectedAddonNames.includes(addon.name);
                            return (
                              <label
                                key={addon.name}
                                className="flex items-start gap-3 rounded-2xl border border-gray-200 p-3 cursor-pointer transition-colors hover:bg-gray-50"
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(value) => {
                                    setSelectedAddonNames((curr) =>
                                      value ? [...curr, addon.name] : curr.filter((n) => n !== addon.name)
                                    );
                                  }}
                                  className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 mt-1"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium text-gray-800 text-sm truncate">{addon.name}</span>
                                    <span className="text-sm text-green-600 font-semibold">+ R$ {addon.price.toFixed(2)}</span>
                                  </div>
                                  {addon.quantity && (
                                    <p className="text-xs text-gray-400">{addon.quantity} {addon.unit}</p>
                                  )}
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            ) : (
              <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
                Este prato não possui adicionais. Confirme para adicionar ao carrinho.
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="ghost"
              onClick={() => setIsAddonDialogOpen(false)}
              className="w-full rounded-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAddons}
              disabled={!selectedItem}
              className="w-full rounded-full bg-green-500 hover:bg-green-600 sm:w-auto"
            >
              Adicionar ao carrinho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
