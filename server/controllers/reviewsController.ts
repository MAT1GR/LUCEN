import { Request, Response } from 'express';
import { getDB } from '../lib/db/connection';

export const createReview = async (req: Request, res: Response) => {
  try {
    const { product_id, title, rating, comment, user_name, user_email } = req.body;

    if (!product_id || !rating || !user_name || !user_email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = getDB();
    const stmt = db.prepare(`
      INSERT INTO reviews (product_id, title, rating, comment, user_name, user_email, is_approved)
      VALUES (?, ?, ?, ?, ?, ?, 1) -- Auto-approve for now
    `);
    
    stmt.run([product_id, title || '', rating, comment || '', user_name, user_email]);
    stmt.free();

    res.status(201).json({ message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
};

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const db = getDB();
    
    const stmt = db.prepare(`
      SELECT * FROM reviews 
      WHERE product_id = ? AND is_approved = 1 
      ORDER BY created_at DESC
    `);
    
    stmt.bind([productId]);
    const reviews = [];
    while (stmt.step()) {
      reviews.push(stmt.getAsObject());
    }
    stmt.free();

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const stmt = db.prepare(`
      SELECT 
        r.id, 
        r.title, 
        r.rating, 
        r.comment, 
        r.user_name, 
        r.user_email, 
        r.created_at,
        r.is_approved,
        p.name as product_name 
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `);
    
    const reviews = [];
    while (stmt.step()) {
      reviews.push(stmt.getAsObject());
    }
    stmt.free();

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const stmt = db.prepare('DELETE FROM reviews WHERE id = ?');
    const result = stmt.run([id]);
    stmt.free();

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};
