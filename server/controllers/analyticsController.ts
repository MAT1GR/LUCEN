import { Request, Response } from 'express';
import { db } from '../lib/database.js';

export const logEvent = async (req: Request, res: Response) => {
  try {
    const { event_name, event_data } = req.body;

    if (!event_name) {
      return res.status(400).json({ message: 'Event name is required.' });
    }

    // This will be a new service function I need to create
    db.analytics.log(event_name, event_data);

    res.status(202).json({ message: 'Event logged.' });
  } catch (error) {
    console.error("Error logging analytics event:", error);
    // Don't block the client, so send a success response anyway
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
