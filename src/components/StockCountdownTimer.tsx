import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface StockCountdownTimerProps {
  createdAt: Date | string;
  orderId: string;
  className?: string;
  onOrderCancel?: () => void; // Optional callback
}

export const StockCountdownTimer: React.FC<StockCountdownTimerProps> = ({ createdAt, orderId, className, onOrderCancel }) => {
    const calculateTimeLeft = () => {
        const createdDate = new Date(createdAt);
        const expirationDate = new Date(createdDate.getTime() + 15 * 60 * 1000); // 15 minutes expiration
        const difference = expirationDate.getTime() - new Date().getTime();

        if (difference <= 0) {
            return { expired: true, minutes: 0, seconds: 0 };
        }

        return {
            expired: false,
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        };
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const [isCancelled, setIsCancelled] = useState(false);

    // This effect runs the timer
    useEffect(() => {
        if (isCancelled) return;
        const timerId = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timerId);
    }, [isCancelled]);

    // This effect runs when the timer expires
    useEffect(() => {
        if (timeLeft.expired && !isCancelled) {
            const cancelOrder = async () => {
                try {
                    const response = await fetch(`/api/orders/${orderId}/cancel-if-expired`, {
                        method: 'POST',
                    });
                    const data = await response.json();
                    if (response.ok) {
                        console.log(`Order ${orderId} cancelled successfully.`);
                        setIsCancelled(true);
                        if(onOrderCancel) onOrderCancel();
                    } else {
                        console.error(`Failed to cancel order ${orderId}:`, data.message);
                    }
                } catch (error) {
                    console.error(`Error calling cancellation API for order ${orderId}:`, error);
                }
            };

            cancelOrder();
        }
    }, [timeLeft.expired, orderId, isCancelled, onOrderCancel]);

    if (timeLeft.expired || isCancelled) {
        return (
             <div className={`flex items-center mt-3 text-red-600 bg-red-50 p-2 rounded-lg ${className}`}>
                <Timer className="w-5 h-5 mr-2" />
                <span className="font-semibold">Pedido cancelado</span>
            </div>
        );
    }

    return (
        <div className={`flex items-center mt-3 text-blue-600 bg-blue-50 p-2 rounded-lg ${className}`}>
            <Timer className="w-5 h-5 mr-2" />
            <span className="font-semibold">
                Tiempo para transferir: {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')} min
            </span>
        </div>
    );
};
