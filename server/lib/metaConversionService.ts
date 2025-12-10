import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const META_API_VERSION = 'v19.0'; 
const META_PIXEL_ID = process.env.META_PIXEL_ID;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

interface UserData {
  em?: string[]; // Hashed email
  ph?: string[]; // Hashed phone
  fn?: string[]; // Hashed first name
  ln?: string[]; // Hashed last name
  ct?: string[]; // Hashed city
  st?: string[]; // Hashed state
  zip?: string[]; // Hashed zip code
  country?: string[]; // Hashed country
  external_id?: string[]; // Hashed external ID
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string; // Facebook click ID
  fbp?: string; // Facebook browser ID
}

interface CustomData {
  currency?: string;
  value?: number;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  contents?: Array<{ id: string; quantity: number; item_price: number }>;
  num_items?: number;
  order_id?: string;
  search_string?: string;
  status?: string;
}

interface Event {
  event_name: string;
  event_time: number; // Unix timestamp
  action_source: string; // e.g., 'website', 'app', 'physical_store', 'system_generated'
  event_id?: string; // Unique event ID
  user_data?: UserData;
  custom_data?: CustomData;
  data_processing_options?: string[]; // e.g., ['LDU'] for Limited Data Use
  data_processing_options_country?: number; // e.g., 1 for US
  data_processing_options_state?: number; // e.g., 1000 for California
}

/**
 * Sends an event to the Meta Conversion API.
 * @param event The event object conforming to Meta's API specification.
 */
export async function sendMetaConversionEvent(event: Event): Promise<any> {
  if (!META_PIXEL_ID || !META_ACCESS_TOKEN) {
    console.warn('Meta Pixel ID or Access Token not configured. Skipping event.');
    return;
  }

  const url = `https://graph.facebook.com/${META_API_VERSION}/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`;

  try {
    const response = await axios.post(url, {
      data: [event],
          }, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
    console.log(`Meta Conversion Event Sent (${event.event_name}):`, response.data);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error sending Meta Conversion Event:', error.response?.data || error.message);
    } else {
      console.error('An unexpected error occurred:', error);
    }
    // No lanzamos el error para no interrumpir el flujo de compra si falla Meta
  }
}