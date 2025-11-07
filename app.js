document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const fetchDataBtn = document.getElementById('fetchDataBtn');
    const tokensTableBody = document.getElementById('tokensTableBody');
    const insightsContent = document.getElementById('insightsContent');
    const loader = document.getElementById('loader');

    // --- URL de tu Backend ---
    const BACKEND_URL = "https://gem-analyzer-backend-410163603371.europe-west1.run.app"; // O v2 si la recreaste
    
    // Almacén temporal de tokens
    let currentTokens = [];

    // --- Event Listeners ---
    fetchDataBtn.addEventListener('click', loadAndRenderTokens);

    // --- Lógica Principal ---
    async function loadAndRenderTokens() {
        loader.style.display = 'block';
        tokensTableBody.innerHTML = '';
        insightsContent.innerHTML = '<p>Buscando gemas y conectando con la IA... (Esto puede tardar hasta 30 segundos)</p>';
        
        try {
            // --- CAMBIO 1: LEER FILTROS Y CONSTRUIR URL ---
            const filters = getFilters();
            // Convierte el objeto de filtros en una cadena de consulta (ej: "minLiquidity=100&minVolume=5000")
            const queryString = new URLSearchParams(filters).toString();
            
            // 1. LLAMAR AL "PUENTE" (ahora con los filtros en la URL)
            const response = await fetch(`${BACKEND_URL}/?${queryString}`);
            // ------------------------------------------------

            if (!response.ok) {
                throw new Error(`Error del backend: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.length === 0) {
                insightsContent.innerHTML = '<p>No se encontraron tokens nuevos que cumplan el criterio. Intenta más tarde.</p>';
                loader.style.display = 'none';
                return;
            }

            // Guardar tokens y renderizar la tabla
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

    // --- FUNCIONES DE RENDERIZADO ---

    function renderTable(tokens) {
        tokensTableBody.innerHTML = '';
        
        // --- CAMBIO 2: ELIMINAR FILTROS DEL FRONTEND ---
        // El backend ya hizo todo el filtrado, por lo que 'tokens' es la lista final.
        
        if (tokens.length === 0) {
            tokensTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No se encontraron tokens con esos filtros.</td></tr>';
            return;
        }

        // Ordenar por Gem Score (de mayor a menor)
        // (Cambiamos filteredTokens.sort por tokens.sort)
        tokens.sort((a, b) => b.gemScore - a.gemScore);

        // (Cambiamos filteredTokens.forEach por tokens.forEach)
        tokens.forEach(token => {
        // ---------------------------------------------------
            const tr = document.createElement('tr');
            
            const score = token.gemScore;
            let scoreClass = 'score-red';
            if (score > 70) scoreClass = 'score-green';
            else if (score >= 50) scoreClass = 'score-yellow';

            tr.innerHTML = `
                <td>${token.name} (${token.symbol})</td>
                <td>${token.network}</td>
                <td>${token.price.toFixed(6)}</td>
                <td>${token.liquidity.toLocaleString()}</td>
                <td>${token.volume24h.toLocaleString()}</td>
                <td>${token.ageHours.toFixed(1)}h</td>
   	          <td>${token.sources ? token.sources.join(', ') : 'N/A'}</td>
                <td><span class="gem-score ${scoreClass}">${score}</span></td>
            `;

            // Event listener para el clic
            tr.addEventListener('click', () => {
                // Usamos 'token' directamente en lugar de 'token.id' para simplificar
                handleTokenClick(token); 
            });
            tokensTableBody.appendChild(tr);
        });
    }
    
    // Función que se activa al hacer clic en una fila
    function handleTokenClick(token) {
        // (Simplificado, ya que ahora pasamos el objeto 'token' completo)
        if (!token) return;

        insightsContent.innerHTML = `
            <h4>Análisis IA de: ${token.name}</h4>
            <p><strong>Puntaje:</strong> ${token.gemScore}</p>
            <p><strong>Análisis:</strong> ${token.analysis}</p>
            <hr>
            <p><strong>Liquidez:</strong> $${token.liquidity.toLocaleString()}</p>
            <p><strong>Volumen 24h:</strong> $${token.volume24h.toLocaleString()}</p>
            <p><strong>Market Cap:</strong> $${token.marketCap.toLocaleString()}</p>
        `;
    }

    // --- CAMBIO 3: MEJORAR GETFILTERS PARA LA URL ---
    // Función para leer los filtros
    function getFilters() {
        const filters = {
            network: document.getElementById('network').value,
            minLiquidity: parseFloat(document.getElementById('minLiquidity').value) || 0,
            minVolume: parseFloat(document.getElementById('minVolume').value) || 0,
            poolAge: parseFloat(document.getElementById('poolAge').value) || 24,
        };
        
        // Manejar Max Market Cap por separado
        // Si la casilla está vacía, 'parseFloat' da NaN (Not a Number)
        const maxMarketCap = parseFloat(document.getElementById('maxMarketCap').value);
        
        // Solo añadimos 'maxMarketCap' a los filtros si el usuario escribió un número válido
        if (!isNaN(maxMarketCap) && maxMarketCap > 0) {
            filters.maxMarketCap = maxMarketCap;
        }
        // Si está vacío, 'Infinity' no se envía, lo cual es correcto para una URL.
        
        return filters;
    }
    // ---------------------------------------------------
});
