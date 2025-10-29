
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, LogIn, User } from 'lucide-react';
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
import type { Restaurant } from '@/types';
import { findRestaurantByCode } from '@/lib/mock-data';
import Link from 'next/link';

export default function CustomerLoginPage() {
  const params = useParams();
  const restaurantCode = params.restaurantCode as string;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (restaurantCode) {
        const foundRestaurant = findRestaurantByCode(restaurantCode);
        if (foundRestaurant) {
            setRestaurant(foundRestaurant);
        } else {
            router.push('/not-found');
        }
    }
  }, [restaurantCode, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
        const customerAccounts = JSON.parse(localStorage.getItem('customerAccounts') || '[]');
        const customer = customerAccounts.find((c: any) => c.email.toLowerCase() === email.toLowerCase() && c.password === password);

        if (customer) {
            localStorage.setItem(`customerData-${restaurantCode}`, JSON.stringify(customer));
            
            toast({
                title: 'Login Successful!',
                description: `Welcome back, ${customer.name}!`,
            });
            
            router.push(`/${restaurantCode}`);
        } else {
            toast({
                title: 'Login Failed',
                description: 'Invalid email or password. Please try again.',
                variant: 'destructive',
            });
        }
        setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/50">
      <Card className="w-full max-w-md mx-4 shadow-2xl">
        <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center bg-primary rounded-full p-3 shadow-lg mx-auto mb-4">
                <User className="h-8 w-8 text-primary-foreground" />
            </div>
          <CardTitle className="text-3xl font-headline">Customer Login</CardTitle>
          <CardDescription>
            Log in to continue to <span className="font-semibold text-primary">{restaurant?.name || '...'}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
             <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
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
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
              {!isLoading && <LogIn className="ml-2 h-4 w-4" />}
            </Button>
          </form>
           <div className="mt-4 text-center text-sm">
                Don't have an account?{' '}
                <Link href={`/${restaurantCode}/signup`} className="underline text-primary">
                    Sign up
                </Link>
            </div>
           <Button variant="link" className="w-full mt-2" asChild>
            <Link href="/">
              Back to Home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
