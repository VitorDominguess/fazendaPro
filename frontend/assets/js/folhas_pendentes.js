document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = "/frontend/login.html";
    return;
  }

  const tabela = document.getElementById('lista-folhas');
  const modal = document.getElementById('modalAprovar');
  let folhaSelecionadaId = null;

  carregarFolhas();

  function carregarFolhas() {
    fetch('http://localhost:5000/api/folhas/pendentes', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
      .then(res => res.json())
      .then(folhas => {
        tabela.innerHTML = '';

        if (!folhas.length) {
          tabela.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhuma folha pendente encontrada.</td></tr>';
          return;
        }

        folhas.forEach(folha => {
          tabela.innerHTML += `
            <tr>
              <td>${folha.id}</td>
              <td>${folha.data_importacao}</td>
              <td>R$ ${formatarMoeda(folha.valor_total)}</td>
              <td>${folha.status}</td>
              <td>
                <button onclick="verLancamento('${folha.id}')">Ver</button>
                <button class="btn-salvar" onclick="abrirModal('${folha.id}')">Aprovar</button>
                <button class="btn-cancelar" onclick="rejeitarFolha('${folha.id}')">Rejeitar</button>
                  <button onclick="verErrosFolha('${folha.id}')">Ver erros</button>
              </td>
            </tr>`;
        });
      })
      .catch(err => {
        console.error('Erro ao carregar folhas:', err);
      });
  }

  window.abrirModal = function(id) {
    folhaSelecionadaId = id;
    modal.style.display = 'flex';
  };

  window.fecharModal = function() {
    modal.style.display = 'none';
    folhaSelecionadaId = null;
  };

  window.confirmarAprovacao = function() {
    const dataVencimento = document.getElementById('data-vencimento').value;
    const empresaPagadora = document.getElementById('empresa-pagadora').value;
    const contaPagamento = document.getElementById('conta-pagamento').value;

    if (!dataVencimento || !empresaPagadora || !contaPagamento) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    fetch(`http://localhost:5000/api/folhas/${folhaSelecionadaId}/aprovar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        data_vencimento: dataVencimento,
        empresa_pagadora: empresaPagadora,
        conta_pagamento: contaPagamento
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao aprovar folha.');
        alert('Folha aprovada com sucesso!');
        fecharModal();
        carregarFolhas();
      })
      .catch(err => {
        console.error(err);
        alert('Erro ao aprovar folha.');
      });
  };

  window.rejeitarFolha = function(id) {
    if (!confirm('Tem certeza que deseja rejeitar esta folha?')) return;

    fetch(`http://localhost:5000/api/folhas/${id}/rejeitar`, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao rejeitar folha.');
        alert('Folha rejeitada com sucesso!');
        carregarFolhas();
      })
      .catch(err => {
        console.error(err);
        alert('Erro ao rejeitar folha.');
      });
  };

  window.verLancamento = function(folhaId) {
    fetch(`http://localhost:5000/api/folhas/${folhaId}/detalhes`, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
    .then(res => {
      if (!res.ok) throw new Error('Erro ao buscar lançamentos');
      return res.json();
    })
    .then(detalhes => {
      if (!detalhes.length) {
        alert('Nenhum lançamento encontrado para visualização.');
        return;
      }

      const modalContent = `
        <div class="modal-header">
          <h3>Visualização da Folha</h3>
          <span class="close-modal" onclick="fecharModalDetalhes()">&times;</span>
        </div>
        <div class="modal-body">
          <table class="tabela-detalhes">
            <thead>
              <tr>
                <th>#</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              ${detalhes.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.tipo}</td>
                  <td>${item.descricao}</td>
                  <td>${formatarMoeda(Number(item.valor))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      document.querySelector('#modal-detalhes .modal-body').innerHTML = modalContent;
      document.getElementById('modal-detalhes').style.display = 'flex';
    })
    .catch(erro => {
      console.error('Erro ao visualizar:', erro);
      alert('Erro ao carregar dados para visualização.');
    });
  };

  window.fecharModalDetalhes = function() {
    document.getElementById('modal-detalhes').style.display = 'none';
  };

  function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }


  carregarEmpresasPagadoras();
carregarContasPagamento();

async function carregarEmpresasPagadoras() {
  const select = document.getElementById('empresa-pagadora');
  try {
    const res = await fetch('http://localhost:5000/api/propriedades/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const empresas = await res.json();
    select.innerHTML = '<option value="">Selecione</option>' +
      empresas.map(emp => `<option value="${emp.id}">${emp.nome_propriedade}</option>`).join('');
  } catch (err) {
    console.error('Erro ao carregar empresas:', err);
    select.innerHTML = '<option disabled>Erro ao carregar empresas</option>';
  }
}

window.verErrosFolha = function(folhaId) {
  const token = localStorage.getItem('token');
  fetch(`http://localhost:5000/api/folhas/${folhaId}/verificar-erros`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById('lista-erros');
    if (data.erros && data.erros.length > 0) {
      container.innerHTML = `<ul>${data.erros.map(e => `<li>${e}</li>`).join('')}</ul>`;
    } else {
      container.innerHTML = `<p style="color: green;">Nenhum erro encontrado. Todos os lançamentos possuem de/para.</p>`;
    }
    document.getElementById('modalVerErros').style.display = 'flex';
  })
  .catch(err => {
    console.error('Erro ao buscar erros da folha:', err);
  });
};


window.fecharModalErros = function() {
  document.getElementById('modalVerErros').style.display = 'none';
};



async function carregarContasPagamento() {
  const select = document.getElementById('conta-pagamento');
  try {
    const res = await fetch('http://localhost:5000/api/contas-bancarias/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const contas = await res.json();
    select.innerHTML = '<option value="">Selecione</option>' +
      contas.map(c => `<option value="${c.id}">${c.nome_banco} - ${c.agencia}/${c.conta_corrente}</option>`).join('');
  } catch (err) {
    console.error('Erro ao carregar contas:', err);
    select.innerHTML = '<option disabled>Erro ao carregar contas</option>';
  }
}

});
