import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const getAllSettings = async (req: Request, res: Response) => {
    try {
        const settingsArray = await prisma.siteSetting.findMany();
        // Transform the array into an object, as the original service did
        const settingsObject = settingsArray.reduce((acc, setting) => {
            acc[setting.key] = { value: setting.value, type: "text" }; // Maintain original object structure
            return acc;
        }, {} as { [key: string]: { value: string | null, type: string } });
        
        res.json(settingsObject);
    } catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ message: 'Error al obtener la configuración' });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const settingsToUpdate: { [key: string]: string } = req.body;
        
        const updatePromises = Object.entries(settingsToUpdate).map(([key, value]) => {
            return prisma.siteSetting.upsert({
                where: { key: key },
                update: { value: value },
                create: { key: key, value: value },
            });
        });

        await prisma.$transaction(updatePromises);
        
        res.json({ message: 'Configuración guardada con éxito' });
    } catch (error) {
        console.error("Error updating settings:", error);
        res.status(500).json({ message: 'Error al guardar la configuración' });
    }
};