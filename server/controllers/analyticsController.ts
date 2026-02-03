import { Request, Response } from 'express';
import { db } from '../lib/database.js';
import { sendEvent } from '../lib/metaConversionService.js';

export const logEvent = async (req: Request, res: Response) => {
  try {
    const { event_name, event_data, eventSourceUrl } = req.body;

    if (!event_name) {
      return res.status(400).json({ message: 'Event name is required.' });
    }

    const metaEvents = ['AddToCart', 'ViewContent', 'InitiateCheckout', 'Purchase'];
    
    if (metaEvents.includes(event_name)) {
        try {
            const userData = {
                ip: req.ip,
                userAgent: req.get('user-agent'),
                // We might get more user data from event_data if available
                ...event_data.user_data
            };

            const customData = {
                currency: event_data?.currency || 'ARS',
                value: event_data?.value,
                content_ids: event_data?.content_ids,
                content_type: event_data?.content_type || 'product',
                content_name: event_data?.content_name,
            };

            sendEvent(
                event_name,
                userData,
                customData,
                eventSourceUrl || `${req.protocol}://${req.get('host')}${req.originalUrl}`
            ).catch(err => 
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