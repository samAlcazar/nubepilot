(function () {
  // 1. Verificamos si el objeto LS existe y si estamos en una página de producto
  if (window.LS && LS.product) {

    const data = {
      store_id: LS.storeId,     // ID de la tienda
      product_id: LS.product.id, // ID del producto visitado
      product_name: LS.product.name,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    console.log("Trackeando visita al producto:", data.product_id);

    // 2. Enviamos la información a TU servidor (Endpoint de tu App)
    fetch('https://nubepilotback-production.up.railway.app/api/dashboard/track-product-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      // 'keepalive: true' ayuda a que la petición se complete si el usuario cierra rápido
      keepalive: true
    })
      .catch(err => console.error("Error trackeando visita:", err));
  }
})();