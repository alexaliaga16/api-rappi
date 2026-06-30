const fdk = require('@fnproject/fdk');
const https = require('https');

const AWS_BASE_URL = 'ewavegx0bb.execute-api.us-east-1.amazonaws.com';
const AWS_API_KEY = '8PCJrAG4JK8hubjgztwm6fEty4Mt5Uc5LYzI1193';
const OCI_CALLBACK_URL = 'https://a3v6vivxnusibqxhwkay5kyvve.apigateway.us-chicago-1.oci.customer-oci.com/v1/pedido/estado';

fdk.handle(async function(input) {
  try {
    const pedido = {
      origen: 'rappi',
      codigo_pedido_ext: input.codigo_pedido_ext || 'RAPPI-' + Date.now(),
      cliente_nombre: input.cliente_nombre,
      total_pagado: input.total_pagado,
      items: (input.items || []).map(item => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad
      }))
    };

    const resultado = await llamarAWS('/dev/pedidos/rappi', 'POST', pedido);

    return {
      success: true,
      mensaje: resultado.mensaje || 'Pedido creado',
      pedido_id_bk: resultado.pedido_id_bk,
      estado_actual: resultado.estado_actual,
      tiempo_estimado_minutos: resultado.tiempo_estimado_minutos,
      data: resultado
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
      hostname: AWS_BASE_URL,
      path: path,
      method: method,
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
        try { resolve(JSON.parse(responseData)); }
        catch { resolve({ raw: responseData }); }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}