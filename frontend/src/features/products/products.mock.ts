export type Product = {
    id: string;
    title: string;
    price: number;
    image: string;
    category: string;
};

export const mockProducts: Product[] = [
    {
        id: "1",
        title: "Basic Hoodie",
        price: 39.9,
        image: "https://picsum.photos/seed/hoodie/600/600",
        category: "Hoodies",
    },
    {
        id: "2",
        title: "Classic T-Shirt",
        price: 19.9,
        image: "https://picsum.photos/seed/tshirt/600/600",
        category: "T-Shirts",
    },
    {
        id: "3",
        title: "Slim Jeans",
        price: 49.9,
        image: "https://picsum.photos/seed/jeans/600/600",
        category: "Jeans",
    },
    {
        id: "4",
        title: "Sneakers",
        price: 59.9,
        image: "https://picsum.photos/seed/sneakers/600/600",
        category: "Shoes",
    },
];