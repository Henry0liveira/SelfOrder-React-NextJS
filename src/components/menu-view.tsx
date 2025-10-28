"use client";

import Image from 'next/image';
import { PlusCircle, ShoppingCart, Trash2, MinusCircle, ArrowRight } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import type { Restaurant, Order } from '@/types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface MenuViewProps {
    restaurant: Restaurant;
}

export default function MenuView({ restaurant }: MenuViewProps) {
    const { cartItems, addToCart, cartTotal, itemCount, removeFromCart, updateQuantity, clearCart } = useCart();
    const router = useRouter();
    const { toast } = useToast();
    
    const menuByCategory = restaurant.menu.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, typeof restaurant.menu>);

    const handlePlaceOrder = () => {
      const newOrder: Omit<Order, 'id'> = {
        restaurantId: restaurant.id,
        items: cartItems,
        total: cartTotal,
        status: 'new',
        timestamp: new Date(),
      };

      // In a real app, this would send to a backend.
      // We'll use localStorage for this demo.
      const existingOrders: Order[] = JSON.parse(localStorage.getItem('orders') || '[]').map((o: any) => ({...o, timestamp: new Date(o.timestamp)}));
      const fullOrder: Order = {
        ...newOrder,
        id: `ORD${1001 + existingOrders.length}`,
      }
      localStorage.setItem('orders', JSON.stringify([fullOrder, ...existingOrders]));

      toast({
        title: "Order Placed!",
        description: "Your order has been sent to the kitchen.",
      });
      clearCart();
      router.push(`/${restaurant.code}/order/${fullOrder.id}`);
    };

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
                                    <Button onClick={() => addToCart(item)} size="sm">
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
            
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl animate-bounce"
                        size="icon"
                        aria-label={`View cart with ${itemCount} items`}
                    >
                        <ShoppingCart className="h-8 w-8" />
                        {itemCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                                {itemCount}
                            </span>
                        )}
                    </Button>
                </SheetTrigger>
                <SheetContent className="flex flex-col">
                    <SheetHeader>
                        <SheetTitle className="text-2xl font-headline">Your Order</SheetTitle>
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
                            <p>Your cart is empty.</p>
                            <p className="text-sm">Add items from the menu to get started.</p>
                        </div>
                    )}
                    <Separator />
                    <SheetFooter className="mt-auto pt-4 sm:justify-between">
                         <div className="text-lg font-bold">
                            Total: <span className="text-primary">${cartTotal.toFixed(2)}</span>
                        </div>
                        <SheetClose asChild>
                            <Button className="w-full sm:w-auto" onClick={handlePlaceOrder} disabled={cartItems.length === 0}>
                                Place Order <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </SheetClose>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
