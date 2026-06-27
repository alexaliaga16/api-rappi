const fdk = require('@fnproject/fdk');

fdk.handle(async function(input) {
  try {
    const { pedidoId, estado, paso, trabajador, timestamp, tenantId } = input;

    console.log(`[RAPPI CALLBACK] Pedido: ${pedidoId} | Estado: ${estado} | Paso: ${paso}`);

    // Aquí iría la lógica real de actualizar en Rappi
    // Por ahora registramos y confirmamos
    const actualizacion = {
      pedidoId,
      tenantId,
      estado,
      paso,
      trabajador,
      timestampCallback: timestamp,
      timestampRecibido: new Date().toISOString(),
      origen: 'rappi'
    };

    console.log('Actualización recibida:', JSON.stringify(actualizacion));

    return {
      success: true,
      mensaje: `Estado actualizado: ${estado}`,
      data: actualizacion
    };

  } catch (error) {
    return {
      success: false,
      mensaje: 'Error al actualizar estado',
      error: error.message
    };
  }
});