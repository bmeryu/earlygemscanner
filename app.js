async function loadAndRenderTokens() {
    loader.style.display = 'block';
    tokensTableBody.innerHTML = '';
    insightsContent.innerHTML = '<p>Buscando gemas y conectando con la IA... (Esto puede tardar hasta 30 segundos)</p>';

    // 1. leer filtros del formulario
    const network = document.getElementById('network').value;            // Solana
    const minLiquidity = document.getElementById('minLiquidity').value;  // 10
    const minVolume   = document.getElementById('minVolume').value;      // 5000
    const maxMarketCap = document.getElementById('maxMarketCap').value;  // 500000
    const poolAge     = document.getElementById('poolAge').value;        // < 2 horas (en tu select dale un value: 2)

    // 2. armar la querystring para el backend
    const params = new URLSearchParams({
        network,
        minLiquidity,
        minVolume,
        maxMarketCap,
        poolAge
    });

    try {
        // 3. llamar AL MISMO backend pero con los filtros
        const response = await fetch(`${BACKEND_URL}?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`Error del backend: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            insightsContent.innerHTML = '<p>No se encontraron tokens nuevos que cumplan el criterio. Intenta más tarde.</p>';
            loader.style.display = 'none';
            return;
        }

        currentTokens = data;
        renderTable(currentTokens);

        loader.style.display = 'none';
        insightsContent.innerHTML = '<p>¡Éxito! Haz clic en un token de la tabla para ver su análisis de IA.</p>';

    } catch (error) {
        console.error("Error al llamar al backend:", error);
        loader.style.display = 'none';
        insightsContent.innerHTML = `<p style="color:red;">Error al conectar con el backend.</p><p>${error.message}</p>`;
    }
}
