"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export default function AddressesPage() {
    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>Saved addresses</CardTitle>
                <CardDescription>
                    Store shipping addresses for faster checkout.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <MapPin className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium">No saved addresses yet</p>
                    <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                        Add your first shipping address to skip typing it every time
                        you check out.
                    </p>
                    <Button className="mt-4" disabled>
                        Add address (coming soon)
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
