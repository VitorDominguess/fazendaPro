document.addEventListener('DOMContentLoaded', () => {

  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = "/frontend/login.html";
    return;
  }

  const form = document.getElementById('form-conta-bancaria');
  const lista = document.getElementById('lista-contas');
  const selectEmpresa = document.getElementById('select-empresa');

  carregarEmpresas();
  carregarContas();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dados = Object.fromEntries(new FormData(form));

    // 🧪 LOG do valor original
    console.log('📤 FormData original:', dados);

    if (!dados.empresa_id) dados.empresa_id = null;
    if (dados.saldo_inicial) dados.saldo_inicial = parseFloat(dados.saldo_inicial);
    else dados.saldo_inicial = 0;

    // 🧪 LOG dos dados tratados
    console.log('📦 Dados a serem enviados no fetch:', dados);

    const id = form.querySelector('[name="id"]').value;
    const method = id ? 'PUT' : 'POST';
    const url = id
      ? 'http://localhost:5000/api/contas-bancarias/' + id
      : 'http://localhost:5000/api/contas-bancarias/';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dados),
      });

      const resposta = await res.json();

      if (!res.ok) {
        console.error('❌ Erro ao salvar (resposta Supabase):', resposta);
        alert('Erro ao salvar: ' + (resposta?.erro || res.status));
        return;
      }

      alert('Conta salva com sucesso!');
      form.reset();
      form.querySelector('[name="id"]').value = '';
      carregarContas();

    } catch (err) {
      console.error('❌ Erro inesperado no fetch:', err);
      alert('Erro inesperado ao salvar');
    }
  });

  async function carregarEmpresas() {
    try {
      const res = await fetch('http://localhost:5000/api/propriedades/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const empresas = await res.json();

      // 🧪 LOG das empresas carregadas
      console.log('🏢 Empresas carregadas:', empresas);

      selectEmpresa.innerHTML = '<option value="">Selecione a empresa</option>' +
        empresas.map(e => `<option value="${e.id}">${e.nome_propriedade}</option>`).join('');
    } catch (e) {
      console.error('Erro ao carregar empresas', e);
    }
  }

  async function carregarContas() {
    try {
      const res = await fetch('http://localhost:5000/api/contas-bancarias/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const contas = await res.json();

      if (!Array.isArray(contas)) {
        console.error('Erro ao carregar contas:', contas);
        alert('Erro ao carregar contas bancárias. Verifique o token ou backend.');
        return;
      }

      lista.innerHTML = contas.map(c => `
        <tr>
          <td>${c.nome_empresa}</td>
          <td>${c.nome_banco}</td>
          <td>${c.agencia}</td>
          <td>${c.conta_corrente}</td>
          <td>R$${parseFloat(c.saldo_inicial || 0).toFixed(2)}</td>
          <td>
            <button onclick="editarConta('${c.id}')"><i class="fas fa-edit"></i></button>
            <button onclick="excluirConta('${c.id}')"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      console.error('Erro ao buscar contas bancárias:', e);
      alert('Erro ao buscar contas bancárias.');
    }
  }

  window.editarConta = async (id) => {
    const res = await fetch('http://localhost:5000/api/contas-bancarias/' + id, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const conta = await res.json();
    Object.keys(conta).forEach(k => {
      if (form.elements[k]) form.elements[k].value = conta[k];
    });
    form.scrollIntoView({ behavior: 'smooth' });
  };

  window.excluirConta = async (id) => {
    if (!confirm('Deseja excluir esta conta?')) return;
    const res = await fetch('http://localhost:5000/api/contas-bancarias/' + id, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      carregarContas();
    } else {
      alert('Erro ao excluir');
    }
  };
});
