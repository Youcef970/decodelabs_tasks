import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur">
        <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Page Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link href="/">
            <Button>Return to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
