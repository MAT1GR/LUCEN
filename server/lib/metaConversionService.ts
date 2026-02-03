import axios from 'axios';
import crypto from 'crypto';

const API_VERSION = 'v19.0';
const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

const hashData = (data: string) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

export const sendEvent = async (eventName: string, userData: any, customData: any, eventSourceUrl: string, actionSource: string = 'website') => {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.error('Meta Pixel ID or Access Token is not configured.');
    return;
  }

  const url = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: actionSource,
        event_source_url: eventSourceUrl,
        user_data: {
          em: userData.email ? [hashData(userData.email)] : [],
          ph: userData.phone ? [hashData(userData.phone)] : [],
          client_ip_address: userData.ip,
          client_user_agent: userData.userAgent,
          ci: userData.city ? [hashData(userData.city.toLowerCase())] : [],
          zp: userData.zip ? [hashData(userData.zip)] : [],
          country: userData.country ? [hashData(userData.country.toLowerCase())] : [],
        },
        custom_data: customData,
      },
    ],
  };

  try {
    await axios.post(url, payload);
    console.log(`Successfully sent ${eventName} event to Meta.`);
  } catch (error) {
    console.error(`Error sending ${eventName} event to Meta:`, error.response?.data || error.message);
  }
};

export const trackViewContent = (userData: any, product: any, eventSourceUrl: string) => {
  const customData = {
    content_name: product.name,
    content_ids: [product.id],
    content_type: 'product',
    value: product.price,
    currency: 'ARS',
  };
  sendEvent('ViewContent', userData, customData, eventSourceUrl);
};

export const trackAddToCart = (userData: any, product: any, quantity: number, eventSourceUrl: string) => {
  const customData = {
    content_name: product.name,
    content_ids: [product.id],
    content_type: 'product',
    value: product.price * quantity,
    currency: 'ARS',
  };
  sendEvent('AddToCart', userData, customData, eventSourceUrl);
};

export const trackInitiateCheckout = (userData: any, cart: any[], eventSourceUrl: string) => {
  const customData = {
    content_ids: cart.map(item => item.product.id),
    content_type: 'product',
    value: cart.reduce((total, item) => total + item.product.price * item.quantity, 0),
    currency: 'ARS',
    num_items: cart.reduce((total, item) => total + item.quantity, 0),
  };
  sendEvent('InitiateCheckout', userData, customData, eventSourceUrl);
};

export const trackPurchase = (userData: any, order: any, eventSourceUrl: string) => {
  const customData = {
    content_ids: order.items.map(item => item.product_id),
    content_type: 'product',
    value: order.total,
    currency: 'ARS',
    num_items: order.items.reduce((total, item) => total + item.quantity, 0),
    order_id: order.id,
  };
  sendEvent('Purchase', userData, customData, eventSourceUrl);
};
