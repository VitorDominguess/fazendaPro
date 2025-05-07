// === FORNECEDORES FRONTEND INTEGRADO COM SUPABASE ===

function atualizarTipo(select) {
  const tipo = select.value;
  const form = document.getElementById('form-fornecedor');
  form.classList.remove('fornecedor-juridica', 'fornecedor-fisica');
  form.classList.add(`fornecedor-${tipo}`);

  const camposJuridica = ['cnpj', 'razao_social', 'ie'];
  const camposFisica = ['cpf', 'rg', 'data_nascimento'];

  camposJuridica.forEach(campo => {
    const el = form.elements[campo];
    if (el) {
      if (tipo === 'juridica') el.setAttribute('required', 'required');
      else {
        el.removeAttribute('required');
        el.value = '';
      }
    }
  });

  camposFisica.forEach(campo => {
    const el = form.elements[campo];
    if (el) {
      if (tipo === 'fisica') el.setAttribute('required', 'required');
      else {
        el.removeAttribute('required');
        el.value = '';
      }
    }
  });

  const labelNome = document.getElementById('label-nome-fantasia');
  if (labelNome) labelNome.textContent = tipo === 'juridica' ? 'Nome Fantasia' : 'Nome Completo';
}

function validarCNPJ(cnpj) {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  let tamanho = cnpj.length - 2, numeros = cnpj.substring(0, tamanho), digitos = cnpj.substring(tamanho), soma = 0, pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != digitos.charAt(0)) return false;
  tamanho++;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  return resultado == digitos.charAt(1);
}

function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let soma = 0, resto;
  for (let i = 1; i <= 9; i++) soma += parseInt(cpf[i - 1]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf[9])) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf[i - 1]) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf[10]);
}

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = "/frontend/login.html";
    return;
  }

  const form = document.getElementById('form-fornecedor');
  const lista = document.getElementById('lista-fornecedores');
  const campoBusca = document.getElementById('busca-fornecedor');

  carregarFornecedores();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const tipo = form.tipo_fornecedor.value;
    const dados = Object.fromEntries(new FormData(form));
  
    // ⚠️ Converte strings vazias para null
    Object.keys(dados).forEach(k => {
      if (dados[k] === '') dados[k] = null;
    });
  
    if (tipo === 'juridica' && !validarCNPJ(dados.cnpj)) {
      alert('CNPJ inválido');
      return;
    }
  
    if (tipo === 'fisica' && !validarCPF(dados.cpf)) {
      alert('CPF inválido');
      return;
    }
  
    const id = form.id.value;
    const url = id
      ? `http://localhost:5000/api/fornecedores/${id}`
      : 'http://localhost:5000/api/fornecedores/';
    const method = id ? 'PUT' : 'POST';
  
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dados),
      });
  
      const resp = await response.json();
  
      if (!response.ok) {
        console.error('❌ Erro ao salvar:', resp);
        alert('Erro ao salvar fornecedor: ' + (resp.erro || response.status));
        return;
      }
  
      alert('Fornecedor salvo com sucesso!');
      form.reset();
      atualizarTipo(form.tipo_fornecedor);
      carregarFornecedores();
      form.id.value = '';
    } catch (err) {
      alert(err.message);
    }
  });
  

  campoBusca.addEventListener('input', () => {
    const termo = campoBusca.value.toLowerCase();
    document.querySelectorAll('.lista-item').forEach(item => {
      item.style.display = item.textContent.toLowerCase().includes(termo) ? 'block' : 'none';
    });
  });

  $(() => {
    $('input[name="cnpj"]').mask('00.000.000/0000-00');
    $('input[name="cpf"]').mask('000.000.000-00');
    $('input[name="telefone"]').mask('(00) 0000-0000');
    $('input[name="celular"]').mask('(00) 00000-0000');
    $('input[name="cep"]').mask('00000-000');
  });

  $('input[name="cep"]').on('blur', async function () {
    const cep = $(this).val().replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const dados = await res.json();
      if (dados.erro) throw new Error('CEP não encontrado');
      const form = document.getElementById('form-fornecedor');
      form.logradouro.value = dados.logradouro || '';
      form.bairro.value = dados.bairro || '';
      form.cidade.value = dados.localidade || '';
      form.uf.value = dados.uf || '';
    } catch (err) {
      alert('Erro ao buscar CEP');
    }
  });

  atualizarTipo(document.querySelector('select[name="tipo_fornecedor"]'));
});

async function carregarFornecedores() {
  const lista = document.getElementById('lista-fornecedores');
  const token = localStorage.getItem('token');
  try {
    const res = await fetch('http://localhost:5000/api/fornecedores/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const fornecedores = await res.json();
    lista.innerHTML = fornecedores.map(f => `
      <tr>
        <td>${f.nome_fantasia}</td>
        <td>${f.razao_social}</td>
        <td>${f.cnpj}</td>
        <td>${f.email || ''}</td>
        <td>
          <button onclick="editarFornecedor('${f.id}')" title="Editar"><i class="fas fa-edit"></i></button>
          <button onclick="excluirFornecedor('${f.id}')" title="Excluir"><i class="fas fa-trash-alt"></i></button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    lista.innerHTML = `<tr><td colspan="5" style="color:red;">Erro ao carregar fornecedores.</td></tr>`;
  }
}

async function excluirFornecedor(id) {
  const token = localStorage.getItem('token');
  if (!confirm('Deseja realmente excluir este fornecedor?')) return;
  try {
    const res = await fetch(`http://localhost:5000/api/fornecedores/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      alert('Fornecedor excluído com sucesso!');
      carregarFornecedores();
    } else {
      throw new Error('Erro ao excluir fornecedor.');
    }
  } catch (err) {
    alert(err.message);
  }
}

async function editarFornecedor(id) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`http://localhost:5000/api/fornecedores/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const fornecedor = await res.json();
    const form = document.getElementById('form-fornecedor');
    for (const campo in fornecedor) {
      const el = form.elements[campo];
      if (el) el.value = fornecedor[campo];
    }
    atualizarTipo(form.tipo_fornecedor);
    window.scrollTo({ top: form.offsetTop - 100, behavior: 'smooth' });
  } catch (err) {
    alert('Erro ao carregar fornecedor para edição.');
  }
}
