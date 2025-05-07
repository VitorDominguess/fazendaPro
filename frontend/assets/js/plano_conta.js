document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = "/frontend/login.html";
    return;
  }

  const API = 'http://localhost:5000/api/plano-contas';
  const form = document.getElementById('form-plano-conta');
  const lista = document.getElementById('lista-planos');
  const busca = document.getElementById('busca-plano');

  carregarPlanos();

  form.querySelectorAll('input[name^="codigo"]').forEach(input => {
    input.addEventListener('input', montarCodigoCompleto);
  });

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

      if (!res.ok) throw new Error('Erro ao salvar plano.');
      alert('Plano salvo com sucesso!');
      form.reset();
      form.querySelector('[name="id"]').value = '';
      carregarPlanos();
    } catch (err) {
      alert(err.message);
    }
  });

  async function carregarPlanos() {
    try {
      const res = await fetch(API, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const planos = await res.json();
      lista.innerHTML = planos.map(plano => `
        <tr>
          <td>${plano.codigo_completo}</td>
          <td>${plano.descricao1 || ''}</td>
          <td>${plano.descricao2 || ''}</td>
          <td>${plano.descricao3 || ''}</td>
          <td>${plano.descricao4 || ''}</td>
          <td>
            <button onclick="editarPlano(${plano.id})"><i class="fas fa-edit"></i></button>
            <button onclick="excluirPlano(${plano.id})"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `).join('');
    } catch {
      lista.innerHTML = '<tr><td colspan="6" style="color:red;">Erro ao carregar planos.</td></tr>';
    }
  }

  window.editarPlano = async function (id) {
    try {
      const res = await fetch(`${API}/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const plano = await res.json();
      Object.keys(plano).forEach(key => {
        if (form.elements[key]) form.elements[key].value = plano[key];
      });
      montarCodigoCompleto();
      window.scrollTo({ top: form.offsetTop, behavior: 'smooth' });
    } catch {
      alert('Erro ao carregar plano para edição.');
    }
  };

  window.excluirPlano = async function (id) {
    if (!confirm('Deseja excluir este plano de contas?')) return;
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) carregarPlanos();
      else throw new Error();
    } catch {
      alert('Erro ao excluir');
    }
  };

  busca.addEventListener('input', async () => {
    const termo = busca.value.toLowerCase();
    try {
      const res = await fetch(API, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const planos = await res.json();
      const filtrados = planos.filter(p =>
        (p.codigo_completo || '').toLowerCase().includes(termo) ||
        (p.descricao1 || '').toLowerCase().includes(termo) ||
        (p.descricao2 || '').toLowerCase().includes(termo) ||
        (p.descricao3 || '').toLowerCase().includes(termo) ||
        (p.descricao4 || '').toLowerCase().includes(termo)
      );
      lista.innerHTML = filtrados.map(plano => `
        <tr>
          <td>${plano.codigo_completo}</td>
          <td>${plano.descricao1 || ''}</td>
          <td>${plano.descricao2 || ''}</td>
          <td>${plano.descricao3 || ''}</td>
          <td>${plano.descricao4 || ''}</td>
          <td>
            <button onclick="editarPlano(${plano.id})"><i class="fas fa-edit"></i></button>
            <button onclick="excluirPlano(${plano.id})"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `).join('');
    } catch {
      lista.innerHTML = '<tr><td colspan="6" style="color:red;">Erro ao filtrar planos.</td></tr>';
    }
  });

  function montarCodigoCompleto() {
    const partes = [];
    for (let i = 1; i <= 4; i++) {
      const input = form.querySelector(`[name="codigo${i}"]`);
      if (input && input.value.trim()) {
        partes.push(input.value.trim());
      }
    }    
    form.querySelector('[name="codigo_completo"]').value = partes.join('.');
  }
});
