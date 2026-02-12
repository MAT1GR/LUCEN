import { Request, Response } from 'express';
import prisma from '../lib/prisma.js'; // Importar Prisma
import NodeCache from 'node-cache';
import { trackViewContent } from '../lib/metaConversionService.js';

// Cache for 60 seconds
const productsCache = new NodeCache({ stdTTL: 60 });

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const {
      category: category,
      sortBy: sortBy,
      page: page = 1,
      limit: limit = 9,
    } = req.query;

    const where: any = { is_active: true };
    if (category && typeof category === 'string') {
      where.category = category;
    }

    let orderBy: any = { id: 'desc' };
    if (sortBy === 'price-asc') orderBy = { price: 'asc' };
    if (sortBy === 'price-desc') orderBy = { price: 'desc' };
    
    const totalProducts = await prisma.product.count({ where });
    const products = await prisma.product.findMany({
      where,
      orderBy,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      // NOTE: Review aggregation is not included for performance on the main listing.
      // This can be added back if needed, but it's often better to load it on the product detail page.
    });

    res.json({
      products,
      totalPages: Math.ceil(totalProducts / Number(limit)),
      currentPage: Number(page),
      totalProducts,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: 'Error al obtener los productos' });
  }
};

export const getAllAdminProducts = async (req: Request, res: Response) => {
    try {
        console.log('[ProductController] Fetching all admin products...');
        const products = await prisma.product.findMany({
          orderBy: { id: 'desc' }
        });
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
        const products = await prisma.product.findMany({
          where: { is_active: true, stock: { gt: 0 } },
          orderBy: { created_at: 'desc' },
          take: limit,
        });
        
        productsCache.set(cacheKey, products);
        res.json(products);
    } catch (error) {
        console.error("Error fetching new products:", error);
        res.status(500).json({ message: 'Error al obtener los productos nuevos' });
    }
};

export const getBestsellerProducts = async (req: Request, res: Response) => {
    try {
        // The original logic was a placeholder returning newest products. Replicating that.
        const products = await prisma.product.findMany({
          where: { is_active: true },
          orderBy: { created_at: 'desc' },
        });
        res.json(products);
    } catch (error) {
        console.error("Error fetching bestseller products:", error);
        res.status(500).json({ message: 'Error al obtener los productos más vendidos' });
    }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { 
        reviews: {
          where: { is_approved: true },
          orderBy: { created_at: 'desc' }
        }
      }
    });

    if (product && product.is_active) {
      const userData = {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      };
      const eventSourceUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      trackViewContent(userData, product, eventSourceUrl);
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
        const newProductData: any = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        
        // Data Type Conversion and structuring for Prisma
        const dataForPrisma = {
            name: newProductData.name,
            description: newProductData.description || '',
            material: newProductData.material || '',
            rise: newProductData.rise || '',
            price: parseFloat(newProductData.price) || 0,
            compare_at_price: newProductData.compare_at_price ? parseFloat(newProductData.compare_at_price) : undefined,
            transfer_price: newProductData.transfer_price ? parseFloat(newProductData.transfer_price) : undefined,
            stock: parseInt(newProductData.stock, 10) || 0,
            is_active: newProductData.isActive === 'true',
            category: newProductData.category,
            colors: newProductData.colors ? JSON.parse(newProductData.colors) : [],
            images: files.newImages ? files.newImages.map(file => `/uploads/${file.filename}`) : [],
            video: files.video && files.video.length > 0 ? `/uploads/${files.video[0].filename}` : undefined,
        };

        const createdProduct = await prisma.product.create({ data: dataForPrisma });
        
        productsCache.del('newest-products');
        res.status(201).json(createdProduct);
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ message: 'Error al crear el producto' });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { existingImages, existingVideoUrl, ...productData } = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        
        const dataForPrisma: any = {};

        // Convert types for fields that are present
        if (productData.name) dataForPrisma.name = productData.name;
        if (productData.description) dataForPrisma.description = productData.description;
        if (productData.material) dataForPrisma.material = productData.material;
        if (productData.rise) dataForPrisma.rise = productData.rise;
        if (productData.category) dataForPrisma.category = productData.category;
        if (productData.price) dataForPrisma.price = parseFloat(productData.price);
        if (productData.compare_at_price) dataForPrisma.compare_at_price = parseFloat(productData.compare_at_price);
        if (productData.transfer_price) dataForPrisma.transfer_price = parseFloat(productData.transfer_price);
        if (productData.stock) dataForPrisma.stock = parseInt(productData.stock, 10);
        if (productData.hasOwnProperty('is_active')) dataForPrisma.is_active = productData.is_active === 'true';

        if (productData.colors && typeof productData.colors === 'string') {
            dataForPrisma.colors = JSON.parse(productData.colors);
        }

        let finalImagePaths: string[] = [];
        if (existingImages && typeof existingImages === 'string') {
            finalImagePaths = JSON.parse(existingImages);
        }
        if (files.newImages && files.newImages.length > 0) {
            const newImagePaths = files.newImages.map(file => `/uploads/${file.filename}`);
            finalImagePaths = [...finalImagePaths, ...newImagePaths];
        }
        dataForPrisma.images = finalImagePaths;

        if (files.video && files.video.length > 0) {
            dataForPrisma.video = `/uploads/${files.video[0].filename}`;
        } else if (existingVideoUrl) {
            dataForPrisma.video = existingVideoUrl;
        } else {
            dataForPrisma.video = null;
        }
        
        const updatedProduct = await prisma.product.update({
            where: { id: parseInt(req.params.id) },
            data: dataForPrisma
        });

        productsCache.del('newest-products');
        res.json(updatedProduct);
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ message: 'Error al actualizar el producto' });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        await prisma.product.delete({
            where: { id: parseInt(req.params.id) }
        });
        productsCache.del('newest-products');
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(404).json({ message: 'Error al eliminar el producto o no fue encontrado' });
    }
};

export const reorderProducts = async (req: Request, res: Response) => {
  // The original implementation was a no-op. Maintaining that behavior.
  // Prisma would require a sort_order field on the Product model to implement this properly.
  res.json({ success: true, message: 'Reordering not implemented.' });
};