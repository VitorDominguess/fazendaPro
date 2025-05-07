let contasComSaldo = []; // armazenará os dados das contas com saldo

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('Token ausente. Redirecionando para login...');
    window.location.href = '/frontend/login.html';
    return;
  }

  const form = document.getElementById('form-transferencia');
  if (!form) {
    console.error('❌ Formulário com ID "form-transferencia" não encontrado.');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const contaOrigem = form.conta_origem.value;
    const contaDestino = form.conta_destino.value;
    const valor = parseFloat(form.valor.value.replace(',', '.'));
    const data = form.data_transferencia.value;

    // 🔎 Validações
    if (contaOrigem === contaDestino) {
      alert('⚠️ A conta de origem não pode ser igual à conta de destino.');
      return;
    }

    if (isNaN(valor) || valor <= 0) {
      alert('⚠️ Informe um valor válido para a transferência.');
      return;
    }

    const contaOrigemObj = contasComSaldo.find(c => c.id === contaOrigem);
    if (!contaOrigemObj) {
      alert('⚠️ Conta de origem inválida.');
      return;
    }

    if (valor > contaOrigemObj.saldo_atual) {
      alert(`⚠️ O valor excede o saldo da conta origem (Saldo: R$ ${contaOrigemObj.saldo_atual.toFixed(2)})`);
      return;
    }

    if (!data || isNaN(new Date(data))) {
      alert('⚠️ Informe uma data de transferência válida.');
      return;
    }

    const dados = {
      conta_origem: contaOrigem,
      conta_destino: contaDestino,
      valor,
      data_transferencia: data,
      observacoes: form.observacoes.value || ''
    };

    try {
      const res = await fetch('http://localhost:5000/api/transferencias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dados)
      });

      const resposta = await res.json(); // Captura resposta mesmo em erro

      if (!res.ok) {
        throw new Error(resposta.erro || 'Erro desconhecido ao salvar a transferência');
      }

      alert('✅ Transferência registrada com sucesso!');
      form.reset();
    } catch (err) {
      console.error('❌ Erro ao registrar transferência:', err);
      alert(err.message);  // Mostra mensagem clara como: "Saldo insuficiente. Saldo atual: R$ -71048.88"
    }
  });

  carregarContas(token);
});

// 🔄 Carregar contas no dropdown e armazenar saldos
async function carregarContas(token) {
  const selects = document.querySelectorAll('select[name="conta_origem"], select[name="conta_destino"]');
  if (selects.length === 0) {
    console.warn('⚠️ Nenhum select encontrado com os nomes esperados.');
    return;
  }

  try {
    const res = await fetch('http://localhost:5000/api/contas-bancarias', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error('Falha ao buscar contas bancárias');

    const contas = await res.json();
    contasComSaldo = contas; // salva para uso posterior

    selects.forEach(select => {
      contas.forEach(conta => {
        const opt = document.createElement('option');
        opt.value = conta.id;
        opt.textContent = `${conta.nome_banco} - ${conta.agencia}/${conta.conta_corrente}`;
        select.appendChild(opt);
      });
    });
  } catch (err) {
    console.error('❌ Erro ao carregar contas:', err);
  }
}
