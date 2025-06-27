// public/js/api.js

/**
 * Módulo para gerir todas as chamadas a APIs externas, como a API da Google Gemini.
 */

// A sua chave de API para a Google Gemini.
// Lembre-se que, em produção, esta chave deve ser protegida e não exposta no lado do cliente.
const GEMINI_API_KEY = "AIzaSyB8O3FPpocPTqlfRfUOTYMUmptvyFXcpP4";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Pede uma sugestão de estilo à API Gemini com base na descrição do utilizador e na especialidade do barbeiro.
 * @param {string} userInput - A descrição fornecida pelo utilizador.
 * @param {object} barber - O objeto do barbeiro selecionado.
 * @returns {Promise<string>} Uma promessa que resolve para o texto da sugestão, formatado em HTML.
 */
export async function getStyleSuggestion(userInput, barber) {
    // Cria o prompt detalhado para a IA, fornecendo contexto.
    const prompt = `Você é um barbeiro especialista e consultor de estilo. Um cliente escolheu o barbeiro '${barber.name}', cuja especialidade é '${barber.specialty}'. O cliente descreveu o que procura: '${userInput}'. Com base nisso, sugira 3 opções de penteados distintas. Para cada opção, dê um nome para o estilo e uma descrição curta e encorajadora do porquê seria uma boa escolha. Formate a resposta em markdown simples, usando '###' para o nome do estilo.`;

    const payload = {
        contents: [{
            role: "user",
            parts: [{ text: prompt }]
        }]
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            // Lança um erro com a mensagem de status se a resposta não for bem-sucedida.
            throw new Error(`Erro na API: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0) {
            let text = result.candidates[0].content.parts[0].text;
            // Converte o markdown simples para HTML para ser exibido corretamente.
            text = text.replace(/### (.*?)\n/g, '<h4 class="text-lg font-bold text-amber-300 mt-4 mb-1">$1</h4>');
            text = text.replace(/\n/g, '<br>');
            return text;
        } else {
            // Lança um erro se a IA não retornar nenhuma sugestão.
            throw new Error("A IA não retornou nenhuma sugestão.");
        }

    } catch (error) {
        console.error("Erro na chamada à API Gemini:", error);
        // Propaga o erro para ser tratado pela função que chamou.
        throw error;
    }
}
