
"use client";

import Image from 'next/image';
import { PlusCircle } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Restaurant, MenuItem } from '@/types';

interface MenuViewProps {
    restaurant: Restaurant;
    menuItems: MenuItem[];
}

export default function MenuView({ restaurant, menuItems }: MenuViewProps) {
    const { addToCart } = useCart();
    
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
                                    <Button onClick={() => addToCart(item)} size="sm">
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
