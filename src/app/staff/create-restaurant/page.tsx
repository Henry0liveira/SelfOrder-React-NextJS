
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { restaurantData } from '@/lib/mock-data';
import type { Restaurant } from '@/types';

export default function CreateRestaurantPage() {
  const [restaurantName, setRestaurantName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      // Always read the latest from localStorage first
      const storedRestaurants = localStorage.getItem('restaurants');
      // Initialize with mock data if no restaurants are in localStorage, otherwise parse what's there
      const allRestaurants: Restaurant[] = storedRestaurants ? JSON.parse(storedRestaurants) : restaurantData;

      // Check if email already exists in the current list of restaurants
      const emailExists = allRestaurants.some((r) => r.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        toast({
          title: 'Error',
          description: 'An account with this email already exists.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      const newRestaurantCode = `${restaurantName.substring(0, 4).toUpperCase().replace(/\s/g, '')}${Math.floor(100 + Math.random() * 900)}`;

      const newRestaurant: Restaurant = {
        id: `REST${allRestaurants.length + 1}`,
        name: restaurantName,
        code: newRestaurantCode,
        email: email,
        password: password, // In a real app, this should be hashed!
        menu: [], // Start with an empty menu
      };

      const updatedRestaurants = [...allRestaurants, newRestaurant];
      localStorage.setItem('restaurants', JSON.stringify(updatedRestaurants));

      toast({
        title: 'Restaurant Created!',
        description: `Restaurant "${restaurantName}" is now ready. Your code is ${newRestaurantCode}.`,
      });
      
      router.push('/staff/login'); 
    }, 1500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/50">
      <Card className="w-full max-w-md mx-4 shadow-2xl">
        <CardHeader className="text-center">
            <Link href="/" className="inline-block mx-auto mb-4">
                <div className="inline-flex items-center justify-center bg-primary rounded-full p-3 shadow-lg">
                    <UtensilsCrossed className="h-8 w-8 text-primary-foreground" />
                </div>
            </Link>
          <CardTitle className="text-3xl font-headline">Create a New Restaurant</CardTitle>
          <CardDescription>Fill in the details to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Restaurant Name</Label>
              <Input
                id="restaurantName"
                type="text"
                placeholder="e.g., The Tasty Spoon"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Login Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g., staff@yourrestaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Restaurant'}
              {!isLoading && <PlusCircle className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <Button variant="link" className="w-full mt-4" asChild>
            <Link href="/staff/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
