import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/http";

type Props = {
    id: number;
    title: string;
    price: number;
    image: string;
    category: string;
    href?: string;
};

export function ProductCard({ id, title, price, image, category, href }: Props) {
    const link = href ?? `/products/${id}`;

    return (
        <Link href={link} className="block">
            <Card className="overflow-hidden">
                <div className="aspect-square w-full overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={resolveImageUrl(image)}
                        alt={title}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                        loading="lazy"
                    />
                </div>
                <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-2 min-h-[2.5rem] font-medium leading-tight">{title}</h3>
                        <span className="shrink-0 font-semibold">€{price.toFixed(2)}</span>
                    </div>
                    <Badge variant="secondary">{category}</Badge>
                </CardContent>
            </Card>
        </Link>
    );
}