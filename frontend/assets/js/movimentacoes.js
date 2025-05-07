const API_BASE = 'http://127.0.0.1:5000/api';

let todosLancamentos = [];

  // Mostrar alerta estilizado
  function showAlert(message, type = 'error') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${type}`;
    alertDiv.textContent = message;
    document.body.prepend(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
  }

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  // 🔐 Verifica se o usuário está autenticado
  if (!token) {
    // Se não estiver, redireciona para login
    window.location.href = "/frontend/login.html";
    return; // Evita continuar executando o resto
  }

  const selectConta = document.getElementById('select-conta');
  const filtroConta = document.getElementById('filtro-conta');
  const tabelaBody = document.getElementById('movimentacoes-body');
  const saldoAtual = document.getElementById('saldo-atual');
  const saldoPrevisto = document.getElementById('saldo-previsto');
  const filtroStatus = document.getElementById('filtro-status');
  const filtroForm = document.getElementById('form-filtros');

  // saldo_previsto.js

document.addEventListener('DOMContentLoaded', async () => {
  const API_BASE = "http://127.0.0.1:5000";
  const token = localStorage.getItem('token');
  if (!token) return;

  const selectFiltro = document.getElementById('filtro-previsao');
  const spanSaldoPrevisto = document.getElementById('saldo-previsto');
  const selectConta = document.getElementById('select-conta');

  const filtros = {
    "semana": 7,
    "mes": 30,
    "total": null
  };

  async function carregarSaldoPrevisto() {
    const dias = filtros[selectFiltro.value];
    const contaSelecionada = selectConta?.value || '';
    let url = `${API_BASE}/api/movimentacoes/saldo-previsto`;

    const params = new URLSearchParams();

    if (dias !== null) {
      const hoje = new Date();
      const dataLimite = new Date(hoje.getTime() + dias * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
      params.append("ate", dataLimite);
    }

    if (contaSelecionada) {
      params.append("conta", contaSelecionada); // o fetch já cuida do encoding
    }
   

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    try {
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      spanSaldoPrevisto.textContent = `R$ ${data.saldo.toFixed(2)}`;
    } catch (err) {
      console.error('Erro ao carregar saldo previsto:', err);
    }
  }

  selectFiltro.addEventListener('change', carregarSaldoPrevisto);
  selectConta?.addEventListener('change', carregarSaldoPrevisto);
  carregarSaldoPrevisto();
  window.atualizarSaldos = carregarSaldoPrevisto;
});


  // Função para agrupar lançamentos por documento e data
  function agruparLancamentos(lancamentos) {
    const agrupados = {};

    lancamentos.forEach(l => {
      const chave = `${l.numero_documento}__${l.data_transacao}`;
      if (!agrupados[chave]) {
        agrupados[chave] = {
          ...l,
          valor_documento: parseFloat(l.valor_documento || 0),
          ids: [l.id],
          descricao: l.descricao || l.motivo_conciliacao || '',
          tipo: l.tipo || l.tipo_movimentacao || ''
        };
      } else {
        agrupados[chave].valor_documento += parseFloat(l.valor_documento || 0);
        agrupados[chave].ids.push(l.id);
      }
    });

    return Object.values(agrupados);
  }

  // Carregar contas bancárias
  async function carregarContas() {
    try {
      const res = await fetch(`${API_BASE}/contas-bancarias`, {
        headers: {
          'Authorization': 'Bearer ' + token  // ✅ adicionado token aqui
        }
      });
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
      const contas = await res.json();
  
      const opcoes = contas.map(c => {
        const value = `${c.nome_banco} ${c.agencia}/${c.conta_corrente}`;
        const label = `${c.nome_banco} ${c.agencia}/${c.conta_corrente}`;
        return `<option value="${value}">${label}</option>`;
      });
      
  
      selectConta.innerHTML = `<option value="">Selecione</option>` + opcoes.join('');
      filtroConta.innerHTML = `<option value="">Todas</option>` + opcoes.join('');
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      showAlert('Erro ao carregar contas bancárias', 'error');
    }
  }
  

  // Atualizar saldos da conta
  async function atualizarSaldos() {
    const contaSelecionada = document.getElementById("select-conta").value;
    if (!contaSelecionada) return;

    const url = `http://127.0.0.1:5000/api/movimentacoes/saldos/${encodeURIComponent(contaSelecionada)}`;

    try {
        const resposta = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        if (!resposta.ok) throw new Error("Erro ao buscar saldos");

        const dados = await resposta.json();

        const formatarMoeda = valor => new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);

        document.getElementById("saldo-atual").textContent = formatarMoeda(dados.saldo_atual);
        document.getElementById("saldo-previsto").textContent = formatarMoeda(dados.saldo_previsto);
    } catch (erro) {
        console.error("Erro ao atualizar saldos:", erro);
    }
}




  // Carregar lançamentos com agrupamento
  async function carregarLancamentos() {
    const conta = document.getElementById("filtro-conta").value;
    const status = document.getElementById("filtro-status").value;
    const tipo = document.getElementById("filtro-tipo").value;
    const dataInicial = document.getElementById("filtro-data-inicial").value;
    const dataFinal = document.getElementById("filtro-data-final").value;

    const params = new URLSearchParams();
    if (conta) params.append("conta_id", conta);
    if (status && status !== 'vencido') params.append("status", status); // "vencido" é tratado no frontend
    if (tipo) params.append("tipo", tipo);
    if (dataInicial) params.append("data_inicial", dataInicial);
    if (dataFinal) params.append("data_final", dataFinal);

    const url = `http://127.0.0.1:5000/api/lancamentos/?${params.toString()}`;

    try {
        const resposta = await fetch(url, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        if (!resposta.ok) {
            if (!verificarAutenticacao(resposta)) return;
            throw new Error("Erro ao carregar lançamentos");
        }

        const dados = await resposta.json();
        const corpoTabela = document.getElementById("movimentacoes-body");
        corpoTabela.innerHTML = "";

        const hoje = new Date().setHours(0, 0, 0, 0);
        const consolidados = new Map();

        dados.forEach(l => {
            const isRateado = l.tipo_documento === "Custo Rateado";
            const chave = isRateado ? `rateado-${l.numero_documento}` : `normal-${l.id}`;

            if (!consolidados.has(chave)) {
                consolidados.set(chave, {
                    ...l,
                    valor_documento: Number(l.valor_documento)
                });
            } else {
                const agrupado = consolidados.get(chave);
                agrupado.valor_documento += Number(l.valor_documento);
            }
        });

        for (const [_, l] of consolidados) {
            const vencimento = l.data_vencimento ? new Date(l.data_vencimento).setHours(0, 0, 0, 0) : null;
            let statusFinal = l.status;

            if (l.status === "pendente" && vencimento && vencimento < hoje) {
                statusFinal = "vencido";
            }

            if (status && status !== statusFinal) continue;

            let acoes = `
                <button onclick="verLancamento('${l.numero_documento}', '${l.data_transacao}')" title="Ver">
                  <i class="fas fa-eye"></i>
                </button>

            `;

            if (statusFinal === 'pendente') {
              acoes += `
                <button class="btn-editar" onclick="editarLancamento('${l.id}', '${l.numero_documento}', '${l.data_transacao}')" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="baixarLancamento('${l.id}', '${l.numero_documento}', '${l.data_transacao}')" title="Baixar">
                  <i class="fas fa-check-circle"></i>
                </button>
                <button class="btn-excluir" onclick="excluirLancamento('${l.id}', '${l.numero_documento}', '${l.data_transacao}')" title="Excluir">
                  <i class="fas fa-trash"></i>
                </button>
              `;
            } else if (statusFinal === 'vencido') {
              acoes += `
                <button onclick="baixarLancamento('${l.id}', '${l.numero_documento}', '${l.data_transacao}')" title="Baixar">
                  <i class="fas fa-check-circle"></i>
                </button>
              `;
            }
            

            const linha = document.createElement("tr");

            linha.innerHTML = `
                <td>${new Date(l.data_transacao).toLocaleDateString('pt-BR')}</td>
                <td>${l.tipo_movimentacao || '-'}</td>
                <td>${l.fornecedor || l.cliente || '-'}</td>
                <td>${l.descricao || '-'}</td>
                <td>${l.valor_documento.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                })}</td>
                <td>${l.data_vencimento ? new Date(l.data_vencimento).toLocaleDateString('pt-BR') : '-'}</td>
                <td>
                    <span class="status-badge ${statusFinal}">
                        ${statusFinal.charAt(0).toUpperCase() + statusFinal.slice(1)}
                    </span>
                </td>
                <td>${acoes}</td>
            `;

            corpoTabela.appendChild(linha);
        }

    } catch (erro) {
        console.error("Erro ao carregar lançamentos:", erro);
    }
}

window.editarLancamento = async function (id, numero_documento, data_transacao) {
  try {
    const res = await fetch(`${API_BASE}/lancamentos`, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });

    if (!res.ok) throw new Error('Erro ao buscar lançamentos');
    const todos = await res.json();

    let grupo = [];

    if (numero_documento && data_transacao) {
      grupo = todos.filter(l =>
        l.numero_documento === numero_documento &&
        l.data_transacao === data_transacao
      );
    }

    if (grupo.length > 1) {
      // Se for um grupo de rateio
      abrirModalEditarGrupo(numero_documento, data_transacao);
    } else {
      // Individual
      const lancamento = todos.find(l => l.id === id);
      if (!lancamento) {
        showAlert('Lançamento não encontrado para edição', 'error');
        return;
      }

      itensRateioAtuais = [lancamento];
      indiceAtual = 0;
      preencherFormulario(lancamento);
      document.getElementById('modal-editar').classList.remove('hidden');
    }
  } catch (erro) {
    console.error('Erro ao abrir edição:', erro);
    showAlert('Erro ao abrir edição', 'error');
  }
};

window.baixarLancamento = async function (id, numero_documento, data_transacao) {
  if (!confirm('Deseja realmente marcar como pago?')) return;

  try {
    const res = await fetch(`${API_BASE}/lancamentos`, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });

    if (!res.ok) throw new Error('Erro ao buscar lançamentos');

    const todos = await res.json();
    let grupo = [];

    if (numero_documento && data_transacao) {
      grupo = todos.filter(l =>
        l.numero_documento === numero_documento &&
        l.data_transacao === data_transacao
      );
    }

    if (grupo.length === 0) {
      const lancamento = todos.find(l => l.id === id);
      if (lancamento) grupo = [lancamento];
    }

    if (grupo.length === 0) {
      showAlert('Nenhum lançamento encontrado para baixar.', 'error');
      return;
    }

    const hoje = new Date().toISOString().split('T')[0];
    const results = await Promise.all(
      grupo.map(l =>
        fetch(`${API_BASE}/lancamentos/${l.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          },
          body: JSON.stringify({ ...l, status: 'pago', data_pagamento: hoje })
        })
      )
    );

    const sucesso = results.every(r => r.ok);

    if (sucesso) {
      showAlert('Lançamento(s) baixado(s) com sucesso!', 'success');
      await carregarLancamentos();
      const contaSelecionada = document.getElementById('select-conta').value;
      if (contaSelecionada) atualizarSaldos(contaSelecionada);
    } else {
      throw new Error('Erro em uma ou mais baixas');
    }

  } catch (erro) {
    console.error('Erro ao baixar lançamento:', erro);
    showAlert('Erro ao baixar lançamento.', 'error');
  }
};

window.excluirLancamento = async function (id, numero_documento, data_transacao) {
  if (!confirm('Deseja realmente excluir este lançamento? Esta ação é irreversível.')) return;

  try {
    const res = await fetch(`${API_BASE}/lancamentos`, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });

    if (!res.ok) throw new Error('Erro ao buscar lançamentos');

    const todos = await res.json();
    let grupo = [];

    if (numero_documento && data_transacao) {
      grupo = todos.filter(l =>
        l.numero_documento === numero_documento &&
        l.data_transacao === data_transacao
      );
    }

    if (grupo.length === 0) {
      const lancamento = todos.find(l => l.id === id);
      if (lancamento) grupo = [lancamento];
    }

    if (grupo.length === 0) {
      showAlert('Nenhum lançamento encontrado para exclusão.', 'error');
      return;
    }

    const resultados = await Promise.allSettled(
      grupo.map(l =>
        fetch(`${API_BASE}/lancamentos/${l.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          }
        })
      )
    );

    const falhas = resultados.filter(r => r.status === 'rejected' || (r.value && !r.value.ok));

    if (falhas.length === 0) {
      showAlert(`${grupo.length} lançamento(s) excluído(s) com sucesso!`, 'success');
      await carregarLancamentos();
      const contaSelecionada = document.getElementById('select-conta').value;
      if (contaSelecionada) atualizarSaldos(contaSelecionada);
    } else {
      showAlert(`${falhas.length} de ${grupo.length} exclusões falharam.`, 'error');
      console.error('Falhas na exclusão:', falhas);
    }

  } catch (erro) {
    console.error('Erro ao excluir:', erro);
    showAlert('Erro ao excluir lançamento.', 'error');
  }
};



window.baixarLancamento = async function(id, numero_documento, data_transacao) {
  if (!confirm('Deseja realmente marcar este(s) lançamento(s) como pago(s)?')) return;

  try {
    const res = await fetch(`${API_BASE}/lancamentos`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });

    if (!res.ok) throw new Error('Erro ao buscar lançamentos');

    const todos = await res.json();

    let grupo = [];

    if (numero_documento && data_transacao) {
      // Trata como grupo
      grupo = todos.filter(l =>
        l.numero_documento === numero_documento &&
        l.data_transacao === data_transacao
      );
    } else {
      // Trata como individual
      const lancamento = todos.find(l => l.id === id);
      if (lancamento) grupo = [lancamento];
    }

    if (grupo.length === 0) {
      showAlert('Nenhum lançamento encontrado.', 'error');
      return;
    }

    const hoje = new Date().toISOString().split('T')[0];
    const results = await Promise.all(
      grupo.map(l => fetch(`${API_BASE}/lancamentos/${l.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ ...l, status: 'pago', data_pagamento: hoje })
      }))
    );

    const allSuccess = results.every(r => r.ok);
    if (allSuccess) {
      showAlert(`Baixa realizada com sucesso!`, 'success');
      await carregarLancamentos();
      const contaSelecionada = document.getElementById('select-conta').value;
      if (contaSelecionada) atualizarSaldos(contaSelecionada);
    } else {
      throw new Error('Erro em uma ou mais atualizações');
    }

  } catch (erro) {
    console.error('Erro ao baixar:', erro);
    showAlert('Erro ao realizar baixa', 'error');
  }
};


  // Event Listeners
  filtroForm.addEventListener('submit', (e) => {
    e.preventDefault();
    carregarLancamentos();
  });

  filtroForm.addEventListener('reset', () => {
    setTimeout(() => {
      filtroStatus.value = 'pendente';
      carregarLancamentos();
    }, 10);
  });

  selectConta.addEventListener('change', () => {
    atualizarSaldos(selectConta.value);
  });

  // Inicialização
  filtroStatus.value = 'pendente';
  carregarContas();
  carregarLancamentos();
});

// Funções globais
function formatarMoedaBRL(valor) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  });
}

// Modal para detalhes do grupo
function abrirModalDetalhesGrupo(numero_documento, data_transacao) {
  fetch(`${API_BASE}/lancamentos`, {
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
  })
  
  .then(res => res.json())
  .then(lancamentos => {
    const grupo = lancamentos.filter(l =>
      l.numero_documento === numero_documento &&
      l.data_transacao === data_transacao
    );

    if (!grupo.length) return;

    const modalContent = `
      <div class="modal-header">
        <h3>Detalhes do Documento: ${numero_documento}</h3>
        <span class="close-modal" onclick="fecharModalDetalhes()">&times;</span>
      </div>
      <div class="modal-body">
        <table class="tabela-detalhes">
          <thead>
            <tr>
              <th>Item</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${grupo.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.descricao || '-'}</td>
                <td>${formatarMoedaBRL(parseFloat(item.valor_documento || 0))}</td>
                <td>${item.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    const modal = document.getElementById('modal-detalhes');
    modal.innerHTML = modalContent;
    modal.style.display = 'block';
  })
  .catch(error => {
    console.error('Erro ao abrir modal de detalhes:', error);
    alert('Erro ao carregar detalhes do documento');
  });
}

function fecharModalDetalhes() {
  document.getElementById('modal-detalhes').style.display = 'none';
}


// Variáveis globais para controle dos itens do rateio
let itensRateioAtuais = [];
let indiceAtual = 0;

window.abrirModalEditarGrupo = function(numero_documento, data_transacao) {
  fetch(`${API_BASE}/lancamentos`, {
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
  })
  .then(res => {
    if (!res.ok) throw new Error('Erro ao buscar lançamentos');
    return res.json();
  })
  .then(lancamentos => {
    itensRateioAtuais = lancamentos.filter(l =>
      l.numero_documento === numero_documento &&
      l.data_transacao === data_transacao
    ).sort((a, b) => (a.talhao || '').localeCompare(b.talhao || ''));

    if (itensRateioAtuais.length === 0) {
      showAlert('Nenhum lançamento encontrado para este documento', 'error');
      return;
    }

    indiceAtual = 0;
    preencherFormulario(itensRateioAtuais[indiceAtual]);
    atualizarContador();
    configurarBotoesNavegacao();
    document.getElementById('modal-editar').classList.remove('hidden');
  })
  .catch(error => {
    console.error('Erro ao abrir modal de edição:', error);
    showAlert('Erro ao carregar dados do rateio: ' + error.message, 'error');
  });
};

async function baixarLancamento(numero_documento, data_transacao) {
  if (!confirm('Deseja marcar como pago todos os lançamentos deste documento?')) return;

  try {
    const res = await fetch(`${API_BASE}/lancamentos`, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });

    if (!res.ok) throw new Error('Erro ao buscar lançamentos');

    const todos = await res.json();
    const grupo = todos.filter(l => 
      l.numero_documento === numero_documento &&
      l.data_transacao === data_transacao
    );

    if (grupo.length === 0) {
      showAlert('Nenhum lançamento encontrado para baixar.', 'error');
      return;
    }

    const hoje = new Date().toISOString().split('T')[0];
    const updates = grupo.map(l => {
      return fetch(`${API_BASE}/lancamentos/${l.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ ...l, status: 'pago', data_pagamento: hoje })
      });
    });

    const resultados = await Promise.all(updates);
    const sucesso = resultados.every(r => r.ok);

    if (sucesso) {
      showAlert('Lançamento(s) baixado(s) com sucesso!', 'success');
      carregarLancamentos();
      atualizarSaldos();
    } else {
      throw new Error('Falha em uma ou mais baixas');
    }

  } catch (erro) {
    console.error('Erro ao baixar:', erro);
    showAlert('Erro ao baixar lançamento.', 'error');
  }
}



function preencherFormulario(lancamento) {
  // Preenche todos os campos do formulário
  document.getElementById('edit-id').value = lancamento.id;
  document.getElementById('edit-categoria').value = lancamento.categoria || '';
  document.getElementById('edit-conta-pagamento').value = lancamento.conta_pagamento || '';
  document.getElementById('edit-empresa-pagadora').value = lancamento.empresa_pagadora || '';
  document.getElementById('edit-fornecedor').value = lancamento.fornecedor || '';
  document.getElementById('edit-forma-pagamento').value = lancamento.forma_pagamento || '';
  document.getElementById('edit-numero-documento').value = lancamento.numero_documento || '';
  document.getElementById('edit-produto').value = lancamento.produto || '';
  document.getElementById('edit-talhao').value = lancamento.talhao || '';
  document.getElementById('edit-safra').value = lancamento.safra || '';
  document.getElementById('edit-valor-documento').value = lancamento.valor_documento || '';
  document.getElementById('edit-multa').value = lancamento.multa || '';
  document.getElementById('edit-juros').value = lancamento.juros || '';
  document.getElementById('edit-ajuste').value = lancamento.ajuste || '';
  document.getElementById('edit-conta-contabil').value = lancamento.conta_contabil || '';
  document.getElementById('edit-status').value = lancamento.status || 'pendente';
  document.getElementById('edit-data-transacao').value = lancamento.data_transacao || '';
  document.getElementById('edit-data-vencimento').value = lancamento.data_vencimento || '';
  document.getElementById('edit-data-pagamento').value = lancamento.data_pagamento || '';
  document.getElementById('edit-observacoes').value = lancamento.observacoes || '';

  // Destaca campos relevantes para rateio
  destacarCamposRateio();
}

function destacarCamposRateio() {
  const camposRateio = ['edit-talhao', 'edit-produto', 'edit-valor-documento'];
  camposRateio.forEach(id => {
    const campo = document.getElementById(id);
    if (campo) {
      campo.style.backgroundColor = '#f0f8ff';
      campo.style.transition = 'background-color 0.3s';
    }
  });
}

function atualizarContador() {
  document.getElementById('contador-rateio').textContent =
    `${indiceAtual + 1}/${itensRateioAtuais.length}`;
}

function configurarBotoesNavegacao() {
  const btnAnterior = document.getElementById('btn-anterior');
  const btnProximo = document.getElementById('btn-proximo');

  btnAnterior.disabled = indiceAtual === 0;
  btnProximo.disabled = indiceAtual === itensRateioAtuais.length - 1;

  // Remove event listeners antigos para evitar duplicação
  btnAnterior.replaceWith(btnAnterior.cloneNode(true));
  btnProximo.replaceWith(btnProximo.cloneNode(true));

  // Adiciona novos event listeners
  document.getElementById('btn-anterior').addEventListener('click', () => {
    if (indiceAtual > 0) {
      indiceAtual--;
      preencherFormulario(itensRateioAtuais[indiceAtual]);
      atualizarContador();
      configurarBotoesNavegacao();
    }
  });

  document.getElementById('btn-proximo').addEventListener('click', () => {
    if (indiceAtual < itensRateioAtuais.length - 1) {
      indiceAtual++;
      preencherFormulario(itensRateioAtuais[indiceAtual]);
      atualizarContador();
      configurarBotoesNavegacao();
    }
  });
}

// Função para salvar (mantida separada para reutilização)
window.salvarItemRateio = async function () {
  const id = document.getElementById('edit-id').value;

  const payload = {
    categoria: document.getElementById('edit-categoria').value,
    conta_pagamento: document.getElementById('edit-conta-pagamento').value,
    empresa_pagadora: document.getElementById('edit-empresa-pagadora').value,
    fornecedor: document.getElementById('edit-fornecedor').value,
    forma_pagamento: document.getElementById('edit-forma-pagamento').value,
    numero_documento: document.getElementById('edit-numero-documento').value,
    produto: document.getElementById('edit-produto').value,
    talhao: document.getElementById('edit-talhao').value,
    safra: document.getElementById('edit-safra').value,
    valor_documento: parseFloat(document.getElementById('edit-valor-documento').value || 0),
    multa: parseFloat(document.getElementById('edit-multa').value || 0),
    juros: parseFloat(document.getElementById('edit-juros').value || 0),
    ajuste: parseFloat(document.getElementById('edit-ajuste').value || 0),
    conta_contabil: document.getElementById('edit-conta-contabil').value,
    status: document.getElementById('edit-status').value,
    data_transacao: document.getElementById('edit-data-transacao').value,
    data_vencimento: document.getElementById('edit-data-vencimento').value,
    data_pagamento: document.getElementById('edit-data-pagamento').value,
    observacoes: document.getElementById('edit-observacoes').value
  };

  try {
    const res = await fetch(`${API_BASE}/lancamentos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')  // ✅ Essencial
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Erro ao salvar alterações');

    showAlert('Alterações salvas com sucesso!', 'success');
    fecharModalEditar();
    carregarLancamentos();

  } catch (error) {
    console.error('Erro ao salvar:', error);
    showAlert('Erro ao salvar alterações: ' + error.message, 'error');
  }
};


// Event listener para o botão "Salvar Todos"
document.getElementById('btn-salvar-todos')?.addEventListener('click', async () => {
  if (!confirm(`Deseja salvar todas as alterações nos ${itensRateioAtuais.length} itens deste rateio?`)) {
    return;
  }

  try {
    // Primeiro salva o item atual
    await salvarItemRateio();

    // Depois salva os demais itens
    const results = await Promise.all(
      itensRateioAtuais
        .filter((_, index) => index !== indiceAtual) // Exclui o item já salvo
        .map(item => fetch(`${API_BASE}/lancamentos/${item.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')  // 🔐 necessário
          },
          
          body: JSON.stringify(item)
        }))
    );

    const allSuccess = results.every(res => res.ok);
    if (allSuccess) {
      showAlert(`Todos os ${itensRateioAtuais.length} itens foram salvos!`, 'success');
      window.carregarLancamentos(); // Atualiza a tabela principal
    } else {
      throw new Error('Alguns itens não puderam ser salvos');
    }
  } catch (error) {
    console.error('Erro ao salvar todos:', error);
    showAlert('Erro ao salvar todos os itens: ' + error.message, 'error');
  }
});

document.getElementById('form-editar').addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('edit-id').value;
  const grupoIds = document.getElementById('edit-id').dataset.grupoIds?.split(',') || [id];

  try {
    const payload = {
      categoria: document.getElementById('edit-categoria').value,
      conta_pagamento: document.getElementById('edit-conta-pagamento').value,
      empresa_pagadora: document.getElementById('edit-empresa-pagadora').value,
      fornecedor: document.getElementById('edit-fornecedor').value,
      forma_pagamento: document.getElementById('edit-forma-pagamento').value,
      numero_documento: document.getElementById('edit-numero-documento').value,
      produto: document.getElementById('edit-produto').value,
      talhao: document.getElementById('edit-talhao').value,
      safra: document.getElementById('edit-safra').value,
      valor_documento: parseFloat(document.getElementById('edit-valor-documento').value || 0),
      multa: parseFloat(document.getElementById('edit-multa').value || 0),
      juros: parseFloat(document.getElementById('edit-juros').value || 0),
      ajuste: parseFloat(document.getElementById('edit-ajuste').value || 0),
      conta_contabil: document.getElementById('edit-conta-contabil').value,
      status: document.getElementById('edit-status').value,
      data_transacao: document.getElementById('edit-data-transacao').value,
      data_vencimento: document.getElementById('edit-data-vencimento').value,
      data_pagamento: document.getElementById('edit-data-pagamento').value,
      observacoes: document.getElementById('edit-observacoes').value
    };

    for (const itemId of grupoIds) {
      const res = await fetch(`${API_BASE}/lancamentos/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Erro ao atualizar lançamento ${itemId}`);
    }

    showAlert('Lançamentos atualizados com sucesso!', 'success');
    fecharModalEditar();

    // Reaplica filtros
    carregarLancamentos();

    // Atualiza saldo da conta selecionada (caso relevante)
    const contaSelecionada = document.getElementById("select-conta").value;
    if (contaSelecionada) atualizarSaldos(contaSelecionada);

  } catch (error) {
    console.error('Erro ao atualizar lançamentos:', error);
    showAlert('Erro ao atualizar lançamentos', 'error');
  }
});

async function excluirLancamento(id) {
  if (!confirm('Tem certeza que deseja excluir este lançamento? Essa ação não pode ser desfeita.')) return;

  try {
    const resposta = await fetch(`${API_BASE}/lancamentos/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });

    if (!resposta.ok) throw new Error('Erro ao excluir lançamento');

    showAlert('Lançamento excluído com sucesso!', 'success');
    carregarLancamentos();

    const contaSelecionada = document.getElementById("select-conta").value;
    if (contaSelecionada) atualizarSaldos(contaSelecionada);
  } catch (erro) {
    console.error('Erro ao excluir lançamento:', erro);
    showAlert('Erro ao excluir lançamento: ' + erro.message, 'error');
  }
}

async function excluirGrupoRateio(numero_documento, data_transacao) {
  if (!confirm('Deseja realmente excluir todos os lançamentos deste rateio? Essa ação é irreversível.')) return;

  try {
    // 1. Buscar todos os lançamentos do grupo
    const res = await fetch(`${API_BASE}/lancamentos`, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });

    if (!res.ok) throw new Error('Erro ao buscar lançamentos');

    const todos = await res.json();
    const grupo = todos.filter(l =>
      l.numero_documento === numero_documento &&
      l.data_transacao === data_transacao
    );

    if (grupo.length === 0) {
      showAlert('Nenhum lançamento encontrado para este rateio', 'error');
      return;
    }

    // 2. Executar todas as exclusões em paralelo
    const resultados = await Promise.allSettled(
      grupo.map(l =>
        fetch(`${API_BASE}/lancamentos/${l.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          }
        })
      )
    );

    const falhas = resultados.filter(r => r.status === 'rejected' || (r.value && !r.value.ok));

    if (falhas.length === 0) {
      showAlert(`Todos os ${grupo.length} lançamentos foram excluídos com sucesso!`, 'success');
      carregarLancamentos();
      const contaSelecionada = document.getElementById("select-conta").value;
      if (contaSelecionada) atualizarSaldos(contaSelecionada);
    } else {
      showAlert(`${falhas.length} de ${grupo.length} exclusões falharam.`, 'error');
      console.error('Falhas na exclusão:', falhas);
    }
  } catch (erro) {
    console.error('Erro ao excluir lançamentos do rateio:', erro);
    showAlert('Erro ao excluir lançamentos: ' + erro.message, 'error');
  }
}

function verLancamento(numero_documento, data_transacao) {
  fetch(`${API_BASE}/lancamentos`, {
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
  })
  .then(res => {
    if (!res.ok) throw new Error('Erro ao buscar lançamentos');
    return res.json();
  })
  .then(lancamentos => {
    const grupo = lancamentos.filter(l =>
      l.numero_documento === numero_documento &&
      l.data_transacao === data_transacao
    );

    if (grupo.length === 0) {
      showAlert('Nenhum lançamento encontrado para visualização.', 'error');
      return;
    }

    const modalContent = `
      <div class="modal-header">
        <h3>Visualização - Documento ${numero_documento}</h3>
        <span class="close-modal" onclick="fecharModalDetalhes()">&times;</span>
      </div>
      <div class="modal-body">
        <table class="tabela-detalhes">
          <thead>
            <tr>
              <th>#</th>
              <th>Talhão</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Vencimento</th>
            </tr>
          </thead>
          <tbody>
            ${grupo.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.talhao || '-'}</td>
                <td>${item.descricao || '-'}</td>
                <td>${formatarMoedaBRL(Number(item.valor_documento || 0))}</td>
                <td>${item.status}</td>
                <td>${item.data_vencimento ? new Date(item.data_vencimento).toLocaleDateString('pt-BR') : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    const modal = document.getElementById('modal-detalhes');
    modal.innerHTML = modalContent;
    modal.style.display = 'block';
  })
  .catch(erro => {
    console.error('Erro ao visualizar:', erro);
    showAlert('Erro ao carregar dados para visualização.', 'error');
  });
}






window.baixarPagamentoPorGrupo = async function(numero_documento, data_transacao) {
  if (!confirm('Deseja realmente marcar todos os lançamentos deste documento como pagos?')) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/lancamentos`, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });

    if (!res.ok) throw new Error('Erro ao buscar lançamentos');

    todosLancamentos = await res.json();  // ✅ Atualiza a variável global
    const grupo = todosLancamentos.filter(l =>
      l.numero_documento === numero_documento &&
      l.data_transacao === data_transacao
    );

    if (grupo.length === 0) {
      showAlert('Nenhum lançamento encontrado para este documento', 'error');
      return;
    }

    const hoje = new Date().toISOString().split('T')[0];
    const promises = grupo.map(lancamento => {
      const payload = {
        ...lancamento,
        status: 'pago',
        data_pagamento: hoje
      };

      return fetch(`${API_BASE}/lancamentos/${lancamento.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify(payload)
      });
    });

    const results = await Promise.all(promises);
    const allSuccess = results.every(res => res.ok);

    if (allSuccess) {
      showAlert(`${grupo.length} lançamentos baixados com sucesso!`, 'success');
      await carregarLancamentos();
      const contaSelecionada = document.getElementById('select-conta').value;
      if (contaSelecionada) atualizarSaldos(contaSelecionada);
    } else {
      throw new Error('Alguns lançamentos não puderam ser atualizados');
    }
  } catch (error) {
    console.error('Erro ao baixar pagamentos:', error);
    showAlert('Erro ao baixar pagamentos do grupo', 'error');
  }
};


function fecharModalEditar() {
  document.getElementById('modal-editar').classList.add('hidden');
}
