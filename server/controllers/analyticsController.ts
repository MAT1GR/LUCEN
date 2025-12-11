import { Request, Response } from 'express';
import { db } from '../lib/database.js';
import { sendMetaConversionEvent } from '../lib/metaConversionService.js'; // <--- Importante

export const logEvent = async (req: Request, res: Response) => {
  try {
    const { event_name, event_data } = req.body;

    if (!event_name) {
      return res.status(400).json({ message: 'Event name is required.' });
    }

    // 1. Guardar en BD local (Tu lógica original)
    // db.analytics.log(event_name, event_data); // Descomenta si tu BD ya tiene esta función

    // 2. ENVIAR A META (Lógica Nueva)
    // Filtramos para enviar solo eventos relevantes a Facebook y evitar duplicados o basura
    const metaEvents = ['AddToCart', 'ViewContent', 'InitiateCheckout', 'Purchase'];
    
    if (metaEvents.includes(event_name)) {
        try {
            // Construimos el evento para CAPI
            const serverEvent = {
                event_name: event_name,
                event_time: Math.floor(Date.now() / 1000),
                action_source: 'website',
                user_data: {
                    client_ip_address: req.ip,
                    client_user_agent: req.headers['user-agent'],
                    // Nota: En 'AddToCart' usualmente no tenemos el email aún,
                    // por eso no enviamos 'em' aquí. Meta usará IP y UserAgent para intentar coincidir.
                },
                custom_data: {
                    currency: event_data?.currency || 'ARS',
                    value: event_data?.value,
                    content_ids: event_data?.content_ids,
                    content_type: event_data?.content_type || 'product',
                    content_name: event_data?.content_name,
                }
            };

            // Enviamos el evento sin esperar (fire and forget) para no frenar la respuesta
            sendMetaConversionEvent(serverEvent).catch(err => 
                console.error(`Error enviando ${event_name} a Meta:`, err)
            );
            
        } catch (metaError) {
            console.error(`Error preparando evento Meta ${event_name}:`, metaError);
        }
    }

    res.status(202).json({ message: 'Event logged and processed.' });
  } catch (error) {
    console.error("Error logging analytics event:", error);
    res.status(202).json({ message: 'Event processed.' });
  }
};

export const getFunnelMetrics = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required.' });
        }

        const metrics = db.analytics.getFunnel(startDate as string, endDate as string);

        res.json(metrics);
    } catch (error) {
        console.error("Error fetching funnel metrics:", error);
        res.status(500).json({ message: 'Error fetching funnel metrics' });
    }
};