import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type Props = {
    id: number;
    title: string;
    price: number;
    image: string;
    category: string;
};

export function ProductCard({ id, title, price, image, category }: Props) {
    return (
        <Link href={`/products/${id}`} className="block">
            <Card className="overflow-hidden">
                <div className="aspect-square w-full overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={image}
                        alt={title}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                        loading="lazy"
                    />
                </div>
                <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="font-medium leading-tight">{title}</h3>
                        <span className="font-semibold">€{price.toFixed(2)}</span>
                    </div>
                    <Badge variant="secondary">{category}</Badge>
                </CardContent>
            </Card>
        </Link>
    );
}