
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, UtensilsCrossed, PlusCircle, ArrowLeft } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { restaurantData } from '@/lib/mock-data';
import type { Restaurant } from '@/types';

export default function StaffLoginPage() {
  const [email, setEmail] = useState('staff@coral.cafe');
  const [password, setPassword] = useState('password');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Prime localStorage with mock data if it's not already there.
    // This ensures the demo login always works.
    if (!localStorage.getItem('restaurants')) {
      localStorage.setItem('restaurants', JSON.stringify(restaurantData));
    }
  }, []);


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const storedRestaurants = localStorage.getItem('restaurants');
      const allRestaurants: Restaurant[] = storedRestaurants ? JSON.parse(storedRestaurants) : [];

      const restaurant = allRestaurants.find(
        (r) => r.email.toLowerCase() === email.toLowerCase() && r.password === password
      );
      
      if (restaurant) {
        localStorage.setItem('loggedInRestaurant', JSON.stringify(restaurant));
        
        toast({
          title: 'Login Successful',
          description: "Welcome back! Redirecting to your dashboard...",
        });
        router.push('/staff/dashboard');
      } else {
        toast({
          title: 'Login Failed',
          description: 'Invalid credentials. Please try again.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    }, 1000);
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
          <CardTitle className="text-3xl font-headline">Staff Portal</CardTitle>
          <CardDescription>Log in to manage your restaurant</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Logging In...' : 'Log In'}
              {!isLoading && <LogIn className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <Separator className="my-6" />

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Não tem uma conta?</p>
            <Button variant="outline" className="w-full" asChild>
                <Link href="/staff/create-restaurant">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Criar restaurante
                </Link>
            </Button>
          </div>

          <Button variant="link" className="w-full mt-4" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Use email <code className="font-bold bg-muted p-1 rounded">staff@coral.cafe</code> and password <code className="font-bold bg-muted p-1 rounded">password</code> for demo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
