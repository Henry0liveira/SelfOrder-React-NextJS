"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LogIn, UtensilsCrossed } from 'lucide-react';
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

export default function StaffLoginPage() {
  const [restaurantId, setRestaurantId] = useState('CORAL123');
  const [password, setPassword] = useState('password');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API authentication
    setTimeout(() => {
      if (restaurantId === 'CORAL123' && password === 'password') {
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
              <Label htmlFor="restaurantId">Restaurant Code</Label>
              <Input
                id="restaurantId"
                type="text"
                placeholder="e.g., CORAL123"
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value.toUpperCase())}
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
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Use code <code className="font-bold bg-muted p-1 rounded">CORAL123</code> and password <code className="font-bold bg-muted p-1 rounded">password</code> for demo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
