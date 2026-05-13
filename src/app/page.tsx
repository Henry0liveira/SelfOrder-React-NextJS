import Image from "next/image";
import Link from "next/link";
import { UtensilsCrossed, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CustomerPortal from "@/components/customer-portal";
import RestaurantBrowserCard from "@/components/restaurant-browser-card";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 sm:p-6 md:p-8">
      <div className="absolute inset-0 -z-20">
        <Image
          src="/516e33fc-cdf5-4c05-928b-a1e0529dbaab.png"
          alt="Wallpaper verde com frutas"
          fill
          priority
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/70 via-white/78 to-[#f2fbeb]/92" />

      <div className="text-center mb-12 max-w-3xl rounded-[2rem] border border-white/60 bg-white/55 px-6 py-8 shadow-[0_20px_80px_rgba(0,0,0,0.12)] backdrop-blur-md sm:px-10">
        <div className="inline-flex items-center justify-center rounded-full bg-primary p-4 mb-4 shadow-lg">
          <UtensilsCrossed className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-5xl md:text-6xl font-headline font-bold text-primary tracking-tighter drop-shadow-sm">
          SelfOrder
        </h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-md mx-auto">
          A maneira mais simples de realizar pedidos.
        </p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 md:gap-8">
        <Card className="flex h-full flex-col border-white/60 bg-white/75 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-in-out hover:scale-[1.02]">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Para clientes</CardTitle>
            <CardDescription>Digite o código de um restaurante</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <CustomerPortal />
          </CardContent>
        </Card>
        
        <Card className="flex h-full flex-col border-white/60 bg-white/75 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-in-out hover:scale-[1.02]">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Para restaurantes</CardTitle>
            <CardDescription>Gerencie seus pedidos e cardápio</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col pt-2">
            <div className="flex h-full flex-col justify-between gap-4">
              <div className="rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                Acesse o painel administrativo para acompanhar pedidos e gerenciar seu restaurante.
              </div>
              <Button type="button" size="lg" className="w-full h-12" asChild>
                <Link href="/staff/login">
                  Staff Login <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <RestaurantBrowserCard />

      <footer className="mt-16 text-center text-muted-foreground text-sm rounded-full bg-white/45 px-4 py-2 backdrop-blur-sm">
        <p>Copyright © {new Date().getFullYear()} MenuQR. All Rights Reserved.</p>
      </footer>
    </main>
  );
}
