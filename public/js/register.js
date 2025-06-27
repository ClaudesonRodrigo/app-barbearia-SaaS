// public/js/register.js

/**
 * Módulo responsável pela lógica da página de registo de uma nova barbearia.
 * VERSÃO FINAL: Utiliza o módulo central firebase-module.js para máxima estabilidade.
 */

// Importa as funções específicas que este ficheiro precisa do nosso módulo central.
import { registerOwner, createShop } from './firebase-module.js';

// --- ELEMENTOS DO DOM ---
const registerForm = document.getElementById('register-form');
const registerButton = document.getElementById('register-button');
const formMessage = document.getElementById('form-message');

// --- LÓGICA DE REGISTO ---
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    registerButton.disabled = true;
    registerButton.innerText = 'A criar...';
    formMessage.innerText = '';
    formMessage.classList.remove('text-red-500', 'text-green-500');

    const shopName = registerForm['shop-name'].value;
    const ownerEmail = registerForm['owner-email'].value;
    const ownerPassword = registerForm['owner-password'].value;

    try {
        // Passo 1: Usa a função do nosso módulo central para criar o utilizador.
        const userCredential = await registerOwner(ownerEmail, ownerPassword);
        const user = userCredential.user;

        // Passo 2: Usa a função do nosso módulo central para criar a loja na base de dados.
        const shopRef = await createShop(user.uid, shopName);
        
        // Passo 3: Redireciona para o dashboard em caso de sucesso, passando o ID da nova loja.
        window.location.href = `dashboard.html?new_shop_id=${shopRef.id}`;

    } catch (error) {
        console.error("Erro no registo:", error);
        registerButton.disabled = false;
        registerButton.innerText = 'Criar Minha Barbearia';
        formMessage.classList.add('text-red-500');

        if (error.code === 'auth/email-already-in-use') {
            formMessage.innerText = 'Este email já está a ser utilizado. Por favor, faça login ou use outro email.';
        } else if (error.code === 'auth/weak-password') {
            formMessage.innerText = 'A sua senha é muito fraca. Tente uma com pelo menos 6 caracteres.';
        } else {
            formMessage.innerText = 'Ocorreu um erro ao criar a sua conta. Tente novamente.';
        }
    }
});
