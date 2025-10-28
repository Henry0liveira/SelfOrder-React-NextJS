"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QrCode, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { findRestaurantByCode } from '@/lib/mock-data';

export default function CustomerPortal() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleFindMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      toast({
        title: 'Error',
        description: 'Please enter a restaurant code.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      // This function now reads from localStorage, ensuring it finds newly created restaurants
      const restaurant = findRestaurantByCode(code);
      if (restaurant) {
        router.push(`/${restaurant.code}`);
      } else {
        toast({
          title: 'Restaurant not found',
          description: `We couldn't find a menu for code "${code}". Please check the code and try again.`,
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <form onSubmit={handleFindMenu} className="space-y-4">
      <div className="relative">
        <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Enter Restaurant Code"
          className="pl-10 text-lg h-12"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          aria-label="Restaurant Code"
          disabled={isLoading}
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
        {isLoading ? 'Finding...' : 'Find Menu'}
        {!isLoading && <ArrowRight className="ml-2" />}
      </Button>
    </form>
  );
}
