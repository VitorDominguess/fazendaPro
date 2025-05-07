document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = "/frontend/login.html";
    return;
  }

  const form = document.getElementById('form-centro-custo');
  const lista = document.getElementById('lista-centros-custo');
  const campoBusca = document.getElementById('busca-centro-custo');
  const selectPai = document.getElementById('centro_custo_pai');

  const API_URL = 'http://127.0.0.1:5000/api/centros-custo';

  carregarCentrosCusto();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = form.nome.value.trim();
    if (!nome) {
      alert('Preencha o nome do centro de custo.');
      return;
    }

    const dados = Object.fromEntries(new FormData(form));
    const id = form.id.value;
    delete dados.id;

    const url = id ? `${API_URL}/${id}` : API_URL;
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(dados)
      });

      if (!res.ok) {
        const erro = await res.json();
        throw new Error(erro?.erro || 'Erro ao salvar centro de custo.');
      }

      alert('Centro de custo salvo com sucesso!');
      form.reset();
      form.id.value = '';
      await carregarCentrosCusto();

    } catch (err) {
      alert(err.message);
    }
  });

  campoBusca.addEventListener('input', () => {
    const termo = campoBusca.value.toLowerCase();
    document.querySelectorAll('.lista-centro-item').forEach(item => {
      item.style.display = item.textContent.toLowerCase().includes(termo) ? '' : 'none';
    });
  });

  async function carregarCentrosCusto() {
    try {
      const res = await fetch(API_URL, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (!res.ok) throw new Error('Erro ao carregar dados');

      const centros = await res.json();

      lista.innerHTML = centros.map(c => `
        <tr class="lista-centro-item">
          <td>${c.nome}</td>
          <td>${getNomePai(centros, c.centro_custo_pai)}</td>
          <td>
            <button onclick="editarCentroCusto('${c.id}')" title="Editar"><i class="fas fa-edit"></i></button>
            <button onclick="excluirCentroCusto('${c.id}')" title="Excluir"><i class="fas fa-trash-alt"></i></button>
          </td>
        </tr>
      `).join('');

      selectPai.innerHTML = `<option value="">Nenhum (Centro principal)</option>` +
        centros
          .filter(c => !c.centro_custo_pai)
          .map(c => `<option value="${c.id}">${c.nome}</option>`)
          .join('');
    } catch (err) {
      lista.innerHTML = `<tr><td colspan="3" style="color:red;">Erro ao carregar centros de custo.</td></tr>`;
    }
  }

  function getNomePai(centros, idPai) {
    const pai = centros.find(c => c.id === idPai);
    return pai ? pai.nome : '-';
  }

  window.excluirCentroCusto = async function (id) {
    if (!confirm('Deseja realmente excluir este centro de custo?')) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (!res.ok) {
        const erro = await res.json();
        throw new Error(erro?.erro || 'Erro ao excluir centro de custo.');
      }

      alert('Centro de custo excluído com sucesso!');
      await carregarCentrosCusto();
    } catch (err) {
      alert(err.message);
    }
  };

  window.editarCentroCusto = async function (id) {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (!res.ok) throw new Error('Erro ao carregar centro de custo.');

      const centro = await res.json();

      for (const campo in centro) {
        if (form.elements[campo]) {
          form.elements[campo].value = centro[campo];
        }
      }

      window.scrollTo({ top: form.offsetTop - 100, behavior: 'smooth' });
    } catch (err) {
      alert(err.message);
    }
  };
});
