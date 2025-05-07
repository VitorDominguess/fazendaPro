document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/frontend/login.html';
      return;
    }
  
    const agrupamentoSelect = document.getElementById('agrupamento');
    const safraSelect = document.getElementById('safra');
    const dataInicialInput = document.getElementById('data-inicial');
    const dataFinalInput = document.getElementById('data-final');
    const btnAplicar = document.getElementById('btn-aplicar');
  
    const tabelaResultados = document.getElementById('tabela-resultados');
    const colunaAgrupamento = document.getElementById('coluna-agrupamento');
    const totalReceita = document.getElementById('total-receita');
    const totalCustos = document.getElementById('total-custos');
    const totalDespesas = document.getElementById('total-despesas');
    const totalMc = document.getElementById('total-mc');
    const totalMcPercentual = document.getElementById('total-mc-percentual');
  
    carregarSafras();
  
    btnAplicar.addEventListener('click', async () => {
      const agrupamento = agrupamentoSelect.value;
      const safra = safraSelect.value;
      const dataInicial = dataInicialInput.value;
      const dataFinal = dataFinalInput.value;
  
      if (!agrupamento || !safra || !dataInicial || !dataFinal) {
        alert('Preencha todos os filtros.');
        return;
      }
  
      try {
        const res = await fetch('http://localhost:5000/api/relatorios/margem-contribuicao', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ agrupamento, safra, data_inicial: dataInicial, data_final: dataFinal })
        });
  
        const dados = await res.json();
        console.log('📦 Dados recebidos:', dados);
        renderizarTabela(dados, agrupamento);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        alert('Erro ao carregar relatório.');
      }
    });
  
    async function carregarSafras() {
      try {
        const res = await fetch('http://localhost:5000/api/safras', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const lista = await res.json();
        safraSelect.innerHTML = '<option value="">Selecione</option>';
        lista.forEach(safra => {
          safraSelect.innerHTML += `<option value="${safra.id}">${safra.nome_safra}</option>`;
        });
      } catch (err) {
        console.error('Erro ao carregar safras:', err);
      }
    }
  
    function renderizarTabela(dados, agrupamento) {
        const nomeCampo = {
          produto: 'Produto',
          talhao: 'Talhão',
          propriedade: 'Propriedade'
        }[agrupamento] || 'Item';
      
        colunaAgrupamento.textContent = nomeCampo;
      
        console.log('👀 Dados para montar tabela:', dados);
        alert('Registros recebidos: ' + dados.length);
      
        if (!dados || !dados.length) {
          tabelaResultados.innerHTML = `<tr><td colspan="6">Nenhum resultado encontrado.</td></tr>`;
          return;
        }
      
        let receitaTotal = 0, custoTotal = 0, despesaTotal = 0, mcTotal = 0;
      
        const linhas = dados.map(item => {
          const nome = item.nome || '-';
          const receita = parseFloat(item.receita_liquida) || 0;
          const custo = parseFloat(item.custos_variaveis) || 0;
          const despesa = parseFloat(item.despesas_variaveis) || 0;
          const mc = receita - custo - despesa;
          const perc = receita > 0 ? (mc / receita * 100) : 0;
      
          receitaTotal += receita;
          custoTotal += custo;
          despesaTotal += despesa;
          mcTotal += mc;
      
          return `
            <tr>
              <td>${nome}</td>
              <td>R$ ${formatarMoeda(receita)}</td>
              <td>R$ ${formatarMoeda(custo)}</td>
              <td>R$ ${formatarMoeda(despesa)}</td>
              <td>R$ ${formatarMoeda(mc)}</td>
              <td>${formatarMoeda(perc)}%</td>
            </tr>
          `;
        }).join('');
      
        tabelaResultados.innerHTML = linhas;
      
        totalReceita.textContent = 'R$ ' + formatarMoeda(receitaTotal);
        totalCustos.textContent = 'R$ ' + formatarMoeda(custoTotal);
        totalDespesas.textContent = 'R$ ' + formatarMoeda(despesaTotal);
        totalMc.textContent = 'R$ ' + formatarMoeda(mcTotal);
        totalMcPercentual.textContent = receitaTotal > 0
          ? (mcTotal / receitaTotal * 100).toFixed(2) + '%'
          : '0%';
      }      
  
    function formatarMoeda(valor) {
      return parseFloat(valor).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  });
  