// -------------------- CONFIG --------------------
const ADMIN_PASSWORD = 'cca123';
let isAdmin = false;

// -------------------- UTILIDADES --------------------
const norm = s => (s || "").toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const pairKey = (a,b) => { const A = norm(a), B = norm(b); return A < B ? `${A}|${B}` : `${B}|${A}`; };

let DBs = {};
let categoriaActual = null;
const defaultCats = ['LIQ Herbicidas','Fertilizantes','LIQ Insecticidas'];
defaultCats.forEach(c => { DBs[c] = { productos: [], compat: {} }; });
categoriaActual = defaultCats[0];

const alias = { 'aceite metilado (mso)': 'Aceite Metilado (MSO)', 'mso': 'Aceite Metilado (MSO)', 'surfactante no ionico (nis)': 'Surfactante No Iónico (NIS)', 'nis': 'Surfactante No Iónico (NIS)'};
const mapAlias = (name) => alias[norm(name)] || name;

// -------------------- DOM --------------------
const selectCat = document.getElementById('categoria');
const datalist = document.getElementById('productos');
const prodA = document.getElementById('prodA');
const prodB = document.getElementById('prodB');
const btnEvaluar = document.getElementById('btnEvaluar');
const btnLimpiar = document.getElementById('btnLimpiar');
const cont = { resultado: document.getElementById('resultado'), riesgo: document.getElementById('resRiesgo'), limpieza: document.getElementById('resLimpieza'), notas: document.getElementById('resNotas') };
const fileInput = document.getElementById('fileInput');
const msg = document.getElementById('msg');
const btnExportJSON = document.getElementById('btnExportJSON');
const btnExportAllJSON = document.getElementById('btnExportAllJSON');
const btnClearDB = document.getElementById('btnClearDB');
const adminPanel = document.getElementById('adminPanel');
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');

// -------------------- RENDER & TABLA --------------------
function riesgoClase(valor){ 
    const v = (valor||'').toLowerCase(); 
    if(v.includes('compatible') && !v.includes('no ')) return 'risk-ok'; 
    if(v.includes('precauc')) return 'risk-caution'; 
    if(v.includes('no compatible') || v.includes('incomp')) return 'risk-bad'; 
    return 'risk-unknown'; 
}

function renderCategoriaSelect(){ 
    selectCat.innerHTML = ''; 
    Object.keys(DBs).forEach(c => { 
        const opt = document.createElement('option'); 
        opt.value = c; opt.textContent = c; 
        selectCat.appendChild(opt); 
    }); 
    selectCat.value = categoriaActual; 
}

function renderProductos(){ 
    const DB = DBs[categoriaActual]; 
    const unique = Array.from(new Set(DB.productos)).sort((a,b)=>a.localeCompare(b)); 
    datalist.innerHTML = ''; 
    unique.forEach(p => { 
        const opt = document.createElement('option'); 
        opt.value = p; 
        datalist.appendChild(opt); 
    }); 
    return unique; 
}

let uniqueProductos = [];
const tabla = document.getElementById('tabla'); 
const theadRow = tabla.querySelector('thead tr'); 
const tbody = tabla.querySelector('tbody');

function buildTable(){ 
    theadRow.innerHTML = '<th class="sticky-th px-3 py-2 text-left bg-gray-100">Producto</th>'; 
    tbody.innerHTML = ''; 
    uniqueProductos = renderProductos(); 
    uniqueProductos.forEach(p => { 
        const th = document.createElement('th'); 
        th.className = 'sticky-th px-3 py-2 text-left bg-gray-100'; 
        th.textContent = p; 
        theadRow.appendChild(th); 
    }); 
    uniqueProductos.forEach(rowProd => { 
        const tr = document.createElement('tr'); 
        const th = document.createElement('th'); 
        th.className = 'sticky-th left-0 px-3 py-2 bg-white text-left font-medium'; 
        th.textContent = rowProd; 
        tr.appendChild(th); 
        uniqueProductos.forEach(colProd => { 
            const td = document.createElement('td'); 
            td.className = 'px-3 py-2 text-center whitespace-nowrap cursor-pointer'; 
            if(rowProd === colProd){ 
                td.innerHTML = '<span class="text-gray-300">—</span>'; 
            } else { 
                const info = DBs[categoriaActual].compat[pairKey(rowProd,colProd)]; 
                let label = 'Sin datos', clase = 'risk-unknown'; 
                if(info){ label = info.riesgo; clase = riesgoClase(info.riesgo); } 
                td.innerHTML = `<span class="badge ${clase}">${label}</span>`; 
                td.addEventListener('click', ()=>{ 
                    prodA.value = rowProd; 
                    prodB.value = colProd; 
                    evaluar(); 
                    document.getElementById('resultado').scrollIntoView({behavior:'smooth', block:'start'}); 
                }); 
            } 
            tr.appendChild(td); 
        }); 
        tbody.appendChild(tr); 
    }); 
}

function resaltarCelda(a,b){ 
    const i = uniqueProductos.indexOf(a); 
    const j = uniqueProductos.indexOf(b); 
    if(i<0||j<0) return; 
    const fila = tbody.children[i]; 
    const celda = fila.children[j+1]; 
    if(celda){ celda.classList.add('ring-2','ring-offset-2','ring-gray-900'); } 
}

function evaluar(){ 
    let A = mapAlias(prodA.value); 
    let B = mapAlias(prodB.value); 
    if(!A || !B){ alert('Completá ambos productos.'); return; } 
    const key = pairKey(A,B); 
    const info = DBs[categoriaActual].compat[key]; 
    cont.resultado.classList.remove('hidden'); 
    if(info){ 
        cont.riesgo.className = 'badge ' + riesgoClase(info.riesgo); 
        cont.riesgo.textContent = info.riesgo; 
        cont.limpieza.textContent = info.limpieza || '—'; 
        cont.notas.textContent = info.notas || ''; 
    } else { 
        cont.riesgo.className = 'badge risk-unknown'; 
        cont.riesgo.textContent = 'Sin datos'; 
        cont.limpieza.textContent = '—'; 
        cont.notas.textContent = 'No hay registro.'; 
    }
    resaltarCelda(A,B); 
}

btnEvaluar.addEventListener('click', evaluar);
btnLimpiar.addEventListener('click', ()=>{ 
    prodA.value=''; prodB.value=''; 
    cont.resultado.classList.add('hidden'); 
});

btnLogin.addEventListener('click', ()=>{ 
    const pass = prompt('Contraseña admin:'); 
    if(pass === ADMIN_PASSWORD){ 
        isAdmin = true; 
        adminPanel.style.display = 'block'; 
        btnLogin.style.display = 'none'; 
        btnLogout.style.display = 'inline-block'; 
    } 
});

btnLogout.addEventListener('click', ()=>{ 
    isAdmin = false; 
    adminPanel.style.display = 'none'; 
    btnLogin.style.display = 'inline-block'; 
    btnLogout.style.display = 'none'; 
});

selectCat.addEventListener('change', ()=>{ 
    categoriaActual = selectCat.value; 
    buildTable(); 
});

// Inicialización
renderCategoriaSelect(); 
buildTable();