const Product = require('../model/product.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config for product images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mime = allowedTypes.test(file.mimetype);
        if (ext && mime) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// GET all products
const getAllProducts = async (req, res) => {
    try {
        const { category, finish, minPrice, maxPrice, sort, search, bestSeller } = req.query;
        let filter = {};

        if (category && category !== 'all') filter.category = category;
        if (finish && finish !== 'all') filter.finish = finish;
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }
        if (bestSeller === 'true') filter.isBestSeller = true;

        let sortOption = { createdAt: -1 };
        if (sort === 'price-asc') sortOption = { price: 1 };
        else if (sort === 'price-desc') sortOption = { price: -1 };
        else if (sort === 'rating') sortOption = { rating: -1 };
        else if (sort === 'name') sortOption = { name: 1 };

        const products = await Product.find(filter).sort(sortOption);
        res.status(200).json({ products, total: products.length });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching products', error: err.message });
    }
};

// GET single product by slug
const getProductBySlug = async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ product });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching product', error: err.message });
    }
};

// GET single product by ID
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ product });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching product', error: err.message });
    }
};

// POST create product (admin)
const createProduct = async (req, res) => {
    try {
        const {
            name, category, price, originalPrice,
            colors, finish, coverage, description,
            features, usage, isBestSeller, stock
        } = req.body;

        // Generate slug from name
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        // Check if slug exists
        const existing = await Product.findOne({ slug });
        if (existing) {
            return res.status(400).json({ message: 'A product with this name already exists' });
        }

        const productData = {
            name,
            slug,
            category,
            price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : undefined,
            colors: typeof colors === 'string' ? JSON.parse(colors) : (colors || []),
            finish,
            coverage: coverage || '',
            description: description || '',
            features: typeof features === 'string' ? JSON.parse(features) : (features || []),
            usage: usage || '',
            isBestSeller: isBestSeller === 'true' || isBestSeller === true,
            stock: stock ? Number(stock) : 100
        };

        // Handle image upload
        if (req.file) {
            productData.image = '/uploads/products/' + req.file.filename;
        }

        const product = await Product.create(productData);
        res.status(201).json({ message: 'Product created successfully', product });
    } catch (err) {
        res.status(500).json({ message: 'Error creating product', error: err.message });
    }
};

// PUT update product (admin)
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const {
            name, category, price, originalPrice,
            colors, finish, coverage, description,
            features, usage, isBestSeller, stock, isActive
        } = req.body;

        if (name) {
            product.name = name;
            product.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        }
        if (category) product.category = category;
        if (price !== undefined) product.price = Number(price);
        if (originalPrice !== undefined) product.originalPrice = originalPrice ? Number(originalPrice) : undefined;
        if (colors) product.colors = typeof colors === 'string' ? JSON.parse(colors) : colors;
        if (finish) product.finish = finish;
        if (coverage !== undefined) product.coverage = coverage;
        if (description !== undefined) product.description = description;
        if (features) product.features = typeof features === 'string' ? JSON.parse(features) : features;
        if (usage !== undefined) product.usage = usage;
        if (isBestSeller !== undefined) product.isBestSeller = isBestSeller === 'true' || isBestSeller === true;
        if (stock !== undefined) product.stock = Number(stock);
        if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;

        // Handle new image upload
        if (req.file) {
            // Delete old image if exists
            if (product.image && product.image.startsWith('/uploads/')) {
                const oldPath = path.join(__dirname, '..', product.image);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            product.image = '/uploads/products/' + req.file.filename;
        }

        await product.save();
        res.status(200).json({ message: 'Product updated successfully', product });
    } catch (err) {
        res.status(500).json({ message: 'Error updating product', error: err.message });
    }
};

// DELETE product (admin)
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Delete image file
        if (product.image && product.image.startsWith('/uploads/')) {
            const imgPath = path.join(__dirname, '..', product.image);
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }

        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting product', error: err.message });
    }
};

// POST seed products (admin) — seeds the 12 default products
const seedProducts = async (req, res) => {
    try {
        const count = await Product.countDocuments();
        if (count > 0) {
            return res.status(400).json({ message: 'Products already exist. Clear DB first.' });
        }

        const defaultProducts = [
            { name: "Premium Interior Matte", slug: "premium-interior-matte", category: "interior", price: 54.99, originalPrice: 64.99, colors: ["Arctic White", "Soft Linen", "Warm Beige", "Cool Gray"], finish: "matte", coverage: "350-400 sq ft per gallon", rating: 4.8, reviews: 234, description: "Our flagship interior matte paint delivers exceptional coverage with a velvety smooth finish.", features: ["Zero VOC formula", "Superior hide in one coat", "Washable surface", "Excellent touch-up", "Mildew resistant"], usage: "Apply with brush, roller, or spray.", isBestSeller: true },
            { name: "Ultra Exterior Shield", slug: "ultra-exterior-shield", category: "exterior", price: 68.99, colors: ["Classic White", "Slate Gray", "Sandstone", "Navy Blue"], finish: "satin", coverage: "300-350 sq ft per gallon", rating: 4.9, reviews: 189, description: "Advanced exterior paint with 15-year durability guarantee.", features: ["UV resistant", "All-weather protection", "Resists cracking", "Self-priming", "Mold resistant"], usage: "Apply to clean, dry surfaces.", isBestSeller: true },
            { name: "Waterproof Basement Sealer", slug: "waterproof-basement-sealer", category: "waterproofing", price: 79.99, colors: ["White", "Gray"], finish: "semi-gloss", coverage: "75-125 sq ft per gallon", rating: 4.7, reviews: 156, description: "Heavy-duty waterproofing paint for basement walls.", features: ["Withstands 12 PSI", "Fills cracks", "Prevents efflorescence", "Low odor", "10-year guarantee"], usage: "Apply to bare, clean masonry.", isBestSeller: true },
            { name: "Pro-Grade Primer", slug: "pro-grade-primer", category: "primers", price: 42.99, colors: ["White", "Gray"], finish: "matte", coverage: "400-450 sq ft per gallon", rating: 4.6, reviews: 312, description: "Professional-quality primer for all surfaces.", features: ["Excellent adhesion", "Blocks stains", "Quick dry", "Sandable", "Compatible with all topcoats"], usage: "Stir before use. Apply evenly.", isBestSeller: true },
            { name: "Kitchen & Bath Semi-Gloss", slug: "kitchen-bath-semi-gloss", category: "interior", price: 58.99, colors: ["Pure White", "Almond", "Light Gray", "Soft Blue"], finish: "semi-gloss", coverage: "350-400 sq ft per gallon", rating: 4.7, reviews: 178, description: "Specially formulated for high-moisture areas.", features: ["Maximum moisture resistance", "Anti-microbial", "Stain resistant", "Easy to clean", "Durable finish"], usage: "Ensure proper ventilation." },
            { name: "Ceiling Flat White", slug: "ceiling-flat-white", category: "interior", price: 38.99, colors: ["Bright White", "Soft White"], finish: "matte", coverage: "400-450 sq ft per gallon", rating: 4.5, reviews: 267, description: "Ultra-flat finish for ceilings.", features: ["Spatter-resistant", "Excellent hide", "Non-yellowing", "Low odor", "Quick drying"], usage: "Use ceiling roller frame." },
            { name: "Deck & Patio Stain", slug: "deck-patio-stain", category: "exterior", price: 62.99, colors: ["Natural Cedar", "Redwood", "Walnut", "Gray Wash"], finish: "satin", coverage: "200-300 sq ft per gallon", rating: 4.8, reviews: 145, description: "Premium stain for wood decks and patios.", features: ["Deep penetration", "UV protection", "Water repellent", "Resists wear", "No cracking"], usage: "Apply to clean, dry wood." },
            { name: "Masonry Waterproofer", slug: "masonry-waterproofer", category: "waterproofing", price: 72.99, colors: ["Clear", "White"], finish: "matte", coverage: "100-150 sq ft per gallon", rating: 4.6, reviews: 98, description: "Clear penetrating waterproofer for masonry.", features: ["Penetrating barrier", "Maintains appearance", "Prevents freeze-thaw", "Salt resistant", "Breathable"], usage: "Apply to clean, dry masonry." },
            { name: "Stain-Blocking Primer", slug: "stain-blocking-primer", category: "primers", price: 48.99, colors: ["White"], finish: "matte", coverage: "300-350 sq ft per gallon", rating: 4.8, reviews: 203, description: "High-performance stain-blocking primer.", features: ["Blocks severe stains", "Seals odors", "Interior/exterior", "Shellac-based", "Quick dry"], usage: "Ensure good ventilation." },
            { name: "Trim & Door High-Gloss", slug: "trim-door-high-gloss", category: "interior", price: 52.99, colors: ["Brilliant White", "Black", "Navy", "Forest Green"], finish: "gloss", coverage: "400-450 sq ft per gallon", rating: 4.7, reviews: 167, description: "High-gloss finish for trim, doors, and cabinets.", features: ["Mirror-like finish", "Hard surface", "Excellent leveling", "Stain resistant", "Easy cleanup"], usage: "Apply with quality brush." },
            { name: "Garage Floor Epoxy", slug: "garage-floor-epoxy", category: "waterproofing", price: 89.99, colors: ["Gray", "Tan", "Tile Red"], finish: "semi-gloss", coverage: "250-300 sq ft per gallon", rating: 4.9, reviews: 134, description: "Professional-grade epoxy for garage floors.", features: ["Chemical resistant", "Hot tire resistant", "Slip-resistant", "Easy to clean", "Professional look"], usage: "Etch concrete before application." },
            { name: "Multi-Surface Bonding Primer", slug: "multi-surface-bonding-primer", category: "primers", price: 56.99, colors: ["White", "Gray"], finish: "matte", coverage: "350-400 sq ft per gallon", rating: 4.6, reviews: 189, description: "Versatile bonding primer for difficult surfaces.", features: ["Bonds to slick surfaces", "No sanding", "Interior/exterior", "Excellent adhesion", "Ready in 2 hours"], usage: "Clean surface thoroughly." }
        ];

        await Product.insertMany(defaultProducts);
        res.status(201).json({ message: `${defaultProducts.length} products seeded successfully` });
    } catch (err) {
        res.status(500).json({ message: 'Error seeding products', error: err.message });
    }
};

module.exports = { getAllProducts, getProductBySlug, getProductById, createProduct, updateProduct, deleteProduct, seedProducts, upload };
