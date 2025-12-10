import nodemailer from 'nodemailer';

// 1. Configuración del transportador
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT), // Esto leerá 465
  secure: process.env.SMTP_SECURE === 'true', // Esto leerá true
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 2. Verificación de conexión (Opcional, pero recomendado para probar)
transporter.verify().then(() => {
  console.log('✅ Listo para enviar correos con ventas@denimrosario.com.ar');
}).catch((error) => {
  console.error('❌ Error conexión SMTP:', error);
});

import { getNewOrderAdminNotificationEmail } from './lib/emailTemplates.js';

// 3. Función para enviar correos
export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"Denim Rosario" <${process.env.EMAIL_FROM}>`, // Remitente elegante
      to,
      subject,
      html,
    });
    console.log('Correo enviado ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error enviando correo:', error);
    return false;
  }
};

export const sendNewOrderAdminNotification = async (order: any, orderId: string) => {
    try {
        const adminEmail = 'grigomati@gmail.com';
        if (!adminEmail) {
            console.warn('Admin email not configured, skipping notification.');
            return;
        }

        const subject = `Nuevo Pedido #${orderId.substring(0, 8)} - ${order.customerName}`;
        
        const itemsListHtml = `
            <ul style="list-style: none; padding: 0;">
                ${order.items.map((item: any) => `
                    <li style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <strong>${item.product.name}</strong> (Talle: ${item.size}) x ${item.quantity} - $${item.product.price.toLocaleString('es-AR')}
                    </li>
                `).join('')}
            </ul>
        `;

        const emailBody = getNewOrderAdminNotificationEmail(
            orderId,
            order.status,
            order.customerName,
            order.customerEmail,
            order.paymentMethod,
            order.total,
            itemsListHtml
        );

        // Use the existing sendEmail function
        await sendEmail(adminEmail, subject, emailBody);
        console.log(`Admin notification sent for order ${orderId}`);

    } catch (error) {
        console.error(`Error sending admin notification for order ${orderId}:`, error);
        // Don't re-throw, just log the error. The main flow shouldn't fail because of this.
    }
};