document.addEventListener('DOMContentLoaded', async function() {
    const amountInput = document.getElementById('amount');
    const fromCurrencySelect = document.getElementById('from-currency');
    const toCurrencySelect = document.getElementById('to-currency');
    const convertBtn = document.getElementById('convert-btn');
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.querySelector('.loading');
    const initialLoadingDiv = document.getElementById('initial-loading');
    
    const apiKey = 'bfc81d756d00440ab33b2617110d1c57';
    
    // Lista de moedas favoritas/comuns para destacar
    const favoriteCurrencies = {
        'USD': 'Dólar Americano (USD)',
        'EUR': 'Euro (EUR)',
        'BRL': 'Real Brasileiro (BRL)',
        'GBP': 'Libra Esterlina (GBP)',
        'JPY': 'Iene Japonês (JPY)',
        'CAD': 'Dólar Canadense (CAD)',
        'AUD': 'Dólar Australiano (AUD)',
        'CHF': 'Franco Suíço (CHF)',
        'CNY': 'Yuan Chinês (CNY)',
        'ARS': 'Peso Argentino (ARS)',
        'MXN': 'Peso Mexicano (MXN)'
    };
    
    // Desabilitar o botão e inputs enquanto carrega
    convertBtn.disabled = true;
    amountInput.disabled = true;
    fromCurrencySelect.disabled = true;
    toCurrencySelect.disabled = true;
    
    // Carregar todas as moedas disponíveis da API
    async function loadAllCurrencies() {
        try {
            const response = await fetch(`https://openexchangerates.org/api/currencies.json`);
            
            if (!response.ok) {
                throw new Error('Falha ao carregar as moedas disponíveis.');
            }
            
            const currencies = await response.json();
            return currencies;
        } catch (error) {
            console.error('Erro ao carregar moedas:', error);
            return null;
        }
    }
    
    // Preencher os selects com todas as moedas
    async function populateCurrencyDropdowns() {
        try {
            // Limpar os selects
            fromCurrencySelect.innerHTML = '';
            toCurrencySelect.innerHTML = '';
            
            // Carregar todas as moedas da API
            const allCurrencies = await loadAllCurrencies();
            
            if (!allCurrencies) {
                throw new Error('Não foi possível carregar as moedas. Recarregue a página.');
            }
            
            // Criar optgroups para moedas favoritas
            const fromFavOptgroup = document.createElement('optgroup');
            fromFavOptgroup.label = 'Moedas Comuns';
            
            const toFavOptgroup = document.createElement('optgroup');
            toFavOptgroup.label = 'Moedas Comuns';
            
            // Adicionar as moedas favoritas primeiro
            for (const [code, name] of Object.entries(favoriteCurrencies)) {
                if (allCurrencies[code]) {
                    const optionFrom = document.createElement('option');
                    optionFrom.value = code;
                    optionFrom.textContent = `${allCurrencies[code]} (${code})`;
                    
                    const optionTo = document.createElement('option');
                    optionTo.value = code;
                    optionTo.textContent = `${allCurrencies[code]} (${code})`;
                    
                    fromFavOptgroup.appendChild(optionFrom);
                    toFavOptgroup.appendChild(optionTo);
                }
            }
            
            // Adicionar optgroups aos selects
            fromCurrencySelect.appendChild(fromFavOptgroup);
            toCurrencySelect.appendChild(toFavOptgroup);
            
            // Criar optgroups para todas as moedas
            const fromAllOptgroup = document.createElement('optgroup');
            fromAllOptgroup.label = 'Todas as Moedas';
            
            const toAllOptgroup = document.createElement('optgroup');
            toAllOptgroup.label = 'Todas as Moedas';
            
            // Ordenar todas as moedas alfabeticamente
            const sortedCurrencies = Object.entries(allCurrencies)
                .sort((a, b) => a[1].localeCompare(b[1]));
            
            // Adicionar todas as moedas aos optgroups
            for (const [code, name] of sortedCurrencies) {
                const optionFrom = document.createElement('option');
                optionFrom.value = code;
                optionFrom.textContent = `${name} (${code})`;
                
                const optionTo = document.createElement('option');
                optionTo.value = code;
                optionTo.textContent = `${name} (${code})`;
                
                fromAllOptgroup.appendChild(optionFrom);
                toAllOptgroup.appendChild(optionTo);
            }
            
            // Adicionar optgroups aos selects
            fromCurrencySelect.appendChild(fromAllOptgroup);
            toCurrencySelect.appendChild(toAllOptgroup);
            
            // Definir valores padrão
            fromCurrencySelect.value = 'USD';
            toCurrencySelect.value = 'BRL';
            
            // Reativar os controles
            convertBtn.disabled = false;
            amountInput.disabled = false;
            fromCurrencySelect.disabled = false;
            toCurrencySelect.disabled = false;
            
            // Esconder o indicador de carregamento inicial
            initialLoadingDiv.style.display = 'none';
            
            return true;
        } catch (error) {
            console.error('Erro ao popular os dropdowns:', error);
            initialLoadingDiv.innerHTML = `
                <p>Erro ao carregar moedas: ${error.message}</p>
                <button onclick="location.reload()">Tentar Novamente</button>
            `;
            return false;
        }
    }
    
    // Função para formatar valores monetários
    function formatCurrency(amount, currencyCode) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency', 
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
    
    // Iniciar o carregamento das moedas
    await populateCurrencyDropdowns();
    
    // Converter moedas quando o botão for clicado
    convertBtn.addEventListener('click', async function() {
        const amount = parseFloat(amountInput.value);
        const fromCurrency = fromCurrencySelect.value;
        const toCurrency = toCurrencySelect.value;
        
        // Validar entrada
        if (isNaN(amount) || amount <= 0) {
            resultDiv.textContent = 'Por favor, insira um valor válido.';
            resultDiv.className = 'result error';
            return;
        }
        
        // Mostrar carregamento
        loadingDiv.style.display = 'block';
        resultDiv.style.display = 'none';
        
        try {
            // Fazer a requisição à API
            const response = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${apiKey}&base=USD`);
            
            if (!response.ok) {
                throw new Error('Falha na conexão com a API. Verifique sua chave de API ou tente novamente mais tarde.');
            }
            
            const data = await response.json();
            
            // Obter as taxas de câmbio
            const rates = data.rates;
            
            // Calcular a conversão
            // Primeiro converter para USD (se necessário) e depois para a moeda de destino
            let result;
            
            if (fromCurrency === 'USD') {
                // Se a moeda de origem for USD, basta multiplicar pela taxa da moeda de destino
                result = amount * rates[toCurrency];
            } else {
                // Caso contrário, primeiro convertemos para USD e depois para a moeda de destino
                const amountInUSD = amount / rates[fromCurrency];
                result = amountInUSD * rates[toCurrency];
            }
            
            // Obter nomes das moedas
            const fromCurrencyName = fromCurrencySelect.options[fromCurrencySelect.selectedIndex].textContent.split(' (')[0];
            const toCurrencyName = toCurrencySelect.options[toCurrencySelect.selectedIndex].textContent.split(' (')[0];
            
            // Exibir o resultado
            resultDiv.innerHTML = `
                <strong>${formatCurrency(amount, fromCurrency)}</strong> equivale a 
                <strong>${formatCurrency(result, toCurrency)}</strong>
                <p>Taxa de câmbio: 1 ${fromCurrency} = ${(rates[toCurrency]/rates[fromCurrency]).toFixed(4)} ${toCurrency}</p>
                <p><small>Atualizado em: ${new Date(data.timestamp * 1000).toLocaleString()}</small></p>
            `;
            resultDiv.className = 'result success';
        } catch (error) {
            resultDiv.textContent = error.message || 'Erro ao converter moedas. Tente novamente.';
            resultDiv.className = 'result error';
            console.error('Erro na conversão:', error);
        } finally {
            loadingDiv.style.display = 'none';
            resultDiv.style.display = 'block';
        }
    });
    
    // Permitir submeter o formulário com a tecla Enter
    amountInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            convertBtn.click();
        }
    });
});