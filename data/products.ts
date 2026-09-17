export type ProductCollection = "flash" | "popular" | "new" | "best" | "recommended";

export type Product = {
  id: string;
  name: string;
  category: string;
  brand: string;
  image: string;
  price: number;
  oldPrice: number;
  discount: number;
  rating: number;
  reviews: number;
  stock: number;
  description: string;
  specifications: { label: string; value: string }[];
  collection: ProductCollection;
};

const details = {
  phone: { description: "A fast, reliable everyday smartphone with a bright display, dependable battery, and thoughtful NexoBD value.", specifications: [{ label: "Display", value: "6.5 inch HD+" }, { label: "Battery", value: "5000 mAh" }, { label: "Warranty", value: "1 year official" }] },
  fashion: { description: "A comfortable, polished essential made for everyday Bangladesh weather and easy styling.", specifications: [{ label: "Material", value: "Premium cotton blend" }, { label: "Fit", value: "Regular fit" }, { label: "Care", value: "Machine wash cold" }] },
  home: { description: "A practical home upgrade that brings considered design and dependable daily performance to your space.", specifications: [{ label: "Material", value: "Food-safe ceramic" }, { label: "Pieces", value: "16-piece set" }, { label: "Care", value: "Dishwasher safe" }] },
  grocery: { description: "Carefully selected pantry essentials from verified sellers, packed fresh for your household.", specifications: [{ label: "Source", value: "Verified local farms" }, { label: "Pack size", value: "500 g - 5 kg" }, { label: "Delivery", value: "Next-day eligible" }] },
  beauty: { description: "A gentle daily care essential made with simple routines and dependable ingredients in mind.", specifications: [{ label: "Skin type", value: "Normal to dry" }, { label: "Use", value: "Daily care" }, { label: "Authenticity", value: "Verified seller" }] },
  gaming: { description: "Level up your setup with responsive controls, comfortable design, and reliable everyday performance.", specifications: [{ label: "Connection", value: "Wireless + USB-C" }, { label: "Compatibility", value: "PC and console" }, { label: "Warranty", value: "6 months" }] },
};

export const products: Product[] = [
  { id: "nxd-001", name: "Nova X smartphone", brand: "NexoTech", category: "Mobile", image: "/products/electronics.svg", price: 18990, oldPrice: 22990, discount: 17, rating: 4.9, reviews: 128, stock: 12, collection: "flash", ...details.phone },
  { id: "nxd-002", name: "Everyday linen kurti", brand: "Aarong Edit", category: "Fashion", image: "/products/fashion.svg", price: 1290, oldPrice: 1650, discount: 22, rating: 4.8, reviews: 86, stock: 24, collection: "flash", ...details.fashion },
  { id: "nxd-003", name: "Minimal ceramic dinner set", brand: "Homeday", category: "Home Appliances", image: "/products/home.svg", price: 1850, oldPrice: 2300, discount: 20, rating: 4.7, reviews: 64, stock: 8, collection: "flash", ...details.home },
  { id: "nxd-004", name: "Premium aromatic rice · 5 kg", brand: "FreshCart", category: "Grocery", image: "/products/grocery.svg", price: 645, oldPrice: 720, discount: 10, rating: 4.9, reviews: 214, stock: 42, collection: "flash", ...details.grocery },
  { id: "nxd-005", name: "Wireless audio buds", brand: "Soundcore", category: "Electronics", image: "/products/electronics.svg", price: 1499, oldPrice: 1999, discount: 25, rating: 4.6, reviews: 92, stock: 15, collection: "flash", ...details.phone },
  { id: "nxd-006", name: "Noise-cancelling headphones", brand: "Soundcore", category: "Electronics", image: "/products/electronics.svg", price: 2490, oldPrice: 3200, discount: 22, rating: 4.8, reviews: 176, stock: 18, collection: "popular", ...details.phone },
  { id: "nxd-007", name: "Classic leather crossbody bag", brand: "Loom & Leaf", category: "Fashion", image: "/products/fashion.svg", price: 1180, oldPrice: 1500, discount: 21, rating: 4.9, reviews: 71, stock: 10, collection: "popular", ...details.fashion },
  { id: "nxd-008", name: "Smart LED living room lamp", brand: "Homeday", category: "Home Appliances", image: "/products/home.svg", price: 890, oldPrice: 1100, discount: 19, rating: 4.7, reviews: 53, stock: 26, collection: "popular", ...details.home },
  { id: "nxd-009", name: "Organic honey · 500 g", brand: "FreshCart", category: "Grocery", image: "/products/grocery.svg", price: 520, oldPrice: 650, discount: 20, rating: 4.9, reviews: 183, stock: 33, collection: "popular", ...details.grocery },
  { id: "nxd-010", name: "Slim-fit cotton overshirt", brand: "Northline", category: "Fashion", image: "/products/fashion.svg", price: 1050, oldPrice: 1300, discount: 19, rating: 4.8, reviews: 44, stock: 20, collection: "new", ...details.fashion },
  { id: "nxd-011", name: "Portable blender bottle", brand: "KitchenPro", category: "Home Appliances", image: "/products/home.svg", price: 1390, oldPrice: 1750, discount: 21, rating: 4.6, reviews: 32, stock: 14, collection: "new", ...details.home },
  { id: "nxd-012", name: "Hydrating skin care set", brand: "Glow Lab", category: "Beauty", image: "/products/beauty.svg", price: 1690, oldPrice: 2100, discount: 20, rating: 4.8, reviews: 68, stock: 19, collection: "new", ...details.beauty },
  { id: "nxd-013", name: "Mechanical gaming keyboard", brand: "LevelUp", category: "Gaming", image: "/products/gaming.svg", price: 3250, oldPrice: 4000, discount: 18, rating: 4.7, reviews: 51, stock: 7, collection: "new", ...details.gaming },
  { id: "nxd-014", name: "Glow serum essentials", brand: "Glow Lab", category: "Beauty", image: "/products/beauty.svg", price: 980, oldPrice: 1200, discount: 18, rating: 4.7, reviews: 47, stock: 22, collection: "best", ...details.beauty },
  { id: "nxd-015", name: "Pro wireless controller", brand: "LevelUp", category: "Gaming", image: "/products/gaming.svg", price: 2890, oldPrice: 3500, discount: 17, rating: 4.8, reviews: 77, stock: 9, collection: "best", ...details.gaming },
  { id: "nxd-016", name: "Family grocery starter box", brand: "FreshCart", category: "Grocery", image: "/products/grocery.svg", price: 2200, oldPrice: 2600, discount: 15, rating: 4.9, reviews: 102, stock: 30, collection: "best", ...details.grocery },
  { id: "nxd-017", name: "Daily tote bag", brand: "Loom & Leaf", category: "Fashion", image: "/products/fashion.svg", price: 790, oldPrice: 950, discount: 17, rating: 4.7, reviews: 38, stock: 25, collection: "recommended", ...details.fashion },
  { id: "nxd-018", name: "Compact air purifier", brand: "Homeday", category: "Home Appliances", image: "/products/home.svg", price: 4990, oldPrice: 5800, discount: 14, rating: 4.8, reviews: 29, stock: 6, collection: "recommended", ...details.home },
  { id: "nxd-019", name: "Pocket gaming console", brand: "LevelUp", category: "Gaming", image: "/products/gaming.svg", price: 3650, oldPrice: 4300, discount: 15, rating: 4.6, reviews: 35, stock: 11, collection: "recommended", ...details.gaming },
  { id: "nxd-020", name: "Fast-charge power bank", brand: "NexoTech", category: "Electronics", image: "/products/electronics.svg", price: 1090, oldPrice: 1350, discount: 19, rating: 4.8, reviews: 84, stock: 17, collection: "recommended", ...details.phone },
  { id: "nxd-021", name: "Walton laptop", brand: "Walton", category: "Laptop", image: "/products/electronics.svg", price: 58990, oldPrice: 65000, discount: 9, rating: 4.8, reviews: 41, stock: 8, collection: "popular", ...details.phone },
  { id: "nxd-022", name: "Everyday smartphone", brand: "Walton", category: "Mobile", image: "/products/electronics.svg", price: 12990, oldPrice: 14990, discount: 13, rating: 4.7, reviews: 67, stock: 16, collection: "popular", ...details.phone },
  { id: "nxd-023", name: "Rechargeable fan", brand: "Walton", category: "Home Appliances", image: "/products/home.svg", price: 3490, oldPrice: 4200, discount: 17, rating: 4.6, reviews: 29, stock: 12, collection: "new", ...details.home },
  { id: "nxd-024", name: "Active smart watch", brand: "NexoTech", category: "Electronics", image: "/products/electronics.svg", price: 2190, oldPrice: 2800, discount: 22, rating: 4.7, reviews: 58, stock: 14, collection: "new", ...details.phone },
  { id: "nxd-025", name: "Everyday wireless earbuds", brand: "Soundcore", category: "Electronics", image: "/products/electronics.svg", price: 1190, oldPrice: 1500, discount: 21, rating: 4.6, reviews: 73, stock: 18, collection: "popular", ...details.phone },
  { id: "nxd-026", name: "Kitchen blender", brand: "Walton", category: "Home Appliances", image: "/products/home.svg", price: 2890, oldPrice: 3400, discount: 15, rating: 4.7, reviews: 35, stock: 10, collection: "new", ...details.home },
  { id: "nxd-027", name: "Digital rice cooker", brand: "Walton", category: "Home Appliances", image: "/products/home.svg", price: 3190, oldPrice: 3800, discount: 16, rating: 4.8, reviews: 48, stock: 9, collection: "best", ...details.home },
  { id: "nxd-028", name: "Warm white LED light", brand: "NexoHome", category: "Home Appliances", image: "/products/home.svg", price: 390, oldPrice: 490, discount: 20, rating: 4.7, reviews: 62, stock: 40, collection: "best", ...details.home },
  { id: "nxd-029", name: "Classic cotton T shirt", brand: "Northline", category: "Fashion", image: "/products/fashion.svg", price: 590, oldPrice: 750, discount: 21, rating: 4.8, reviews: 91, stock: 32, collection: "new", ...details.fashion },
  { id: "nxd-030", name: "Comfort walking shoes", brand: "Northline", category: "Fashion", image: "/products/fashion.svg", price: 1890, oldPrice: 2400, discount: 21, rating: 4.7, reviews: 55, stock: 13, collection: "best", ...details.fashion },
];

export const categories = ["Electronics", "Mobile", "Laptop", "Home Appliances", "Fashion", "Beauty", "Grocery", "Baby Products", "Gaming"];

export function productsByCollection(collection: ProductCollection) {
  return products.filter((product) => product.collection === collection);
}

export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}