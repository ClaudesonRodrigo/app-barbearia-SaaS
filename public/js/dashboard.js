// public/js/dashboard.js

/**
 * Módulo que controla toda a lógica da Página de Gestão Unificada (dashboard.html).
 * VERSÃO FINAL: Utiliza o módulo central e tem uma lógica de carregamento robusta que
 * mostra/esconde as vistas de login ou o dashboard na mesma página, eliminando loops.
 */

// Importa todas as funções de que precisa do nosso "super-módulo" central.
import { 
    onDashboardAuthChange, 
    loginOwner,
    logoutOwner, 
    getShopByOwner, 
    getShopById, 
    addSubCollectionDoc, 
    deleteSubCollectionDoc,
    listenToCollection,
    listenToAllAppointmentsForDate
} from './firebase-module.js';

import { renderAdminList, renderDashboardAppointments } from './ui.js';

// --- ESTADO DO DASHBOARD ---
let currentShop = null; 

// --- ELEMENTOS DO DOM ---
const loaderView = document.getElementById('full-page-loader');
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');

// Elementos do Login
const loginForm = document.getElementById('login-form');
const loginButton = document.getElementById('login-button');
const loginMessage = document.getElementById('form-message');

// Elementos do Dashboard
const userEmailSpan = document.getElementById('user-email');
const logoutButton = document.getElementById('logout-button');
const shopNameTitle = document.getElementById('shop-name-title');
const publicLink = document.getElementById('public-link');
const copyLinkButton = document.getElementById('copy-link-button');
const serviceForm = document.getElementById('service-form');
const barberForm = document.getElementById('barber-form');
const adminDatePicker = document.getElementById('admin-date-picker-dash');

// --- FUNÇÕES DE CONTROLO DA UI ---
function showView(viewName) {
    loaderView.style.display = 'none';
    loginContainer.style.display = 'none';
    dashboardContainer.style.display = 'none';

    if (viewName === 'login') {
        loginContainer.style.display = 'flex';
    } else if (viewName === 'dashboard') {
        dashboardContainer.style.display = 'block';
    }
}


// --- FUNÇÕES DE LÓGICA E DADOS DO DASHBOARD ---

function renderShopDetails(user) {
    if (!currentShop || !user) return;
    shopNameTitle.textContent = currentShop.shopName;
    userEmailSpan.textContent = user.email;
    const bookingPageUrl = `${window.location.origin}/barbearia.html?shop=${currentShop.id}`;
    publicLink.href = bookingPageUrl;
    publicLink.textContent = bookingPageUrl;
}

async function addService(e) {
    e.preventDefault();
    if (!currentShop) return;
    const newService = { name: serviceForm['service-name'].value, price: serviceForm['service-price'].value, duration: parseInt(serviceForm['service-duration'].value, 10), description: serviceForm['service-description'].value };
    await addSubCollectionDoc(currentShop.id, 'services', newService);
    serviceForm.reset();
}

async function addBarber(e) {
    e.preventDefault();
    if (!currentShop) return;
    const newBarber = { name: barberForm['barber-name'].value, specialty: barberForm['barber-specialty'].value, photo: `https://placehold.co/400x400/1f2937/a8a29e?text=${barberForm['barber-name'].value.charAt(0)}` };
    await addSubCollectionDoc(currentShop.id, 'barbers', newBarber);
    barberForm.reset();
}

async function deleteItem(collectionName, itemId) {
    if (!currentShop) return;
    if (confirm(`Tem a certeza que quer apagar este item?`)) {
        await deleteSubCollectionDoc(currentShop.id, collectionName, itemId);
    }
}


// --- LÓGICA DE AUTENTICAÇÃO E INICIALIZAÇÃO ---

// Ponto de entrada principal: Ouve as mudanças de estado de autenticação
onDashboardAuthChange(async (user) => {
    if (user) {
        // UTILIZADOR ESTÁ LOGADO
        
        // Mostra uma mensagem de carregamento enquanto busca os dados
        loaderView.innerHTML = `<p class="text-white text-lg">A carregar dados da sua barbearia...</p>`;
        loaderView.style.display = 'flex';

        const urlParams = new URLSearchParams(window.location.search);
        const newShopId = urlParams.get('new_shop_id');
        let shopData = null;

        if (newShopId) {
            // Fluxo de novo registo: busca a loja pelo ID passado no URL.
            shopData = await getShopById(newShopId);
            // Limpa o URL para que o refresh da página não execute esta lógica novamente.
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            // Fluxo de login normal: busca a loja pelo UID do dono.
            shopData = await getShopByOwner(user.uid);
        }

        currentShop = shopData;

        if (currentShop) {
            // Se encontrámos a loja, renderizamos o dashboard.
            renderShopDetails(user);
            const today = new Date().toISOString().split('T')[0];
            adminDatePicker.value = today;
            
            // Inicia os listeners para as coleções
            listenToCollection(currentShop.id, 'services', (items) => renderAdminList('services', items, deleteItem));
            listenToCollection(currentShop.id, 'barbers', (items) => renderAdminList('barbers', items, deleteItem));
            listenToAllAppointmentsForDate(currentShop.id, today, renderDashboardAppointments);
            
            // Mostra o dashboard
            showView('dashboard');
        } else {
            // Se, mesmo após o login, não encontrarmos uma loja, algo está errado.
            alert("Não foi possível encontrar os dados da sua barbearia. Por favor, tente fazer login novamente.");
            logoutOwner(); // Faz logout para evitar loops e força o utilizador a tentar de novo.
        }
    } else {
        // UTILIZADOR NÃO ESTÁ LOGADO
        // Mostra a vista de login.
        console.log("Nenhum utilizador autenticado. A mostrar formulário de login.");
        showView('login');
    }
});


// --- EVENT LISTENERS ---

// Listener para o formulário de login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginButton.disabled = true;
    loginButton.innerText = 'A entrar...';
    loginMessage.textContent = '';

    const email = document.getElementById('owner-email').value;
    const password = document.getElementById('owner-password').value;

    try {
        await loginOwner(email, password);
        // O onDashboardAuthChange irá detetar o login bem-sucedido e mostrar o dashboard.
    } catch (error) {
        loginMessage.textContent = 'Email ou senha inválidos.';
        loginButton.disabled = false;
        loginButton.innerText = 'Entrar';
    }
});

// Outros listeners do dashboard
logoutButton.addEventListener('click', logoutOwner);
serviceForm.addEventListener('submit', addService);
barberForm.addEventListener('submit', addBarber);
adminDatePicker.addEventListener('change', () => {
    if(currentShop) {
        listenToAllAppointmentsForDate(currentShop.id, adminDatePicker.value, renderDashboardAppointments);
    }
});

copyLinkButton.addEventListener('click', () => {
    navigator.clipboard.writeText(publicLink.href).then(() => {
        copyLinkButton.textContent = 'Copiado!';
        setTimeout(() => { copyLinkButton.textContent = 'Copiar'; }, 2000);
    });
});
