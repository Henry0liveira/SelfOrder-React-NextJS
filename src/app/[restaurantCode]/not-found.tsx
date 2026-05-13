import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UtensilsCrossed, AlertTriangle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/50 p-4 text-center">
        <div className="inline-flex items-center justify-center bg-destructive rounded-full p-4 mb-4 shadow-lg">
          <AlertTriangle className="h-10 w-10 text-destructive-foreground" />
        </div>
      <h2 className="text-3xl font-bold font-headline mb-2">Restaurant Not Found</h2>
      <p className="text-muted-foreground mb-6 max-w-sm">We couldn't find a menu for the code you entered. Please check the code and try again.</p>
      <Button asChild>
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  )
}
