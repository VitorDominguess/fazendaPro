document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = "/frontend/login.html";
    return;
  }

  const API = 'http://localhost:5000/api/depara';
  const form = document.getElementById('form-depara');
  const lista = document.getElementById('lista-depara');
  const dreSelect = form.querySelector('[name="dre"]');
  const categoriaPrincipalSelect = form.querySelector('[name="categoria_principal"]');
  const contaContabilSelect = form.querySelector('[name="conta_contabil"]');

  preencherSelectsFixos();
  carregarContasContabeis();
  carregarLista();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dados = Object.fromEntries(new FormData(form));
    const id = dados.id;
    delete dados.id;

    const url = id ? `${API}/${id}` : API;
    const metodo = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dados)
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      alert('Salvo com sucesso!');
      form.reset();
      form.querySelector('[name="id"]').value = '';
      carregarLista();
    } catch (err) {
      alert(err.message);
    }
  });

  window.editar = async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao buscar item');
      const dados = await res.json();
      for (let campo in dados) {
        if (form.elements[campo]) form.elements[campo].value = dados[campo];
      }
      window.scrollTo({ top: form.offsetTop - 50, behavior: 'smooth' });
    } catch (err) {
      alert(err.message);
    }
  };

  window.excluir = async (id) => {
    if (!confirm('Confirma exclusão?')) return;
    try {
      await fetch(`${API}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      carregarLista();
    } catch (err) {
      alert('Erro ao excluir');
    }
  };

  async function carregarLista() {
    if (!lista) return;
    try {
      const res = await fetch(API, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const dados = await res.json();

      lista.innerHTML = dados.map(d => `
        <tr>
          <td>${d.categoria}</td>
          <td>${d.tipo_movimentacao}</td>
          <td>${d.conta_contabil}</td>
          <td>${d.dre}</td>
          <td>${d.categoria_principal}</td>
          <td>${d.subcategoria}</td>
          <td>
            <button onclick="editar(${d.id})" title="Editar">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="excluir(${d.id})" title="Excluir">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    } catch {
      lista.innerHTML = '<tr><td colspan="7" style="color:red;">Erro ao carregar dados do De/Para.</td></tr>';
    }
  }

  function preencherSelectsFixos() {
    const dres = [
      'Receita Líquida',
      'CPV / CMV',
      'DCV',
      'DGA',
      'IR & CSLL',
      'Depreciação',
      'Resultado Financeiro'
    ];

    const categorias = [
      'Entradas',
      'Operacionais',
      'Despesas Comerciais',
      'Despesas Gerais e Administrativas',
      'Pessoal / Encargos',
      'Impostos'
    ];

    dreSelect.innerHTML = dres.map(d => `<option value="${d}">${d}</option>`).join('');
    categoriaPrincipalSelect.innerHTML = categorias.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  async function carregarContasContabeis() {
    try {
      const res = await fetch('http://localhost:5000/api/plano-contas/codigos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const contas = await res.json();
      contaContabilSelect.innerHTML = contas.map(c => `<option value="${c}">${c}</option>`).join('');
    } catch (e) {
      contaContabilSelect.innerHTML = '<option disabled>Erro ao carregar contas</option>';
    }
  }
});
