import { Request, Response } from "express";
import prisma from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const { searchTerm, page = 1, limit = 15 } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    const where: Prisma.CustomerWhereInput = {};
    if (searchTerm && typeof searchTerm === 'string') {
        where.OR = [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
        ];
    }
    
    const totalCustomers = await prisma.customer.count({ where });
    const customers = await prisma.customer.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
    });

    res.json({
        customers,
        totalPages: Math.ceil(totalCustomers / limitNum),
        currentPage: pageNum,
        totalCustomers,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: 'Error al obtener los clientes' });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findUnique({
        where: { id: req.params.id }
    });
    if (customer) {
      res.json(customer);
    } else {
      res.status(404).json({ message: 'Cliente no encontrado' });
    }
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ message: 'Error al obtener el cliente' });
  }
};

export const subscribeToDrop = async (req: Request, res: Response) => {
  const { email, name = "Drop Subscriber" } = req.body;

  if (!email) {
    return res.status(400).json({ message: "El email es requerido." });
  }

  try {
    await prisma.dropNotification.create({
        data: {
            email,
            name,
        }
    });
    res.status(201).json({ message: '¡Gracias por suscribirte! Te avisaremos.' });
  } catch (error: any) {
    // Check for unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(200).json({ message: 'Ya estás suscripto.' });
    }
    console.error("Error subscribing to drop:", error);
    res.status(500).json({ message: "Error al procesar la suscripción." });
  }
};
