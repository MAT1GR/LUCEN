import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getNewProducts,
  getBestsellerProducts,
  getAllAdminProducts,
  reorderProducts
} from '../controllers/productController.js';

const router = Router();

// --- CONFIGURACIÓN DE MULTER CORREGIDA ---

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(process.cwd(), 'public/uploads');
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
      if (file.fieldname === "video") {
      if (file.mimetype === 'video/mp4' || file.mimetype === 'video/quicktime' || file.mimetype === 'video/webm') {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten videos MP4, MOV y WEBM.'), false);
      }
    } else {    cb(null, true);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// --- RUTAS ---

router.get('/', getAllProducts);
router.get('/all', getAllAdminProducts);
router.get('/newest', getNewProducts);
router.get('/bestsellers', getBestsellerProducts);
router.post('/reorder', reorderProducts);
router.get('/:id', getProductById);

// Aplicamos el middleware 'upload' para crear y actualizar productos
const uploadFields = upload.fields([
  { name: 'newImages', maxCount: 10 },
  { name: 'video', maxCount: 1 }
]);
router.post('/', uploadFields, createProduct);
router.put('/:id', uploadFields, updateProduct);
router.delete('/:id', deleteProduct);

export default router;