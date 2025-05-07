document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = "/frontend/login.html";
    return;
  }

  const form = document.getElementById('form-contas-pagar');
  const tabelaRateio = document.getElementById('modalTabelaRateio');
  const tipoRateio = document.getElementById('modalTipoRateio');
  const nomeRateado = document.getElementById('modalNomeRateado');
  const formaRateio = document.getElementById('modalFormaRateio');
  const valorRateio = document.getElementById('modalValorRateio');
  const tipoDocumento = document.getElementById('tipo_documento');
  const modalRateio = document.getElementById('modalRateio');
  const btnAddRateio = document.getElementById('btnAddRateio');
  const btnSalvarRateio = document.getElementById('btnSalvarRateio');

  let rateios = [];

  const selects = {
    categoria: document.querySelector('select[name="categoria"]'),
    conta_pagamento: document.querySelector('select[name="conta_pagamento"]'),
    empresa_pagadora: document.querySelector('select[name="empresa_pagadora"]'),
    fornecedor: document.querySelector('select[name="fornecedor"]'),
    forma_pagamento: document.querySelector('select[name="forma_pagamento"]'),
    produto: document.querySelector('select[name="produto"]'),
    talhao: document.querySelector('select[name="talhao"]'),
    safra: document.querySelector('select[name="safra"]'),
    centro_custo: document.querySelector('select[name="centro_custo"]'),
    conta_contabil: document.querySelector('select[name="conta_contabil"]'),
    valor_documento: document.querySelector('input[name="valor_documento"]')
  };

  const camposFaltantes = [
    "tipo_produto", "valor_produto", "data_pagamento", "dias_atraso",
    "contrato", "descricao", "unidade_medida_embalagem", "qtde_embalagens",
    "kg_por_caixa", "peso_liquido", "peso_bruto", "refugo", "tara",
    "sub_centro_custo", "subconta", "propriedade", "motivo_conciliacao",
    "observacoes", "dre", "categoria_principal"
  ];

  const API_BASE = 'http://127.0.0.1:5000/api';
  const API_LANCAMENTOS = `${API_BASE}/lancamentos`;
  const API_TIPOS_DOC = `${API_BASE}/tipos-documento`;
  const API_DEPARA = `${API_BASE}/depara`;

  async function preencherSelect(url, selectElement, campo1, campo2 = '', campo3 = '') {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  
    const dados = await res.json();
    selectElement.innerHTML = '<option value="">Selecione</option>';
  
    dados.forEach(dado => {
      let texto = '';
  
      // Para contas bancárias: Banco Agência/Conta
      if (selectElement.name === 'conta_pagamento') {
        texto = `${dado[campo1]} ${dado[campo2]}/${dado[campo3]}`;
        const option = document.createElement('option');
        option.value = dado.id; // aqui pode manter o ID
        option.textContent = texto;
        selectElement.appendChild(option);
      } else {
        // Para os demais: usa o nome no value (ex: nome_fantasia, nome_produto, etc.)
        texto = dado[campo1];
        if (campo2 && campo3) texto += ` - ${dado[campo2]} - ${dado[campo3]}`;
        else if (campo2) texto += ` - ${dado[campo2]}`;
  
        const option = document.createElement('option');
        option.value = texto; // aqui vai o nome
        option.textContent = texto;
        selectElement.appendChild(option);
      }
    });
  }
  
  

  async function carregarDados() {
    await Promise.all([
      preencherSelect(`${API_BASE}/contas-bancarias`, selects.conta_pagamento, 'nome_banco', 'agencia', 'conta_corrente'),
      preencherSelect(`${API_BASE}/propriedades`, selects.empresa_pagadora, 'nome_propriedade'),
      preencherSelect(`${API_BASE}/fornecedores`, selects.fornecedor, 'nome_fantasia'),
      preencherSelect(`${API_BASE}/formas-pagamento`, selects.forma_pagamento, 'nome'),
      preencherSelect(`${API_BASE}/produtos`, selects.produto, 'nome_produto'),
      preencherSelect(`${API_BASE}/talhoes`, selects.talhao, 'nome_talhao'),
      preencherSelect(`${API_BASE}/safras`, selects.safra, 'nome_safra'),
      preencherSelect(`${API_BASE}/centros-custo`, selects.centro_custo, 'nome_centro'),
      preencherSelect(`${API_BASE}/plano-contas`, selects.conta_contabil, 'codigo_completo'),
      preencherTiposDocumento(),
      carregarCategorias()
    ]);
    atualizarRateadoDisponivel();
  }

  async function preencherTiposDocumento() {
    const res = await fetch(API_TIPOS_DOC, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const dados = await res.json();
    tipoDocumento.innerHTML = '<option value="">Selecione</option>';
    
    dados
      .filter(d => d.situacao?.toLowerCase() === 'ativo' || d.nome === 'Custo Rateado')
      .forEach(doc => {
        const opt = document.createElement('option');
        opt.value = doc.nome;
        opt.textContent = doc.nome;
        tipoDocumento.appendChild(opt);
      });
  }
  
  

  async function carregarCategorias() {
    const res = await fetch(API_DEPARA, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const dados = await res.json();
    const categorias = [...new Set(dados.map(d => d.categoria).filter(Boolean))];
    selects.categoria.innerHTML = '<option value="">Selecione</option>';
    categorias.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      selects.categoria.appendChild(option);
    });
  
    selects.categoria.addEventListener('change', () => {
      const cat = selects.categoria.value;
      const item = dados.find(d => d.categoria === cat);
      if (item) {
        selects.conta_contabil.value = item.conta_contabil;
        form.elements['dre'].value = item.dre;
        form.elements['categoria_principal'].value = item.categoria_principal;
        form.elements['tipo_movimentacao'].value = item.tipo_movimentacao;
      }
    });
  }
  

  tipoDocumento.addEventListener('change', () => {
    if (tipoDocumento.value === 'Custo Rateado') {
      modalRateio.showModal();
    }
  });

  btnAddRateio.addEventListener('click', () => {
    const tipo = tipoRateio.value;
    const nome = nomeRateado.value;
    const forma = formaRateio.value;
    const valor = parseFloat(valorRateio.value);
    const total = parseFloat(selects.valor_documento.value || '0');

    if (!tipo || !nome || isNaN(valor)) return alert('Preencha os campos corretamente');

    const calculado = forma === 'porcentagem' ? total * valor / 100 : valor;
    rateios.push({ tipo, nome, forma, valor: calculado.toFixed(2) });
    atualizarTabelaRateio();
    valorRateio.value = '';
  });

  function atualizarTabelaRateio() {
    tabelaRateio.innerHTML = '';
    rateios.forEach((r, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.tipo}</td>
        <td>${r.nome}</td>
        <td>${r.forma}</td>
        <td>R$ ${r.valor}</td>
        <td><button type="button" onclick="removerRateio(${i})">🗑️</button></td>`;
      tabelaRateio.appendChild(tr);
    });
  }

  window.removerRateio = i => {
    rateios.splice(i, 1);
    atualizarTabelaRateio();
  };

  btnSalvarRateio.addEventListener('click', () => {
    modalRateio.close();
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(form));
    const dadosBase = {
      ...formData,
      data_cadastro: new Date().toISOString(),
      status: 'pendente',
      conciliado: false
    };
    camposFaltantes.forEach(c => { if (!(c in dadosBase)) dadosBase[c] = ''; });

    try {
      if (tipoDocumento.value === 'Custo Rateado') {
        if (rateios.length === 0) return alert('Adicione itens de rateio');
        for (const r of rateios) {
          const payload = {
            ...dadosBase,
            valor_documento: r.valor,
            propriedade: r.tipo === 'Propriedade' ? r.nome : '',
            talhao: r.tipo === 'Talhão' ? r.nome : '',
            motivo_conciliacao: `Rateio ${r.tipo}`
          };

          const res = await fetch(API_LANCAMENTOS, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });

          if (res.status === 401) {
            alert("Sua sessão expirou. Faça login novamente.");
            localStorage.removeItem("token");
            window.location.href = "/frontend/login.html";
            return;
          }

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.erro || 'Erro ao salvar lançamento');
          }
        }

        alert('Lançamentos rateados salvos com sucesso!');
      } else {
        const res = await fetch(API_LANCAMENTOS, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(dadosBase)
        });

        if (res.status === 401) {
          alert("Sua sessão expirou. Faça login novamente.");
          localStorage.removeItem("token");
          window.location.href = "/frontend/login.html";
          return;
        }

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.erro || 'Erro ao salvar lançamento');
        }

        alert('Lançamento salvo com sucesso!');
      }

      form.reset();
      rateios = [];
      atualizarTabelaRateio();
    } catch (e) {
      console.error('Erro ao salvar lançamento:', e);
      alert('Erro ao salvar lançamento: ' + e.message);
    }
  });

  function atualizarRateadoDisponivel() {
    const propriedades = Array.from(selects.empresa_pagadora.options).map(opt => opt.value).filter(Boolean);
    const talhoes = Array.from(selects.talhao.options).map(opt => opt.value).filter(Boolean);
    tipoRateio.addEventListener('change', () => {
      nomeRateado.innerHTML = '<option value="">Selecione</option>';
      const lista = tipoRateio.value === 'Talhão' ? talhoes : propriedades;
      lista.forEach(nome => {
        const opt = document.createElement('option');
        opt.value = nome;
        opt.textContent = nome;
        nomeRateado.appendChild(opt);
      });
    });
  }

  carregarDados();
});
