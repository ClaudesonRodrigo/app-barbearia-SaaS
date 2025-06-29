<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crie a Sua Conta - AgendaBarber</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
</head>
<body class="font-body bg-gray-900 text-gray-300">

    <div class="min-h-screen flex flex-col items-center justify-center p-4">
        <div class="w-full max-w-md">
            <header class="text-center mb-8">
                <a href="index.html" class="font-title text-4xl font-bold text-white">
                    Agenda<span class="text-amber-400">Barber</span>
                </a>
                <p class="text-gray-400 mt-2">Comece o seu teste gratuito de 30 dias.</p>
            </header>

            <main class="bg-gray-800 p-8 rounded-lg shadow-2xl">
                <form id="register-form" class="space-y-6">
                    <div>
                        <label for="shop-name" class="block text-sm font-bold text-gray-300 mb-2">Nome da Barbearia</label>
                        <input type="text" id="shop-name" name="shop-name" required class="w-full p-3 bg-gray-700 rounded-lg text-white border-2 border-gray-600 focus:outline-none focus:border-amber-500 transition">
                    </div>
                    <div>
                        <label for="owner-email" class="block text-sm font-bold text-gray-300 mb-2">Seu Email</label>
                        <input type="email" id="owner-email" name="owner-email" required class="w-full p-3 bg-gray-700 rounded-lg text-white border-2 border-gray-600 focus:outline-none focus:border-amber-500 transition">
                    </div>
                    <div>
                        <label for="owner-password" class="block text-sm font-bold text-gray-300 mb-2">Sua Senha</label>
                        <input type="password" id="owner-password" name="owner-password" required minlength="6" class="w-full p-3 bg-gray-700 rounded-lg text-white border-2 border-gray-600 focus:outline-none focus:border-amber-500 transition">
                    </div>
                    <button type="submit" id="register-button" class="cta-button w-full bg-amber-400 text-gray-900 font-bold text-lg py-3 px-8 rounded-lg">Criar Minha Barbearia</button>
                </form>
                <div id="form-message" class="mt-4 text-center"></div>
            </main>
             <footer class="text-center mt-6">
                <p class="text-sm text-gray-500">Já tem uma conta? <a href="dashboard.html" class="font-bold text-amber-400 hover:underline">Faça login</a></p>
            </footer>
        </div>
    </div>

    <!-- Script de Registo Integrado -->
    <script type="module">
        // Importa apenas o necessário do SDK do Firebase
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        // Configuração do Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyD69YUDxKUdLE6ndt_22YHR7FMJ6miXf9M",
            authDomain: "barbeariasergipana-b32b6.firebaseapp.com",
            projectId: "barbeariasergipana-b32b6",
            storageBucket: "barbeariasergipana-b32b6.firebasestorage.app",
            messagingSenderId: "562815971114",
            appId: "1:562815971114:web:73e811a601c6b64e8ab853",
            measurementId: "G-1M4H1Z3TV5"
        };

        // Inicializa os serviços Firebase
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        // Elementos do DOM
        const registerForm = document.getElementById('register-form');
        const registerButton = document.getElementById('register-button');
        const formMessage = document.getElementById('form-message');

        // Lógica de Registo
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
                // Cria o utilizador no Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(auth, ownerEmail, ownerPassword);
                const user = userCredential.user;

                // Cria o documento da loja no Firestore
                const shopRef = await addDoc(collection(db, "shops"), {
                    ownerUid: user.uid,
                    ownerEmail: ownerEmail,
                    shopName: shopName,
                    createdAt: serverTimestamp(),
                    subscriptionStatus: 'trialing'
                });
                
                // **SOLUÇÃO DEFINITIVA:** Guarda no navegador que um registo acabou de acontecer.
                // O dashboard usará este sinalizador para esperar pelos dados.
                sessionStorage.setItem('isNewRegistration', 'true');

                // Redireciona para o dashboard
                window.location.href = `dashboard.html`;

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
    </script>

</body>
</html>
