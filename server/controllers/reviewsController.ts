import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

export const createReview = async (req: Request, res: Response) => {
  try {
    const { product_id, title, rating, comment, user_name, user_email } = req.body;

    if (!product_id || !rating || !user_name || !user_email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await prisma.review.create({
      data: {
        product_id: parseInt(product_id),
        title: title || '',
        rating: parseInt(rating),
        comment: comment || '',
        user_name,
        user_email,
        is_approved: true, // Auto-approve for now
      },
    });

    res.status(201).json({ message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
};

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    
    const reviews = await prisma.review.findMany({
      where: {
        product_id: parseInt(productId),
        is_approved: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Remap to match original structure with product_name
    const formattedReviews = reviews.map(r => ({
      ...r,
      product_name: r.product.name,
      product: undefined, // remove the nested product object
    }));

    res.json(formattedReviews);
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.review.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'Review not found' });
    }
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

export const toggleReviewApproval = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { is_approved } = req.body;

        if (typeof is_approved !== 'boolean') {
            return res.status(400).json({ message: 'is_approved must be a boolean' });
        }

        const updatedReview = await prisma.review.update({
            where: { id: parseInt(id) },
            data: { is_approved: is_approved },
        });

        res.json(updatedReview);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ message: 'Review not found' });
        }
        console.error('Error updating review approval:', error);
        res.status(500).json({ error: 'Failed to update review' });
    }
};
