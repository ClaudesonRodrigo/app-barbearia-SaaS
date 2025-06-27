// public/js/firebase-module.js

/**
 * Módulo Central do Firebase ("Super-módulo").
 * Este ficheiro ÚNICO lida com a configuração, autenticação e operações do Firestore.
 * Todos os outros scripts da aplicação irão importar a partir daqui.
 * Isto simplifica as dependências e resolve os erros "404 (Not Found)".
 */

// --- Importações do SDK do Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    addDoc, 
    query, 
    where, 
    onSnapshot, 
    deleteDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- 1. CONFIGURAÇÃO CENTRAL ---
const firebaseConfig = {
    apiKey: "AIzaSyD69YUDxKUdLE6ndt_22YHR7FMJ6miXf9M",
    authDomain: "barbeariasergipana-b32b6.firebaseapp.com",
    projectId: "barbeariasergipana-b32b6",
    storageBucket: "barbeariasergipana-b32b6.firebasestorage.app",
    messagingSenderId: "562815971114",
    appId: "1:562815971114:web:73e811a601c6b64e8ab853",
    measurementId: "G-1M4H1Z3TV5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 2. FUNÇÕES DE AUTENTICAÇÃO (DONO DA BARBEARIA - DASHBOARD) ---

export function registerOwner(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
}

export function loginOwner(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}

export function logoutOwner() {
    return signOut(auth);
}

export function onDashboardAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}

// --- 3. FUNÇÕES DE AUTENTICAÇÃO (CLIENTE FINAL) ---

export function onClientAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}

export function loginClient() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
}

export function logoutClient() {
    return signOut(auth);
}

// --- 4. FUNÇÕES DO FIRESTORE (BASE DE DADOS) ---

export function createShop(ownerUid, shopName) {
    return addDoc(collection(db, "shops"), {
        ownerUid: ownerUid, shopName: shopName,
        createdAt: serverTimestamp(), subscriptionStatus: 'trialing'
    });
}

export async function getShopById(shopId) {
    if (!shopId) return null;
    const shopRef = doc(db, 'shops', shopId);
    const shopSnap = await getDoc(shopRef);
    return shopSnap.exists() ? { id: shopSnap.id, ...shopSnap.data() } : null;
}

export async function getShopByOwner(ownerUid) {
    const q = query(collection(db, 'shops'), where("ownerUid", "==", ownerUid));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const shopDoc = querySnapshot.docs[0];
        return { id: shopDoc.id, ...shopDoc.data() };
    }
    return null;
}

export async function fetchSubCollection(shopId, collectionName) {
    const subCollectionRef = collection(db, `shops/${shopId}/${collectionName}`);
    const snapshot = await getDocs(subCollectionRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export function addSubCollectionDoc(shopId, collectionName, data) {
    return addDoc(collection(db, `shops/${shopId}/${collectionName}`), data);
}

export function deleteSubCollectionDoc(shopId, collectionName, docId) {
    return deleteDoc(doc(db, `shops/${shopId}/${collectionName}`, docId));
}

export function listenToCollection(shopId, collectionName, callback) {
     if(!shopId) return;
     const itemsRef = collection(db, `shops/${shopId}/${collectionName}`);
     return onSnapshot(itemsRef, (snapshot) => {
         const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         callback(items);
     });
}

export function listenToAppointmentsForBarber(shopId, barberId, date, callback) {
    const q = query(collection(db, `shops/${shopId}/appointments`), where("barberId", "==", barberId), where("date", "==", date));
    return onSnapshot(q, (snapshot) => {
        const bookedSlots = new Set(snapshot.docs.map(doc => doc.data().time));
        callback(bookedSlots);
    });
}

export function listenToMyAppointments(shopId, userId, callback) {
    const q = query(collection(db, `shops/${shopId}/appointments`), where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
        const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(appointments);
    });
}

export function listenToAllAppointmentsForDate(shopId, date, callback) {
    const q = query(collection(db, `shops/${shopId}/appointments`), where("date", "==", date));
    return onSnapshot(q, (snapshot) => {
        const appointments = snapshot.docs.map(doc => doc.data());
        callback(appointments);
    });
}

export function createAppointment(shopId, appointmentData) {
    const dataToSave = { ...appointmentData, createdAt: serverTimestamp() };
    return addDoc(collection(db, `shops/${shopId}/appointments`), dataToSave);
}

export function cancelAppointment(shopId, appointmentId) {
    const appointmentRef = doc(db, `shops/${shopId}/appointments`, appointmentId);
    return deleteDoc(appointmentRef);
}
