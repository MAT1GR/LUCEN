import { Request, Response } from "express";
import { db } from '../lib/database.js';


export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const { searchTerm, page } = req.query;

    const filters = {
        searchTerm: searchTerm as string | undefined,
        page: page ? parseInt(page as string, 10) : 1,
    };

    const result = await db.customers.getAll(filters);
    res.json(result);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: 'Error al obtener los clientes' });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const customer = await db.customers.getById(req.params.id);
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
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "El email es requerido." });
  }

  try {
    const success = await db.notifications.subscribe(email);
    if (success) {
      res.status(201).json({ message: '¡Gracias por suscribirte! Te avisaremos.' });
    } else {
      res.status(200).json({ message: 'Ya estás suscripto.' });
    }
  } catch (error: any) {
    console.error("Error subscribing to drop:", error);
    res.status(500).json({ message: "Error al procesar la suscripción." });
  }
};
