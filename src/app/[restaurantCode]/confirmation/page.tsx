import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, PartyPopper } from 'lucide-react';

export default function ConfirmationPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/30 p-4">
      <Card className="w-full max-w-lg text-center shadow-2xl animate-in fade-in-50 zoom-in-90 duration-500">
        <CardHeader>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-4xl font-bold font-headline text-primary">
            Order Confirmed!
          </CardTitle>
          <CardDescription className="text-lg">
            Thank you for your order.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Your order has been sent to the kitchen and will be prepared shortly. You'll be notified when it's ready for pickup.
          </p>
          <div className="flex items-center justify-center text-accent">
            <PartyPopper className="mr-2" />
            <span>Enjoy your meal!</span>
            <PartyPopper className="ml-2" />
          </div>
          <Button asChild size="lg" className="w-full max-w-xs mx-auto">
            <Link href="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
