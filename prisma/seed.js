"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../src/config/db"));
const cloudinary_gateway_1 = require("../src/gateways/cloudinary.gateway");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Resolve a local asset path (e.g. "/assets/break1.jpg") to an absolute file path */
function resolveLocalAsset(assetPath) {
    // assetPath is relative to the frontend src/ folder, e.g. "/assets/break1.jpg"
    const relative = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
    return path_1.default.resolve(__dirname, '../../moor-hall-ui/src', relative);
}
/** Fetch a remote URL and return a Buffer */
function fetchUrlToBuffer(url) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https_1.default : http_1.default;
        lib.get(url, (res) => {
            // Follow redirects
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchUrlToBuffer(res.headers.location).then(resolve).catch(reject);
            }
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
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
async function resolveCloudinaryUrl(imageRef, folder) {
    // Already a Cloudinary URL — return as-is
    if (imageRef.includes('cloudinary.com')) {
        return imageRef;
    }
    let buffer;
    if (imageRef.startsWith('http://') || imageRef.startsWith('https://')) {
        // Remote URL (e.g. Unsplash)
        buffer = await fetchUrlToBuffer(imageRef);
    }
    else {
        // Local asset path relative to frontend src/
        const absPath = resolveLocalAsset(imageRef);
        if (!fs_1.default.existsSync(absPath)) {
            console.warn(`   ⚠ Local asset not found: ${absPath} — skipping upload.`);
            return imageRef; // fall back to original path
        }
        buffer = fs_1.default.readFileSync(absPath);
    }
    const cloudinaryUrl = await (0, cloudinary_gateway_1.uploadSingleImage)(buffer, folder);
    console.log(`   ☁ Uploaded to Cloudinary: ${path_1.default.basename(imageRef)} → ${cloudinaryUrl}`);
    return cloudinaryUrl;
}
// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
    { name: 'Food', slug: 'food', description: 'All food dishes including breakfast, lunch, and dinner', type: 'FOOD' },
    { name: 'Coffee', slug: 'coffee', description: 'Coffee and hot beverages', type: 'COFFEE' },
    { name: 'Drinks', slug: 'drinks', description: 'Cocktails and refreshing beverages', type: 'DRINK' },
    { name: 'Bakery', slug: 'bakery', description: 'Fresh baked goods and pastries', type: 'BAKERY' },
    { name: 'Specials', slug: 'specials', description: 'Chef\'s special selections', type: 'SPECIAL' },
];
// ─── Menu Items ───────────────────────────────────────────────────────────────
// imageUrl can be:
//   - a local asset path relative to moor-hall-ui/src/  (e.g. "/assets/break1.jpg")
//   - a remote URL                                      (e.g. "https://images.unsplash.com/…")
//   - an already-uploaded Cloudinary URL                 (e.g. "https://res.cloudinary.com/…")
const MENU_ITEMS = [
    // ══════════════════════════════════════════════════════════════════════════
    // FOOD  (Breakfast + Dinner + Lunch)
    // ══════════════════════════════════════════════════════════════════════════
    {
        categorySlug: 'food',
        items: [
            // ── Breakfast (Breakfast.tsx) ────────────────────────────────────────
            {
                slug: 'omelette', name: 'Omelette', shortDescription: 'Fluffy eggs with fresh vegetables and cheese',
                description: 'Fluffy eggs with fresh vegetables and cheese', productType: 'FOOD', price: 15000,
                imageUrl: '/assets/break1.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'pancakes', name: 'Pancakes', shortDescription: 'Golden pancakes with maple syrup and butter',
                description: 'Golden pancakes with maple syrup and butter', productType: 'FOOD', price: 12000,
                imageUrl: '/assets/break2.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'coffee-breakfast', name: 'Coffee', shortDescription: 'Freshly brewed premium coffee',
                description: 'Freshly brewed premium coffee', productType: 'COFFEE', price: 3000,
                imageUrl: '/assets/break1.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'orange-juice-breakfast', name: 'Orange Juice', shortDescription: 'Freshly squeezed orange juice',
                description: 'Freshly squeezed orange juice', productType: 'DRINK', price: 4000,
                imageUrl: '/assets/break2.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'croissant', name: 'Croissant', shortDescription: 'Buttery, flaky French pastry',
                description: 'Buttery, flaky French pastry', productType: 'BAKERY', price: 8000,
                imageUrl: '/assets/break1.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'toast', name: 'Toast', shortDescription: 'Artisanal bread with butter and jam',
                description: 'Artisanal bread with butter and jam', productType: 'FOOD', price: 5000,
                imageUrl: '/assets/break2.jpg', isFeatured: false, isAvailable: true,
            },
            // ── Dinner (Dinner.tsx) ───────────────────────────────────────────────
            {
                slug: 'grilled-salmon', name: 'Grilled Salmon', shortDescription: 'Atlantic salmon with lemon herb butter and asparagus',
                description: 'Atlantic salmon with lemon herb butter and asparagus', productType: 'FOOD', price: 42000,
                imageUrl: '/assets/menu.jpg', isFeatured: true, isAvailable: true,
            },
            {
                slug: 'filet-mignon', name: 'Filet Mignon', shortDescription: 'Prime beef tenderloin with red wine reduction',
                description: 'Prime beef tenderloin with red wine reduction', productType: 'FOOD', price: 55000,
                imageUrl: '/assets/chief.jpg', isFeatured: true, isAvailable: true,
            },
            {
                slug: 'lobster-ravioli', name: 'Lobster Ravioli', shortDescription: 'Homemade pasta filled with lobster in cream sauce',
                description: 'Homemade pasta filled with lobster in cream sauce', productType: 'FOOD', price: 38000,
                imageUrl: '/assets/menu.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'duck-confit', name: 'Duck Confit', shortDescription: 'Slow-cooked duck leg with cherry gastrique',
                description: 'Slow-cooked duck leg with cherry gastrique', productType: 'FOOD', price: 45000,
                imageUrl: '/assets/chief.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'seafood-paella', name: 'Seafood Paella', shortDescription: 'Spanish rice with shrimp, mussels, and saffron',
                description: 'Spanish rice with shrimp, mussels, and saffron', productType: 'FOOD', price: 48000,
                imageUrl: '/assets/menu.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'beef-wellington', name: 'Beef Wellington', shortDescription: 'Puff pastry wrapped beef with mushroom duxelles',
                description: 'Puff pastry wrapped beef with mushroom duxelles', productType: 'FOOD', price: 52000,
                imageUrl: '/assets/chief.jpg', isFeatured: true, isAvailable: true,
            },
            {
                slug: 'truffle-risotto', name: 'Truffle Risotto', shortDescription: 'Creamy Arborio rice with black truffle and parmesan',
                description: 'Creamy Arborio rice with black truffle and parmesan', productType: 'FOOD', price: 35000,
                imageUrl: '/assets/menu.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'chocolate-souffle', name: 'Chocolate Soufflé', shortDescription: 'Warm chocolate soufflé with vanilla ice cream',
                description: 'Warm chocolate soufflé with vanilla ice cream', productType: 'FOOD', price: 22000,
                imageUrl: '/assets/chief.jpg', isFeatured: false, isAvailable: true,
            },
            // ── Lunch (Lunch.tsx) ────────────────────────────────────────────────
            {
                slug: 'grilled-chicken', name: 'Grilled Chicken', shortDescription: 'Herb-marinated chicken breast with roasted vegetables',
                description: 'Herb-marinated chicken breast with roasted vegetables', productType: 'FOOD', price: 25000,
                imageUrl: '/assets/lunch.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'grilled-steak', name: 'Grilled Steak', shortDescription: 'Juicy ribeye steak with garlic butter and herbs',
                description: 'Juicy ribeye steak with garlic butter and herbs', productType: 'FOOD', price: 35000,
                imageUrl: '/assets/lunch1.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'bbq-sausages', name: 'BBQ Sausages', shortDescription: 'Smoked sausages with caramelized onions',
                description: 'Smoked sausages with caramelized onions', productType: 'FOOD', price: 18000,
                imageUrl: '/assets/lunch.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'loaded-fries', name: 'Loaded Fries', shortDescription: 'Crispy fries topped with cheese and bacon',
                description: 'Crispy fries topped with cheese and bacon', productType: 'FOOD', price: 12000,
                imageUrl: '/assets/lunch1.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'bbq-ribs', name: 'BBQ Ribs', shortDescription: 'Slow-cooked pork ribs with tangy BBQ sauce',
                description: 'Slow-cooked pork ribs with tangy BBQ sauce', productType: 'FOOD', price: 28000,
                imageUrl: '/assets/lunch.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'grilled-vegetables', name: 'Grilled Vegetables', shortDescription: 'Seasonal vegetables grilled to perfection',
                description: 'Seasonal vegetables grilled to perfection', productType: 'FOOD', price: 10000,
                imageUrl: '/assets/lunch1.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'classic-burger', name: 'Classic Burger', shortDescription: 'Beef patty with lettuce, tomato, and special sauce',
                description: 'Beef patty with lettuce, tomato, and special sauce', productType: 'FOOD', price: 15000,
                imageUrl: '/assets/lunch.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'caesar-salad', name: 'Caesar Salad', shortDescription: 'Crisp romaine lettuce with parmesan and croutons',
                description: 'Crisp romaine lettuce with parmesan and croutons', productType: 'FOOD', price: 14000,
                imageUrl: '/assets/lunch1.jpg', isFeatured: false, isAvailable: true,
            },
        ],
    },
    // ══════════════════════════════════════════════════════════════════════════
    // COFFEE  (CoffeeBeverage.tsx)
    // ══════════════════════════════════════════════════════════════════════════
    {
        categorySlug: 'coffee',
        items: [
            {
                slug: 'classic-espresso', name: 'Classic Espresso', shortDescription: 'Rich and bold single shot espresso made from premium beans',
                description: 'Rich and bold single shot espresso made from premium beans', productType: 'COFFEE', price: 8000,
                imageUrl: 'https://images.unsplash.com/photo-1459755486867-b55449bb39ff?auto=format&fit=crop&w=400&h=400', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'creamy-cappuccino', name: 'Creamy Cappuccino', shortDescription: 'Espresso with steamed milk and thick foam topping',
                description: 'Espresso with steamed milk and thick foam topping', productType: 'COFFEE', price: 12000,
                imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&h=400', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'vanilla-latte', name: 'Vanilla Latte', shortDescription: 'Smooth espresso with steamed milk and vanilla syrup',
                description: 'Smooth espresso with steamed milk and vanilla syrup', productType: 'COFFEE', price: 15000,
                imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=400&h=400', isFeatured: true, isAvailable: true,
            },
            {
                slug: 'iced-americano', name: 'Iced Americano', shortDescription: 'Chilled espresso diluted with cold water over ice',
                description: 'Chilled espresso diluted with cold water over ice', productType: 'COFFEE', price: 10000,
                imageUrl: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=400&h=400', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'fresh-orange-juice', name: 'Fresh Orange Juice', shortDescription: 'Freshly squeezed oranges, no preservatives added',
                description: 'Freshly squeezed oranges, no preservatives added', productType: 'DRINK', price: 14000,
                imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=400&h=400', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'berry-blast-smoothie', name: 'Berry Blast Smoothie', shortDescription: 'Mixed berries, yogurt, and honey blended to perfection',
                description: 'Mixed berries, yogurt, and honey blended to perfection', productType: 'DRINK', price: 18000,
                imageUrl: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=400&h=400', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'chamomile-tea', name: 'Chamomile Tea', shortDescription: 'Relaxing herbal tea with natural calming properties',
                description: 'Relaxing herbal tea with natural calming properties', productType: 'COFFEE', price: 9000,
                imageUrl: 'https://images.unsplash.com/photo-1553909489-cd47e9adb6cc?auto=format&fit=crop&w=400&h=400', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'matcha-latte', name: 'Matcha Latte', shortDescription: 'Premium Japanese matcha with steamed milk and honey',
                description: 'Premium Japanese matcha with steamed milk and honey', productType: 'COFFEE', price: 16000,
                imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=400&h=400', isFeatured: true, isAvailable: true,
            },
        ],
    },
    // ══════════════════════════════════════════════════════════════════════════
    // DRINKS  (Cocktail.tsx)
    // ══════════════════════════════════════════════════════════════════════════
    {
        categorySlug: 'drinks',
        items: [
            {
                slug: 'classic-mojito', name: 'Classic Mojito', shortDescription: 'Fresh mint, lime, sugar, and premium rum',
                description: 'Fresh mint, lime, sugar, and premium rum', productType: 'DRINK', price: 8000,
                imageUrl: '/assets/cok.jpg', isFeatured: true, isAvailable: true,
            },
            {
                slug: 'berry-martini', name: 'Berry Martini', shortDescription: 'Mixed berries, vodka, and a hint of citrus',
                description: 'Mixed berries, vodka, and a hint of citrus', productType: 'DRINK', price: 10000,
                imageUrl: '/assets/cok1.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'cosmopolitan', name: 'Cosmopolitan', shortDescription: 'Vodka, cranberry, lime, and triple sec',
                description: 'Vodka, cranberry, lime, and triple sec', productType: 'DRINK', price: 9000,
                imageUrl: '/assets/cok.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'old-fashioned', name: 'Old Fashioned', shortDescription: 'Bourbon, sugar, bitters, and orange peel',
                description: 'Bourbon, sugar, bitters, and orange peel', productType: 'DRINK', price: 11000,
                imageUrl: '/assets/cok1.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'classic-margarita', name: 'Classic Margarita', shortDescription: 'Tequila, lime juice, and triple sec',
                description: 'Tequila, lime juice, and triple sec', productType: 'DRINK', price: 9000,
                imageUrl: '/assets/cok.jpg', isFeatured: true, isAvailable: true,
            },
            {
                slug: 'espresso-martini', name: 'Espresso Martini', shortDescription: 'Vodka, coffee liqueur, and fresh espresso',
                description: 'Vodka, coffee liqueur, and fresh espresso', productType: 'DRINK', price: 12000,
                imageUrl: '/assets/cok1.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'negroni', name: 'Negroni', shortDescription: 'Gin, Campari, and sweet vermouth',
                description: 'Gin, Campari, and sweet vermouth', productType: 'DRINK', price: 10000,
                imageUrl: '/assets/cok.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'aperol-spritz', name: 'Aperol Spritz', shortDescription: 'Aperol, prosecco, and soda water',
                description: 'Aperol, prosecco, and soda water', productType: 'DRINK', price: 8000,
                imageUrl: '/assets/cok1.jpg', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'whiskey-sour', name: 'Whiskey Sour', shortDescription: 'Bourbon, lemon juice, and simple syrup',
                description: 'Bourbon, lemon juice, and simple syrup', productType: 'DRINK', price: 9000,
                imageUrl: '/assets/cok.jpg', isFeatured: false, isAvailable: true,
            },
        ],
    },
    // ══════════════════════════════════════════════════════════════════════════
    // BAKERY  (Bakery.tsx – image gallery; names derived from image context)
    // ══════════════════════════════════════════════════════════════════════════
    {
        categorySlug: 'bakery',
        items: [
            {
                slug: 'artisan-bread', name: 'Artisan Bread', shortDescription: 'Freshly baked artisan bread',
                description: 'Freshly baked artisan bread', productType: 'BAKERY', price: 5000,
                imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&h=450', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'croissant-bakery', name: 'Butter Croissant', shortDescription: 'Classic French butter croissant',
                description: 'Classic French butter croissant', productType: 'BAKERY', price: 4000,
                imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&h=450', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'chocolate-cake', name: 'Chocolate Cake', shortDescription: 'Rich chocolate layer cake',
                description: 'Rich chocolate layer cake', productType: 'BAKERY', price: 12000,
                imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=600&h=450', isFeatured: true, isAvailable: true,
            },
            {
                slug: 'cinnamon-roll', name: 'Cinnamon Roll', shortDescription: 'Warm cinnamon roll with cream cheese glaze',
                description: 'Warm cinnamon roll with cream cheese glaze', productType: 'BAKERY', price: 6000,
                imageUrl: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=600&h=450', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'danish-pastry', name: 'Danish Pastry', shortDescription: 'Flaky pastry with fruit filling',
                description: 'Flaky pastry with fruit filling', productType: 'BAKERY', price: 5500,
                imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=600&h=450', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'bagel-platter', name: 'Bagel Platter', shortDescription: 'Freshly baked bagels with cream cheese',
                description: 'Freshly baked bagels with cream cheese', productType: 'BAKERY', price: 7000,
                imageUrl: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=600&h=450', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'muffin-assortment', name: 'Muffin Assortment', shortDescription: 'Assorted freshly baked muffins',
                description: 'Assorted freshly baked muffins', productType: 'BAKERY', price: 4500,
                imageUrl: 'https://images.unsplash.com/photo-1606066889831-35faf6fa6ff6?auto=format&fit=crop&w=600&h=450', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'sourdough-loaf', name: 'Sourdough Loaf', shortDescription: 'Handcrafted sourdough bread loaf',
                description: 'Handcrafted sourdough bread loaf', productType: 'BAKERY', price: 8000,
                imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&h=450', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'cheese-pastry', name: 'Cheese Pastry', shortDescription: 'Savory cheese-filled pastry',
                description: 'Savory cheese-filled pastry', productType: 'BAKERY', price: 5000,
                imageUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&h=450', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'cupcake-assortment', name: 'Cupcake Assortment', shortDescription: 'Decorated cupcakes in assorted flavors',
                description: 'Decorated cupcakes in assorted flavors', productType: 'BAKERY', price: 6500,
                imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&h=450', isFeatured: false, isAvailable: true,
            },
            {
                slug: 'fruit-tart', name: 'Fruit Tart', shortDescription: 'Fresh fruit tart with custard filling',
                description: 'Fresh fruit tart with custard filling', productType: 'BAKERY', price: 9000,
                imageUrl: 'https://images.unsplash.com/photo-1607478900766-efe13248b125?auto=format&fit=crop&w=600&h=450', isFeatured: true, isAvailable: true,
            },
        ],
    },
    // ══════════════════════════════════════════════════════════════════════════
    // SPECIALS  (Menu.tsx – Chef's Specials section)
    // ══════════════════════════════════════════════════════════════════════════
    {
        categorySlug: 'specials',
        items: [
            {
                slug: 'crispy-crust-pizza', name: 'Crispy Crust Pizza', shortDescription: 'Freshly baked with premium cheese, tomatoes, and aromatic herbs',
                description: 'Freshly baked with premium cheese, tomatoes, and aromatic herbs', productType: 'FOOD', price: 20000,
                imageUrl: '/assets/pizza.png', isFeatured: true, isAvailable: true,
            },
            {
                slug: 'grilled-salmon-special', name: 'Grilled Salmon', shortDescription: 'Atlantic salmon grilled to perfection with lemon butter sauce',
                description: 'Atlantic salmon grilled to perfection with lemon butter sauce', productType: 'FOOD', price: 25000,
                imageUrl: '/assets/lunch.jpg', isFeatured: true, isAvailable: true,
            },
            {
                slug: 'premium-burger', name: 'Premium Burger', shortDescription: 'Juicy beef patty with cheddar, lettuce, tomato, and special sauce',
                description: 'Juicy beef patty with cheddar, lettuce, tomato, and special sauce', productType: 'FOOD', price: 18000,
                imageUrl: '/assets/burger.png', isFeatured: true, isAvailable: true,
            },
            {
                slug: 'chocolate-lava-cake', name: 'Chocolate Lava Cake', shortDescription: 'Warm chocolate cake with a molten center, served with vanilla ice cream',
                description: 'Warm chocolate cake with a molten center, served with vanilla ice cream', productType: 'FOOD', price: 12000,
                imageUrl: '/assets/break1.jpg', isFeatured: true, isAvailable: true,
            },
        ],
    },
];
// ─── Seed function ────────────────────────────────────────────────────────────
async function main() {
    console.log('🌱 Starting database seed...\n');
    // 0. Validate Cloudinary env vars
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const cloudKey = process.env.CLOUDINARY_API_KEY;
    const cloudSecret = process.env.CLOUDINARY_API_SECRET;
    const useCloudinary = !!(cloudName && cloudKey && cloudSecret);
    if (!useCloudinary) {
        console.warn('⚠  CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET not set.');
        console.warn('   Images will be stored as their original URLs (no Cloudinary upload).\n');
    }
    else {
        console.log(`☁  Cloudinary configured (cloud: ${cloudName}). Images will be uploaded.\n`);
    }
    // 1. Seed Categories
    console.log('📂 Seeding categories...');
    const categoryMap = {};
    for (const cat of CATEGORIES) {
        const existing = await db_1.default.$queryRaw `
       SELECT id FROM "MenuCategory" WHERE slug = ${cat.slug} LIMIT 1
     `;
        if (existing.length > 0) {
            console.log(`   ↳ Category "${cat.name}" already exists (id=${existing[0].id}), skipping.`);
            categoryMap[cat.slug] = existing[0].id;
        }
        else {
            const created = await db_1.default.menuCategory.create({
                data: { name: cat.name, slug: cat.slug, description: cat.description, type: cat.type },
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
            const existing = await db_1.default.$queryRaw `
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
                }
                catch (err) {
                    console.warn(`   ⚠ Cloudinary upload failed for "${item.name}": ${err.message}`);
                    console.warn(`   ↳ Falling back to original URL: ${item.imageUrl}`);
                    uploadFailCount++;
                }
            }
            await db_1.default.menuItem.create({
                data: {
                    categoryId,
                    name: item.name,
                    slug: item.slug,
                    shortDescription: item.shortDescription,
                    description: item.description,
                    productType: item.productType,
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
    // 3. Seed Sample Orders for Dashboard
    console.log('\n📦 Seeding sample orders...');
    const menuItems = await db_1.default.menuItem.findMany();
    const menuItemIds = menuItems.map((item) => item.id);
    // Create sample orders with different statuses
    const orderStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
    const customers = [
        { name: 'John Smith', email: 'john@example.com', phone: '+256700000001' },
        { name: 'Jane Doe', email: 'jane@example.com', phone: '+256700000002' },
        { name: 'Bob Johnson', email: 'bob@example.com', phone: '+256700000003' },
        { name: 'Alice Brown', email: 'alice@example.com', phone: '+256700000004' },
        { name: 'Charlie Davis', email: 'charlie@example.com', phone: '+256700000005' },
    ];
    // Generate sample orders
    const numOrders = Math.min(20, menuItemIds.length * 2);
    for (let i = 0; i < numOrders; i++) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
        const numItems = Math.floor(Math.random() * 3) + 1;
        const orderItems = [];
        let subtotal = 0;
        for (let j = 0; j < numItems; j++) {
            const menuItemId = menuItemIds[Math.floor(Math.random() * menuItemIds.length)];
            const menuItem = menuItems.find((m) => m.id === menuItemId);
            if (!menuItem)
                continue;
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
        if (orderItems.length === 0)
            continue;
        const deliveryFee = status !== 'CANCELLED' && Math.random() > 0.5 ? 5000 : 0;
        const totalAmount = subtotal + deliveryFee;
        await db_1.default.order.create({
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
                status: status,
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
    await db_1.default.$disconnect();
});
//# sourceMappingURL=seed.js.map