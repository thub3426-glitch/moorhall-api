import prisma from '../src/config/db';
import { uploadSingleImage } from '../src/gateways/cloudinary.gateway';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve a local asset path (e.g. "/assets/break1.jpg") to an absolute file path */
function resolveLocalAsset(assetPath: string): string {
  // assetPath is relative to the frontend src/ folder, e.g. "/assets/break1.jpg"
  const relative = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  return path.resolve(__dirname, '../../moor-hall-ui/src', relative);
}

/** Fetch a remote URL and return a Buffer */
function fetchUrlToBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrlToBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Resolve an image reference to a Cloudinary URL.
 * - Local asset paths (e.g. "/assets/break1.jpg") → read file, upload to Cloudinary
 * - Remote URLs (http/https) → fetch, upload to Cloudinary
 * - Already a Cloudinary URL → return as-is
 */
async function resolveCloudinaryUrl(imageRef: string, folder: string): Promise<string> {
  // Already a Cloudinary URL — return as-is
  if (imageRef.includes('cloudinary.com')) {
    return imageRef;
  }

  let buffer: Buffer;

  if (imageRef.startsWith('http://') || imageRef.startsWith('https://')) {
    // Remote URL (e.g. Unsplash)
    buffer = await fetchUrlToBuffer(imageRef);
  } else {
    // Local asset path relative to frontend src/
    const absPath = resolveLocalAsset(imageRef);
    if (!fs.existsSync(absPath)) {
      console.warn(`   ⚠ Local asset not found: ${absPath} — skipping upload.`);
      return imageRef; // fall back to original path
    }
    buffer = fs.readFileSync(absPath);
  }

  const result = await uploadSingleImage(buffer, folder);
  const cloudinaryUrl = result.secure_url;
  console.log(`   ☁ Uploaded to Cloudinary: ${path.basename(imageRef)} → ${cloudinaryUrl}`);
  return cloudinaryUrl;
}

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Breakfast',   slug: 'breakfast',   description: 'Fresh breakfast items to start your day', type: 'FOOD' },
  { name: 'Soups',       slug: 'soups',       description: 'Warm and comforting soups',               type: 'FOOD' },
  { name: 'Coffee',      slug: 'coffee',      description: 'Premium coffee and hot beverages',         type: 'COFFEE' },
  { name: 'Juices',      slug: 'juices',      description: 'Fresh juices and smoothies',              type: 'DRINK' },
  { name: 'Salads',      slug: 'salads',      description: 'Fresh salads and healthy options',        type: 'FOOD' },
  { name: 'Fish',        slug: 'fish',        description: 'Fresh fish dishes',                      type: 'FOOD' },
  { name: 'Chicken',     slug: 'chicken',     description: 'Tender chicken specialties',             type: 'FOOD' },
  { name: 'Beef',        slug: 'beef',        description: 'Premium beef dishes',                    type: 'FOOD' },
  { name: 'Burgers',     slug: 'burgers',     description: 'Delicious burgers and sandwiches',       type: 'FOOD' },
  { name: 'Pizza',       slug: 'pizza',       description: 'Classic pizzas',                         type: 'FOOD' },
  { name: 'Pasta',       slug: 'pasta',       description: 'Italian pasta dishes',                   type: 'FOOD' },
  { name: 'Special Dishes', slug: 'special-dishes', description: 'Chef special selections',           type: 'SPECIAL' },
] as const;

// ─── Menu Items ───────────────────────────────────────────────────────────────
// imageUrl can be:
//   - a local asset path relative to moor-hall-ui/src/  (e.g. "/assets/break1.jpg")
//   - a remote URL                                      (e.g. "https://images.unsplash.com/…")
//   - an already-uploaded Cloudinary URL                 (e.g. "https://res.cloudinary.com/…")
const MENU_ITEMS = [
  // ══════════════════════════════════════════════════════════════════════════
  // BREAKFAST - Fresh breakfast items from Moor Hall
  // ══════════════════════════════════════════════════════════════════════════
  {
    categorySlug: 'breakfast',
    items: [
      { slug: 'eggs-and-bacon', name: 'Eggs and Bacon', shortDescription: 'Fried eggs with crispy bacon', description: 'Fried eggs with crispy bacon and toast', productType: 'FOOD', price: 1500, imageUrl: 'https://images.unsplash.com/photo-1609521263047-f69740ec20c6?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'breakfast-omelette', name: 'Omelette', shortDescription: 'Fluffy omelette with vegetables', description: 'Fluffy omelette with fresh vegetables and cheese', productType: 'FOOD', price: 2000, imageUrl: 'https://images.unsplash.com/photo-1585238341710-4dd0bd180d8d?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'pancakes-breakfast', name: 'Pancakes', shortDescription: 'Golden pancakes with syrup', description: 'Golden pancakes served with maple syrup and butter', productType: 'FOOD', price: 2500, imageUrl: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'french-toast', name: 'French Toast', shortDescription: 'Crispy French toast', description: 'Crispy French toast with jam and cream', productType: 'FOOD', price: 2000, imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'bacon-toast', name: 'Bacon Toast', shortDescription: 'Toast with bacon and butter', description: 'Toasted bread with crispy bacon and butter', productType: 'FOOD', price: 1500, imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'butter-roll', name: 'Butter Roll', shortDescription: 'Soft roll with butter', description: 'Soft roll with fresh butter and jam', productType: 'FOOD', price: 800, imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'ugandan-breakfast', name: 'Ugandan Breakfast', shortDescription: 'Traditional Ugandan breakfast', description: 'Traditional Ugandan porridge with beans', productType: 'FOOD', price: 1800, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'tea-breakfast', name: 'Tea with Bread', shortDescription: 'Hot tea with bread', description: 'Hot tea served with butter and bread', productType: 'FOOD', price: 1000, imageUrl: 'https://images.unsplash.com/photo-1597318615621-64f51e5ccd96?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SOUPS - Warm and nourishing soups
  // ══════════════════════════════════════════════════════════════════════════
  {
    categorySlug: 'soups',
    items: [
      { slug: 'chicken-soup', name: 'Chicken Soup', shortDescription: 'Warm chicken broth with vegetables', description: 'Warm chicken soup with fresh vegetables and herbs', productType: 'FOOD', price: 3000, imageUrl: 'https://images.unsplash.com/photo-1547592166-7aae4d755744?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'beef-soup', name: 'Beef Soup', shortDescription: 'Rich beef broth', description: 'Rich beef soup with potatoes and carrots', productType: 'FOOD', price: 3500, imageUrl: 'https://images.unsplash.com/photo-1605521842149-d7699c7765c0?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'vegetable-soup', name: 'Vegetable Soup', shortDescription: 'Mixed vegetable soup', description: 'Healthy vegetable soup with seasonal vegetables', productType: 'FOOD', price: 2500, imageUrl: 'https://images.unsplash.com/photo-1603521401091-2e8a0b04a5ba?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'bean-soup', name: 'Bean Soup', shortDescription: 'Beans in tomato broth', description: 'Bean soup with tomato and spices', productType: 'FOOD', price: 2000, imageUrl: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd64asf?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'mushroom-soup', name: 'Mushroom Soup', shortDescription: 'Creamy mushroom soup', description: 'Creamy mushroom soup with herbs', productType: 'FOOD', price: 3500, imageUrl: 'https://images.unsplash.com/photo-1547592166-7aae4d755744?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'matoke-soup', name: 'Matoke Soup', shortDescription: 'Traditional matoke soup', description: 'Traditional Ugandan matoke soup with groundnuts', productType: 'FOOD', price: 3000, imageUrl: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd64asf?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'pumpkin-soup', name: 'Pumpkin Soup', shortDescription: 'Creamy pumpkin soup', description: 'Creamy pumpkin soup with coconut milk', productType: 'FOOD', price: 3000, imageUrl: 'https://images.unsplash.com/photo-1609521263047-f69740ec20c6?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // COFFEE - Premium coffee beverages
  // ══════════════════════════════════════════════════════════════════════════
  {
    categorySlug: 'coffee',
    items: [
      { slug: 'espresso', name: 'Espresso', shortDescription: 'Single shot espresso', description: 'Rich and bold single shot espresso', productType: 'COFFEE', price: 2000, imageUrl: 'https://images.unsplash.com/photo-1459755486867-b55449bb39ff?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'double-espresso', name: 'Double Espresso', shortDescription: 'Double shot espresso', description: 'Double shot espresso for a stronger kick', productType: 'COFFEE', price: 3000, imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2cab2707d?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'americano', name: 'Americano', shortDescription: 'Espresso with hot water', description: 'Espresso diluted with hot water', productType: 'COFFEE', price: 2500, imageUrl: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'cappuccino', name: 'Cappuccino', shortDescription: 'Espresso with steamed milk', description: 'Espresso with steamed milk and foam', productType: 'COFFEE', price: 3500, imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'latte', name: 'Latte', shortDescription: 'Espresso with lots of milk', description: 'Espresso with plenty of steamed milk', productType: 'COFFEE', price: 3500, imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'macchiato', name: 'Macchiato', shortDescription: 'Espresso with small milk', description: 'Espresso marked with small amount of milk', productType: 'COFFEE', price: 3000, imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2cab2707d?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'flat-white', name: 'Flat White', shortDescription: 'Smooth espresso and milk', description: 'Espresso with velvety steamed milk', productType: 'COFFEE', price: 4000, imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'mocha', name: 'Mocha', shortDescription: 'Espresso with chocolate', description: 'Espresso with chocolate and steamed milk', productType: 'COFFEE', price: 4500, imageUrl: 'https://images.unsplash.com/photo-1578432291840-8d1c51dc1cff?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'iced-coffee', name: 'Iced Coffee', shortDescription: 'Cold coffee with ice', description: 'Chilled espresso with ice and milk', productType: 'COFFEE', price: 3500, imageUrl: 'https://images.unsplash.com/photo-1517701904202-ffb425f2b8be?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'cold-brew', name: 'Cold Brew', shortDescription: 'Smooth cold brew coffee', description: 'Smooth cold brew served over ice', productType: 'COFFEE', price: 4000, imageUrl: 'https://images.unsplash.com/photo-1517701904202-ffb425f2b8be?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'irish-coffee', name: 'Irish Coffee', shortDescription: 'Coffee with whiskey', description: 'Coffee with Irish whiskey and cream', productType: 'COFFEE', price: 5000, imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'vanilla-coffee', name: 'Vanilla Coffee', shortDescription: 'Coffee with vanilla', description: 'Latte with vanilla syrup', productType: 'COFFEE', price: 4000, imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'caramel-coffee', name: 'Caramel Coffee', shortDescription: 'Coffee with caramel', description: 'Latte with caramel syrup and drizzle', productType: 'COFFEE', price: 4000, imageUrl: 'https://images.unsplash.com/photo-1578432291840-8d1c51dc1cff?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'hazelnut-coffee', name: 'Hazelnut Coffee', shortDescription: 'Coffee with hazelnut', description: 'Latte with hazelnut syrup', productType: 'COFFEE', price: 4000, imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'cinnamon-coffee', name: 'Cinnamon Coffee', shortDescription: 'Coffee with cinnamon', description: 'Latte with cinnamon syrup and spice', productType: 'COFFEE', price: 4000, imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // JUICES - Fresh juices and beverages
  // ══════════════════════════════════════════════════════════════════════════
  {
    categorySlug: 'juices',
    items: [
      { slug: 'fresh-orange-juice', name: 'Fresh Orange Juice', shortDescription: 'Freshly squeezed oranges', description: 'Pure fresh orange juice, no additives', productType: 'DRINK', price: 2000, imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd1223c1?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'mango-juice', name: 'Mango Juice', shortDescription: 'Fresh mango juice', description: 'Sweet fresh mango juice', productType: 'DRINK', price: 2500, imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd1223c1?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'passion-fruit-juice', name: 'Passion Fruit Juice', shortDescription: 'Tangy passion fruit juice', description: 'Tangy and refreshing passion fruit juice', productType: 'DRINK', price: 2500, imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd1223c1?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'pineapple-juice', name: 'Pineapple Juice', shortDescription: 'Fresh pineapple juice', description: 'Sweet pineapple juice with tropical taste', productType: 'DRINK', price: 2500, imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd1223c1?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'papaya-juice', name: 'Papaya Juice', shortDescription: 'Fresh papaya juice', description: 'Sweet papaya juice', productType: 'DRINK', price: 2500, imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd1223c1?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'watermelon-juice', name: 'Watermelon Juice', shortDescription: 'Refreshing watermelon', description: 'Refreshing watermelon juice', productType: 'DRINK', price: 2000, imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd1223c1?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'guava-juice', name: 'Guava Juice', shortDescription: 'Fresh guava juice', description: 'Nutritious guava juice', productType: 'DRINK', price: 2000, imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd1223c1?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'banana-smoothie', name: 'Banana Smoothie', shortDescription: 'Creamy banana smoothie', description: 'Creamy banana smoothie with milk', productType: 'DRINK', price: 3000, imageUrl: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'mixed-fruit-smoothie', name: 'Mixed Fruit Smoothie', shortDescription: 'Mixed fruit smoothie', description: 'Blend of mixed fresh fruits', productType: 'DRINK', price: 3500, imageUrl: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SALADS - Fresh and healthy salads
  // ══════════════════════════════════════════════════════════════════════════
  {
    categorySlug: 'salads',
    items: [
      { slug: 'caesar-salad', name: 'Caesar Salad', shortDescription: 'Crisp romaine with Caesar dressing', description: 'Romaine lettuce, parmesan, croutons with Caesar dressing', productType: 'FOOD', price: 5000, imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'green-salad', name: 'Green Salad', shortDescription: 'Fresh green vegetables', description: 'Mixed green salad with vinaigrette', productType: 'FOOD', price: 4000, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'tomato-cucumber-salad', name: 'Tomato & Cucumber Salad', shortDescription: 'Fresh tomato and cucumber', description: 'Fresh tomatoes and cucumbers with olive oil', productType: 'FOOD', price: 3500, imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'coleslaw', name: 'Coleslaw', shortDescription: 'Cabbage salad', description: 'Fresh cabbage coleslaw with creamy dressing', productType: 'FOOD', price: 2500, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'chickpea-salad', name: 'Chickpea Salad', shortDescription: 'Protein-rich chickpea salad', description: 'Chickpeas with fresh vegetables', productType: 'FOOD', price: 4000, imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'bean-salad', name: 'Bean Salad', shortDescription: 'Mixed beans salad', description: 'Mixed beans with fresh herbs and dressing', productType: 'FOOD', price: 3500, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'avocado-salad', name: 'Avocado Salad', shortDescription: 'Creamy avocado salad', description: 'Fresh avocado with mixed greens and lime', productType: 'FOOD', price: 6000, imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // FISH - Fresh fish dishes
  // ══════════════════════════════════════════════════════════════════════════
  {
    categorySlug: 'fish',
    items: [
      { slug: 'grilled-tilapia', name: 'Grilled Tilapia', shortDescription: 'Fresh grilled tilapia', description: 'Fresh tilapia grilled with lemon and herbs', productType: 'FOOD', price: 8000, imageUrl: 'https://images.unsplash.com/photo-1504674900152-b8886b8100d0?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'fried-tilapia', name: 'Fried Tilapia', shortDescription: 'Crispy fried tilapia', description: 'Fried tilapia with crispy batter', productType: 'FOOD', price: 8000, imageUrl: 'https://images.unsplash.com/photo-1504674900152-b8886b8100d0?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'steamed-fish', name: 'Steamed Fish', shortDescription: 'Steamed whole fish', description: 'Whole fish steamed with ginger and green onions', productType: 'FOOD', price: 10000, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'fish-curry', name: 'Fish Curry', shortDescription: 'Spiced fish curry', description: 'Fish cooked in aromatic curry sauce', productType: 'FOOD', price: 9000, imageUrl: 'https://images.unsplash.com/photo-1504674900152-b8886b8100d0?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'smoked-fish', name: 'Smoked Fish', shortDescription: 'Smoked whole fish', description: 'Traditionally smoked whole fish', productType: 'FOOD', price: 12000, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'fish-with-vegetables', name: 'Fish with Vegetables', shortDescription: 'Fish with sautéed vegetables', description: 'Grilled fish served with fresh vegetables', productType: 'FOOD', price: 10000, imageUrl: 'https://images.unsplash.com/photo-1504674900152-b8886b8100d0?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'fish-soup', name: 'Fish Soup', shortDescription: 'Hearty fish soup', description: 'Rich fish soup with vegetables', productType: 'FOOD', price: 8000, imageUrl: 'https://images.unsplash.com/photo-1605521842149-d7699c7765c0?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CHICKEN - Delicious chicken specialties
  // ══════════════════════════════════════════════════════════════════════════
  {
    categorySlug: 'chicken',
    items: [
      { slug: 'grilled-chicken-breast', name: 'Grilled Chicken Breast', shortDescription: 'Tender grilled chicken', description: 'Grilled chicken breast with herbs and spices', productType: 'FOOD', price: 8000, imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'fried-chicken', name: 'Fried Chicken', shortDescription: 'Crispy fried chicken', description: 'Crispy fried chicken with golden coating', productType: 'FOOD', price: 8000, imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'chicken-curry', name: 'Chicken Curry', shortDescription: 'Spiced chicken curry', description: 'Tender chicken in aromatic curry sauce', productType: 'FOOD', price: 9000, imageUrl: 'https://images.unsplash.com/photo-1565937669043-0ecffc4ad4cd?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'chicken-stew', name: 'Chicken Stew', shortDescription: 'Traditional chicken stew', description: 'Chicken with potatoes and vegetables in rich sauce', productType: 'FOOD', price: 8500, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'steamed-chicken', name: 'Steamed Chicken', shortDescription: 'Steamed chicken pieces', description: 'Steamed chicken with ginger and herbs', productType: 'FOOD', price: 8000, imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'chicken-stir-fry', name: 'Chicken Stir Fry', shortDescription: 'Stir-fried chicken', description: 'Chicken stir-fried with vegetables and soy sauce', productType: 'FOOD', price: 8500, imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'whole-roasted-chicken', name: 'Whole Roasted Chicken', shortDescription: 'Whole roasted chicken', description: 'Whole chicken roasted until golden', productType: 'FOOD', price: 20000, imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'chicken-with-rice', name: 'Chicken with Rice', shortDescription: 'Chicken served with rice', description: 'Grilled chicken with fragrant rice', productType: 'FOOD', price: 10000, imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'smoked-chicken', name: 'Smoked Chicken', shortDescription: 'Smoked chicken pieces', description: 'Smoked chicken with smoky flavor', productType: 'FOOD', price: 12000, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'chicken-soup', name: 'Chicken Soup', shortDescription: 'Warm chicken soup', description: 'Warm chicken broth with noodles', productType: 'FOOD', price: 5000, imageUrl: 'https://images.unsplash.com/photo-1605521842149-d7699c7765c0?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'barbecued-chicken', name: 'BBQ Chicken', shortDescription: 'Barbecued chicken', description: 'Chicken grilled with BBQ sauce', productType: 'FOOD', price: 9000, imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BEEF - Premium beef dishes
  // ══════════════════════════════════════════════════════════════════════════
  {
    categorySlug: 'beef',
    items: [
      { slug: 'grilled-beef-steak', name: 'Grilled Beef Steak', shortDescription: 'Tender grilled beef steak', description: 'Premium beef steak grilled to perfection', productType: 'FOOD', price: 15000, imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'fried-beef', name: 'Fried Beef', shortDescription: 'Fried beef strips', description: 'Tender fried beef with spices', productType: 'FOOD', price: 10000, imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'beef-stew', name: 'Beef Stew', shortDescription: 'Rich beef stew', description: 'Beef stewed with potatoes and vegetables', productType: 'FOOD', price: 10000, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'beef-curry', name: 'Beef Curry', shortDescription: 'Spiced beef curry', description: 'Tender beef in aromatic curry sauce', productType: 'FOOD', price: 11000, imageUrl: 'https://images.unsplash.com/photo-1565937669043-0ecffc4ad4cd?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'minced-beef', name: 'Minced Beef', shortDescription: 'Ground beef with vegetables', description: 'Ground beef cooked with fresh vegetables', productType: 'FOOD', price: 8000, imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'beef-with-rice', name: 'Beef with Rice', shortDescription: 'Beef served with rice', description: 'Grilled beef served with fragrant rice', productType: 'FOOD', price: 10000, imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'smoked-beef', name: 'Smoked Beef', shortDescription: 'Smoked beef', description: 'Traditionally smoked beef', productType: 'FOOD', price: 14000, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'beef-ribs', name: 'Beef Ribs', shortDescription: 'BBQ beef ribs', description: 'Slow-cooked beef ribs with BBQ sauce', productType: 'FOOD', price: 16000, imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'beef-liver', name: 'Beef Liver', shortDescription: 'Fried beef liver', description: 'Fried beef liver with onions', productType: 'FOOD', price: 7000, imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'beef-soup', name: 'Beef Soup', shortDescription: 'Hearty beef soup', description: 'Rich beef broth with vegetables', productType: 'FOOD', price: 7000, imageUrl: 'https://images.unsplash.com/photo-1605521842149-d7699c7765c0?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BURGERS - Delicious burgers and sandwiches
  // ══════════════════════════════════════════════════════════════════════════
  {
    categorySlug: 'burgers',
    items: [
      { slug: 'classic-beef-burger', name: 'Classic Beef Burger', shortDescription: 'Beef patty with fresh toppings', description: 'Beef patty, lettuce, tomato, onion, pickle with special sauce', productType: 'FOOD', price: 4500, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'double-beef-burger', name: 'Double Beef Burger', shortDescription: 'Double beef patties', description: 'Two beef patties with cheese and toppings', productType: 'FOOD', price: 6500, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'chicken-burger', name: 'Chicken Burger', shortDescription: 'Breaded chicken patty', description: 'Breaded chicken patty with vegetables', productType: 'FOOD', price: 4000, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'fish-burger', name: 'Fish Burger', shortDescription: 'Breaded fish patty', description: 'Fried fish patty with tartar sauce', productType: 'FOOD', price: 4500, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'mushroom-burger', name: 'Mushroom Burger', shortDescription: 'Veggie burger with mushrooms', description: 'Mushroom patty with fresh vegetables', productType: 'FOOD', price: 3500, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'cheese-burger', name: 'Cheese Burger', shortDescription: 'Beef burger with cheese', description: 'Beef patty with melted cheese', productType: 'FOOD', price: 5000, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'bacon-burger', name: 'Bacon Burger', shortDescription: 'Beef burger with bacon', description: 'Beef patty topped with crispy bacon', productType: 'FOOD', price: 5500, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'spicy-burger', name: 'Spicy Burger', shortDescription: 'Hot spicy burger', description: 'Beef burger with spicy sauce and jalapenos', productType: 'FOOD', price: 5000, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'egg-burger', name: 'Egg Burger', shortDescription: 'Burger with fried egg', description: 'Beef patty topped with fried egg', productType: 'FOOD', price: 5000, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PIZZA - Classic pizzas
  // ══════════════════════════════════════════════════════════════════════════
  {
    categorySlug: 'pizza',
    items: [
      { slug: 'margherita-pizza', name: 'Margherita Pizza', shortDescription: 'Classic tomato and mozzarella', description: 'Tomato sauce, mozzarella, and basil', productType: 'FOOD', price: 8000, imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'pepperoni-pizza', name: 'Pepperoni Pizza', shortDescription: 'Pizza with pepperoni', description: 'Tomato sauce, mozzarella, and pepperoni slices', productType: 'FOOD', price: 9000, imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07f128?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'vegetarian-pizza', name: 'Vegetarian Pizza', shortDescription: 'Pizza with fresh vegetables', description: 'Tomato sauce, cheese, peppers, onions, mushrooms', productType: 'FOOD', price: 8000, imageUrl: 'https://images.unsplash.com/photo-1511689915685-a1aa7ec6a52b?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'meat-lovers-pizza', name: 'Meat Lovers Pizza', shortDescription: 'Pizza with multiple meats', description: 'Beef, chicken, bacon with tomato sauce and cheese', productType: 'FOOD', price: 10000, imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07f128?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PASTA - Italian pasta dishes
  // ══════════════════════════════════════════════════════════════════════════
  {
    categorySlug: 'pasta',
    items: [
      { slug: 'spaghetti-carbonara', name: 'Spaghetti Carbonara', shortDescription: 'Creamy pasta with bacon', description: 'Spaghetti with creamy sauce, bacon, and parmesan', productType: 'FOOD', price: 8000, imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221fcf4b?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'spaghetti-bolognese', name: 'Spaghetti Bolognese', shortDescription: 'Pasta with meat sauce', description: 'Spaghetti with rich tomato and meat sauce', productType: 'FOOD', price: 7500, imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221fcf4b?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'penne-arrabbiata', name: 'Penne Arrabbiata', shortDescription: 'Spicy tomato pasta', description: 'Penne in spicy tomato sauce', productType: 'FOOD', price: 7000, imageUrl: 'https://images.unsplash.com/photo-1621996346565-411f36ba389f?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'fettuccine-alfredo', name: 'Fettuccine Alfredo', shortDescription: 'Creamy parmesan pasta', description: 'Fettuccine in creamy alfredo sauce', productType: 'FOOD', price: 8500, imageUrl: 'https://images.unsplash.com/photo-1621996346565-411f36ba389f?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SPECIAL DISHES - Chef specialties
  // ══════════════════════════════════════════════════════════════════════════
  {
    categorySlug: 'special-dishes',
    items: [
      { slug: 'ugali-sukuma', name: 'Ugali and Sukuma', shortDescription: 'Traditional meal', description: 'Corn porridge with sautéed greens', productType: 'FOOD', price: 3000, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'matoke-sauce', name: 'Matoke in Sauce', shortDescription: 'Steamed plantains', description: 'Steamed plantains in tomato and groundnut sauce', productType: 'FOOD', price: 3500, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'posho-beans', name: 'Posho and Beans', shortDescription: 'Corn and beans', description: 'Cornmeal with boiled beans', productType: 'FOOD', price: 2500, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'rice-with-vegetables', name: 'Rice with Vegetables', shortDescription: 'Fried rice with veggies', description: 'Fragrant rice with fresh vegetables', productType: 'FOOD', price: 4000, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'chips-fried-chicken', name: 'Chips and Fried Chicken', shortDescription: 'Popular combo', description: 'Crispy fries with fried chicken', productType: 'FOOD', price: 5000, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
      { slug: 'irish-potato-stew', name: 'Irish Potato Stew', shortDescription: 'Potato and vegetable stew', description: 'Traditional potato stew with vegetables', productType: 'FOOD', price: 3500, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'mandazi', name: 'Mandazi', shortDescription: 'Fried dough', description: 'Traditional fried dough snack', productType: 'FOOD', price: 1500, imageUrl: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd64asf?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'samosa', name: 'Samosa', shortDescription: 'Fried pastry with filling', description: 'Crispy fried pastry with meat or vegetable filling', productType: 'FOOD', price: 2000, imageUrl: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd64asf?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'spring-roll', name: 'Spring Roll', shortDescription: 'Crispy spring roll', description: 'Fried spring roll with vegetable filling', productType: 'FOOD', price: 2500, imageUrl: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd64asf?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'chapati', name: 'Chapati', shortDescription: 'Flatbread', description: 'Traditional Indian flatbread', productType: 'FOOD', price: 1000, imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'naan-bread', name: 'Naan Bread', shortDescription: 'Indian naan bread', description: 'Soft Indian naan bread with butter', productType: 'FOOD', price: 1500, imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400', isFeatured: false, isAvailable: true },
      { slug: 'vegetable-biryani', name: 'Vegetable Biryani', shortDescription: 'Spiced rice dish', description: 'Fragrant rice with vegetables and spices', productType: 'FOOD', price: 5000, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400', isFeatured: true, isAvailable: true },
    ],
  },
];

// ─── Featured Services ────────────────────────────────────────────────────────
const FEATURED_SERVICES = [
  {
    name: 'Fine Dining Experience',
    slug: 'fine-dining-experience',
    type: 'EVENT_SERVICE',
    description: 'Indulge in our exquisite fine dining service featuring world-class cuisine and impeccable service.',
    imageUrl: '/assets/chief.jpg',
    isActive: true,
  },
  {
    name: 'Exclusive Reservations',
    slug: 'exclusive-reservations',
    type: 'CUSTOMER_CONVENIENCE',
    description: 'Secure your table at the most sought-after restaurant with our premium reservation service.',
    imageUrl: '/assets/menu.jpg',
    isActive: true,
  },
  {
    name: 'Catering Services',
    slug: 'catering-services',
    type: 'OUTSIDE_CATERING',
    description: 'Professional catering for any occasion – weddings, corporate events, and private celebrations.',
    imageUrl: '/assets/lunch.jpg',
    isActive: true,
  },
  {
    name: 'Private Events',
    slug: 'private-events',
    type: 'EVENT_SERVICE',
    description: 'Create unforgettable moments with our exclusive private event spaces and personalized service.',
    imageUrl: '/assets/lunch1.jpg',
    isActive: true,
  },
];

// ─── Promotions ───────────────────────────────────────────────────────────────
const PROMOTIONS = [
  {
    title: 'Summer Special - 30% Off',
    description: 'Enjoy 30% discount on all beverages and desserts during summer season.',
    imageUrl: 'https://images.unsplash.com/photo-1536599018054-b8d05564e550?auto=format&fit=crop&w=600&h=400',
    discountPercentage: 30,
    originalPrice: 50000,
    discountedPrice: 35000,
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-08-31'),
    isActive: true,
    displayOrder: 1,
    imagePublicId: null,
  },
  {
    title: 'Weekend Brunch Deal',
    description: 'Get 25% off on our signature breakfast and brunch items every Saturday and Sunday.',
    imageUrl: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=600&h=400',
    discountPercentage: 25,
    originalPrice: 40000,
    discountedPrice: 30000,
    startDate: new Date('2026-06-07'),
    endDate: new Date('2026-12-31'),
    isActive: true,
    displayOrder: 2,
    imagePublicId: null,
  },
  {
    title: 'Happy Hour - Buy One Get One',
    description: 'Buy one cocktail, get one free on all drinks from 5 PM to 7 PM, Monday to Friday.',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561551?auto=format&fit=crop&w=600&h=400',
    discountPercentage: 50,
    originalPrice: 20000,
    discountedPrice: 10000,
    startDate: new Date('2026-06-02'),
    endDate: new Date('2026-12-31'),
    isActive: true,
    displayOrder: 3,
    imagePublicId: null,
  },
  {
    title: 'Family Combo - 20% Savings',
    description: 'Order our family combo (feeds 4-5 people) and save 20% on total bill.',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&h=400',
    discountPercentage: 20,
    originalPrice: 100000,
    discountedPrice: 80000,
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-09-30'),
    isActive: true,
    displayOrder: 4,
    imagePublicId: null,
  },
];

// ─── Seed function ────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Starting database seed...\n');

  // 0. Validate Cloudinary env vars
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const cloudKey  = process.env.CLOUDINARY_API_KEY;
  const cloudSecret = process.env.CLOUDINARY_API_SECRET;
  const useCloudinary = !!(cloudName && cloudKey && cloudSecret);

  if (!useCloudinary) {
    console.warn('⚠  CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET not set.');
    console.warn('   Images will be stored as their original URLs (no Cloudinary upload).\n');
  } else {
    console.log(`☁  Cloudinary configured (cloud: ${cloudName}). Images will be uploaded.\n`);
  }

  // 1. Seed Categories
  console.log('📂 Seeding categories...');
  const categoryMap: Record<string, number> = {};

   for (const cat of CATEGORIES) {
     const existing = await prisma.$queryRaw<{ id: number }[]>`
       SELECT id FROM "MenuCategory" WHERE slug = ${cat.slug} LIMIT 1
     `;
     if (existing.length > 0) {
       console.log(`   ↳ Category "${cat.name}" already exists (id=${existing[0].id}), skipping.`);
       categoryMap[cat.slug] = existing[0].id;
     } else {
       const created = await prisma.menuCategory.create({
         data: { name: cat.name, slug: cat.slug, description: cat.description, type: cat.type as any },
       });
       console.log(`   ✓ Created category "${cat.name}" (id=${created.id})`);
       categoryMap[cat.slug] = created.id;
     }
   }

  // 2. Seed Menu Items (with Cloudinary upload)
  console.log('\n🍽️  Seeding menu items...');
  let createdCount = 0;
  let skippedCount = 0;
  let uploadCount = 0;
  let uploadFailCount = 0;

  for (const group of MENU_ITEMS) {
    const categoryId = categoryMap[group.categorySlug];
    if (!categoryId) {
      console.warn(`   ⚠ Category slug "${group.categorySlug}" not found – skipping its items.`);
      continue;
    }

    for (const item of group.items) {
      // Check existence with raw SQL to avoid schema-drift issues
      const existing = await prisma.$queryRaw<{ id: number }[]>`
        SELECT id FROM "MenuItem" WHERE slug = ${item.slug} LIMIT 1
      `;
      if (existing.length > 0) {
        skippedCount++;
        continue;
      }

      // Resolve image URL: upload to Cloudinary if configured, otherwise keep original
      let imageUrl = item.imageUrl;
      if (useCloudinary) {
        try {
          imageUrl = await resolveCloudinaryUrl(item.imageUrl, 'menu_items');
          uploadCount++;
        } catch (err: any) {
          console.warn(`   ⚠ Cloudinary upload failed for "${item.name}": ${err.message}`);
          console.warn(`   ↳ Falling back to original URL: ${item.imageUrl}`);
          uploadFailCount++;
        }
      }

          await prisma.menuItem.create({
            data: {
              categoryId,
              name: item.name,
              slug: item.slug,
              shortDescription: item.shortDescription,
              description: item.description,
              productType: item.productType as any,
              price: item.price,
              imageUrl,
              images: imageUrl ? [imageUrl] : [],
              isFeatured: item.isFeatured,
              isAvailable: item.isAvailable,
            },
          });
      createdCount++;
    }
  }
  console.log(`   ✓ Created ${createdCount} menu items (${skippedCount} already exist)`);

  // 3. Seed Featured Services
  console.log('\n⭐ Seeding featured services...');
  let featuredServicesCreated = 0;
  let featuredServicesSkipped = 0;

  for (const service of FEATURED_SERVICES) {
    const existing = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM "ServiceItem" WHERE slug = ${service.slug} LIMIT 1
    `;
    
    if (existing.length > 0) {
      featuredServicesSkipped++;
      console.log(`   ↳ Service "${service.name}" already exists, skipping.`);
      continue;
    }

    let imageUrl = service.imageUrl;
    if (useCloudinary) {
      try {
        imageUrl = await resolveCloudinaryUrl(service.imageUrl, 'featured_services');
      } catch (err: any) {
        console.warn(`   ⚠ Cloudinary upload failed for "${service.name}": ${err.message}`);
      }
    }

    await prisma.serviceItem.create({
      data: {
        name: service.name,
        slug: service.slug,
        type: service.type as any,
        description: service.description,
        imageUrl,
        isActive: service.isActive,
      },
    });
    featuredServicesCreated++;
    console.log(`   ✓ Created featured service "${service.name}"`);
  }
  console.log(`   ✓ Created ${featuredServicesCreated} featured services (${featuredServicesSkipped} already exist)`);

  // 4. Seed Promotions
  console.log('\n🎁 Seeding promotions...');
  let promotionsCreated = 0;
  let promotionsSkipped = 0;

  for (const promotion of PROMOTIONS) {
    const existing = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM "Promotion" WHERE title = ${promotion.title} LIMIT 1
    `;
    
    if (existing.length > 0) {
      promotionsSkipped++;
      console.log(`   ↳ Promotion "${promotion.title}" already exists, skipping.`);
      continue;
    }

    let imageUrl = promotion.imageUrl;
    if (useCloudinary) {
      try {
        imageUrl = await resolveCloudinaryUrl(promotion.imageUrl, 'promotions');
      } catch (err: any) {
        console.warn(`   ⚠ Cloudinary upload failed for "${promotion.title}": ${err.message}`);
      }
    }

    await prisma.promotion.create({
      data: {
        title: promotion.title,
        description: promotion.description,
        imageUrl,
        imagePublicId: promotion.imagePublicId,
        discountPercentage: promotion.discountPercentage,
        originalPrice: promotion.originalPrice,
        discountedPrice: promotion.discountedPrice,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        isActive: promotion.isActive,
        displayOrder: promotion.displayOrder,
      },
    });
    promotionsCreated++;
    console.log(`   ✓ Created promotion "${promotion.title}" (${promotion.discountPercentage}% off)`);
  }
  console.log(`   ✓ Created ${promotionsCreated} promotions (${promotionsSkipped} already exist)`);

  // 5. Seed Sample Orders for Dashboard
  console.log('\n📦 Seeding sample orders...');
  const menuItems = await prisma.menuItem.findMany();
  const menuItemIds = menuItems.map((item: { id: number }) => item.id);
  
  // Create sample orders with different statuses
  const orderStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
  const customers = [
    { name: 'John Smith',  email: 'john@example.com',  phone: '+256700000001' },
    { name: 'Jane Doe',    email: 'jane@example.com',  phone: '+256700000002' },
    { name: 'Bob Johnson', email: 'bob@example.com',   phone: '+256700000003' },
    { name: 'Alice Brown', email: 'alice@example.com', phone: '+256700000004' },
    { name: 'Charlie Davis', email: 'charlie@example.com', phone: '+256700000005' },
  ];

  // Generate sample orders
  const numOrders = Math.min(20, menuItemIds.length * 2);
  for (let i = 0; i < numOrders; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
    const numItems = Math.floor(Math.random() * 3) + 1;
    const orderItems: any[] = [];
    let subtotal = 0;

    for (let j = 0; j < numItems; j++) {
      const menuItemId = menuItemIds[Math.floor(Math.random() * menuItemIds.length)];
      const menuItem = menuItems.find((m: any) => m.id === menuItemId);
      if (!menuItem) continue;

      const quantity = Math.floor(Math.random() * 3) + 1;
      const unitPrice = parseFloat(menuItem.price.toString());
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;

      orderItems.push({
        menuItemId,
        itemNameSnapshot: menuItem.name,
        itemDescriptionSnapshot: menuItem.description ?? null,
        unitPriceSnapshot: unitPrice,
        quantity,
        lineTotal,
      });
    }

    if (orderItems.length === 0) continue;

    const deliveryFee = status !== 'CANCELLED' && Math.random() > 0.5 ? 5000 : 0;
    const totalAmount = subtotal + deliveryFee;

    await prisma.order.create({
      data: {
        orderNumber: `MH-${Date.now()}-${i}`,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAltPhone: null,
        deliveryAddress: Math.random() > 0.5 ? '123 Main St, Kampala' : null,
        locationNotes: null,
        orderType: Math.random() > 0.5 ? 'DELIVERY' : 'PICKUP',
        sourceChannel: 'WEBSITE',
        notes: null,
        subtotal,
        deliveryFee,
        discountAmount: 0,
        totalAmount,
        paymentMethod: 'MOMO_MANUAL',
        paymentArrangement: 'FULL_BEFORE_DELIVERY',
        paymentRuleSnapshot: undefined,
        paymentStatus: 'WAITING_PAYMENT',
        paymentMode: 'FULL_PAYMENT_BEFORE_APPROVAL',
        requiredPaymentAmount: totalAmount,
        paidAmount: 0,
        remainingAmount: totalAmount,
        status: status as any,
        customerPaymentReference: null,
        customerPaymentProofNote: null,
        paymentSlipReference: null,
        reviewedByAdminId: null,
        confirmedByAdminId: null,
        confirmedAt: null,
        approvedByAdminId: null,
        approvedAt: null,
        cancelledAt: status === 'CANCELLED' ? new Date() : null,
        cancellationReason: status === 'CANCELLED' ? 'Customer cancelled' : null,
        items: { create: orderItems },
      },
    });

    console.log(`   ✓ Created order ${i + 1}/${numOrders} (${status})`);
  }

  console.log('\n✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
