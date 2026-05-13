"use client";

import { Home, ShoppingCart, ClipboardList, Loader2, UtensilsCrossed, User } from 'lucide-react';
import { CartProvider, useCart } from '@/hooks/use-cart';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Restaurant, MenuItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { MinusCircle, PlusCircle, Trash2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/types';
import { useUser, useCollectionQuery, useFirestore, useCollection } from '@/firebase';
import { addDoc, collection, serverTimestamp, doc, getDoc, updateDoc, increment, runTransaction, getDocs, query, where } from 'firebase/firestore';
import type { StockItem } from '@/types';
import { convertMeasurementQuantity, normalizeMeasurementUnit } from '@/lib/measurement';

const findMatchingStockItem = (stockItems: StockItem[], ingredientUnit: string) => {
  const normalizedIngredientUnit = normalizeMeasurementUnit(ingredientUnit);
  const exactMatch = stockItems.find((item) => normalizeMeasurementUnit(item.unit) === normalizedIngredientUnit);

  if (exactMatch) {
    return exactMatch;
  }

  return stockItems.find((item) => convertMeasurementQuantity(1, normalizedIngredientUnit, item.unit) !== null);
};


// We need to wrap the layout in the CartProvider so all pages have access to the cart
export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <ClientLayout>{children}</ClientLayout>
    </CartProvider>
  );
}


function ClientLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const restaurantCode = params.restaurantCode as string;
  const pathname = usePathname();
  const router = useRouter();
  const firestore = useFirestore();

  const {user: customer, loading: userLoading} = useUser();
  const {data: restaurants, loading: restaurantLoading} = useCollectionQuery<Restaurant>('restaurants', [{field: 'code', operator: '==', value: restaurantCode}]);
  const restaurant = restaurants?.[0];

  const {data: customerOrders, loading: ordersLoading} = useCollectionQuery<Order>(
      (restaurant?.id && customer?.uid) ? 'orders' : '',
      [
        {field: 'customerUid', operator: '==', value: customer?.uid || ''}, 
        {field: 'restaurantId', operator: '==', value: restaurant?.id || ''}
      ]
  );
  
  const hasOrders = customerOrders && customerOrders.length > 0;

  const { cartItems, cartTotal, removeFromCart, updateQuantity, clearCart, itemCount, loading: cartLoading } = useCart();
  const { toast } = useToast();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [orderNote, setOrderNote] = useState('');

  useEffect(() => {
    // Redirect to login if not authenticated and not on auth pages
    if (!userLoading && !customer && !pathname.includes('/login') && !pathname.includes('/signup')) {
      router.push(`/${restaurantCode}/login`);
    }
  }, [customer, userLoading, restaurantCode, router, pathname]);

  // load saved customer address if any
  useEffect(() => {
    const fetchAddress = async () => {
      if (!customer) return;
      try {
        const userDocRef = doc(firestore, 'users', customer.uid);
        const userSnap = await getDoc(userDocRef);
        const data = userSnap.data();
        if (data && data.address) setAddress(data.address as string);
      } catch (e) {
        console.warn('Could not fetch user address', e);
      }
    };
    fetchAddress();
  }, [customer, firestore]);

  const handlePlaceOrder = async () => {
    if (!customer) {
      toast({ title: "Erro", description: "Você precisa estar logado para fazer um pedido.", variant: "destructive"});
      router.push(`/${restaurantCode}/login`);
      return;
    }
    if (!restaurant) {
      toast({ title: "Erro", description: "Restaurante não encontrado.", variant: "destructive"});
      return;
    }

    // Find the restaurant owner UID to access the menu (for ingredients)
    const restaurantsRef = collection(firestore, 'restaurants');
    const q = query(restaurantsRef, where('code', '==', restaurantCode));
    const restaurantSnap = await getDocs(q);
    const restaurantDoc = restaurantSnap.docs[0];
    const ownerUid = restaurantDoc?.data()?.ownerUid;

    const newOrder: Omit<Order, 'id'> = {
      restaurantId: restaurant.id,
      customerUid: customer.uid,
      customer: {
        name: customer.displayName || 'Anonymous',
        email: customer.email || 'no-email'
      },
      items: cartItems.map(ci => ({
          menuItemId: ci.menuItem.id,
          name: ci.menuItem.name,
          quantity: ci.quantity,
          price: ci.menuItem.price,
          category: ci.menuItem.category,
          selectedSize: ci.selectedSize,
          addons: ci.selectedAddons || [],
            observation: ci.observation,
      })),
      total: cartTotal,
      status: 'new' as const,
      timestamp: serverTimestamp(),
          customerNote: orderNote.trim() || undefined,
    };

    try {
        const ordersCollectionRef = collection(firestore, 'orders');
        // attach delivery info
        const orderWithDelivery = {
          ...newOrder,
          deliveryType: deliveryType,
          deliveryAddress: deliveryType === 'delivery' ? address : undefined,
        };

        await addDoc(ordersCollectionRef, orderWithDelivery);

        // Deduct stock based on ingredients of each ordered item
        if (ownerUid) {
          try {
            for (const cartItem of cartItems) {
              // Fetch menu item to get its ingredients
              const menuItemRef = doc(firestore, `restaurants/${ownerUid}/menu`, cartItem.menuItem.id);
              const menuItemSnap = await getDoc(menuItemRef);
              const menuItemData = menuItemSnap.data() as MenuItem | undefined;
              
              if (menuItemData?.ingredients && menuItemData.ingredients.length > 0) {
                for (const ingredient of menuItemData.ingredients) {
                  // Find stock item by name (case insensitive)
                  const stockRef = collection(firestore, `restaurants/${ownerUid}/stock`);
                  const stockQuery = query(stockRef, where('name', '==', ingredient.name));
                  const stockSnap = await getDocs(stockQuery);
                  const stockItems = stockSnap.docs.map((snapshot) => ({
                    id: snapshot.id,
                    ...(snapshot.data() as Omit<StockItem, 'id'>),
                  }));
                  const stockItem = findMatchingStockItem(stockItems, ingredient.unit);
                  
                  if (stockItem) {
                    const stockDocRef = stockSnap.docs.find((snapshot) => snapshot.id === stockItem.id)?.ref;
                    const deduction = convertMeasurementQuantity(
                      ingredient.quantity * cartItem.quantity,
                      ingredient.unit,
                      stockItem.unit
                    );

                    if (deduction === null || !stockDocRef) {
                      console.warn(`No compatible unit conversion for ingredient ${ingredient.name}`);
                      continue;
                    }

                    await updateDoc(stockDocRef, {
                      currentStock: increment(-deduction),
                      lastUpdated: serverTimestamp(),
                    });
                  }
                }
              }

              if (cartItem.selectedAddons && cartItem.selectedAddons.length > 0) {
                for (const addon of cartItem.selectedAddons) {
                  const stockRef = collection(firestore, `restaurants/${ownerUid}/stock`);
                  const stockQuery = query(stockRef, where('name', '==', addon.name));
                  const stockSnap = await getDocs(stockQuery);

                  if (stockSnap.empty) continue;

                  const stockItems = stockSnap.docs.map((snapshot) => ({
                    id: snapshot.id,
                    ...(snapshot.data() as Omit<StockItem, 'id'>),
                  }));
                  const stockItem = findMatchingStockItem(stockItems, addon.unit);

                  if (!stockItem) continue;

                  const stockDocRef = stockSnap.docs.find((snapshot) => snapshot.id === stockItem.id)?.ref;
                  const deduction = convertMeasurementQuantity(
                    addon.quantity * cartItem.quantity,
                    addon.unit,
                    stockItem.unit
                  );

                  if (deduction === null || !stockDocRef) continue;

                  await updateDoc(stockDocRef, {
                    currentStock: increment(-deduction),
                    lastUpdated: serverTimestamp(),
                  });
                }
              }
            }
          } catch (stockError) {
            // Stock deduction is best-effort; don't fail the order
            console.warn("Stock deduction error (non-critical):", stockError);
          }
        }

        // Clear the cart in firestore
        await clearCart();

        // If delivery chosen, persist the customer's address for later
        if (deliveryType === 'delivery' && customer) {
          try {
            const userDocRef = doc(firestore, 'users', customer.uid);
            await updateDoc(userDocRef, { address });
          } catch (e) {
            console.warn('Failed to save customer address', e);
          }
        }

        toast({
          title: "Pedido realizado!",
          description: "Seu pedido foi enviado para a cozinha.",
        });
        
        setIsCartOpen(false); // Close the sheet
        setOrderNote('');
        router.push(`/${restaurantCode}/confirmation`);

    } catch (error) {
        console.error("Error placing order: ", error);
        toast({ title: "Erro", description: "Não foi possível realizar o pedido.", variant: "destructive"});
    }
  };

  const loading = restaurantLoading || userLoading || cartLoading;

  if (loading && !restaurant) { // only show global loader if restaurant is not yet loaded
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (pathname.includes('/login') || pathname.includes('/signup') || pathname.includes('/confirmation') || pathname.includes('/not-found') || !restaurant) {
      return <>{children}</>;
  }
    return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <div className="relative min-h-screen overflow-hidden bg-[#e5f8d6] pb-24">
          <div className="absolute inset-0 -z-20">
            <Image
              src="/516e33fc-cdf5-4c05-928b-a1e0529dbaab.png"
              alt="Padrão de fundo verde"
              fill
              priority
              className="object-cover opacity-35"
            />
          </div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/65 via-white/70 to-[#eef9e3]/90" />
        <header className="sticky top-0 z-40 border-b border-white/60 bg-white/75 backdrop-blur-xl">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href={`/${restaurantCode}`} className="flex items-center gap-2">
              <UtensilsCrossed className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold font-headline">{restaurant.name}</h1>
            </Link>
             {customer && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground"/>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {customer.displayName || customer.email}
                </p>
              </div>
             )}
          </div>
        </header>

        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            {children}
        </main>
        
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/60 bg-white/85 shadow-[0_-12px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 items-center h-16">
              <Link href={`/${restaurantCode}`} className={`flex flex-col items-center justify-center gap-1 text-muted-foreground ${pathname === `/${restaurantCode}` ? 'text-primary' : ''}`}>
                  <Home className="h-6 w-6" />
                  <span className="text-xs font-medium">Cardápio</span>
              </Link>
              
              <SheetTrigger asChild>
                <button className="flex flex-col items-center justify-center gap-1 text-muted-foreground relative">
                  {cartLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <ShoppingCart className="h-6 w-6" />}
                  <span className="text-xs font-medium">Carrinho</span>
                  {itemCount > 0 && (
                      <span className="absolute -top-1 right-1/2 translate-x-4 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                          {itemCount}
                      </span>
                  )}
                </button>
              </SheetTrigger>

              <Link href={hasOrders ? `/${restaurantCode}/orders` : '#'} onClick={(e) => !hasOrders && e.preventDefault()} className={`flex flex-col items-center justify-center gap-1 text-muted-foreground ${pathname.includes('/orders') ? 'text-primary' : ''} ${!hasOrders ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <ClipboardList className="h-6 w-6" />
                  <span className="text-xs font-medium">Pedidos</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

       <SheetContent className="flex w-[100vw] flex-col bg-white/95 backdrop-blur-xl sm:max-w-xl lg:max-w-2xl">
          <SheetHeader>
              <SheetTitle className="text-2xl font-headline">Seu Pedido</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-3">
              <label className={`cursor-pointer rounded-2xl border px-3 py-3 text-sm font-medium transition-colors ${deliveryType === 'pickup' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 bg-white'}`}>
                <input type="radio" name="delivery" value="pickup" checked={deliveryType === 'pickup'} onChange={() => setDeliveryType('pickup')} className="mr-2 accent-primary" /> Retirar
              </label>
              <label className={`cursor-pointer rounded-2xl border px-3 py-3 text-sm font-medium transition-colors ${deliveryType === 'delivery' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 bg-white'}`}>
                <input type="radio" name="delivery" value="delivery" checked={deliveryType === 'delivery'} onChange={() => setDeliveryType('delivery')} className="mr-2 accent-primary" /> Entrega
              </label>
            </div>

            {deliveryType === 'delivery' && (
              <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Endereço de entrega</p>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingAddress(true)}>{address ? 'Editar' : 'Adicionar'}</Button>
                </div>
                {!isEditingAddress ? (
                  <p className="text-sm text-muted-foreground mt-2">{address || 'Nenhum endereço salvo.'}</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, complemento, bairro" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={async () => {
                        if (!customer) return;
                        try { await updateDoc(doc(firestore, 'users', customer.uid), { address }); toast({ title: 'Endereço salvo' }); setIsEditingAddress(false); } catch (e) { toast({ title: 'Erro', description: 'Não foi possível salvar o endereço.', variant: 'destructive' }); }
                      }}>Salvar</Button>
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingAddress(false)}>Cancelar</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-medium">Observações do pedido</p>
              <p className="text-xs text-muted-foreground">Ex.: sem talheres, enviar molho à parte ou orientar a cozinha.</p>
              <Textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Escreva uma observação geral para o pedido"
                className="min-h-[96px] resize-none rounded-2xl"
              />
            </div>
          </div>
          <Separator />
          {cartItems.length > 0 ? (
              <div className="flex-grow overflow-y-auto -mx-6 px-6 my-4 space-y-4">
                  {cartItems.map(cartItem => (
                      <div key={cartItem.id} className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                          <Image src={cartItem.menuItem.imageUrl} alt={cartItem.menuItem.name} width={72} height={72} className="h-18 w-18 rounded-2xl object-cover"/>
                          <div className="min-w-0 flex-grow">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold leading-tight">{cartItem.menuItem.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    R${(cartItem.selectedSize?.price ?? cartItem.menuItem.price).toFixed(2)}
                                  </p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeFromCart(cartItem.id)} aria-label="Remove item" className="h-8 w-8 shrink-0">
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                              </div>
                          {cartItem.selectedAddons && cartItem.selectedAddons.length > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Adicionais: {cartItem.selectedAddons.map((addon) => addon.name).join(', ')}
                            </p>
                          )}
                          {cartItem.selectedSize && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Tamanho: {cartItem.selectedSize.name}
                            </p>
                          )}
                          {cartItem.observation && (
                            <p className="mt-1 text-xs text-foreground/80">
                              Obs.: {cartItem.observation}
                            </p>
                          )}
                              <div className="mt-2 flex items-center gap-2">
                                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}>
                                      <MinusCircle className="h-4 w-4"/>
                                  </Button>
                                  <span className="w-6 text-center text-sm font-semibold">{cartItem.quantity}</span>
                                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}>
                                      <PlusCircle className="h-4 w-4"/>
                                  </Button>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center text-muted-foreground">
                  <ShoppingCart className="h-16 w-16 mb-4" />
                  <p>Seu carrinho está vazio.</p>
                  <p className="text-sm">Adicione itens do cardápio para começar.</p>
              </div>
          )}
          <Separator />
          <SheetFooter className="mt-auto gap-3 pt-4 sm:flex-row sm:justify-between">
                <div className="text-lg font-bold">
                  Total: <span className="text-primary">R${cartTotal.toFixed(2)}</span>
              </div>
              <Button className="w-full rounded-full sm:w-auto" onClick={handlePlaceOrder} disabled={cartItems.length === 0}>
                  Finalizar Pedido <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
          </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
