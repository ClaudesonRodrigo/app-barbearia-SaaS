// public/js/ui.js

/**
 * Módulo responsável por toda a manipulação da interface do utilizador (UI).
 * Este ficheiro é partilhado pela aplicação do cliente e pelo dashboard.
 */

// --- OBTENÇÃO DE ELEMENTOS DO DOM ---
// Vistas principais da aplicação do cliente
const views = {
    'services-view': document.getElementById('services-view'),
    'barbers-view': document.getElementById('barbers-view'),
    'booking-view': document.getElementById('booking-view'),
};

// Containers de listas (ambas as aplicações)
const servicesList = document.getElementById('services-list');
const barbersList = document.getElementById('barbers-list');
const timeSlotsContainer = document.getElementById('time-slots-container');
const myAppointmentsList = document.getElementById('my-appointments-list');

// Containers de listas (apenas no dashboard)
const servicesListAdmin = document.getElementById('services-list-admin');
const barbersListAdmin = document.getElementById('barbers-list-admin');
const appointmentsListAdmin = document.getElementById('appointments-list-admin');


// --- FUNÇÕES GLOBAIS DE UI ---

/**
 * Mostra uma vista principal e esconde as outras (usado na app do cliente).
 * @param {string} viewName - O ID da vista a ser mostrada.
 */
export function showView(viewName) {
    Object.values(views).forEach(view => {
        if (view) view.classList.add('hidden');
    });
    if (views[viewName]) {
        views[viewName].classList.remove('hidden');
    }
    window.scrollTo(0, 0);
};

/**
 * Mostra um modal de notificação.
 * @param {string} title - O título do modal.
 * @param {string} message - A mensagem a ser exibida.
 */
export function showModal(title, message) {
    const modal = document.getElementById('notification-modal');
    if (modal) {
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-message').innerText = message;
        modal.classList.remove('hidden');
    }
};

/**
 * Fecha um modal pelo seu ID.
 * @param {string} modalId - O ID do modal a fechar.
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
};

// Disponibiliza as funções no objeto global `window` para que possam ser chamadas pelo HTML (onclick).
// Esta é uma forma simples de ligar o HTML a módulos JavaScript.
window.ui = {
    showView,
    closeModal
};


// --- FUNÇÕES DE RENDERIZAÇÃO PARA A APP DO CLIENTE ---

/**
 * Renderiza os serviços na página do cliente.
 * @param {Array} servicesData - Array de objetos de serviço.
 * @param {function} onSelect - Função a ser chamada no clique.
 */
export function renderServices(servicesData, onSelect) {
    if (!servicesList) return;
    servicesList.innerHTML = '';
    servicesData.forEach(service => {
        const el = document.createElement('div');
        el.className = "service-card bg-gray-800 p-5 rounded-lg shadow-md cursor-pointer transition-transform duration-300 hover:bg-gray-700 hover:scale-105";
        el.innerHTML = `
            <h3 class="text-xl font-bold text-amber-400">${service.name}</h3>
            <p class="text-gray-400 text-sm mt-1">${service.description}</p>
            <p class="text-lg font-semibold mt-3">${service.price}</p>
        `;
        el.onclick = () => onSelect(service);
        servicesList.appendChild(el);
    });
}

/**
 * Renderiza os barbeiros na página do cliente.
 * @param {Array} barbersData - Array de objetos de barbeiro.
 * @param {function} onSelectBarber - Função para agendamento.
 * @param {function} onSuggestStyle - Função para o consultor IA.
 */
export function renderBarbers(barbersData, onSelectBarber, onSuggestStyle) {
    if (!barbersList) return;
    barbersList.innerHTML = '';
    barbersData.forEach(barber => {
        const el = document.createElement('div');
        el.className = "barber-card bg-gray-800 rounded-lg shadow-md text-center p-5 transition-transform duration-300 hover:bg-gray-700 flex flex-col items-center justify-between";
        el.innerHTML = `
            <div class="cursor-pointer" data-barber-id="${barber.id}">
                <img src="${barber.photo}" alt="${barber.name}" class="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-amber-400">
                <h3 class="text-xl font-bold">${barber.name}</h3>
                <p class="text-amber-400 text-sm">${barber.specialty}</p>
            </div>
            <button class="gemini-btn mt-4 bg-gray-700 hover:bg-amber-600 text-white hover:text-gray-900 font-semibold py-2 px-4 rounded-lg text-xs transition-all duration-300">
                ✨ Sugerir Estilos
            </button>
        `;
        el.querySelector('.cursor-pointer').onclick = () => onSelectBarber(barber);
        el.querySelector('.gemini-btn').onclick = () => onSuggestStyle(barber);
        barbersList.appendChild(el);
    });
}

/**
 * Renderiza os horários disponíveis.
 * @param {Set<string>} bookedSlots - Set de horários ocupados.
 * @param {function} onSelectTime - Função a ser chamada no clique de um horário livre.
 */
export function renderTimeSlots(bookedSlots, onSelectTime) {
    if (!timeSlotsContainer) return;
    timeSlotsContainer.innerHTML = '';
    const openingTime = 9, closingTime = 19, slotDuration = 30;
    
    for (let h = openingTime; h < closingTime; h++) {
        for (let m = 0; m < 60; m += slotDuration) {
            const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            const isBooked = bookedSlots.has(time);
            const slotElement = document.createElement('button');
            slotElement.innerText = time;
            slotElement.className = `time-slot p-3 rounded-lg font-semibold transition-all duration-200 ${isBooked ? 'bg-red-800 text-gray-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-gray-900'}`;
            slotElement.disabled = isBooked;
            if (!isBooked) slotElement.onclick = () => onSelectTime(time);
            timeSlotsContainer.appendChild(slotElement);
        }
    }
}

/**
 * Renderiza os agendamentos do cliente.
 * @param {Array} appointments - Array de agendamentos.
 * @param {function} onCancel - Função a ser chamada ao clicar em "Cancelar".
 */
export function renderMyAppointments(appointments, onCancel) {
    if (!myAppointmentsList) return;
    myAppointmentsList.innerHTML = '';
    if (appointments.length === 0) {
        myAppointmentsList.innerHTML = '<p class="text-gray-500 text-center">Você ainda não possui agendamentos.</p>';
        return;
    }

    appointments.forEach(appt => {
        const el = document.createElement('div');
        el.className = "bg-gray-800 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4";
        const apptDateTime = new Date(`${appt.date}T${appt.time}`);
        const isSoon = (apptDateTime - new Date()) / (1000 * 60 * 60) <= 24 && (apptDateTime > new Date());
        el.innerHTML = `
            <div class="flex-grow"><p class="font-bold text-amber-400">${appt.serviceName}</p><p class="text-sm text-gray-400">com ${appt.barberName}</p></div>
            <div class="flex items-center gap-4">
                <div class="text-center sm:text-right"><p class="font-semibold">${apptDateTime.toLocaleDateString('pt-BR', {weekday: 'long', day: '2-digit', month: 'short' })}</p><p class="text-lg font-bold">${appt.time}</p></div>
                ${isSoon ? '<span title="Lembrete: seu agendamento é em menos de 24 horas!">🔔</span>' : ''}
            </div>
            <button data-id="${appt.id}" class="cancel-btn w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
        `;
        myAppointmentsList.appendChild(el);
    });
    document.querySelectorAll('.cancel-btn').forEach(btn => btn.onclick = (e) => onCancel(e.target.dataset.id));
}


// --- FUNÇÕES DE RENDERIZAÇÃO PARA O DASHBOARD ---

/**
 * Renderiza uma lista de itens (serviços ou barbeiros) no dashboard.
 * @param {string} type - 'services' ou 'barbers'.
 * @param {Array} items - Array de itens a renderizar.
 * @param {function} deleteFunction - Função a ser chamada ao clicar no botão de apagar.
 */
export function renderAdminList(type, items, deleteFunction) {
    const container = type === 'services' ? servicesListAdmin : barbersListAdmin;
    if (!container) return;
    container.innerHTML = '';
    if (items.length === 0) {
        container.innerHTML = `<p class="text-sm text-gray-500">Nenhum item adicionado.</p>`;
        return;
    }
    items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = "flex justify-between items-center bg-gray-700 p-2 rounded";
        itemEl.innerHTML = `<span>${item.name}</span><button data-id="${item.id}" class="delete-btn text-red-400 hover:text-red-600 font-bold">X</button>`;
        container.appendChild(itemEl);
    });
    container.querySelectorAll('.delete-btn').forEach(button => {
        button.onclick = () => deleteFunction(type, button.dataset.id);
    });
}

/**
 * Renderiza a lista de agendamentos no dashboard do admin.
 * @param {Array} appointments - Array de agendamentos.
 */
export function renderDashboardAppointments(appointments) {
    if (!appointmentsListAdmin) return;
    appointmentsListAdmin.innerHTML = '';
     if (appointments.length === 0) {
        appointmentsListAdmin.innerHTML = '<p class="text-gray-500 text-center">Nenhum agendamento para esta data.</p>';
        return;
    }
    const sortedAppointments = appointments.sort((a,b) => a.time.localeCompare(b.time));
    sortedAppointments.forEach(appt => {
        const el = document.createElement('div');
        el.className = 'bg-gray-700 p-3 rounded-lg mb-2';
        el.innerHTML = `
            <div class="flex justify-between items-center"><p class="font-bold text-white">${appt.time} - ${appt.serviceName}</p><p class="text-sm text-gray-400">${appt.barberName}</p></div>
            <p class="text-sm text-amber-400 mt-1">Cliente: ${appt.userName}</p>
        `;
        appointmentsListAdmin.appendChild(el);
    });
}
