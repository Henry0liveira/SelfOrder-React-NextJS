
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, UserPlus } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import type { Restaurant, CustomerAccount } from '@/types';
import { findRestaurantByCode } from '@/lib/mock-data';
import Link from 'next/link';


export default function CustomerSignUpPage() {
  const params = useParams();
  const restaurantCode = params.restaurantCode as string;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [allowPromotions, setAllowPromotions] = useState(false);
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

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast({
        title: 'Missing information',
        description: 'Please fill out all required fields.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);

    setTimeout(() => {
        const customerAccounts: CustomerAccount[] = JSON.parse(localStorage.getItem('customerAccounts') || '[]');
        
        const emailExists = customerAccounts.some(c => c.email.toLowerCase() === email.toLowerCase());
        if(emailExists) {
            toast({
                title: "Account already exists",
                description: "An account with this email already exists. Please log in.",
                variant: 'destructive'
            });
            setIsLoading(false);
            router.push(`/${restaurantCode}/login`);
            return;
        }

      const newCustomer: CustomerAccount = { name, email, password, phone, allowPromotions };
      const updatedAccounts = [...customerAccounts, newCustomer];
      localStorage.setItem('customerAccounts', JSON.stringify(updatedAccounts));
      
      localStorage.setItem(`customerData-${restaurantCode}`, JSON.stringify(newCustomer));
      
      toast({
        title: 'Account Created!',
        description: `Welcome, ${name}! Redirecting you to the menu.`,
      });
      
      router.push(`/${restaurantCode}`);
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/50">
      <Card className="w-full max-w-md mx-4 shadow-2xl">
        <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center bg-primary rounded-full p-3 shadow-lg mx-auto mb-4">
                <UserPlus className="h-8 w-8 text-primary-foreground" />
            </div>
          <CardTitle className="text-3xl font-headline">Create your Account</CardTitle>
          <CardDescription>
            to order from <span className="font-semibold text-primary">{restaurant?.name || '...'}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-6">
             <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
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
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 90000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="promotions" checked={allowPromotions} onCheckedChange={(checked) => setAllowPromotions(checked as boolean)} />
                <Label htmlFor="promotions" className="text-sm font-normal text-muted-foreground">
                    I agree to receive promotions via email.
                </Label>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Sign Up & See Menu'}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>
           <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <Link href={`/${restaurantCode}/login`} className="underline text-primary">
                    Log In
                </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

