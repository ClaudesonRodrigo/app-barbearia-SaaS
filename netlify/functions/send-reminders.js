// netlify/functions/send-reminders.js

/**
 * Esta é uma Netlify Scheduled Function.
 * Ela é executada automaticamente todos os dias para enviar lembretes de agendamento por WhatsApp.
 */

// SDKs para comunicar com o Firebase (backend) e Twilio (WhatsApp)
const admin = require('firebase-admin');
const twilio = require('twilio');

// --- INICIALIZAÇÃO SEGURA DOS SERVIÇOS ---

// Carrega as chaves secretas a partir das variáveis de ambiente do Netlify
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsAppNumber = process.env.TWILIO_WHATSAPP_FROM;

// Inicializa o Firebase Admin SDK (apenas se ainda não foi inicializado)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const twilioClient = twilio(accountSid, authToken);


// --- LÓGICA PRINCIPAL DA FUNÇÃO ---

exports.handler = async (event) => {
    console.log("A executar a função de lembretes...");

    try {
        // 1. Calcula a data de "amanhã" no formato AAAA-MM-DD
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        const tomorrowDateString = `${year}-${month}-${day}`;
        
        console.log(`A procurar por agendamentos para a data: ${tomorrowDateString}`);

        // 2. Busca todas as barbearias na plataforma
        const shopsSnapshot = await db.collection('shops').get();
        if (shopsSnapshot.empty) {
            console.log("Nenhuma barbearia encontrada.");
            return { statusCode: 200, body: "Nenhuma barbearia encontrada." };
        }

        const reminderPromises = [];

        // 3. Itera sobre cada barbearia
        for (const shopDoc of shopsSnapshot.docs) {
            const shop = { id: shopDoc.id, ...shopDoc.data() };

            // 4. Busca os agendamentos de amanhã para a barbearia atual
            const appointmentsSnapshot = await db.collection(`shops/${shop.id}/appointments`)
                .where('date', '==', tomorrowDateString)
                .get();

            if (appointmentsSnapshot.empty) {
                console.log(`Nenhum agendamento para amanhã na loja ${shop.shopName}.`);
                continue; // Pula para a próxima loja
            }

            // 5. Itera sobre cada agendamento encontrado
            for (const apptDoc of appointmentsSnapshot.docs) {
                const appointment = apptDoc.data();
                
                // **PRÓXIMO PASSO CRÍTICO:** Precisamos de buscar o número de telefone do cliente.
                // Atualmente, não o guardamos. A lógica abaixo assume que teremos uma
                // coleção 'users' onde o telefone é guardado.
                const userDoc = await db.collection('users').doc(appointment.userId).get();
                
                if (userDoc.exists() && userDoc.data().phoneNumber) {
                    const toWhatsAppNumber = userDoc.data().phoneNumber; // ex: '+5579999998888'

                    // 6. Formata a mensagem de lembrete
                    const messageBody = `Olá ${appointment.userName}! 👋 Este é um lembrete do seu agendamento amanhã na ${shop.shopName}.\n\nServiço: ${appointment.serviceName}\nHorário: ${appointment.time}\n\nAté breve! 💈`;

                    // 7. Adiciona a promessa de envio da mensagem a uma lista
                    console.log(`A preparar lembrete para ${toWhatsAppNumber}`);
                    const promise = twilioClient.messages.create({
                        from: `whatsapp:${fromWhatsAppNumber}`,
                        to: `whatsapp:${toWhatsAppNumber}`,
                        body: messageBody
                    });
                    reminderPromises.push(promise);
                } else {
                    console.log(`Número de telefone não encontrado para o utilizador ${appointment.userId}.`);
                }
            }
        }
        
        // 8. Executa todas as promessas de envio de mensagens em paralelo
        await Promise.all(reminderPromises);

        console.log(`Processo concluído. ${reminderPromises.length} lembretes enviados.`);
        return {
            statusCode: 200,
            body: `Processo concluído. ${reminderPromises.length} lembretes enviados.`,
        };

    } catch (error) {
        console.error('Erro na função de lembretes:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Falha ao executar a função de lembretes.' }),
        };
    }
};
