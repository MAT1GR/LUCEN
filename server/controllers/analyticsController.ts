import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { sendMetaConversionEvent } from '../lib/metaConversionService.js';

export const logEvent = async (req: Request, res: Response) => {
  try {
    const { event_name, event_data, eventSourceUrl } = req.body;

    if (!event_name) {
      return res.status(400).json({ message: 'Event name is required.' });
    }
    
    // This function's primary role seems to be sending data to Meta, not logging to the local DB.
    // The original service had a logging function, but it wasn't called here.
    // We preserve the existing behavior.
    const metaEvents = ['AddToCart', 'ViewContent', 'InitiateCheckout', 'Purchase'];
    
    if (metaEvents.includes(event_name)) {
        try {
            const userData = {
                ip: req.ip,
                userAgent: req.get('user-agent'),
                ...event_data.user_data
            };

            const customData = {
                currency: event_data?.currency || 'ARS',
                value: event_data?.value,
                content_ids: event_data?.content_ids,
                content_type: event_data?.content_type || 'product',
                content_name: event_data?.content_name,
            };

            sendMetaConversionEvent(
                event_name,
                userData,
                customData,
                eventSourceUrl || `${req.protocol}://${req.get('host')}${req.originalUrl}`
            ).catch((err: any) => 
                console.error(`Error enviando ${event_name} a Meta:`, err)
            );
            
        } catch (metaError) {
            console.error(`Error preparando evento Meta ${event_name}:`, metaError);
        }
    }

    res.status(202).json({ message: 'Event processed.' });
  } catch (error) {
    console.error("Error logging analytics event:", error);
    // Respond with 202 to indicate acceptance even if internal logging fails
    res.status(202).json({ message: 'Event processed.' });
  }
};

export const getFunnelMetrics = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
            return res.status(400).json({ message: 'Start date and end date are required.' });
        }

        // Adjust endDate to be inclusive of the whole day
        const inclusiveEndDate = new Date(endDate);
        inclusiveEndDate.setUTCHours(23, 59, 59, 999);

        const results = await prisma.analyticsEvent.groupBy({
            by: ['event_name'],
            _count: {
                _all: true,
            },
            where: {
                created_at: {
                    gte: new Date(startDate),
                    lte: inclusiveEndDate,
                }
            }
        });

        // Format the results into a simple key-value object
        const funnel = results.reduce((acc, row) => {
            acc[row.event_name] = row._count._all;
            return acc;
        }, {} as { [key: string]: number });

        res.json(funnel);
    } catch (error) {
        console.error("Error fetching funnel metrics:", error);
        res.status(500).json({ message: 'Error fetching funnel metrics' });
    }
};