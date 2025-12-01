import { Router } from 'express';
import { getAllOrders, updateOrderStatus, getCustomerOrders, createOrder, getOrderById, cancelIfExpired } from '../controllers/orderController.js';

const router = Router();

router.post('/', createOrder);
router.get('/', getAllOrders);
router.get('/:id', getOrderById);
router.get('/customer/:id', getCustomerOrders);
router.put('/:id/status', updateOrderStatus);
router.post('/:id/cancel-if-expired', cancelIfExpired);

export default router;