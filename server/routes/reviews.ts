import express from 'express';
import { createReview, getProductReviews, getAllReviews, deleteReview } from '../controllers/reviewsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();


// --- Admin Routes ---
// This groups all admin-related review routes under '/admin' and protects them.
const adminRouter = express.Router();
adminRouter.use(authenticateToken);
adminRouter.get('/', getAllReviews);      // GET /api/reviews/admin
adminRouter.delete('/:id', deleteReview); // DELETE /api/reviews/admin/:id
router.use('/admin', adminRouter);


// --- Public Routes ---
router.post('/', createReview);
router.get('/:productId', getProductReviews);


export default router;
