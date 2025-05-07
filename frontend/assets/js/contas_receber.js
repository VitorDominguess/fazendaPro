document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE = "http://127.0.0.1:5000";
    const token = localStorage.getItem('token');
    if (!token) return alert("Token não encontrado.");
  
    const form = document.getElementById('form-contas-receber');
    const categoriaSelect = form.querySelector('[name="categoria"]');
    const clienteSelect = form.querySelector('[name="cliente"]');
    const formaPagamentoSelect = form.querySelector('[name="forma_pagamento"]');
    const tipoDocumentoSelect = form.querySelector('[name="tipo_documento"]');
    const contaRecebimentoSelect = form.querySelector('[name="conta_recebimento"]');
    const produtoSelect = form.querySelector('[name="produto"]');
    const safraSelect = form.querySelector('[name="safra"]');
    const talhaoSelect = form.querySelector('[name="talhao"]');
    const kgPorCaixaInput = form.querySelector('[name="kg_por_caixa"]');
    const quantidadeCaixasInput = form.querySelector('[name="quantidade_caixas"]');
    const valorUnitarioInput = form.querySelector('[name="valor_unitario"]');
    const valorDocumentoInput = form.querySelector('[name="valor_documento"]');
    const pesoBrutoInput = form.querySelector('[name="peso_bruto"]');
    const refugoInput = form.querySelector('[name="refugo"]');
    const taraInput = form.querySelector('[name="tara"]');
    const pesoLiquidoInput = form.querySelector('[name="peso_liquido"]');
  
    const headers = { headers: { Authorization: `Bearer ${token}` } };
    let produtosMap = {};
  
    function preencherSelect(select, dados, chave, valor = 'id', montarLabel = null) {
      select.innerHTML = '<option value="">Selecione</option>';
      dados.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valor];
        option.textContent = montarLabel ? montarLabel(item) : item[chave];
        select.appendChild(option);
      });
    }
  
    try {
      const [
        categoriasResp,
        clientesResp,
        formasResp,
        tiposResp,
        contasResp,
        safrasResp,
        talhoesResp,
        produtosResp
      ] = await Promise.all([
        fetch(`${API_BASE}/api/depara/categorias`, headers),
        fetch(`${API_BASE}/api/clientes`, headers),
        fetch(`${API_BASE}/api/formas-pagamento`, headers),
        fetch(`${API_BASE}/api/tipos-documento`, headers),
        fetch(`${API_BASE}/api/contas-bancarias`, headers),
        fetch(`${API_BASE}/api/safras`, headers),
        fetch(`${API_BASE}/api/talhoes`, headers),
        fetch(`${API_BASE}/api/produtos`, headers)
      ]);
  
      const [
        categorias, clientes, formas, tipos, contas, safras, talhoes, produtos
      ] = await Promise.all([
        categoriasResp.json(),
        clientesResp.json(),
        formasResp.json(),
        tiposResp.json(),
        contasResp.json(),
        safrasResp.json(),
        talhoesResp.json(),
        produtosResp.json()
      ]);
  
      preencherSelect(categoriaSelect, categorias, 'categoria');
      preencherSelect(clienteSelect, clientes, 'razao_social');
      preencherSelect(formaPagamentoSelect, formas, 'nome');
      preencherSelect(tipoDocumentoSelect, tipos, 'nome');
      preencherSelect(contaRecebimentoSelect, contas, null, 'id', item =>
        `${item.nome_banco} - Ag ${item.agencia} - CC ${item.conta_corrente}`);
      preencherSelect(safraSelect, safras, 'nome_safra');
      preencherSelect(talhaoSelect, talhoes, 'nome_talhao');
  
      produtoSelect.innerHTML = '<option value="">Selecione</option>';
      produtos.forEach(prod => {
        produtosMap[prod.id] = {
          kg_por_caixa: parseFloat(prod.peso || 0),
          valor_unitario: parseFloat(prod.preco || 0)
        };
        const option = document.createElement('option');
        option.value = prod.id;
        option.textContent = prod.nome_produto;
        produtoSelect.appendChild(option);
      });
    } catch (e) {
        console.error("❌ Falha no carregamento inicial:", e);
      } finally {
        document.getElementById('loading-overlay').style.display = 'none';
      }
  
    function calcularValores() {
      const pesoBruto = parseFloat(pesoBrutoInput.value) || 0;
      const refugo = parseFloat(refugoInput.value) || 0;
      const tara = parseFloat(taraInput.value) || 0;
  
      const pesoLiquido = pesoBruto - refugo - tara;
      pesoLiquidoInput.value = pesoLiquido.toFixed(2);
  
      const produtoID = produtoSelect.value;
      if (!produtoID || !produtosMap[produtoID]) return;
  
      const { kg_por_caixa, valor_unitario } = produtosMap[produtoID];
      kgPorCaixaInput.value = kg_por_caixa;
      valorUnitarioInput.value = valor_unitario.toFixed(2);
  
      const caixas = kg_por_caixa ? pesoLiquido / kg_por_caixa : 0;
      quantidadeCaixasInput.value = Math.floor(caixas);
      valorDocumentoInput.value = (pesoLiquido * valor_unitario).toFixed(2);
    }
  
    [pesoBrutoInput, refugoInput, taraInput, produtoSelect].forEach(input =>
      input.addEventListener('input', calcularValores)
    );
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const dados = Object.fromEntries(new FormData(form));
  
      try {
        const resp = await fetch(`${API_BASE}/api/contas-receber`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(dados)
        });
  
        if (!resp.ok) throw new Error('Erro ao salvar dados');
        alert('Conta a receber registrada com sucesso!');
        form.reset();
      } catch (err) {
        console.error(err);
        alert('Erro ao salvar dados');
      }
    });
  });
  