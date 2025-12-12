// server/lib/emailTemplates.ts

const BRAND_COLOR = "#000000"; // Negro Puro
const BG_COLOR = "#f4f4f4";
const TEXT_COLOR = "#333333";

// Estilos Base (Estética "All Black" / Editorial)
const containerStyle = `
  max-width: 600px;
  margin: 0 auto;
  background-color: #ffffff;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  border: 1px solid #e5e5e5;
`;

const headerStyle = `
  background-color: #ffffff;
  padding: 40px 20px 20px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
`;

const logoText = `
  color: #000000;
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 4px;
  text-decoration: none;
  text-transform: uppercase;
`;

const contentStyle = `
  padding: 40px 40px;
  color: ${TEXT_COLOR};
  line-height: 1.8;
  font-size: 14px;
`;

const buttonStyle = `
  display: inline-block;
  background-color: #000000; 
  color: #ffffff;
  padding: 16px 32px;
  text-decoration: none;
  font-weight: 500;
  margin-top: 30px;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 2px;
`;

const footerStyle = `
  background-color: #fafafa;
  padding: 30px;
  text-align: center;
  font-size: 11px;
  color: #999999;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

// --------------------------------------------------------------------------
// 1. AVISO DE NO TRANSFERENCIA / LIBERACIÓN DE STOCK (Formal)
// * Se envía cuando expira el tiempo de espera de la transferencia.
// --------------------------------------------------------------------------
export const getTransferInstructionEmail = (customerName: string, amount: number, orderId: string) => {
  return `
    <div style="background-color: ${BG_COLOR}; padding: 40px 10px;">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <span style="${logoText}">Estado del Pedido</span>
        </div>
        <div style="${contentStyle}">
          <p style="font-size: 16px; margin-bottom: 20px;">Estimada/o ${customerName},</p>
          
          <p>Le informamos acerca del estado de su orden <strong>#${orderId}</strong>.</p>
          
          <div style="border-left: 2px solid #000; padding-left: 15px; margin: 25px 0;">
            <p style="margin: 0; color: #000;">
              Hasta el momento, <strong>no hemos registrado la transferencia</strong> correspondiente al pago de su pedido.
            </p>
          </div>

          <p>Debido a la naturaleza exclusiva de nuestro inventario (piezas únicas), el sistema procederá a habilitar nuevamente el producto en la tienda online para que esté disponible para otros clientes.</p>
          
          <p>Si usted ya ha realizado el pago y esto es un error, por favor envíe el comprobante a la brevedad respondiendo este correo para retener la unidad manualmente.</p>

          <center>
            <a href="https://denimrosario.com.ar" style="${buttonStyle}">Ir a la Tienda</a>
          </center>
        </div>
        <div style="${footerStyle}">
          <p>Denim Rosario | Administración</p>
        </div>
      </div>
    </div>
  `;
};

// --------------------------------------------------------------------------
// 2. CONFIRMACIÓN DE COMPRA (Pago Exitoso)
// --------------------------------------------------------------------------
export const getOrderConfirmationEmail = (customerName: string, orderId: string, itemsListHtml: string) => {
  return `
    <div style="background-color: ${BG_COLOR}; padding: 40px 10px;">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <span style="${logoText}">Confirmado</span>
        </div>
        <div style="${contentStyle}">
          <h2 style="margin-top: 0; color: #000; font-size: 18px; font-weight: 400; text-transform: uppercase; letter-spacing: 1px;">Pedido #${orderId}</h2>
          
          <p>Hola ${customerName},</p>
          <p>Tu pago ha sido procesado con éxito. Ya estamos preparando tu selección con la dedicación que se merece.</p>
          
          <div style="margin: 40px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 20px 0;">
            <p style="font-size: 10px; text-transform: uppercase; color: #999; margin-bottom: 15px; letter-spacing: 2px;">Tu Selección</p>
            ${itemsListHtml} 
          </div>

          <p style="font-size: 13px; color: #666;">Te notificaremos en cuanto el paquete esté en camino.</p>
          
          <center>
            <a href="https://denimrosario.com.ar/cuenta/pedidos/${orderId}" style="${buttonStyle}">Ver Estado</a>
          </center>
        </div>
        <div style="${footerStyle}">
          <p>Denim Rosario | ¿Dudas? Respondé este correo.</p>
        </div>
      </div>
    </div>
  `;
};

// --------------------------------------------------------------------------
// NUEVO: CONFIRMACIÓN DE PAGO MANUAL (Transferencia)
// --------------------------------------------------------------------------
export const getOrderPaidEmail = (customerName: string, orderId: string, itemsListHtml: string) => {
  return `
    <div style="background-color: ${BG_COLOR}; padding: 40px 10px;">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <span style="${logoText}">PAGO RECIBIDO</span>
        </div>
        <div style="${contentStyle}">
          <h2 style="margin-top: 0; color: #000; font-size: 18px; font-weight: 400; text-transform: uppercase; letter-spacing: 1px;">Pedido #${orderId}</h2>
          
          <p>Hola ${customerName},</p>
          <p>Hemos recibido y confirmado tu pago. Ya estamos preparando tu selección con la dedicación que se merece.</p>
          
          <div style="margin: 40px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 20px 0;">
            <p style="font-size: 10px; text-transform: uppercase; color: #999; margin-bottom: 15px; letter-spacing: 2px;">Tu Selección</p>
            ${itemsListHtml} 
          </div>

          <p style="font-size: 13px; color: #666;">Te notificaremos en cuanto el paquete esté en camino.</p>
          
          <center>
            <a href="https://denimrosario.com.ar/cuenta/pedidos/${orderId}" style="${buttonStyle}">Ver Estado</a>
          </center>
        </div>
        <div style="${footerStyle}">
          <p>Denim Rosario | ¿Dudas? Respondé este correo.</p>
        </div>
      </div>
    </div>
  `;
};

// --- TEMPLATE 3: ALERTA DE DROP (Automática) ---
export const getDropAlertEmail = (
    customerName: string, 
    recommendedProducts: string[] = [] // Array con nombres de productos ej: ["Jean Cargo", "Mom Rígido"]
) => {
  
  // Generamos el HTML de la lista de productos limpio y minimalista
  const productsHtml = recommendedProducts.length > 0 
    ? recommendedProducts.map(prod => 
        `<li style="margin-bottom: 10px; color: #000; font-weight: 500;">▪ ${prod}</li>`
      ).join('')
    : '<li style="margin-bottom: 10px;">Jeans Rígidos (New Arrivals)</li><li>Piezas Únicas</li>';

  return `
    <div style="background-color: ${BG_COLOR}; padding: 40px 10px;">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <span style="${logoText}">NUEVO DROP</span>
        </div>
        <div style="${contentStyle};">
          
          <p style="font-size: 16px; margin-bottom: 25px;">Hola ${customerName},</p>
          <p>Ya salió el nuevo drop semanal y seleccionamos estos productos que te pueden llegar a gustar:</p>
          
          <div style="background-color: #fafafa; padding: 25px; margin: 30px 0; border-left: 2px solid #000;">
            <ul style="margin: 0; padding-left: 0; list-style: none; font-size: 14px;">
              ${productsHtml}
            </ul>
          </div>

          <p style="margin-bottom: 30px; font-style: italic; color: #666; font-size: 13px;">
            Recordatorio: Trabajamos con stock único. La disponibilidad es inmediata.
          </p>

          <center>
             <a href="https://denimrosario.com.ar" style="${buttonStyle}">Ver Disponibilidad</a>
          </center>
        </div>
        <div style="${footerStyle}">
          <p>Denim Rosario | Lista VIP</p>
        </div>
      </div>
    </div>
  `;
};

// --------------------------------------------------------------------------
// 4. CARRITO ABANDONADO (Minimalista)
// --------------------------------------------------------------------------
export const getAbandonedCartEmail = (customerName: string, cartUrl: string) => {
  return `
    <div style="background-color: ${BG_COLOR}; padding: 40px 10px;">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <span style="${logoText}">Bolsa de Compras</span>
        </div>
        <div style="${contentStyle}; text-align: center;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hola ${customerName},</p>
          <p>Notamos que dejaste piezas en tu bolsa. Al tratarse de stock único, no podemos garantizar la reserva si no se confirma el pedido.</p>
          
          <a href="${cartUrl}" style="${buttonStyle}">RETOMAR COMPRA</a>
          
          <p style="margin-top: 40px;">
            <a href="${cartUrl}" style="color: #999; text-decoration: none; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">No gracias, liberar stock</a>
          </p>
        </div>
      </div>
    </div>
  `;
};

// --- TEMPLATE 5: ENVÍO CONFIRMADO (ROSARIO CADETE) ---
export const getShippedCadeteEmail = (customerName: string, orderId: string, deliveryDate: string) => {
  return `
    <div style="background-color: ${BG_COLOR}; padding: 40px 10px;">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <span style="${logoText}">¡PEDIDO EN CAMINO!</span>
        </div>
        <div style="${contentStyle}">
          <p style="font-size: 16px; margin-bottom: 20px;">Hola ${customerName},</p>
          <p>Tu pedido <strong>#${orderId}</strong> está listo y será entregado por nuestro cadete.</p>
          <p>La entrega está programada para el día:</p>
          <h2 style="color: #000; background: #eee; padding: 10px; display: inline-block; border-radius: 4px; margin: 20px 0;">${deliveryDate}</h2>
          <p>Recordá que el cadete pasará en el rango horario correspondiente a ese día.</p>
          <center>
            <a href="https://denimrosario.com.ar/cuenta/pedidos/${orderId}" style="${buttonStyle}">Ver Estado</a>
          </center>
        </div>
        <div style="${footerStyle}">
          <p>Denim Rosario | Entregas</p>
        </div>
      </div>
    </div>
  `;
};

// --- TEMPLATE 6: ENVÍO CONFIRMADO (CORREO ARGENTINO) ---
export const getShippedCorreoEmail = (customerName: string, orderId: string, trackingInfo: string) => {
  return `
    <div style="background-color: ${BG_COLOR}; padding: 40px 10px;">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <span style="${logoText}">¡PEDIDO EN CAMINO!</span>
        </div>
        <div style="${contentStyle}">
          <p style="font-size: 16px; margin-bottom: 20px;">Hola ${customerName},</p>
          <p>¡Buenas noticias! Tu pedido <strong>#${orderId}</strong> ya fue despachado por Correo Argentino.</p>
          <p><strong>Número de seguimiento:</strong> ${trackingInfo}</p>
          <p>Podés seguir el estado de tu envío directamente en la página de Correo Argentino.</p>
          <center>
            <a href="https://www.correoargentino.com.ar/servicios/ecommerce/paqueteria/buscartracking" style="${buttonStyle}">Seguir Envío</a>
          </center>
          <p style="font-size: 13px; color: #666; margin-top: 20px;">¡Que lo disfrutes!</p>
        </div>
        <div style="${footerStyle}">
          <p>Denim Rosario | Envíos</p>
        </div>
      </div>
    </div>
  `;
};

// --- TEMPLATE 7: PEDIDO CANCELADO ---
export const getOrderCancelledEmail = (customerName: string, orderId: string) => {
  return `
    <div style="background-color: ${BG_COLOR}; padding: 40px 10px;">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <span style="${logoText}">Pedido Cancelado</span>
        </div>
        <div style="${contentStyle}">
          <p style="font-size: 16px; margin-bottom: 20px;">Hola ${customerName},</p>
          <p>Te informamos que tu pedido <strong>#${orderId}</strong> ha sido cancelado.</p>
          <p style="font-size: 13px; color: #666; margin-top: 20px;">Si crees que esto es un error o tenés alguna consulta, no dudes en contactarnos.</p>
        </div>
        <div style="${footerStyle}">
          <p>Denim Rosario | Soporte</p>
        </div>
      </div>
    </div>
  `;
};

// --- TEMPLATE 8: PEDIDO ENTREGADO (ADMIN) ---
export const getOrderDeliveredAdminEmail = (orderId: string, customerName: string, customerEmail: string, customerPhone: string, shippingAddress: string, shippingMethod: string, paymentMethod: string, total: number, itemsListHtml: string) => {
  return `
    <div style="background-color: ${BG_COLOR}; padding: 40px 10px;">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <span style="${logoText}">¡PEDIDO ENTREGADO!</span>
        </div>
        <div style="${contentStyle}">
          <p style="font-size: 16px; margin-bottom: 20px;">El pedido <strong>#${orderId}</strong> de <strong>${customerName}</strong> ha sido marcado como entregado.</p>
          <h3>Detalles del pedido:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 5px;"><strong>Cliente:</strong> ${customerName} (${customerEmail})</li>
            <li style="margin-bottom: 5px;"><strong>Teléfono:</strong> ${customerPhone || 'N/A'}</li>
            <li style="margin-bottom: 5px;"><strong>Dirección de Envío:</strong> ${shippingAddress}</li>
            <li style="margin-bottom: 5px;"><strong>Método de Envío:</strong> ${shippingMethod}</li>
            <li style="margin-bottom: 5px;"><strong>Método de Pago:</strong> ${paymentMethod}</li>
            <li style="margin-bottom: 5px;"><strong>Total:</strong> $${total.toLocaleString('es-AR')}</li>
          </ul>
          <h4 style="margin-top: 30px;">Items:</h4>
          ${itemsListHtml}
          <p style="font-size: 13px; color: #666; margin-top: 30px;">Este es un aviso automático de que un pedido ha completado su ciclo.</p>
        </div>
        <div style="${footerStyle}">
          <p>Denim Rosario | Administración</p>
        </div>
      </div>
    </div>
  `;
};

// --- TEMPLATE 9: NUEVA ORDEN (ADMIN) ---
export const getNewOrderAdminNotificationEmail = (
    orderId: string, 
    orderStatus: string, 
    customerName: string, 
    customerEmail: string,
    paymentMethod: string, 
    total: number, 
    itemsListHtml: string
) => {
  return `
    <div style="background-color: ${BG_COLOR}; padding: 40px 10px;">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <span style="${logoText}">NUEVO PEDIDO</span>
        </div>
        <div style="${contentStyle}">
          <h2 style="margin-top: 0; color: #000; font-size: 18px; font-weight: 400; text-transform: uppercase; letter-spacing: 1px;">¡Tenés un nuevo pedido en la tienda!</h2>
          
          <p>La orden <strong>#${orderId}</strong> acaba de ser creada por <strong>${customerName}</strong> (${customerEmail}).</p>

          <div style="margin: 30px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 20px 0;">
            <p style="font-size: 10px; text-transform: uppercase; color: #999; margin-bottom: 15px; letter-spacing: 2px;">Resumen del Pedido</p>
            <ul style="list-style: none; padding: 0;">
                <li style="margin-bottom: 5px;"><strong>Estado Actual:</strong> <span style="background: #eee; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${orderStatus.toUpperCase()}</span></li>
                <li style="margin-bottom: 5px;"><strong>Método de Pago:</strong> ${paymentMethod}</li>
                <li style="margin-bottom: 5px;"><strong>Monto Total:</strong> $${total.toLocaleString('es-AR')}</li>
            </ul>
          </div>
          
          <div style="margin: 30px 0;">
            <p style="font-size: 10px; text-transform: uppercase; color: #999; margin-bottom: 15px; letter-spacing: 2px;">Productos</p>
            ${itemsListHtml}
          </div>

          <center>
            <a href="https://denimrosario.com.ar/admin" style="${buttonStyle}">Ir al Panel de Admin</a>
          </center>
        </div>
        <div style="${footerStyle}">
          <p>Denim Rosario | Notificaciones</p>
        </div>
      </div>
    </div>
  `;
};
