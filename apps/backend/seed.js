import { supabase } from './config/supabase.js';

const exactStaticProducts = [
  {
    name: "Organic Superfood Moringa Leaf Powder",
    title: "Organic Superfood Moringa Leaf Powder",
    description: "Shade-dried moringa leaf, milled fine and packed fresh.",
    price: 399,
    category: "Superfoods",
    image_url: "https://ljpyjuifueyxrkywvlns.supabase.co/storage/v1/object/public/Products/moringa-powder.png",
    stock: 60,
    is_featured: true,
    rating: 5.0,
    reviews_count: 1,
    ingredients: "100% Pure Organic Shade-dried Moringa Oleifera Leaf Powder.",
    benefits: "Rich in Vitamin C, Iron, and Antioxidants. Promotes healthy digestion and glowing skin.",
    how_to_use: "Add 1 spoon to green smoothies, warm herbal teas, or sprinkle over fresh salads.",
    shipping_returns: "Ships within 24 hours. Free delivery on orders above ₹999. Easy 30-day return policy."
  },
  {
    name: "Ashwagandha Stress Relief Powder",
    title: "Ashwagandha Stress Relief Powder",
    description: "Standardized adaptogenic root extract for deep sleep and vitality.",
    price: 599,
    category: "Daily Wellness",
    image_url: "https://ljpyjuifueyxrkywvlns.supabase.co/storage/v1/object/public/Products/health-powder.png",
    stock: 40,
    is_featured: true,
    rating: 4.5,
    reviews_count: 2,
    ingredients: "100% Organic Ashwagandha Root Extract (Withania Somnifera).",
    benefits: "Reduces stress and anxiety, improves sleep quality, boosts energy and stamina.",
    how_to_use: "Mix 1/2 teaspoon in warm milk or honey before sleeping.",
    shipping_returns: "Ships within 24 hours. Free delivery on orders above ₹999. Easy 30-day return policy."
  },
  {
    name: "Health Booster Powder",
    title: "Health Booster Powder",
    description: "A warm herb-and-root blend for your everyday cup.",
    price: 499,
    category: "Daily Wellness",
    image_url: "https://ljpyjuifueyxrkywvlns.supabase.co/storage/v1/object/public/Products/health-powder.png",
    stock: 45,
    is_featured: true,
    rating: 4.0,
    reviews_count: 1,
    ingredients: "Organic Ashwagandha, Shatavari, Safed Musli, Brahmi, and Cardamom.",
    benefits: "Improves overall immunity, reduces stress and fatigue, supports natural body strength.",
    how_to_use: "Mix 1 teaspoon in warm milk or water twice daily after meal.",
    shipping_returns: "Ships within 24 hours. Free delivery on orders above ₹999. Easy 30-day return policy."
  },
  {
    name: "Herbal Shilajit Powder",
    title: "Herbal Shilajit Powder",
    description: "Himalayan-sourced resin powder for a grounding daily ritual.",
    price: 799,
    category: "Superfoods",
    image_url: "https://ljpyjuifueyxrkywvlns.supabase.co/storage/v1/object/public/Products/shilajit-powder.png",
    stock: 50,
    is_featured: true,
    rating: 3.5,
    reviews_count: 2,
    ingredients: "100% Raw Himalayan Shilajit Resin Extract, Fulvic Acid, 84+ Trace Minerals.",
    benefits: "Enhances stamina and energy levels, supports cognitive clarity, and aids muscle recovery.",
    how_to_use: "Take a pea-sized amount (300-500mg) and dissolve in warm milk or water daily in the morning.",
    shipping_returns: "Ships within 24 hours. Free delivery on orders above ₹999. Easy 30-day return policy."
  },
  {
    name: "Organic Aloe Vera Gel",
    title: "Organic Aloe Vera Gel",
    description: "Light, clear gel for face, body and after-sun care.",
    price: 299,
    category: "Skin & Body",
    image_url: "https://ljpyjuifueyxrkywvlns.supabase.co/storage/v1/object/public/Products/aloe-gel.png",
    stock: 35,
    is_featured: true,
    rating: 2.0,
    reviews_count: 1,
    ingredients: "99% Pure Organic Aloe Vera Inner Leaf Juice, Vitamin E, Natural Xanthan Gum.",
    benefits: "Soothes irritated skin, provides intense hydration, heals sunburns, and softens hair.",
    how_to_use: "Apply directly onto clean skin or scalp and gently massage until fully absorbed.",
    shipping_returns: "Ships within 24 hours. Free delivery on orders above ₹999. Easy 30-day return policy."
  }
];

async function seedDatabase() {
  try {
    console.log("Seeding detailed products with ratings into Supabase...");
    const { data, error } = await supabase
      .from('products')
      .upsert(exactStaticProducts, { onConflict: 'name' })
      .select();

    if (error) console.error("Error:", error.message);
    else console.log(`Successfully updated ${data.length} products with ratings & reviews!`);
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

seedDatabase();