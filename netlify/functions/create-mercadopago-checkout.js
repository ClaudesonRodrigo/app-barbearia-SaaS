// netlify/functions/create-mercadopago-checkout.js

/**
 * Esta é uma Netlify Function que cria uma preferência de pagamento no Mercado Pago.
 * Ela será chamada quando o dono de uma barbearia clicar no botão para iniciar a subscrição.
 */

// O SDK do Mercado Pago facilita a comunicação com a API.
const mercadopago = require('mercadopago');

exports.handler = async (event) => {
    // 1. Segurança: Verifica se o pedido foi feito usando o método POST.
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 2. Obtém os dados enviados pela nossa aplicação (o ID da loja e o email do dono).
        const { shopId, ownerEmail } = JSON.parse(event.body);

        if (!shopId || !ownerEmail) {
            throw new Error('ID da loja ou email do dono em falta.');
        }

        // 3. Obtém a sua chave secreta do Mercado Pago a partir das variáveis de ambiente do Netlify.
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

        if (!accessToken) {
            throw new Error('A chave de acesso do Mercado Pago não está configurada no Netlify.');
        }

        // 4. Configura o SDK do Mercado Pago com a sua chave.
        mercadopago.configure({
            access_token: accessToken,
        });

        // 5. Define os detalhes da subscrição que estamos a vender.
        const preference = {
            items: [
                {
                    title: 'Plano Profissional AgendaBarber',
                    description: 'Acesso mensal à plataforma de agendamento.',
                    quantity: 1,
                    currency_id: 'BRL', // Moeda: Real Brasileiro
                    unit_price: 49.90,   // O preço do seu plano
                },
            ],
            payer: {
                email: ownerEmail,
            },
            back_urls: {
                // URLs para onde o cliente será redirecionado após o pagamento.
                success: `${process.env.URL}/dashboard.html?payment=success`,
                failure: `${process.env.URL}/dashboard.html?payment=failure`,
                pending: `${process.env.URL}/dashboard.html?payment=pending`,
            },
            auto_return: 'approved', // Redireciona automaticamente se o pagamento for aprovado.
            external_reference: shopId, // Guarda o ID da nossa loja para sabermos quem pagou.
        };

        // 6. Cria a preferência de pagamento no Mercado Pago.
        const response = await mercadopago.preferences.create(preference);
        
        // 7. Devolve o link de checkout para a nossa aplicação.
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            // O init_point é o URL para onde devemos redirecionar o utilizador.
            body: JSON.stringify({ checkoutUrl: response.body.init_point }),
        };

    } catch (error) {
        console.error('Erro na função do Mercado Pago:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Falha ao criar o checkout.' }),
        };
    }
};
