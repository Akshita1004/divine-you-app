import { Product } from "@/types/product";

export const featuredProducts: Product[] = [
  {
    id: 1,
    title: "Herbal Shilajit Powder",
    description: "Himalayan-sourced resin powder for a grounding daily ritual.",
    price: 799,
    originalPrice: null,
    image: "/images/products/shilajit-powder.png",
    category: "Herbal Powders",
    weight: "50 G",
    rating: 4.8,
    reviewsCount: 126,
    badge: null,
    detailsDescription:
      "A dark, earthy powder packed in amber glass. Divine You Shilajit is presented in its traditional powdered form for those who prefer to measure their own serving.",
    ingredients: [
      "Ingredient list for Herbal Shilajit Powder is supplied by the product catalogue.",
      "No fillers or artificial colours declared on this listing.",
    ],
    benefits: [
      "Traditionally used in Ayurvedic routines.",
      "Formulated for everyday wellness rituals.",
      "Benefit copy is managed as product data and reviewed before publishing.",
    ],
    howToUse: [
      "Follow the directions printed on the pack.",
      "Store in a cool, dry place away from direct sunlight.",
      "Consult a qualified practitioner before use if you are pregnant, nursing or on medication.",
    ],
    shippingInfo: [
      "Free shipping across India on orders above Rs. 999.",
      "Dispatched within 2 business days from New Delhi.",
      "Easy 30-day returns on unopened packs.",
    ],
  },
  {
    id: 2,
    title: "Health Booster Powder",
    description: "A warm herb-and-root blend for your everyday cup.",
    price: 499,
    originalPrice: null,
    image: "/images/products/health-powder.png",
    category: "Herbal Powders",
    weight: "250 G",
    rating: 4.6,
    reviewsCount: 84,
    badge: null,
    detailsDescription:
      "A nourishing blend of traditional herbs and roots crafted to support immunity and daily vitality.",
    ingredients: [
      "Ashwagandha Root Extract, Shatavari, Pure Turmeric, Ginger Root.",
      "100% natural, no synthetic additives.",
    ],
    benefits: [
      "Supports natural immune response.",
      "Promotes sustained energy without caffeine jitters.",
    ],
    howToUse: [
      "Mix 1 tsp with warm milk or honey every morning.",
      "Stir thoroughly and consume warm.",
    ],
    shippingInfo: [
      "Free shipping across India on orders above Rs. 999.",
      "Dispatched within 2 business days from New Delhi.",
    ],
  },
  {
    id: 3,
    title: "Organic Superfood Moringa Leaf Powder",
    description: "Shade-dried moringa leaf, milled fine and packed fresh.",
    price: 399,
    originalPrice: null,
    image: "/images/products/moringa-powder.png",
    category: "Superfoods",
    weight: "250 G",
    rating: 4.7,
    reviewsCount: 152,
    detailsDescription:
      "Shade-dried moringa leaves packed with essential nutrients, antioxidants, and vitamins.",
    ingredients: [
      "100% Organic Shade-dried Moringa Oleifera Leaf Powder.",
    ],
    benefits: [
      "Rich source of Vitamin C, Iron, and Amino Acids.",
      "Supports healthy digestion and skin health.",
    ],
    howToUse: [
      "Add 1 tsp to smoothies, juices, or warm water.",
    ],
    shippingInfo: [
      "Free shipping across India on orders above Rs. 999.",
      "Dispatched within 2 business days.",
    ],
  },
  {
    id: 4,
    title: "Organic Aloe Vera Gel",
    description: "Light, clear gel for face, body and after-sun care.",
    price: 299,
    originalPrice: null,
    image: "/images/products/aloe-gel.png",
    category: "Botanical Care",
    weight: "250 ML",
    rating: 4.9,
    reviewsCount: 203,
    badge: null,
    detailsDescription:
      "Cold-extracted organic aloe vera gel for soothing hydration and skin cooling.",
    ingredients: [
      "99% Pure Organic Aloe Vera Leaf Juice, Natural Xanthan Gum.",
    ],
    benefits: [
      "Soothes sunburn, skin irritation, and dryness.",
      "Non-sticky lightweight hydration.",
    ],
    howToUse: [
      "Apply liberally to cleansed skin as needed.",
    ],
    shippingInfo: [
      "Free shipping across India on orders above Rs. 999.",
      "Dispatched within 2 business days.",
    ],
  },
];

export function getProductById(id: number): Product | undefined {
  return featuredProducts.find((p) => p.id === id);
}