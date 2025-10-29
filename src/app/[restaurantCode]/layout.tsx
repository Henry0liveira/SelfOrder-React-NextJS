

"use client";

import { Home, ShoppingCart, ClipboardList, Loader2 } from 'lucide-react';
import { CartProvider, useCart } from '@/hooks/use-cart';
import { findRestaurantByCode } from '@/lib/mock-data';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Restaurant } from '@/types';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { MinusCircle, PlusCircle, Trash2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Order, CustomerAccount } from '@/types';


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

  const [restaurant, setRestaurant] = useState<Restaurant | null | undefined>(undefined);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const { cartItems, cartTotal, removeFromCart, updateQuantity, clearCart, itemCount } = useCart();
  const { toast } = useToast();
  const [isCartOpen, setIsCartOpen] = useState(false);


  useEffect(() => {
    // Check if customer data exists, if not, redirect to login
    const customerData = localStorage.getItem(`customerData-${restaurantCode}`);
    if (!customerData && !pathname.includes('/login') && !pathname.includes('/signup')) {
      router.push(`/${restaurantCode}/login`);
      return;
    }

    const foundRestaurant = findRestaurantByCode(restaurantCode);
    setRestaurant(foundRestaurant);

    const orders: Order[] = JSON.parse(localStorage.getItem('orders') || '[]');
    const customer = customerData ? (JSON.parse(customerData) as CustomerAccount) : null;
    if (customer) {
      const latestOrderForCustomer = orders
        .filter(o => o.restaurantId === foundRestaurant?.id && o.customer?.email === customer.email)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      if (latestOrderForCustomer) {
        setLastOrderId(latestOrderForCustomer.id);
      }
    }
  }, [restaurantCode, router, pathname]);

  const handlePlaceOrder = () => {
    const customerData = localStorage.getItem(`customerData-${restaurantCode}`);
    if (!customerData) {
      toast({ title: "Error", description: "You must be logged in to place an order.", variant: "destructive"});
      router.push(`/${restaurantCode}/login`);
      return;
    }
    const customer = JSON.parse(customerData) as CustomerAccount;

    const newOrder: Omit<Order, 'id'> = {
      restaurantId: restaurant!.id,
      customer: customer,
      items: cartItems,
      total: cartTotal,
      status: 'new',
      timestamp: new Date(),
    };

    const existingOrders: Order[] = JSON.parse(localStorage.getItem('orders') || '[]').map((o: any) => ({...o, timestamp: new Date(o.timestamp)}));
    const fullOrder: Order = {
      ...newOrder,
      id: `ORD${1001 + existingOrders.length}`,
    }
    localStorage.setItem('orders', JSON.stringify([fullOrder, ...existingOrders]));

    toast({
      title: "Order placed!",
      description: "Your order has been sent to the kitchen.",
    });
    
    setIsCartOpen(false); // Close the sheet
    clearCart();
    router.push(`/${restaurantCode}/order/${fullOrder.id}`);
  };


  if (restaurant === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Don't show layout on login, confirmation, or not-found pages
  if (pathname.includes('/login') || pathname.includes('/signup') || pathname.includes('/confirmation') || pathname.includes('/not-found') || !restaurant) {
      return <>{children}</>;
  }


  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <div className="min-h-screen bg-background pb-24">
        <header className="bg-card border-b sticky top-0 z-40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold font-headline">{restaurant.name}</h1>
            </Link>
          </div>
        </header>

        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            {children}
        </main>
        
        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 items-center h-16">
              <Link href={`/${restaurantCode}`} className={`flex flex-col items-center justify-center gap-1 text-muted-foreground ${pathname === `/${restaurantCode}` ? 'text-primary' : ''}`}>
                  <Home className="h-6 w-6" />
                  <span className="text-xs font-medium">Cardápio</span>
              </Link>
              
              <SheetTrigger asChild>
                <button className="flex flex-col items-center justify-center gap-1 text-muted-foreground relative">
                  <ShoppingCart className="h-6 w-6" />
                  <span className="text-xs font-medium">Carrinho</span>
                  {itemCount > 0 && (
                      <span className="absolute -top-1 right-1/2 translate-x-4 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                          {itemCount}
                      </span>
                  )}
                </button>
              </SheetTrigger>

              <Link href={lastOrderId ? `/${restaurantCode}/order/${lastOrderId}` : '#'} onClick={(e) => !lastOrderId && e.preventDefault()} className={`flex flex-col items-center justify-center gap-1 text-muted-foreground ${pathname.includes('/order/') ? 'text-primary' : ''} ${!lastOrderId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <ClipboardList className="h-6 w-6" />
                  <span className="text-xs font-medium">Pedidos</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

       <SheetContent className="flex flex-col">
          <SheetHeader>
              <SheetTitle className="text-2xl font-headline">Seu Pedido</SheetTitle>
          </SheetHeader>
          <Separator />
          {cartItems.length > 0 ? (
              <div className="flex-grow overflow-y-auto -mx-6 px-6 my-4 space-y-4">
                  {cartItems.map(cartItem => (
                      <div key={cartItem.menuItem.id} className="flex items-center gap-4">
                          <Image src={cartItem.menuItem.imageUrl} alt={cartItem.menuItem.name} width={64} height={64} className="rounded-md object-cover"/>
                          <div className="flex-grow">
                              <p className="font-semibold">{cartItem.menuItem.name}</p>
                              <p className="text-sm text-muted-foreground">${cartItem.menuItem.price.toFixed(2)}</p>
                              <div className="flex items-center gap-2 mt-1">
                                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity - 1)}>
                                      <MinusCircle className="h-4 w-4"/>
                                  </Button>
                                  <span className="w-4 text-center">{cartItem.quantity}</span>
                                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity + 1)}>
                                      <PlusCircle className="h-4 w-4"/>
                                  </Button>
                              </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeFromCart(cartItem.menuItem.id)} aria-label="Remove item">
                              <Trash2 className="h-5 w-5 text-destructive"/>
                          </Button>
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
          <SheetFooter className="mt-auto pt-4 sm:justify-between">
                <div className="text-lg font-bold">
                  Total: <span className="text-primary">${cartTotal.toFixed(2)}</span>
              </div>
              <Button className="w-full sm:w-auto" onClick={handlePlaceOrder} disabled={cartItems.length === 0}>
                  Finalizar Pedido <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
          </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
