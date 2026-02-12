import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const subscribeToDrop = async (req: Request, res: Response) => {
  const { name, phone } = req.body;
  console.log('[Notification] Subscribe request received:', { name, phone });

  if (!phone) {
    return res.status(400).json({ message: 'El número de WhatsApp es requerido.' });
  }

  const subscriberName = name || 'Suscriptor';
  const trimmedPhone = phone.trim().replace(/\s/g, '');

  try {
    const existing = await prisma.dropNotification.findFirst({
        where: { phone: trimmedPhone }
    });

    if (existing) {
        return res.status(200).json({ message: 'Ya estás suscripto.' });
    }

    // To satisfy the UNIQUE NOT NULL constraint on email, we create a placeholder.
    const placeholderEmail = `${trimmedPhone}@placeholder.denimrosario.com`;

    await prisma.dropNotification.create({
        data: {
            name: subscriberName,
            phone: trimmedPhone,
            email: placeholderEmail,
        }
    });
    
    res.status(201).json({ message: '¡Gracias por suscribirte! Te avisaremos.' });

  } catch (error: any) {
    console.error("Error subscribing to drop:", error);
    res.status(500).json({ message: 'Error al procesar la suscripción.' });
  }
};

export const getSubscribers = async (req: Request, res: Response) => {
  try {
      const subscribers = await prisma.dropNotification.findMany({
        orderBy: {
            created_at: 'desc'
        }
      });
      res.json(subscribers);
  } catch (error) {
      console.error("Error fetching subscribers:", error);
      res.status(500).json({ message: 'Error al obtener los suscriptores' });
  }
};
