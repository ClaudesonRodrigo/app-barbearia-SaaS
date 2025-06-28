// netlify/functions/get-style-suggestion.js

/**
 * Esta é uma Netlify Function. Ela funciona como um pequeno "backend"
 * que corre nos servidores do Netlify, e não no navegador do utilizador.
 * A sua principal função é fazer a chamada à API da Gemini de forma segura,
 * protegendo a sua chave de API.
 */

exports.handler = async (event) => {
    // 1. Verifica se o pedido foi feito usando o método POST.
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 2. Obtém os dados enviados pela nossa aplicação (o prompt do utilizador e o barbeiro).
        const { userInput, barber } = JSON.parse(event.body);

        // 3. Obtém a sua chave de API secreta a partir das variáveis de ambiente do Netlify.
        // A chave NUNCA é exposta no código do navegador.
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error('A chave da API Gemini não está configurada no Netlify.');
        }
        if (!userInput || !barber) {
             throw new Error('Dados insuficientes para a sugestão.');
        }

        // 4. Constrói o prompt para a IA, tal como fazíamos antes.
        const prompt = `Você é um barbeiro especialista e consultor de estilo. Um cliente escolheu o barbeiro '${barber.name}', cuja especialidade é '${barber.specialty}'. O cliente descreveu o que procura: '${userInput}'. Com base nisso, sugira 3 opções de penteados distintas. Para cada opção, dê um nome para o estilo e uma descrição curta e encorajadora do porquê seria uma boa escolha. Formate a resposta em markdown simples, usando '###' para o nome do estilo.`;
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const payload = { contents: [{ parts: [{ text: prompt }] }] };

        // 5. Faz a chamada segura à API da Gemini a partir do servidor do Netlify.
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error('Gemini API response error:', await response.text());
            throw new Error('A API da Gemini retornou um erro.');
        }

        const result = await response.json();
        const suggestionText = result.candidates[0].content.parts[0].text;

        // 6. Devolve a sugestão para a nossa aplicação do cliente.
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ suggestion: suggestionText }),
        };

    } catch (error) {
        console.error('Erro na função Netlify:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Falha ao obter a sugestão de estilo.' }),
        };
    }
};
