import Link from "next/link";
import { UtensilsCrossed, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CustomerPortal from "@/components/customer-portal";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-secondary/50 p-4 sm:p-6 md:p-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center bg-primary rounded-full p-4 mb-4 shadow-lg">
          <UtensilsCrossed className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-5xl md:text-6xl font-headline font-bold text-primary tracking-tighter">
          MenuQR
        </h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-md mx-auto">
          The simplest way to view menus and place orders.
        </p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="transform hover:scale-105 transition-transform duration-300 ease-in-out shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">For Customers</CardTitle>
            <CardDescription>Enter a restaurant code to view the menu and order.</CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerPortal />
          </CardContent>
        </Card>
        
        <Card className="transform hover:scale-105 transition-transform duration-300 ease-in-out shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">For Restaurants</CardTitle>
            <CardDescription>Manage your menu and track incoming orders.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-full pt-6">
            <Link href="/staff/login" legacyBehavior passHref>
              <Button size="lg" className="w-full">
                Staff Login <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-16 text-center text-muted-foreground text-sm">
        <p>Copyright © {new Date().getFullYear()} MenuQR. All Rights Reserved.</p>
      </footer>
    </main>
  );
}
