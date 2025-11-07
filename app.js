document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const fetchDataBtn = document.getElementById('fetchDataBtn');
    const tokensTableBody = document.getElementById('tokensTableBody');
    const insightsContent = document.getElementById('insightsContent');
    const loader = document.getElementById('loader');

    // --- URL de tu Backend (ahora público, pero protegido por CORS) ---
    const BACKEND_URL = "https://gem-analyzer-backend-410163603371-europe-west1.run.app";

    // --- Event Listeners ---
    fetchDataBtn.addEventListener('click', loadAndRenderTokens);

    // --- Lógica Principal ---
    async function loadAndRenderTokens() {
        loader.style.display = 'block';
        tokensTableBody.innerHTML = '';
        insightsContent.innerHTML = '<p>Conectando con el "puente" de IA...</p>';
        
        try {
            // Esta es la llamada real desde tu navegador al "puente"
            // No necesita "tokens" de auth porque el "puente" es público
            // y nos protege con CORS.
            const response = await fetch(BACKEND_URL, {
                method: 'GET', // O POST, nuestro código acepta ambos
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                // Si la conexión falla (ej. error 500)
                throw new Error(`Error del backend: ${response.status} ${response.statusText}`);
            }

            // Si la conexión es exitosa, lee la respuesta
            const data = await response.json();
            
            // Renderizamos la respuesta de prueba de nuestro "puente"
            loader.style.display = 'none';
            insightsContent.innerHTML = `
                <h4>¡Conexión Exitosa!</h4>
                <p>${data.message}</p>
                <p><strong>Token:</strong> ${data.tokenName}</p>
                <p><strong>Análisis:</strong> ${data.analysis}</p>
            `;

        } catch (error) {
            // Si la llamada fetch falla (ej. error de red o de CORS)
            console.error("Error al llamar al backend:", error);
            loader.style.display = 'none';
            insightsContent.innerHTML = `<p style="color:red;">Error al conectar con el backend. Revisa la consola (F12).</p><p>${error.message}</p>`;
        }
    }
});
