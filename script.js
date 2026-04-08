const API = "http://localhost:3000/api";

let motoristaEditandoId = null;
let veiculoEditandoId = null;
let manutencaoEditandoId = null;
let abastecimentoEditandoId = null;

let motoristasCache = [];
let veiculosCache = [];

document.querySelectorAll(".sidebar nav a").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const target = link.getAttribute("data-target");
    showPage(target);
  });
});

function showPage(pageId) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".sidebar nav a").forEach((l) => l.classList.remove("active"));

  document.getElementById(pageId).classList.add("active");
  document.querySelector(`[data-target="${pageId}"]`).classList.add("active");

  loadPageData(pageId);
}

document.getElementById("themeToggleBtn").onclick = () => {
  document.body.classList.toggle("dark");
};

async function loadMotoristasCache() {
  motoristasCache = await fetch(API + "/motoristas").then(r => r.json());
}

async function loadVeiculosCache() {
  veiculosCache = await fetch(API + "/veiculos").then(r => r.json());
}

function setupAutocomplete(inputId, listaId, getData, format) {
  const input = document.getElementById(inputId);
  const lista = document.getElementById(listaId);

  input.addEventListener("input", () => {
    const termo = input.value.toLowerCase();
    lista.innerHTML = "";

    if (!termo) {
      lista.classList.add("hidden");
      return;
    }

    const filtrados = getData().filter(item =>
      format(item).toLowerCase().includes(termo)
    );

    filtrados.forEach(item => {
      const li = document.createElement("li");
      li.textContent = format(item);

      li.onclick = () => {
        input.value = format(item);
        input.dataset.id = item.id;
        lista.classList.add("hidden");
      };

      lista.appendChild(li);
    });

    lista.classList.remove("hidden");
  });
}

function initAutocompletes() {
  setupAutocomplete(
    "inputMotorista",
    "motoristaSugestoes",
    () => motoristasCache,
    (m) => `${m.nome} (${m.cpf || "sem CPF"})`
  );

  setupAutocomplete(
    "inputVeiculoManut",
    "veiculoSugestoesManut",
    () => veiculosCache,
    (v) => `${v.placa} - ${v.modelo}`
  );

  setupAutocomplete(
    "inputVeiculoAbast",
    "veiculoSugestoesAbast",
    () => veiculosCache,
    (v) => `${v.placa} - ${v.modelo}`
  );
}

async function loadDashboard() {
  const [v, m, man, ab] = await Promise.all([
    fetch(API + "/veiculos").then(r => r.json()),
    fetch(API + "/motoristas").then(r => r.json()),
    fetch(API + "/manutencoes").then(r => r.json()),
    fetch(API + "/abastecimentos").then(r => r.json())
  ]);

  totalVeiculos.textContent = v.length;
  totalMotoristas.textContent = m.length;
  totalManutencoes.textContent = man.length;
  totalAbastecimentos.textContent = ab.length;
}

async function loadVeiculos() {
  await loadVeiculosCache();

  const list = document.getElementById("veiculosList");
  list.innerHTML = "";

  veiculosCache.forEach(v => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <p><b>${v.placa}</b> - ${v.marca || ""} ${v.modelo}</p>
      <p>Categoria: ${v.categoria || "N/A"} | Ano: ${v.ano} | KM: ${v.km}</p>
      <p>Motorista: ${v.motorista_nome || "Nenhum"}</p>
      <button onclick="editVeiculo(${v.id})">Editar</button>
      <button onclick="deleteVeiculo(${v.id})">Excluir</button>
    `;

    list.appendChild(card);
  });
}

document.getElementById("addVeiculoBtn").onclick = () => {
  veiculoEditandoId = null;
  document.getElementById("veiculoForm").classList.remove("hidden");
};

document.getElementById("cancelVeiculo").onclick = resetVeiculoForm;

document.getElementById("saveVeiculo").onclick = async () => {
  const motoristaId = document.getElementById("inputMotorista").dataset.id;

  const data = {
    placa: inputValue("inputPlaca"),
    marca: inputValue("inputMarca"),
    modelo: inputValue("inputModelo"),
    categoria: inputValue("inputCategoria"),
    ano: inputValue("inputAno"),
    km: inputValue("inputKm"),
    motorista_id: motoristaId || null
  };

  const method = veiculoEditandoId ? "PUT" : "POST";
  const url = veiculoEditandoId ? `${API}/veiculos/${veiculoEditandoId}` : `${API}/veiculos`;

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  resetVeiculoForm();
  loadVeiculos();
};

function resetVeiculoForm() {
  ["inputPlaca", "inputMarca", "inputModelo", "inputCategoria", "inputAno", "inputKm", "inputMotorista"].forEach(id => {
    const el = document.getElementById(id);
    el.value = "";
    el.dataset.id = "";
  });

  veiculoForm.classList.add("hidden");
}

async function editVeiculo(id) {
  const v = veiculosCache.find(v => v.id == id);

  inputPlaca.value = v.placa;
  inputMarca.value = v.marca || "";
  inputModelo.value = v.modelo;
  inputCategoria.value = v.categoria || "";
  inputAno.value = v.ano;
  inputKm.value = v.km;

  const motoristaInput = document.getElementById("inputMotorista");
  motoristaInput.value = v.motorista_nome || "";
  motoristaInput.dataset.id = v.motorista_id || "";

  veiculoEditandoId = id;
  veiculoForm.classList.remove("hidden");
}

async function deleteVeiculo(id) {
  await fetch(`${API}/veiculos/${id}`, { method: "DELETE" });
  loadVeiculos();
}

async function loadMotoristas() {
  await loadMotoristasCache();

  const list = document.getElementById("motoristasList");
  list.innerHTML = "";

  motoristasCache.forEach(m => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <p><b>${m.nome}</b> - ${m.idade} anos</p>
      <p>CPF: ${m.cpf || "N/A"} | Telefone: ${m.telefone || "N/A"}</p>
      <p>CNH: ${m.cnh || "N/A"} | Email: ${m.email || "N/A"}</p>
      <button onclick="editMotorista(${m.id})">Editar</button>
      <button onclick="deleteMotorista(${m.id})">Excluir</button>
    `;

    list.appendChild(card);
  });
}

document.getElementById("addMotoristaBtn").onclick = () => {
  motoristaEditandoId = null;
  document.getElementById("motoristaForm").classList.remove("hidden");
};

document.getElementById("cancelMotorista").onclick = () => {
  motoristaEditandoId = null;
  document.getElementById("motoristaForm").classList.add("hidden");
};

document.getElementById("saveMotorista").onclick = async () => {
  const data = {
    nome: inputValue("inputNomeMotorista"),
    cpf: inputValue("inputCPF"),
    telefone: inputValue("inputTelefone"),
    idade: inputValue("inputIdadeMotorista"),
    cnh: inputValue("inputCNH"),
    validade_cnh: inputValue("inputValidadeCNH"),
    email: inputValue("inputEmail"),
  };

  if (motoristaEditandoId) {
    await fetch(`${API}/motoristas/${motoristaEditandoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    motoristaEditandoId = null;
  } else {
    await fetch(API + "/motoristas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  document.getElementById("motoristaForm").classList.add("hidden");
  loadMotoristas();
};

async function editMotorista(id) {
  const m = motoristasCache.find(m => m.id == id);

  document.getElementById("inputNomeMotorista").value = m.nome;
  document.getElementById("inputCPF").value = m.cpf || "";
  document.getElementById("inputTelefone").value = m.telefone || "";
  document.getElementById("inputIdadeMotorista").value = m.idade;
  document.getElementById("inputCNH").value = m.cnh || "";
  document.getElementById("inputValidadeCNH").value = m.validade_cnh || "";
  document.getElementById("inputEmail").value = m.email || "";

  motoristaEditandoId = id;
  document.getElementById("motoristaForm").classList.remove("hidden");
}

async function deleteMotorista(id) {
  await fetch(`${API}/motoristas/${id}`, { method: "DELETE" });
  loadMotoristas();
}

async function loadManutencoes() {
  await loadVeiculosCache();

  const data = await fetch(API + "/manutencoes").then(r => r.json());
  const list = document.getElementById("manutencoesList");
  list.innerHTML = "";

  data.forEach(m => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <p>${m.veiculo_placa} - ${m.data} - ${m.status}</p>
      <button onclick="editManutencao(${m.id})">Editar</button>
      <button onclick="deleteManutencao(${m.id})">Excluir</button>
    `;
    list.appendChild(div);
  });
}

document.getElementById("addManutencaoBtn").onclick = () => {
  manutencaoEditandoId = null;
  manutencaoForm.classList.remove("hidden");
};

document.getElementById("cancelManutencao").onclick = () => {
  manutencaoForm.classList.add("hidden");
};

document.getElementById("saveManutencao").onclick = async () => {
  const veiculoId = inputVeiculoManut.dataset.id;

  if (!veiculoId) return alert("Selecione um veículo válido");

  const data = {
    veiculo_id: veiculoId,
    data: inputDataManut.value,
    status: inputStatusManut.value
  };

  const method = manutencaoEditandoId ? "PUT" : "POST";
  const url = manutencaoEditandoId ? `${API}/manutencoes/${manutencaoEditandoId}` : `${API}/manutencoes`;

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  manutencaoForm.classList.add("hidden");
  loadManutencoes();
};

async function editManutencao(id) {
  const data = await fetch(API + "/manutencoes").then(r => r.json());
  const m = data.find(m => m.id == id);

  const veiculo = veiculosCache.find(v => v.id == m.veiculo_id);

  inputVeiculoManut.value = veiculo ? `${veiculo.placa} - ${veiculo.modelo}` : "";
  inputVeiculoManut.dataset.id = m.veiculo_id;

  inputDataManut.value = m.data;
  inputStatusManut.value = m.status;

  manutencaoEditandoId = id;
  manutencaoForm.classList.remove("hidden");
}

async function loadAbastecimentos() {
  await loadVeiculosCache();

  const data = await fetch(API + "/abastecimentos").then(r => r.json());
  const list = document.getElementById("abastecimentosList");
  list.innerHTML = "";

  data.forEach(a => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <p>${a.veiculo_placa} - ${a.data} - ${a.tipo_combustivel}</p>
      <p>Posto: ${a.posto || "N/A"} | ${a.litros}L - R$${a.valor}</p>
      <button onclick="editAbastecimento(${a.id})">Editar</button>
      <button onclick="deleteAbastecimento(${a.id})">Excluir</button>
    `;
    list.appendChild(div);
  });
}

async function editAbastecimento(id) {
  const a = (await fetch(API + "/abastecimentos").then(r => r.json())).find(a => a.id == id);

  inputVeiculoAbast.value = a.veiculo_placa;
  inputVeiculoAbast.dataset.id = a.veiculo_id;
  inputDataAbast.value = a.data;
  selectOption(a.tipo_combustivel);
  inputPosto.value = a.posto || "";
  inputLitros.value = a.litros;
  inputValor.value = a.valor;

  abastecimentoEditandoId = id;
  abastecimentoForm.classList.remove("hidden");
}

async function deleteAbastecimento(id) {
  await fetch(`${API}/abastecimentos/${id}`, { method: "DELETE" });
  loadAbastecimentos();
}

document.getElementById("addAbastecimentoBtn").onclick = () => {
  abastecimentoEditandoId = null;
  resetAbastecimentoForm();
  abastecimentoForm.classList.remove("hidden");
};

document.getElementById("cancelAbastecimento").onclick = () => {
  resetAbastecimentoForm();
};

function resetAbastecimentoForm() {
  ["inputVeiculoAbast", "inputDataAbast", "inputPosto", "inputLitros", "inputValor"].forEach(id => {
    const el = document.getElementById(id);
    el.value = "";
    el.dataset.id = "";
  });
  selectOption("Etanol");
  abastecimentoForm.classList.add("hidden");
}

document.getElementById("saveAbastecimento").onclick = async () => {
  const veiculoId = inputVeiculoAbast.dataset.id;

  if (!veiculoId) return alert("Selecione um veículo válido");

  const tipoCombustivel = document.querySelector(".selected").textContent.replace(" ▼", "");

  const data = {
    veiculo_id: veiculoId,
    data: inputValue("inputDataAbast"),
    tipo_combustivel: tipoCombustivel,
    posto: inputValue("inputPosto"),
    litros: inputValue("inputLitros"),
    valor: inputValue("inputValor")
  };

  const method = abastecimentoEditandoId ? "PUT" : "POST";
  const url = abastecimentoEditandoId ? `${API}/abastecimentos/${abastecimentoEditandoId}` : `${API}/abastecimentos`;

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  resetAbastecimentoForm();
  loadAbastecimentos();
};


function inputValue(id) {
  return document.getElementById(id).value;
}

function loadPageData(pageId) {
  if (pageId === "dashboardPage") loadDashboard();
  if (pageId === "veiculosPage") loadVeiculos();
  if (pageId === "motoristasPage") loadMotoristas();
  if (pageId === "manutencoesPage") loadManutencoes();
  if (pageId === "abastecimentosPage") loadAbastecimentos();
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadMotoristasCache();
  await loadVeiculosCache();
  initAutocompletes();
  loadDashboard();
});
function toggleDropdown() {
  document.getElementById("options").classList.toggle("active");
}

function selectOption(valor) {
  document.querySelector(".selected").innerText = valor + " ▼";
  document.getElementById("options").classList.remove("active");
}