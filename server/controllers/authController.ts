import { Request, Response } from 'express';
import prisma from '../lib/prisma.js'; // Importar Prisma
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; // Importar bcrypt

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key-change-me';

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
  }
  try {
    const user = await prisma.adminUser.findUnique({
      where: { username },
    });
    
    if (user && bcrypt.compareSync(password, user.password)) {
      // Excluir password del objeto de usuario que se devuelve
      const { password, ...userWithoutPassword } = user;
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ user: userWithoutPassword, token });
    } else {
      res.status(401).json({ message: 'Credenciales inválidas' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  const { username, oldPassword, newPassword } = req.body;

  if (!username || !oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  try {
    const user = await prisma.adminUser.findUnique({
      where: { username },
    });

    if (user && bcrypt.compareSync(oldPassword, user.password)) {
      const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
      await prisma.adminUser.update({
        where: { username },
        data: { password: hashedNewPassword },
      });
      res.json({ message: 'Contraseña actualizada con éxito' });
    } else {
      res.status(401).json({ message: 'La contraseña actual es incorrecta o el usuario no existe' });
    }
  } catch (error) {
    console.error('Error al cambiar la contraseña:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};