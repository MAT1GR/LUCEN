import { Request, Response } from 'express';
import { db } from '../lib/database.js';
import NodeCache from 'node-cache';

// Cache for 60 seconds
const productsCache = new NodeCache({ stdTTL: 60 });


export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const filters = {
      category: req.query.category as string | undefined,
      sortBy: req.query.sortBy as string | undefined,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 9,
    };
    const result = await db.products.getAll(filters);
    res.json(result);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: 'Error al obtener los productos' });
  }
};

export const getAllAdminProducts = async (req: Request, res: Response) => {
    try {
        console.log('[ProductController] Fetching all admin products...');
        const products = await db.products.getAllAdmin();
        console.log(`[ProductController] Retrieved ${products.length} products for admin.`);
        res.json(products);
    } catch (error) {
        console.error("Error fetching admin products:", error);
        res.status(500).json({ message: 'Error al obtener los productos para admin' });
    }
};

export const getNewProducts = async (req: Request, res: Response) => {
    const cacheKey = 'newest-products';
    try {
        const cachedProducts = productsCache.get(cacheKey);
        if (cachedProducts) {
            console.log('[Cache] HIT for newest-products');
            return res.json(cachedProducts);
        }

        console.log('[Cache] MISS for newest-products');
        const limit = Number(req.query.limit) || 4;
        const products = await db.products.getNewest(limit);
        
        productsCache.set(cacheKey, products);
        res.json(products);
    } catch (error) {
        console.error("Error fetching new products:", error);
        res.status(500).json({ message: 'Error al obtener los productos nuevos' });
    }
};

export const getBestsellerProducts = async (req: Request, res: Response) => {
    try {
        const products = await db.products.getBestsellers();
        res.json(products);
    } catch (error) {
        console.error("Error fetching bestseller products:", error);
        res.status(500).json({ message: 'Error al obtener los productos más vendidos' });
    }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await db.products.getById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Producto no encontrado' });
    }
  } catch (error) {
    console.error("Error fetching product by id:", error);
    res.status(500).json({ message: 'Error al obtener el producto' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const newProductData = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        
        console.log('[DEBUG] Raw data received for create:', newProductData);

        // Data Type Conversion
        newProductData.price = parseFloat(newProductData.price) || 0;
        newProductData.compare_at_price = parseFloat(newProductData.compare_at_price) || 0;
        newProductData.transfer_price = parseFloat(newProductData.transfer_price) || 0;
        newProductData.stock = parseInt(newProductData.stock, 10) || 0;
        newProductData.isActive = newProductData.isActive === 'true';
        
        if (newProductData.colors && typeof newProductData.colors === 'string') {
            newProductData.colors = JSON.parse(newProductData.colors);
        } else {
            newProductData.colors = [];
        }
        
        if (files.newImages) {
            newProductData.images = files.newImages.map(file => `/uploads/${file.filename}`);
        } else {
            newProductData.images = [];
        }

        if (files.video && files.video.length > 0) {
            newProductData.video = `/uploads/${files.video[0].filename}`;
        }
        
        console.log('[DEBUG] Data before sending to DB for create:', newProductData);

        const createdProductId = await db.products.create(newProductData);
        productsCache.del('newest-products');
        const createdProduct = await db.products.getById(createdProductId);
        res.status(201).json(createdProduct);
    } catch (error) {
        console.error('--- CREATE PRODUCT ERROR CATCH BLOCK ---');
        console.error("Error creating product:", error);
        res.status(500).json({ message: 'Error al crear el producto' });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { existingImages, existingVideoUrl, ...productData } = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        
        console.log('[DEBUG] Raw data received for update:', req.body);

        // Data Type Conversion
        if (productData.price) productData.price = parseFloat(productData.price);
        if (productData.compare_at_price) productData.compare_at_price = parseFloat(productData.compare_at_price);
        if (productData.transfer_price) productData.transfer_price = parseFloat(productData.transfer_price);
        if (productData.stock) productData.stock = parseInt(productData.stock, 10);
        if (productData.hasOwnProperty('isActive')) productData.isActive = productData.isActive === 'true';

        if (productData.colors && typeof productData.colors === 'string') {
            productData.colors = JSON.parse(productData.colors);
        }

        let finalImagePaths: string[] = [];
        if (existingImages && typeof existingImages === 'string') {
            try {
                const parsed = JSON.parse(existingImages);
                if (Array.isArray(parsed)) {
                    finalImagePaths = parsed;
                }
            } catch (e) {
                console.error('Failed to parse existingImages:', e);
                return res.status(400).json({ message: 'El formato de las imágenes existentes no es válido.' });
            }
        }
        
        if (files.newImages && files.newImages.length > 0) {
            const newImagePaths = files.newImages.map(file => `/uploads/${file.filename}`);
            finalImagePaths = [...finalImagePaths, ...newImagePaths];
        }

        productData.images = finalImagePaths;

        if (files.video && files.video.length > 0) {
            productData.video = `/uploads/${files.video[0].filename}`;
        } else if (existingVideoUrl) {
            productData.video = existingVideoUrl;
        } else {
            productData.video = null;
        }

        console.log('[DEBUG] Data before sending to DB for update:', productData);

        const updated = await db.products.update(req.params.id, productData);
        if (updated) {
            productsCache.del('newest-products');
            const updatedProduct = await db.products.getById(req.params.id);
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Producto no encontrado para actualizar' });
        }
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ message: 'Error al actualizar el producto' });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const deleted = await db.products.delete(req.params.id);
        if (deleted) {
            productsCache.del('newest-products');
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Producto no encontrado para eliminar' });
        }
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: 'Error al eliminar el producto' });
    }
};

export const reorderProducts = async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Invalid payload. "items" array is required.' });
    }

    const success = db.products.updateOrder(items);
    
    if (!success && items.length > 0) {
      throw new Error('No products were updated. Please check product IDs.');
    }
    
    // Clear cache to reflect the new order on the frontend
    productsCache.del('newest-products'); 
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error reordering products:", error);
    res.status(500).json({ message: 'Error al reordenar los productos' });
  }
};