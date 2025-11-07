// Espera a que el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {

    // --- Elementos del DOM ---
    const fetchDataBtn = document.getElementById('fetchDataBtn');
    const tokensTableBody = document.getElementById('tokensTableBody');
    const insightsContent = document.getElementById('insightsContent');
    const insightsLoader = document.getElementById('insightsLoader');
    const webValidationContent = document.getElementById('webValidationContent');
    const webValidationResult = document.getElementById('webValidationResult');
    const loader = document.getElementById('loader');

    // --- Event Listeners ---
    fetchDataBtn.addEventListener('click', loadAndRenderTokens);

    // --- Datos de Ejemplo (Mock Data) ---
    // Usamos esto ya que no podemos hacer llamadas a API reales desde un archivo local
    // y para evitar problemas de CORS y API Keys.
    function getMockDexScreenerData() {
        return [
            {
                pairAddress: "SOL123",
                baseToken: { symbol: "GEM", name: "MyGem" },
                priceUsd: "0.005",
                liquidity: { usd: 15000 },
                volume: { h24: 50000 },
                pairCreatedAt: Date.now() - (1 * 60 * 60 * 1000), // Hace 1 hora
                marketCap: 150000
            },
            {
                pairAddress: "SOL456",
                baseToken: { symbol: "FAST", name: "FastCoin" },
                priceUsd: "0.02",
                liquidity: { usd: 5000 },
                volume: { h24: 10000 },
                pairCreatedAt: Date.now() - (3 * 60 * 60 * 1000), // Hace 3 horas
                marketCap: 40000
            }
        ];
    }

    function getMockBirdeyeData() {
        // Birdeye a menudo requiere una API key, por lo que el mock es esencial
        return [
            {
                address: "SOL123", // Coincide con DexScreener
                symbol: "GEM",
                name: "MyGem",
                price: 0.005,
                liquidity: 15100, // Ligeramente diferente
                volume_24h: 51000,
                createdAt: Date.now() - (1 * 60 * 60 * 1000),
                mc: 150000
            },
            {
                address: "SOL789",
                symbol: "NEW",
                name: "NewbieCoin",
                price: 0.001,
                liquidity: 800, // No pasa el filtro
                volume_24h: 3000,
                createdAt: Date.now() - (30 * 60 * 1000), // 30 mins
                mc: 10000
            }
        ];
    }

    // --- Funciones de Fetch (Simuladas) ---

    // Función que SIMULA la llamada a DexScreener
    async function fetchDexScreener(chain) {
        console.log(`Simulando fetch a DexScreener para ${chain}...`);
        // --- CÓDIGO REAL (COMENTADO) ---
        // try {
        //     const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/search?q=new_pairs_on_${chain}`);
        //     if (!response.ok) throw new Error('Error en DexScreener');
        //     const data = await response.json();
        //     return data.pairs; // Ajustar según la estructura real de la API
        // } catch (error) {
        //     console.error("Error en fetchDexScreener:", error);
        //     return getMockDexScreenerData(); // Fallback a mock
        // }
        
        // Retornamos mock data directamente para la demo
        return new Promise(resolve => {
            setTimeout(() => resolve(getMockDexScreenerData()), 500);
        });
    }

    // Función que SIMULA la llamada a Birdeye
    async function fetchBirdeye(chain) {
        console.log(`Simulando fetch a Birdeye para ${chain}...`);
        // --- CÓDIGO REAL (COMENTADO) ---
        // const BIRDEYE_API_KEY = "PEGA_TU_API_KEY_AQUI"; 
        // try {
        //     const response = await fetch(`https://public-api.birdeye.so/defi/new_pairs?chain=${chain}`, {
        //         headers: { 'X-API-KEY': BIRDEYE_API_KEY }
        //     });
        //     if (!response.ok) throw new Error('Error en Birdeye');
        //     const data = await response.json();
        //     return data.data.pairs; // Ajustar según la estructura real de la API
        // } catch (error) {
        //     console.error("Error en fetchBirdeye:", error);
        //     return getMockBirdeyeData(); // Fallback a mock
        // }

        // Retornamos mock data directamente para la demo
        return new Promise(resolve => {
            setTimeout(() => resolve(getMockBirdeyeData()), 500);
        });
    }

    // --- Lógica Principal ---

    async function loadAndRenderTokens() {
        loader.style.display = 'block';
        tokensTableBody.innerHTML = '';
        insightsContent.innerHTML = '<p>Haz clic en un token para obtener análisis...</p>';
        webValidationContent.style.display = 'none';

        const filters = getFilters();

        // 1. Fetch de ambas fuentes
        const [dexData, birdeyeData] = await Promise.all([
            fetchDexScreener(filters.network),
            fetchBirdeye(filters.network)
        ]);

        // 2. Unificar y procesar datos
        const processedTokens = processAndCombineTokens(dexData, birdeyeData);

        // 3. Calcular Score y Filtrar
        const scoredAndFilteredTokens = processedTokens
            .map(token => {
                token.gemScore = calculateGemScore(token, filters);
                return token;
            })
            .filter(token => {
                // Filtramos *después* de obtenerlos, aunque en un caso real
                // las APIs deberían permitir filtrar en la llamada.
                return token.liquidity >= filters.minLiquidity &&
                       token.volume24h >= filters.minVolume &&
                       token.marketCap <= filters.maxMarketCap &&
                       token.ageHours <= filters.poolAge;
            });
            
        // 4. Renderizar
        renderTable(scoredAndFilteredTokens);
        loader.style.display = 'none';
    }

    function processAndCombineTokens(dexData, birdeyeData) {
        const tokenMap = new Map();

        // Normalizar datos de DexScreener
        dexData.forEach(pair => {
            const token = {
                id: pair.pairAddress,
                symbol: pair.baseToken.symbol,
                name: pair.baseToken.name,
                network: getFilters().network,
                price: parseFloat(pair.priceUsd),
                liquidity: parseFloat(pair.liquidity.usd),
                volume24h: parseFloat(pair.volume.h24),
                ageHours: (Date.now() - new Date(pair.pairCreatedAt).getTime()) / (1000 * 60 * 60),
                marketCap: parseFloat(pair.marketCap) || 0,
                sources: ['DexScreener']
            };
            tokenMap.set(token.id, token);
        });

        // Normalizar y unir datos de Birdeye
        birdeyeData.forEach(pair => {
            const id = pair.address;
            if (tokenMap.has(id)) {
                // Token ya existe, agregar fuente y promediar datos
                const existing = tokenMap.get(id);
                existing.sources.push('Birdeye');
                // Podríamos promediar liquidez, volumen, etc.
            } else {
                // Token nuevo de Birdeye
                const token = {
                    id: id,
                    symbol: pair.symbol,
                    name: pair.name,
                    network: getFilters().network,
                    price: parseFloat(pair.price),
                    liquidity: parseFloat(pair.liquidity),
                    volume24h: parseFloat(pair.volume_24h),
                    ageHours: (Date.now() - new Date(pair.createdAt).getTime()) / (1000 * 60 * 60),
                    marketCap: parseFloat(pair.mc) || 0,
                    sources: ['Birdeye']
                };
                tokenMap.set(id, token);
            }
        });

        return Array.from(tokenMap.values());
    }
    
    function getFilters() {
        return {
            network: document.getElementById('network').value,
            minLiquidity: parseFloat(document.getElementById('minLiquidity').value) || 0,
            minVolume: parseFloat(document.getElementById('minVolume').value) || 0,
            maxMarketCap: parseFloat(document.getElementById('maxMarketCap').value) || Infinity,
            poolAge: parseFloat(document.getElementById('poolAge').value) || 24,
        };
    }

    function calculateGemScore(token, filters) {
        let score = 0;
        // Base 100 pts (según el prompt, aunque parece que suma sobre 100)
        // Re-interpretando: 100 es el máximo.
        if (token.ageHours <= filters.poolAge) score += 30;
        if (token.volume24h >= filters.minVolume) score += 25;
        if (token.liquidity >= filters.minLiquidity) score += 20;
        if (token.marketCap <= filters.maxMarketCap) score += 15;
        if (token.sources.length > 1) score += 10;
        
        return Math.min(score, 100); // Asegurar que no pase de 100
    }

    function renderTable(tokens) {
        tokensTableBody.innerHTML = '';
        if (tokens.length === 0) {
            tokensTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No se encontraron tokens con esos filtros.</td></tr>';
            return;
        }

        tokens.forEach(token => {
            const tr = document.createElement('tr');
            
            const score = token.gemScore;
            let scoreClass = 'score-red';
            if (score > 75) scoreClass = 'score-green';
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
                handleTokenClick(token);
            });
            tokensTableBody.appendChild(tr);
        });
    }

    // --- Funciones de IA y Validación ---

    async function handleTokenClick(token) {
        // Resetear paneles
        insightsContent.innerHTML = '';
        webValidationContent.style.display = 'none';
        insightsLoader.style.display = 'block';

        // 1. Obtener análisis de Gemini
        // Simulamos la llamada a Gemini, ya que requiere un backend seguro
        const analysis = await getGeminiAnalysis(token);
        insightsContent.innerHTML = analysis;
        insightsLoader.style.display = 'none';

        // 2. Realizar validación web (simulada)
        // La "capacidad de conectarse a datos en tiempo real" es una función
        // del backend de AI Studio. Lo simulamos con una búsqueda.
        const validationResult = await getWebValidation(token.name);
        webValidationResult.innerHTML = validationResult;
        webValidationContent.style.display = 'block';
    }

    async function getGeminiAnalysis(token) {
        // --- PROMPT PARA GEMINI (del prompt de QPT) ---
        const systemPrompt = `Eres un analista cripto que evalúa tokens muy jóvenes. Recibirás un JSON con datos como: nombre, símbolo, red, edad del pool, liquidez, volumen 24h, market cap y fuentes donde se encontró.

Tu tarea:
1. Di en 1 frase si parece una oportunidad temprana o no.
2. Menciona 2 factores positivos (ej. volumen alto para la edad, liquidez decente, aparece en más de una fuente).
3. Menciona 1 alerta (baja liquidez, market cap desconocido, edad muy baja que puede ser honeypot, falta de auditoría).
4. Cierra con una frase de responsabilidad: 'esto no es recomendación de inversión'.

Responde en español neutro y máximo 100 palabras.`;
        
        const tokenJson = JSON.stringify(token, null, 2);

        // --- SIMULACIÓN DE LLAMADA A GEMINI ---
        // En una app real, harías un fetch a tu propio backend (ej. una Cloud Function)
        // que a su vez llamaría a la API de Vertex AI (Gemini) con el systemPrompt y el tokenJson.
        // Aquí, simulamos la respuesta:
        
        console.log("Enviando a Gemini (simulado):\n", systemPrompt, "\nDatos:\n", tokenJson);
        
        return new Promise(resolve => {
            setTimeout(() => {
                let report = `<h4>Análisis Rápido de ${token.name}</h4>`;
                
                // Lógica de análisis simulada (basada en el prompt)
                const isGood = token.gemScore > 60;
                
                if (isGood) {
                    report += `<p>Este token muestra señales iniciales de ser una oportunidad especulativa temprana.</p>`;
                } else {
                    report += `<p>Este token parece ser de alto riesgo y podría no ser una buena oportunidad ahora mismo.</p>`;
                }
                
                report += `<ul>`;
                report += `<li><strong>Positivo:</strong> Volumen de 24h (${token.volume24h.toLocaleString()}) es notable para su liquidez.</li>`;
                report += `<li><strong>Positivo:</strong> Encontrado en ${token.sources.length} fuentes (${token.sources.join(', ')}).</li>`;
                report += `<li><strong>Alerta:</strong> La edad (${token.ageHours.toFixed(1)}h) es extremadamente baja, aumentando el riesgo de 'honeypot' o 'rug pull'.</li>`;
                report += `</ul>`;
                report += `<p><em>Esto no es recomendación de inversión.</em></p>`;
                
                resolve(report);
            }, 1000); // Simula el delay de la red
        });
    }

    async function getWebValidation(tokenName) {
        // En un entorno real de AI Studio, usarías la herramienta de "grounding" o búsqueda.
        // En una app web normal, esto es más complejo (requiere API de Google Search).
        // Hacemos una simulación simple:
        
        return new Promise(resolve => {
            const resultHtml = `Buscando "${tokenName}"... (Simulado). <br>
            <a href="https://x.com/search?q=%24${tokenName}" target="_blank">Buscar en X (Twitter)</a><br>
            <a href="https://www.google.com/search?q=${tokenName}+crypto" target="_blank">Buscar en Google</a>`;
            resolve(resultHtml);
        });
    }

});
