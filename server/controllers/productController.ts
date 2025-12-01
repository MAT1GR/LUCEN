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
        const products = await db.products.getAllAdmin();
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
        
        console.log('[DEBUG] Raw data received:', newProductData);

        // Data Type Conversion
        newProductData.price = parseFloat(newProductData.price) || 0;
        const waistFlat = parseInt(newProductData.waist_flat, 10);
        newProductData.waist_flat = isNaN(waistFlat) ? null : waistFlat;
        const length = parseInt(newProductData.length, 10);
        newProductData.length = isNaN(length) ? null : length;
        const riseCm = parseInt(newProductData.rise_cm, 10);
        newProductData.rise_cm = isNaN(riseCm) ? null : riseCm;
        newProductData.isNew = newProductData.isNew === 'true';
        newProductData.isBestSeller = newProductData.isBestSeller === 'true';
        newProductData.isActive = newProductData.isActive === 'true';
        newProductData.isWaistStretchy = newProductData.isWaistStretchy === 'true';
        
        if (newProductData.sizes && typeof newProductData.sizes === 'string') {
            newProductData.sizes = JSON.parse(newProductData.sizes);
        }
        
        if (files.newImages) {
            newProductData.images = files.newImages.map(file => `/uploads/${file.filename}`);
        } else {
            newProductData.images = [];
        }

        if (files.video) {
            newProductData.video = `/uploads/${files.video[0].filename}`;
        }
        
        console.log('[DEBUG] Data before sending to DB:', newProductData);

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

        // Data Type Conversion
        if (productData.price) productData.price = parseFloat(productData.price);
        if (productData.hasOwnProperty('waist_flat')) {
            const parsed = parseInt(productData.waist_flat, 10);
            productData.waist_flat = isNaN(parsed) ? null : parsed;
        }
        if (productData.hasOwnProperty('length')) {
            const parsed = parseInt(productData.length, 10);
            productData.length = isNaN(parsed) ? null : parsed;
        }
        if (productData.hasOwnProperty('rise_cm')) {
            const parsed = parseInt(productData.rise_cm, 10);
            productData.rise_cm = isNaN(parsed) ? null : parsed;
        }
        if (productData.isNew) productData.isNew = productData.isNew === 'true';
        if (productData.isBestSeller) productData.isBestSeller = productData.isBestSeller === 'true';
        if (productData.isActive) productData.isActive = productData.isActive === 'true';
        if (productData.isWaistStretchy) productData.isWaistStretchy = productData.isWaistStretchy === 'true';

        if (productData.sizes && typeof productData.sizes === 'string') {
            productData.sizes = JSON.parse(productData.sizes);
        }

        let finalImagePaths = existingImages ? JSON.parse(existingImages) : [];
        
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