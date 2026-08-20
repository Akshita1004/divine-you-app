import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// 1. Fetch All Products (Sorted by Rating High to Low)
router.get('/', async (req, res) => {
  try {
    const { category, featured, limit } = req.query;

    let query = supabase
      .from('products')
      .select('*')
      .order('rating', { ascending: false, nullsFirst: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: products, error } = await query;

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.json({ success: true, count: products.length, products });
  } catch (err) {
    console.error('Fetch Products Error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching products' });
  }
});

// 2. Fetch Single Product by Slug or ID
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;

    const isUuid = /^[0-9a-fA-F-]{36}$/.test(identifier);
    const filterColumn = isUuid ? 'id' : 'slug';

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq(filterColumn, identifier)
      .single();

    if (error || !product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (err) {
    console.error('Fetch Single Product Error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching product' });
  }
});

// 3. Seed Static Products into Supabase Database
router.post('/seed', async (req, res) => {
  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Products array is required in body',
      });
    }

    const formattedProducts = products.map((p) => ({
      name: p.title || p.name,
      title: p.title || p.name,
      description: p.description || '',
      price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
      category: p.category || 'General',
      image_url: p.image || p.image_url || (p.images && p.images[0]) || '',
      images: p.images || [p.image || p.image_url || ''],
      stock: p.stock || 50,
      is_featured: p.isFeatured || false,
      rating: p.rating || 4.5,
      reviews_count: p.reviews_count || p.reviewsCount || 1,
    }));

    const { data, error } = await supabase
      .from('products')
      .upsert(formattedProducts, { onConflict: 'name' })
      .select();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.json({
      success: true,
      message: `${data.length} products successfully inserted into database!`,
      products: data,
    });
  } catch (err) {
    console.error('Seed Products Error:', err);
    res.status(500).json({ success: false, message: 'Failed to seed products' });
  }
});

// 4. Submit Review & Recalculate Average Rating Automatically
router.post('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_name, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Valid rating (1-5) is required' });
    }

    // 1. Save new review into 'reviews' table
    const { error: reviewError } = await supabase.from('reviews').insert([
      {
        product_id: id,
        user_name: user_name || 'Anonymous',
        rating: parseFloat(rating),
        comment: comment || '',
      },
    ]);

    if (reviewError) {
      return res.status(400).json({ success: false, message: reviewError.message });
    }

    // 2. Fetch all reviews for this product to recalculate average
    const { data: allReviews, error: fetchError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', id);

    if (fetchError) {
      return res.status(400).json({ success: false, message: fetchError.message });
    }

    const totalReviews = allReviews.length;
    const sumRatings = allReviews.reduce((acc, curr) => acc + Number(curr.rating), 0);
    const newAverageRating = parseFloat((sumRatings / totalReviews).toFixed(1));

    // 3. Update 'products' table with new rating and reviews_count
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        rating: newAverageRating,
        reviews_count: totalReviews,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ success: false, message: updateError.message });
    }

    res.json({
      success: true,
      message: 'Review submitted and rating updated successfully!',
      product: updatedProduct,
    });
  } catch (err) {
    console.error('Submit Review Error:', err);
    res.status(500).json({ success: false, message: 'Server error submitting review' });
  }
});

export default router;