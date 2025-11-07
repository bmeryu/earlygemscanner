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
            const response = await fetch(BACKEND_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error del backend: ${response.status} ${response.statusText}`);
            }

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
            console.error("Error al llamar al backend:", error);
            loader.style.display = 'none';
            insightsContent.innerHTML = `<p style="color:red;">Error al conectar con el backend. Revisa la consola (F12).</p><p>${error.message}</p>`;
        }
    }
});
