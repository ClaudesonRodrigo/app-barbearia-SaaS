// netlify/functions/mercadopago-webhook.js

/**
 * Esta Netlify Function atua como um Webhook.
 * Ela recebe notificações automáticas do Mercado Pago sempre que um evento de pagamento ocorre.
 */

// O SDK do Firebase Admin permite que o nosso backend interaja com o Firestore de forma segura.
const admin = require('firebase-admin');

// Configuração para inicializar o Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
    // 1. Apenas aceita pedidos POST, que é como o Mercado Pago envia as notificações.
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);
        
        // 2. Verifica se a notificação é sobre um pagamento que foi atualizado.
        if (body.action === 'payment.updated') {
            const paymentId = body.data.id;
            
            // 3. Obtém os detalhes do pagamento usando o SDK do Mercado Pago
            // (Esta parte requereria o SDK do Mercado Pago ou uma chamada fetch direta)
            // Para simplificar, vamos assumir que o pagamento foi aprovado
            // e que o `external_reference` está disponível na notificação,
            // embora na prática seja necessário fazer uma chamada GET para buscar os detalhes do pagamento.
            
            // Em um cenário real, você faria:
            // const paymentDetails = await mercadopago.payment.findById(paymentId);
            // const status = paymentDetails.body.status;
            // const shopId = paymentDetails.body.external_reference;

            // Para este exemplo, vamos simular que recebemos o ID da loja e o status
            const shopId = body.external_reference; // Supondo que a notificação inclua isto.
            const status = 'approved'; // Simulando um pagamento aprovado

            // 4. Se o pagamento foi aprovado, atualizamos o status da loja no Firestore.
            if (status === 'approved' && shopId) {
                const shopRef = db.collection('shops').doc(shopId);
                await shopRef.update({
                    subscriptionStatus: 'active',
                    lastPaymentDate: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`Subscrição da loja ${shopId} atualizada para 'active'.`);
            }
        }
        
        // 5. Responde ao Mercado Pago com um status 200 OK para confirmar o recebimento.
        return {
            statusCode: 200,
            body: 'Notificação recebida com sucesso.',
        };

    } catch (error) {
        console.error('Erro no webhook do Mercado Pago:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Falha ao processar a notificação.' }),
        };
    }
};
