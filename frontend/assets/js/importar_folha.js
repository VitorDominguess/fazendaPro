document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = "/frontend/login.html";
    return;
  }

  const inputArquivo = document.getElementById('arquivo-folha');
  const btnImportar = document.getElementById('btnImportar');
  const btnSalvar = document.getElementById('btnSalvar');
  const tabela = document.getElementById('tabela-folha');
  const lblValorTotal = document.getElementById('valor-total');

  let dadosFolha = [];
  let valorTotal = 0;

  btnImportar.addEventListener('click', async () => {
    if (!inputArquivo.files.length) {
      alert('Selecione uma planilha para importar.');
      return;
    }

    const file = inputArquivo.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets['Resumo'];
      if (!sheet) {
        alert('A planilha precisa ter uma aba chamada "Resumo".');
        return;
      }

      const linhas = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      dadosFolha = [];
      tabela.innerHTML = '';
      valorTotal = 0;
      let hoje = new Date().toISOString().split('T')[0];

      for (let i = 2; i < linhas.length; i++) {
        const linha = linhas[i];
        const descricao = (linha[1] || 'Sem descrição').toString().trim();
        const provento = limparNumero(linha[3]);
        const imposto = limparNumero(linha[4]);

        if (provento > 0) {
          tabela.innerHTML += criarLinhaHTML(hoje, 'Provento', descricao, provento);
          dadosFolha.push({ tipo: 'Provento', descricao, valor: provento });
          valorTotal += provento;
        }
        if (imposto > 0) {
          tabela.innerHTML += criarLinhaHTML(hoje, 'Imposto', descricao, imposto);
          dadosFolha.push({ tipo: 'Imposto', descricao, valor: imposto });
          valorTotal += imposto;
        }
      }

      lblValorTotal.textContent = `Valor Total: R$ ${formatarMoeda(valorTotal)}`;
      btnSalvar.disabled = false;
    };

    reader.readAsArrayBuffer(file);
  });

  btnSalvar.addEventListener('click', async () => {
    if (!dadosFolha.length) {
      alert('Importe primeiro a folha.');
      return;
    }

    const payload = {
      data_importacao: new Date().toISOString().split('T')[0],
      valor_total: valorTotal,
      status: 'pendente',
      detalhes: dadosFolha
    };

    try {
      const res = await fetch('http://localhost:5000/api/folhas/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Erro ao salvar folha.');

      alert('Folha salva como pendente!');
      dadosFolha = [];
      tabela.innerHTML = '';
      lblValorTotal.textContent = 'Valor Total: R$ 0,00';
      btnSalvar.disabled = true;
    } catch (err) {
      alert(err.message);
    }
  });

  function limparNumero(valor) {
    if (!valor) return 0;
    if (typeof valor === 'number') return valor;
    return parseFloat(String(valor).replace(/\s/g, '').replace(/[R$]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
  }

  function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function criarLinhaHTML(data, tipo, descricao, valor) {
    return `
      <tr>
        <td>${data}</td>
        <td>${tipo}</td>
        <td>${descricao}</td>
        <td>R$ ${formatarMoeda(valor)}</td>
      </tr>
    `;
  }
});
