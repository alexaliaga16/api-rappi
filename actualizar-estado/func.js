const fdk = require('@fnproject/fdk');
const https = require('https');

// Si todas las sedes comparten el mismo callback de Rappi, se usa este.
// Si cada sede tiene su propio callback, AWS debe enviarlo en el payload como rappi_callback_url.
const RAPPI_CALLBACK_URL_DEFAULT = process.env.RAPPI_CALLBACK_URL || '';

fdk.handle(async function(input) {
  try {
    const codigo_pedido_ext = (input.codigo_pedido_ext || '').trim();
    const estado_nuevo      = (input.estado_nuevo || '').trim();
    const pedido_id_bk      = (input.pedido_id_bk || '').trim();
    const sede              = (input.sede || '').trim();
    // AWS puede enviar la URL de callback específica de la sede
    const callbackUrl       = (input.rappi_callback_url || '').trim() || RAPPI_CALLBACK_URL_DEFAULT;

    if (!codigo_pedido_ext || !estado_nuevo) {
      return {
        success: false,
        mensaje: 'Campos obligatorios: codigo_pedido_ext, estado_nuevo.'
      };
    }
    if (!sede) {
      return {
        success: false,
        mensaje: 'El campo sede es obligatorio para identificar la sucursal.'
      };
    }

    console.log(`[actualizar-estado] sede=${sede} pedido=${codigo_pedido_ext} → ${estado_nuevo}`);

    if (callbackUrl) {
      await notificarRappi(callbackUrl, {
        codigo_pedido_ext,
        pedido_id_bk,
        sede,
        estado: estado_nuevo
      });
    } else {
      console.warn('[actualizar-estado] Sin RAPPI_CALLBACK_URL configurada — notificación omitida.');
    }

    return {
      success: true,
      mensaje: `Estado ${estado_nuevo} procesado correctamente.`,
      codigo_pedido_ext,
      pedido_id_bk,
      sede,
      estado_nuevo
    };

  } catch (error) {
    return {
      success: false,
      mensaje: 'Error al actualizar estado',
      error: error.message
    };
  }
});

function notificarRappi(url, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = JSON.stringify(body);

    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + (parsed.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => resolve(responseData));
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}
