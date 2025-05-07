document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = "/frontend/login.html";
    return;
  }

  const form = document.getElementById('form-produto');
  const lista = document.getElementById('lista-produtos');
  const busca = document.getElementById('busca-produto');

  carregarProdutos();

  ['nome_produto', 'peso'].forEach(campo => {
    form[campo].addEventListener('input', atualizarNomeFinal);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dados = Object.fromEntries(new FormData(form));

    // 🔧 Limpeza de campos numéricos
    dados.preco = parseFloat(dados.preco || 0);
    dados.nome_final = form.nome_final.value;

    const id = form.querySelector('[name="id"]').value;
    const url = id
      ? `http://localhost:5000/api/produtos/${id}`
      : `http://localhost:5000/api/produtos/`;
    const method = id ? 'PUT' : 'POST';

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
        console.error('Erro ao salvar:', resposta);
        return alert('Erro ao salvar produto: ' + (resposta?.erro || res.status));
      }

      alert('Produto salvo com sucesso!');
      form.reset();
      form.querySelector('[name="id"]').value = '';
      carregarProdutos();
    } catch (err) {
      alert('Erro inesperado ao salvar produto.');
    }
  });

  async function carregarProdutos() {
    try {
      const res = await fetch('http://localhost:5000/api/produtos/', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // ← Certifique-se que `token` está correto
        }
        
      });

      const produtos = await res.json();

      lista.innerHTML = produtos.map(produto => `
        <tr>
          <td>${produto.nome_final || ''}</td>
          <td>${produto.unidade_medida || ''}</td>
          <td>${produto.peso || ''}</td>
          <td>R$ ${parseFloat(produto.preco || 0).toFixed(2)}</td>
          <td>
            <button onclick="editarProduto('${produto.id}')"><i class="fas fa-edit"></i></button>
            <button onclick="excluirProduto('${produto.id}')"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      alert('Erro ao carregar produtos.');
    }
  }

  window.editarProduto = async function (id) {
    try {
      const res = await fetch(`http://localhost:5000/api/produtos/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // ← Certifique-se que `token` está correto
        }
        
      });

      const produto = await res.json();
      Object.keys(produto).forEach(key => {
        if (form.elements[key]) {
          form.elements[key].value = produto[key];
        }
      });
      atualizarNomeFinal();
      window.scrollTo({ top: form.offsetTop, behavior: 'smooth' });
    } catch (err) {
      alert('Erro ao carregar produto para edição.');
    }
  };

  window.excluirProduto = async function (id) {
    if (!confirm('Deseja excluir este produto?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/produtos/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // ← Certifique-se que `token` está correto
        }
        
      });

      if (!res.ok) throw new Error('Erro ao excluir produto.');
      carregarProdutos();
    } catch (err) {
      alert(err.message);
    }
  };

  busca.addEventListener('input', async () => {
    const termo = busca.value.toLowerCase();

    const res = await fetch('http://localhost:5000/api/produtos/', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // ← Certifique-se que `token` está correto
      }      
    });

    const produtos = await res.json();

    const filtrados = produtos.filter(p =>
      (p.nome_final || '').toLowerCase().includes(termo)
    );

    lista.innerHTML = filtrados.map(produto => `
      <tr>
        <td>${produto.nome_final || ''}</td>
        <td>${produto.unidade_medida || ''}</td>
        <td>${produto.peso || ''}</td>
        <td>R$ ${parseFloat(produto.preco || 0).toFixed(2)}</td>
        <td>
          <button onclick="editarProduto('${produto.id}')"><i class="fas fa-edit"></i></button>
          <button onclick="excluirProduto('${produto.id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  });

  function atualizarNomeFinal() {
    const nome = form.nome_produto.value.trim();
    const peso = form.peso.value.trim();

    if (nome && peso) {
      form.nome_final.value = `${nome} - ${peso.toUpperCase()}KG`;
    } else {
      form.nome_final.value = '';
    }
  }
});
