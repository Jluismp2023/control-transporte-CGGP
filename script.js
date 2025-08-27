// --- 1. IMPORTACIÓN Y CONFIGURACIÓN DE FIREBASE ---

// Importar funciones de Firebase que necesitamos
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// TU CONFIGURACIÓN DE FIREBASE (La que copiaste en el paso anterior)
const firebaseConfig = {
    apiKey: "AIzaSyDqhFlx7rP4kFLM4WW7qPQjQfrauw4n9MM",
    authDomain: "control-transporte-cggp-e124e.firebaseapp.com",
    projectId: "control-transporte-cggp-e124e",
    storageBucket: "control-transporte-cggp-e124e.firebasestorage.app",
    messagingSenderId: "567479910196",
    appId: "1:567479910196:web:695b6225e7d29e4f64ef61"
};

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencias a nuestras "colecciones" (carpetas) en la base de datos
const colCanteras = collection(db, "canteras");
const colMateriales = collection(db, "materiales");
const colVolquetas = collection(db, "volquetas");
const colViajes = collection(db, "viajes");


// --- Lógica para cambiar de Pestañas ---
window.mostrarTab = function(nombreTab) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById(nombreTab).classList.add('active');
    event.currentTarget.classList.add('active');
}

document.addEventListener('DOMContentLoaded', async function() {
    // --- BASES DE DATOS LOCALES (Ahora son un reflejo de la nube) ---
    let canterasRegistradas = [], materialesRegistrados = [], volquetasRegistradas = [], viajesRegistrados = [];

    // --- ELEMENTOS DEL DOM ---
    const formViajeTitulo = document.getElementById('formViajeTitulo'), formVolquetaTitulo = document.getElementById('formVolquetaTitulo');
    const viajeForm = document.getElementById('viajeForm'), canteraForm = document.getElementById('canteraForm'), materialForm = document.getElementById('materialForm'), registroVolquetaForm = document.getElementById('registroVolquetaForm');
    const viajesTableBody = document.getElementById('viajesTableBody'), viajesTableFooter = document.getElementById('viajesTableFooter');
    const volquetasTableBody = document.getElementById('volquetasTableBody'), canterasTableBody = document.getElementById('canterasTableBody'), materialesTableBody = document.getElementById('materialesTableBody');
    const resumenMaterialesTableBody = document.getElementById('resumenMaterialesTableBody'), resumenMaterialesFooter = document.getElementById('resumenMaterialesFooter');
    const imprimirHistorialBtn = document.getElementById('imprimirHistorialBtn'), imprimirResumenBtn = document.getElementById('imprimirResumenBtn');
    const historialContainer = document.getElementById('historialContainer'), resumenContainer = document.getElementById('resumenContainer');
    const filtroMaterialSelect = document.getElementById('filtroMaterialSelect'), filtroFechaDesde = document.getElementById('filtroFechaDesde'), filtroFechaHasta = document.getElementById('filtroFechaHasta');
    const btnFiltrarFecha = document.getElementById('btnFiltrarFecha'), btnLimpiarFecha = document.getElementById('btnLimpiarFecha');
    const searchInput = document.getElementById('searchInput');
    const prevPageBtn = document.getElementById('prevPageBtn'), nextPageBtn = document.getElementById('nextPageBtn'), pageInfo = document.getElementById('pageInfo');
    
    // --- ESTADO DE LA APLICACIÓN ---
    let editIndexVolqueta = null, editIndexViaje = null;
    let filtroMaterialActual = 'todos', filtroFechaDesdeActual = '', filtroFechaHastaActual = '';
    let searchTerm = '';
    let currentPage = 1;
    const rowsPerPage = 15;

    // --- NUEVAS FUNCIONES DE DATOS CON FIREBASE ---
    async function cargarDatos() {
        // Cargar Canteras
        const queryCanteras = await getDocs(colCanteras);
        canterasRegistradas = queryCanteras.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre }));
        // Cargar Materiales
        const queryMateriales = await getDocs(colMateriales);
        materialesRegistrados = queryMateriales.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre }));
        // Cargar Volquetas
        const queryVolquetas = await getDocs(colVolquetas);
        volquetasRegistradas = queryVolquetas.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Cargar Viajes
        const queryViajes = await getDocs(colViajes);
        viajesRegistrados = queryViajes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // --- FUNCIÓN PARA PONER LA FECHA ACTUAL ---
    function setFechaActual() {
        const fechaInput = document.getElementById('fechaViaje');
        const hoy = new Date();
        fechaInput.value = hoy.getFullYear() + '-' + ('0' + (hoy.getMonth() + 1)).slice(-2) + '-' + ('0' + hoy.getDate()).slice(-2);
    }

    // --- FUNCIÓN CENTRAL PARA ACTUALIZAR LA PANTALLA ---
    function actualizarPantalla() {
        viajesRegistrados.sort((a, b) => b.fecha.localeCompare(a.fecha));
        canterasTableBody.innerHTML = '';
        canterasRegistradas.forEach((c) => { canterasTableBody.innerHTML += `<tr><td>${c.nombre}</td><td><button class="action-btn edit-btn" data-type="cantera" data-id="${c.id}"><i class="fa-solid fa-pencil"></i></button><button class="action-btn delete-btn" data-type="cantera" data-id="${c.id}"><i class="fa-solid fa-trash"></i></button></td></tr>`; });
        materialesTableBody.innerHTML = '';
        materialesRegistrados.forEach((m) => { materialesTableBody.innerHTML += `<tr><td>${m.nombre}</td><td><button class="action-btn edit-btn" data-type="material" data-id="${m.id}"><i class="fa-solid fa-pencil"></i></button><button class="action-btn delete-btn" data-type="material" data-id="${m.id}"><i class="fa-solid fa-trash"></i></button></td></tr>`; });
        volquetasTableBody.innerHTML = '';
        volquetasRegistradas.forEach((v) => { volquetasTableBody.innerHTML += `<tr><td>${v.descripcion}</td><td>${v.chofer}</td><td>${v.placa}</td><td>${v.propietario}</td><td>${v.volumen} m³</td><td><button class="action-btn edit-btn" data-type="volqueta" data-id="${v.id}"><i class="fa-solid fa-pencil"></i></button><button class="action-btn delete-btn" data-type="volqueta" data-id="${v.id}"><i class="fa-solid fa-trash"></i></button></td></tr>`; });
        const canteraSelect = document.getElementById('canteraSelect'); canteraSelect.innerHTML = '<option value="">-- Seleccione --</option>'; canterasRegistradas.forEach(c => canteraSelect.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`);
        const materialSelect = document.getElementById('materialSelect'); materialSelect.innerHTML = '<option value="">-- Seleccione --</option>'; materialesRegistrados.forEach(m => materialSelect.innerHTML += `<option value="${m.nombre}">${m.nombre}</option>`);
        const volquetaSelect = document.getElementById('volquetaSelect'); volquetaSelect.innerHTML = '<option value="">-- Seleccione --</option>'; volquetasRegistradas.forEach(v => volquetaSelect.innerHTML += `<option value="${v.descripcion}">Desc: ${v.descripcion} (${v.volumen} m³)</option>`);
        filtroMaterialSelect.innerHTML = '<option value="todos">Mostrar Todos</option>'; materialesRegistrados.forEach(m => filtroMaterialSelect.innerHTML += `<option value="${m.nombre}">${m.nombre}</option>`);
        filtroMaterialSelect.value = filtroMaterialActual;
        let viajesFiltrados = viajesRegistrados;
        if (searchTerm) { const lowerCaseSearchTerm = searchTerm.toLowerCase(); viajesFiltrados = viajesFiltrados.filter(viaje => Object.values(viaje).some(val => String(val).toLowerCase().includes(lowerCaseSearchTerm))); }
        if (filtroMaterialActual !== 'todos') { viajesFiltrados = viajesFiltrados.filter(viaje => viaje.material === filtroMaterialActual); }
        if (filtroFechaDesdeActual && filtroFechaHastaActual) { viajesFiltrados = viajesFiltrados.filter(viaje => viaje.fecha >= filtroFechaDesdeActual && viaje.fecha <= filtroFechaHastaActual); }
        const totales = viajesFiltrados.reduce((acc, v) => { acc.volumen += v.volumen; acc.costoMaterial += v.costoMaterial; acc.costoTransporte += v.costoTransporte; acc.costoTotal += v.costoMaterial + v.costoTransporte; return acc; }, { volumen: 0, costoMaterial: 0, costoTransporte: 0, costoTotal: 0 });
        viajesTableFooter.innerHTML = `<tr><td colspan="4">TOTALES</td><td>${totales.volumen.toFixed(2)} m³</td><td colspan="2"></td><td>$${totales.costoMaterial.toFixed(2)}</td><td>$${totales.costoTransporte.toFixed(2)}</td><td>$${totales.costoTotal.toFixed(2)}</td><td colspan="2"></td></tr>`;
        const resumen = {};
        viajesFiltrados.forEach(viaje => { if (!resumen[viaje.material]) { resumen[viaje.material] = { volumen: 0, costoMaterial: 0, costoTransporte: 0 }; } resumen[viaje.material].volumen += viaje.volumen; resumen[viaje.material].costoMaterial += viaje.costoMaterial; resumen[viaje.material].costoTransporte += viaje.costoTransporte; });
        resumenMaterialesTableBody.innerHTML = '';
        for (const material in resumen) { const data = resumen[material]; resumenMaterialesTableBody.innerHTML += `<tr><td><strong>${material}</strong></td><td>${data.volumen.toFixed(2)} m³</td><td>$${data.costoMaterial.toFixed(2)}</td><td>$${data.costoTransporte.toFixed(2)}</td></tr>`; }
        resumenMaterialesFooter.innerHTML = `<tr><td>TOTAL GENERAL</td><td>${totales.volumen.toFixed(2)} m³</td><td>$${totales.costoMaterial.toFixed(2)}</td><td>$${totales.costoTransporte.toFixed(2)}</td></tr>`;
        const totalPages = Math.ceil(viajesFiltrados.length / rowsPerPage);
        currentPage = Math.max(1, Math.min(currentPage, totalPages));
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const viajesPaginados = viajesFiltrados.slice(startIndex, endIndex);
        viajesTableBody.innerHTML = '';
        viajesPaginados.forEach(viaje => {
             const costoTotal = viaje.costoMaterial + viaje.costoTransporte;
             viajesTableBody.innerHTML += `<tr><td>${viaje.fecha}</td><td>${viaje.descripcion}</td><td>${viaje.chofer}</td><td>${viaje.placa}</td><td>${viaje.volumen.toFixed(2)} m³</td><td>${viaje.cantera}</td><td>${viaje.material}</td><td>$${viaje.costoMaterial.toFixed(2)}</td><td>$${viaje.costoTransporte.toFixed(2)}</td><td>$${costoTotal.toFixed(2)}</td><td>${viaje.observaciones}</td><td><button class="action-btn edit-btn" data-type="viaje" data-id="${viaje.id}"><i class="fa-solid fa-pencil"></i></button><button class="action-btn delete-btn" data-type="viaje" data-id="${viaje.id}"><i class="fa-solid fa-trash"></i></button></td></tr>`;
        });
        pageInfo.textContent = `Página ${totalPages > 0 ? currentPage : 0} de ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    // --- MANEJO DE FORMULARIOS ---
    canteraForm.addEventListener('submit', async e => { e.preventDefault(); await addDoc(colCanteras, { nombre: document.getElementById('nombreCantera').value }); await cargarDatos(); actualizarPantalla(); canteraForm.reset(); });
    materialForm.addEventListener('submit', async e => { e.preventDefault(); await addDoc(colMateriales, { nombre: document.getElementById('nombreMaterial').value }); await cargarDatos(); actualizarPantalla(); materialForm.reset(); });
    viajeForm.addEventListener('submit', async e => {
        e.preventDefault();
        const numeroViajesInput = document.getElementById('numeroViajes');
        const numeroDeViajes = parseInt(numeroViajesInput.value, 10) || 1;
        const descripcionSeleccionada = document.getElementById('volquetaSelect').value;
        const volqueta = volquetasRegistradas.find(v => v.descripcion === descripcionSeleccionada);
        if (!volqueta) { alert('Error: La volqueta seleccionada ya no existe.'); return; }
        const viajeData = { fecha: document.getElementById('fechaViaje').value, descripcion: volqueta.descripcion, chofer: volqueta.chofer, placa: volqueta.placa, volumen: volqueta.volumen, cantera: document.getElementById('canteraSelect').value, material: document.getElementById('materialSelect').value, costoMaterial: parseFloat(document.getElementById('costoMaterial').value), costoTransporte: parseFloat(document.getElementById('costoTransporte').value), observaciones: document.getElementById('observaciones').value };
        if (editIndexViaje === null) { for (let i = 0; i < numeroDeViajes; i++) { await addDoc(colViajes, viajeData); } } 
        else { await updateDoc(doc(db, "viajes", editIndexViaje), viajeData); editIndexViaje = null; formViajeTitulo.innerHTML = 'Registrar Nuevo Viaje'; document.getElementById('btnGuardarViaje').innerHTML = '<i class="fa-solid fa-plus"></i> Agregar Viaje'; numeroViajesInput.disabled = false; }
        await cargarDatos(); actualizarPantalla(); viajeForm.reset(); setFechaActual(); numeroViajesInput.value = 1;
    });
    registroVolquetaForm.addEventListener('submit', async e => {
        e.preventDefault();
        const volquetaData = { descripcion: document.getElementById('descripcion').value, chofer: document.getElementById('chofer').value, placa: document.getElementById('placa').value, propietario: document.getElementById('propietario').value, volumen: parseFloat(document.getElementById('volumen').value) };
        if (editIndexVolqueta === null) { await addDoc(colVolquetas, volquetaData); } 
        else { await updateDoc(doc(db, "volquetas", editIndexVolqueta), volquetaData); editIndexVolqueta = null; formVolquetaTitulo.innerHTML = 'Registrar Nueva Volqueta'; document.getElementById('btnGuardarVolqueta').innerHTML = '<i class="fa-solid fa-plus"></i> Añadir Volqueta'; }
        await cargarDatos(); actualizarPantalla(); registroVolquetaForm.reset();
    });

    // --- LÓGICA DE INTERACCIÓN ---
    async function handleActionClick(e) {
        const targetButton = e.target.closest('.action-btn');
        if (!targetButton) return;
        const type = targetButton.dataset.type;
        const id = targetButton.dataset.id;
        if (targetButton.classList.contains('delete-btn')) {
            if (!confirm('¿Estás seguro de que quieres eliminar este registro?')) return;
            if (type === 'cantera') await deleteDoc(doc(db, "canteras", id));
            if (type === 'material') await deleteDoc(doc(db, "materiales", id));
            if (type === 'volqueta') await deleteDoc(doc(db, "volquetas", id));
            if (type === 'viaje') await deleteDoc(doc(db, "viajes", id));
        } else if (targetButton.classList.contains('edit-btn')) {
            if (type === 'cantera') { 
                const item = canterasRegistradas.find(c => c.id === id);
                const n = prompt('Editar nombre de la cantera:', item.nombre); 
                if (n) await updateDoc(doc(db, "canteras", id), { nombre: n });
            }
            if (type === 'material') {
                const item = materialesRegistrados.find(m => m.id === id);
                const n = prompt('Editar nombre del material:', item.nombre);
                if (n) await updateDoc(doc(db, "materiales", id), { nombre: n });
            }
            if (type === 'volqueta') {
                const v = volquetasRegistradas.find(v => v.id === id);
                document.getElementById('descripcion').value = v.descripcion; document.getElementById('chofer').value = v.chofer; document.getElementById('placa').value = v.placa; document.getElementById('propietario').value = v.propietario; document.getElementById('volumen').value = v.volumen;
                editIndexVolqueta = id;
                formVolquetaTitulo.innerHTML = 'Editando Volqueta'; document.getElementById('btnGuardarVolqueta').innerHTML = '<i class="fa-solid fa-save"></i> Actualizar Volqueta';
                window.mostrarTab('datos'); formVolquetaTitulo.scrollIntoView({ behavior: 'smooth' });
            }
            if (type === 'viaje') {
                const v = viajesRegistrados.find(v => v.id === id);
                document.getElementById('fechaViaje').value = v.fecha;
                document.getElementById('numeroViajes').value = 1; document.getElementById('numeroViajes').disabled = true;
                document.getElementById('volquetaSelect').value = v.descripcion; document.getElementById('canteraSelect').value = v.cantera;
                document.getElementById('materialSelect').value = v.material; document.getElementById('costoMaterial').value = v.costoMaterial;
                document.getElementById('costoTransporte').value = v.costoTransporte;
                document.getElementById('observaciones').value = v.observaciones;
                editIndexViaje = id;
                formViajeTitulo.innerHTML = 'Editando Viaje'; document.getElementById('btnGuardarViaje').innerHTML = '<i class="fa-solid fa-save"></i> Actualizar Viaje';
                window.mostrarTab('viajes'); formViajeTitulo.scrollIntoView({ behavior: 'smooth' });
            }
        }
        await cargarDatos();
        actualizarPantalla();
    }
    document.getElementById('datos').addEventListener('click', handleActionClick);
    document.getElementById('resumen').addEventListener('click', handleActionClick);
    
    // --- LÓGICA DE FILTROS, BÚSQUEDA Y PAGINACIÓN ---
    searchInput.addEventListener('input', e => { searchTerm = e.target.value; currentPage = 1; actualizarPantalla(); });
    filtroMaterialSelect.addEventListener('change', e => { filtroMaterialActual = e.target.value; currentPage = 1; actualizarPantalla(); });
    btnFiltrarFecha.addEventListener('click', () => {
        filtroFechaDesdeActual = filtroFechaDesde.value; filtroFechaHastaActual = filtroFechaHasta.value;
        if (filtroFechaDesdeActual && !filtroFechaHastaActual) { filtroFechaHasta.value = filtroFechaDesdeActual; filtroFechaHastaActual = filtroFechaDesdeActual; }
        if (!filtroFechaDesdeActual && filtroFechaHastaActual) { filtroFechaDesde.value = filtroFechaHastaActual; filtroFechaDesdeActual = filtroFechaHastaActual; }
        currentPage = 1; actualizarPantalla();
    });
    btnLimpiarFecha.addEventListener('click', () => { filtroFechaDesdeActual = ''; filtroFechaHastaActual = ''; filtroFechaDesde.value = ''; filtroFechaHasta.value = ''; currentPage = 1; actualizarPantalla(); });
    prevPageBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; actualizarPantalla(); } });
    nextPageBtn.addEventListener('click', () => { 
        let viajesFiltrados = viajesRegistrados; if (searchTerm) { const lowerCaseSearchTerm = searchTerm.toLowerCase(); viajesFiltrados = viajesFiltrados.filter(viaje => Object.values(viaje).some(val => String(val).toLowerCase().includes(lowerCaseSearchTerm))); }
        if (filtroMaterialActual !== 'todos') { viajesFiltrados = viajesFiltrados.filter(viaje => viaje.material === filtroMaterialActual); }
        if (filtroFechaDesdeActual && filtroFechaHastaActual) { viajesFiltrados = viajesFiltrados.filter(viaje => viaje.fecha >= filtroFechaDesdeActual && viaje.fecha <= filtroFechaHastaActual); }
        const totalPages = Math.ceil(viajesFiltrados.length / rowsPerPage);
        if (currentPage < totalPages) { currentPage++; actualizarPantalla(); }
     });

    // --- LÓGICA DE IMPRESIÓN ---
    function imprimirSeccion(container, titulo) {
        let originalTBodyContent = null;
        if (container.id === 'historialContainer') {
            originalTBodyContent = viajesTableBody.innerHTML;
            let viajesFiltrados = viajesRegistrados;
            if (searchTerm) { const lowerCaseSearchTerm = searchTerm.toLowerCase(); viajesFiltrados = viajesFiltrados.filter(viaje => Object.values(viaje).some(val => String(val).toLowerCase().includes(lowerCaseSearchTerm))); }
            if (filtroMaterialActual !== 'todos') { viajesFiltrados = viajesFiltrados.filter(viaje => viaje.material === filtroMaterialActual); }
            if (filtroFechaDesdeActual && filtroFechaHastaActual) { viajesFiltrados = viajesFiltrados.filter(viaje => viaje.fecha >= filtroFechaDesdeActual && viaje.fecha <= filtroFechaHastaActual); }
            let fullReportHTML = '';
            viajesFiltrados.forEach(viaje => {
                const costoTotal = viaje.costoMaterial + viaje.costoTransporte;
                fullReportHTML += `<tr><td>${viaje.fecha}</td><td>${viaje.descripcion}</td><td>${viaje.chofer}</td><td>${viaje.placa}</td><td>${viaje.volumen.toFixed(2)} m³</td><td>${viaje.cantera}</td><td>${viaje.material}</td><td>$${viaje.costoMaterial.toFixed(2)}</td><td>$${viaje.costoTransporte.toFixed(2)}</td><td>$${costoTotal.toFixed(2)}</td><td>${viaje.observaciones}</td><td></td></tr>`;
            });
            viajesTableBody.innerHTML = fullReportHTML;
        }
        const header = container.querySelector('.print-header');
        header.innerHTML = `<div class="print-title-main">CONSORCIO GENERAL GALLARDO PASAJE</div><div class="print-title-sub">LICO-GADMPA-2025.0001</div><div class="print-title-sub">AMPLIACIÓN DE LA AV. GENERAL GALLARDO INCLUYE ACERAS, BORDILLOS Y OBRAS COMPLEMENTARIAS DEL CANTON PASAJE</div><div class="print-report-title">${titulo}</div><p>Generado el: ${new Date().toLocaleString('es-EC', { dateStyle: 'full', timeStyle: 'short' })}</p>`;
        const footer = container.querySelector('.print-footer');
        footer.innerHTML = `<div class="firma-titulo">ELABORADO POR:</div><div class="nombre-ingeniero">ING. JOSE L. MACAS P.</div><div>RESIDENTE DE OBRA</div><div>CONSORCIO GENERAL GALLARDO PASAJE</div>`;
        container.classList.add('printable');
        window.print();
        container.classList.remove('printable');
        if (originalTBodyContent !== null) {
            viajesTableBody.innerHTML = originalTBodyContent;
        }
    }
    imprimirHistorialBtn.addEventListener('click', () => imprimirSeccion(historialContainer, `Control de Transporte (${filtroMaterialActual === 'todos' ? 'Todos' : filtroMaterialActual})`));
    imprimirResumenBtn.addEventListener('click', () => imprimirSeccion(resumenContainer, `Resumen por Material (${filtroMaterialActual === 'todos' ? 'Todos' : filtroMaterialActual})`));
    
    // --- INICIALIZACIÓN DE LA APLICACIÓN ---
    await cargarDatos();
    actualizarPantalla();
    setFechaActual();
    document.getElementById('viajes').classList.add('active');
});