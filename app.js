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
            // 1. LLAMAR AL "PUENTE"
            const response = await fetch(BACKEND_URL);
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
        
        // Aplicar los filtros del frontend (¡ahora sí los usamos!)
        const filters = getFilters();
        const filteredTokens = tokens.filter(token => {
            return token.liquidity >= filters.minLiquidity &&
                   token.volume24h >= filters.minVolume &&
                   token.marketCap <= filters.maxMarketCap &&
                   token.ageHours <= filters.poolAge;
        });

        if (filteredTokens.length === 0) {
            tokensTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No se encontraron tokens con esos filtros.</td></tr>';
            return;
        }

        // Ordenar por Gem Score (de mayor a menor)
        filteredTokens.sort((a, b) => b.gemScore - a.gemScore);

        filteredTokens.forEach(token => {
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
                <td>${token.sources.join(', ')}</td>
                <td><span class="gem-score ${scoreClass}">${score}</span></td>
            `;

            // Event listener para el clic
            tr.addEventListener('click', () => {
                handleTokenClick(token.id);
            });
            tokensTableBody.appendChild(tr);
        });
    }
    
    // Función que se activa al hacer clic en una fila
    function handleTokenClick(tokenId) {
        const token = currentTokens.find(t => t.id === tokenId);
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

    // Función para leer los filtros
    function getFilters() {
        return {
            network: document.getElementById('network').value,
            minLiquidity: parseFloat(document.getElementById('minLiquidity').value) || 0,
            minVolume: parseFloat(document.getElementById('minVolume').value) || 0,
            maxMarketCap: parseFloat(document.getElementById('maxMarketCap').value) || Infinity,
            poolAge: parseFloat(document.getElementById('poolAge').value) || 24,
        };
    }
});
