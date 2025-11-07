document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const fetchDataBtn = document.getElementById('fetchDataBtn');
    const insightsContent = document.getElementById('insightsContent');
    const loader = document.getElementById('loader');

    // --- URL de PRUEBA (API pública y confiable) ---
    const TEST_URL = "https://jsonplaceholder.typicode.com/todos/1";

    // --- Event Listeners ---
    fetchDataBtn.addEventListener('click', loadAndRenderTokens);

    // --- Lógica Principal ---
    async function loadAndRenderTokens() {
        loader.style.display = 'block';
        insightsContent.innerHTML = '<p>Llamando a la API de prueba (jsonplaceholder)...</p>';
        
        try {
            // Esta es la llamada de prueba
            const response = await fetch(TEST_URL);

            if (!response.ok) {
                throw new Error(`Error del backend: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Renderizamos la respuesta de prueba
            loader.style.display = 'none';
            insightsContent.innerHTML = `
                <h4>¡Prueba Exitosa!</h4>
                <p>La app SÍ puede hacer llamadas externas.</p>
                <p><strong>Respuesta de la API de prueba:</strong></p>
                <pre>${JSON.stringify(data, null, 2)}</pre>
            `;

        } catch (error) {
            console.error("Error al llamar a la API de prueba:", error);
            loader.style.display = 'none';
            insightsContent.innerHTML = `<p style="color:red;">Error al llamar a la API de prueba.</p><p>${error.message}</p>`;
        }
    }
});
