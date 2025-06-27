// public/js/main.js (Página do Cliente Final)

/**
 * Módulo principal da aplicação do cliente.
 * VERSÃO FINAL: Utiliza o módulo central firebase-module.js para máxima estabilidade.
 */

// Importa todas as funções de que precisa do nosso "super-módulo" central.
import { 
    onClientAuthChange, 
    loginClient, 
    logoutClient,
    getShopById,
    fetchSubCollection,
    listenToAppointmentsForBarber,
    listenToMyAppointments,
    createAppointment,
    cancelAppointment
} from './firebase-module.js';

import { showView, showModal, closeModal, renderServices, renderBarbers, renderTimeSlots, renderMyAppointments } from './ui.js';
import { getStyleSuggestion } from './api.js';

// --- ESTADO GLOBAL DA APLICAÇÃO ---
const appState = {
    shopId: null,
    shopDetails: null,
    currentUser: null,
    services: [],
    barbers: [],
    selectedService: null,
    selectedBarber: null,
    appointmentsUnsubscribe: null,
    myAppointmentsUnsubscribe: null,
};

// --- REFERÊNCIAS A ELEMENTOS DO DOM ---
const mainContent = document.getElementById('main-content');
const loadingView = document.getElementById('loading-view');
const datePicker = document.getElementById('date-picker');
const geminiGenerateBtn = document.getElementById('gemini-generate-btn');
const geminiResult = document.getElementById('gemini-result');
const headerTitle = document.querySelector('header h1');
const userInfoContainer = document.getElementById('user-info');

// --- MANIPULADORES DE EVENTOS (EVENT HANDLERS) ---

function handleServiceSelect(service) {
    appState.selectedService = service;
    showView('barbers-view');
}

function handleBarberSelect(barber) {
    appState.selectedBarber = barber;
    const today = new Date().toISOString().split('T')[0];
    datePicker.value = today;
    datePicker.min = today;

    document.getElementById('booking-details').innerHTML = `Serviço: <span class="font-bold text-white">${appState.selectedService.name}</span><br>Barbeiro: <span class="font-bold text-white">${appState.selectedBarber.name}</span>`;
    showView('booking-view');
    
    document.getElementById('time-slots-container').innerHTML = '<div class="col-span-full text-center p-4">A carregar horários...</div>';
    if (appState.appointmentsUnsubscribe) appState.appointmentsUnsubscribe();
    appState.appointmentsUnsubscribe = listenToAppointmentsForBarber(appState.shopId, barber.id, today, (bookedSlots) => {
        renderTimeSlots(bookedSlots, handleTimeSelect);
    });
}

async function handleTimeSelect(time) {
    if (!appState.currentUser) {
        showModal("Login Necessário", "Por favor, faça login para completar o agendamento.");
        return;
    }

    const appointmentData = {
        userId: appState.currentUser.uid,
        userName: appState.currentUser.displayName || "Cliente",
        serviceId: appState.selectedService.id,
        serviceName: appState.selectedService.name,
        barberId: appState.selectedBarber.id,
        barberName: appState.selectedBarber.name,
        date: datePicker.value,
        time: time,
    };

    try {
        await createAppointment(appState.shopId, appointmentData);
        showModal("Sucesso!", `O seu horário para ${appointmentData.serviceName} com ${appointmentData.barberName} às ${time} foi confirmado.`);
        showView('services-view');
    } catch (error) {
        showModal("Erro", "Não foi possível realizar o agendamento.");
        console.error("Erro ao criar agendamento:", error);
    }
}

function handleCancelClick(appointmentId) {
    document.getElementById('confirm-modal-message').innerText = "Esta ação é irreversível e irá apagar o seu agendamento.";
    document.getElementById('confirm-modal').classList.remove('hidden');
    
    document.getElementById('confirm-cancel-btn').onclick = () => closeModal('confirm-modal');
    document.getElementById('confirm-delete-btn').onclick = async () => {
        closeModal('confirm-modal');
        try {
            await cancelAppointment(appState.shopId, appointmentId);
            showModal("Cancelado", "O seu agendamento foi cancelado com sucesso.");
        } catch (error) {
            console.error("Erro ao cancelar agendamento: ", error);
            showModal("Erro", "Não foi possível cancelar o agendamento.");
        }
    };
}

function openStyleConsultant(barber) {
    appState.selectedBarber = barber;
    document.getElementById('gemini-modal-intro').innerText = `Peça sugestões de estilo para ${barber.name}, especialista em ${barber.specialty}.`;
    document.getElementById('gemini-prompt-input').value = '';
    geminiResult.innerHTML = '<p class="text-gray-500">As sugestões da IA aparecerão aqui...</p>';
    document.getElementById('gemini-modal').classList.remove('hidden');
}


// --- INICIALIZAÇÃO E LÓGICA PRINCIPAL ---

function getShopIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('shop');
}

async function initializeClientApp() {
    appState.shopId = getShopIdFromUrl();

    if (!appState.shopId) {
        document.body.innerHTML = '<h1 class="text-white text-center p-10 text-2xl">Erro: Barbearia não encontrada. Verifique o link.</h1>';
        return;
    }

    try {
        appState.shopDetails = await getShopById(appState.shopId);
        
        if (!appState.shopDetails) {
            document.body.innerHTML = `<h1 class="text-white text-center p-10 text-2xl">Erro: A barbearia com o ID '${appState.shopId}' não existe.</h1>`;
            return;
        }

        headerTitle.textContent = appState.shopDetails.shopName;
        document.title = `${appState.shopDetails.shopName} - Agendamento`;

        appState.services = await fetchSubCollection(appState.shopId, 'services');
        appState.barbers = await fetchSubCollection(appState.shopId, 'barbers');

        loadingView.style.display = 'none';
        mainContent.classList.remove('hidden');
        renderServices(appState.services, handleServiceSelect);
        renderBarbers(appState.barbers, handleBarberSelect, openStyleConsultant);
        
        onClientAuthChange((user) => {
            appState.currentUser = user;
            if (user) {
                userInfoContainer.innerHTML = `<span>Logado como: ${user.displayName || 'Cliente'}</span> <button id="client-logout-btn" class="ml-2 text-red-400 hover:underline text-xs">Sair</button>`;
                document.getElementById('client-logout-btn').onclick = logoutClient;
                if (appState.myAppointmentsUnsubscribe) appState.myAppointmentsUnsubscribe();
                appState.myAppointmentsUnsubscribe = listenToMyAppointments(appState.shopId, user.uid, (appointments) => {
                    renderMyAppointments(appointments, handleCancelClick);
                });
            } else {
                userInfoContainer.innerHTML = `<button id="client-login-btn" class="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-600">Fazer Login para Agendar</button>`;
                document.getElementById('client-login-btn').onclick = loginClient;
                renderMyAppointments([], handleCancelClick);
            }
        });

    } catch (error) {
        console.error("Erro fatal ao inicializar a aplicação:", error);
        document.body.innerHTML = '<h1 class="text-white text-center p-10 text-2xl">Ocorreu um erro ao carregar a página. Tente novamente mais tarde.</h1>';
    }
}


// --- EVENT LISTENERS GERAIS ---

datePicker.addEventListener('change', () => {
    if (!appState.selectedBarber || !appState.shopId) return;
    const selectedDate = datePicker.value;
    if (appState.appointmentsUnsubscribe) appState.appointmentsUnsubscribe();
    appState.appointmentsUnsubscribe = listenToAppointmentsForBarber(appState.shopId, appState.selectedBarber.id, selectedDate, (bookedSlots) => {
        renderTimeSlots(bookedSlots, handleTimeSelect);
    });
});

geminiGenerateBtn.onclick = async () => {
    const userInput = document.getElementById('gemini-prompt-input').value;
    if (!userInput.trim()) {
        geminiResult.innerHTML = '<p class="text-red-500">Por favor, descreva o que você procura.</p>';
        return;
    }

    geminiResult.innerHTML = '<div class="loader"></div>';
    
    try {
        const suggestions = await getStyleSuggestion(userInput, appState.selectedBarber);
        geminiResult.innerHTML = suggestions;
    } catch (error) {
        console.error("Erro na sugestão do Gemini:", error);
        geminiResult.innerHTML = `<p class="text-red-500">Ocorreu um erro ao buscar sugestões.</p>`;
    }
};

// --- PONTO DE ENTRADA DA APLICAÇÃO ---
document.addEventListener('DOMContentLoaded', initializeClientApp);
