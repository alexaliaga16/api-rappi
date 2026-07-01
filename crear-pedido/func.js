const fdk = require('@fnproject/fdk');
const https = require('https');

const AWS_HOST = process.env.AWS_HOST || 'lmhhjsjxlc.execute-api.us-east-1.amazonaws.com';
const AWS_API_KEY = process.env.AWS_API_KEY || 'dkOQp3tzBa6cyA3ksIxkQ6O01HG7UDtI9N20rEth';

fdk.handle(async function(input) {
  try {
    const { sede, codigo_pedido_ext, cliente_nombre, total_pagado, items } = input;

    if (!sede) {
      return { success: false, mensaje: 'El campo sede es obligatorio para identificar la sucursal.' };
    }
    if (!cliente_nombre || !String(cliente_nombre).trim()) {
      return { success: false, mensaje: 'El campo cliente_nombre es obligatorio.' };
    }
    if (total_pagado === undefined || total_pagado === null) {
      return { success: false, mensaje: 'El campo total_pagado es obligatorio.' };
    }
    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, mensaje: 'El pedido debe tener al menos un ítem.' };
    }

    const pedido = {
      origen: 'rappi',
      sede,
      codigo_pedido_ext: codigo_pedido_ext || 'RAPPI-' + Date.now(),
      cliente_nombre: String(cliente_nombre).trim(),
      total_pagado,
      items: items.map(item => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad
      }))
    };

    const resultado = await llamarAWS('/dev/pedidos/rappi', 'POST', pedido);

    return {
      success: true,
      mensaje: resultado.mensaje || 'Pedido creado',
      pedido_id_bk: resultado.pedido_id_bk,
      sede: input.sede,
      estado_actual: resultado.estado_actual,
      tiempo_estimado_minutos: resultado.tiempo_estimado_minutos
    };

  } catch (error) {
    return {
      success: false,
      mensaje: 'Error al crear pedido',
      error: error.message
    };
  }
});

function llamarAWS(path, method, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);

    const options = {
      hostname: AWS_HOST,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'x-api-key': AWS_API_KEY
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(responseData); } catch { parsed = { raw: responseData }; }

        if (res.statusCode >= 400) {
          return reject(new Error(parsed.mensaje || parsed.message || `HTTP ${res.statusCode}`));
        }
        resolve(parsed);
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}
