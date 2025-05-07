document.addEventListener('DOMContentLoaded', () => {

  const token = localStorage.getItem('token');

  // 🔐 Verifica se o usuário está autenticado
  if (!token) {
      // Se não estiver, redireciona para login
      window.location.href = "/frontend/login.html";
      return; // Evita continuar executando o resto
  }

    const form = document.getElementById('form-cliente');
    const lista = document.getElementById('lista-clientes');
    const campoBusca = document.getElementById('busca-cliente');
  
    carregarClientes();
    atualizarTipoCliente(form.tipo_cliente);
    preencherUFs();
    preencherTiposEndereco();
    aplicarMascaras();
    configurarBuscaCEP();
  
    form.tipo_cliente.addEventListener('change', function () {
      atualizarTipoCliente(this);
    });
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
    
      // Limpa erros visuais anteriores
      form.querySelectorAll('.erro').forEach(el => el.classList.remove('erro'));
    
      const tipo = form.tipo_cliente.value;
      const nomeFantasia = form.nome_fantasia.value.trim();
      const razaoSocial = form.razao_social.value.trim();
      const cnpj = form.cnpj?.value?.trim() || '';
      const cpf = form.cpf?.value?.trim() || '';
    
      let camposInvalidos = [];
    
      if (tipo === 'juridica') {
        if (!nomeFantasia) camposInvalidos.push('nome_fantasia');
        if (!razaoSocial) camposInvalidos.push('razao_social');
        if (!cnpj) camposInvalidos.push('cnpj');
        else if (!validarCNPJ(cnpj)) {
          alert('CNPJ inválido.');
          form.cnpj.classList.add('erro');
          return;
        }
      }
    
      if (tipo === 'fisica') {
        if (!nomeFantasia) camposInvalidos.push('nome_fantasia');
        if (!cpf) camposInvalidos.push('cpf');
        else if (!validarCPF(cpf)) {
          alert('CPF inválido.');
          form.cpf.classList.add('erro');
          return;
        }
      }
    
      if (camposInvalidos.length > 0) {
        console.warn('Campos obrigatórios ausentes:', camposInvalidos);
        camposInvalidos.forEach(nome => {
          const campo = form.elements[nome];
          if (campo) campo.classList.add('erro');
        });
        alert('Preencha todos os campos obrigatórios: ' + camposInvalidos.join(', '));
        return;
      }
    
      const dados = Object.fromEntries(new FormData(form));
    
      try {
        const id = form.id.value;
        const url = id ? `http://localhost:5000/api/clientes/${id}` : 'http://localhost:5000/api/clientes/';
        const method = id ? 'PUT' : 'POST';
    
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(dados),
        });
    
        if (!response.ok) {
          const erro = await response.json();
          throw new Error(erro?.erro || 'Erro ao salvar cliente.');
        }
    
        alert('Cliente salvo com sucesso!');
        form.reset();
        form.id.value = '';
        carregarClientes();
        atualizarTipoCliente(form.tipo_cliente);
        aplicarMascaras();
      } catch (err) {
        alert(err.message);
      }
    });
    
    
  
    campoBusca.addEventListener('input', () => {
      const termo = campoBusca.value.toLowerCase();
      document.querySelectorAll('.lista-item').forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(termo) ? 'table-row' : 'none';
      });
    });
  
    async function carregarClientes() {
      const lista = document.getElementById('lista-clientes');
    
      try {
        const res = await fetch('http://localhost:5000/api/clientes/', {
          headers: {
            'Authorization': 'Bearer ' + token
          }
        });
    
        const clientes = await res.json();
        lista.innerHTML = '';
    
        if (!clientes.length) {
          lista.innerHTML = '<tr><td colspan="5">Nenhum cliente encontrado.</td></tr>';
          return;
        }
    
        clientes.forEach(cliente => {
          const linha = document.createElement('tr');
          linha.innerHTML = `
            <td>${cliente.nome_fantasia || ''}</td>
            <td>${cliente.razao_social || ''}</td>
            <td>${cliente.cnpj || cliente.cpf || ''}</td>
            <td>${cliente.email || ''}</td>
            <td>
              <button onclick="editarCliente('${cliente.id}')" title="Editar">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="excluirCliente('${cliente.id}')" title="Excluir">
                <i class="fas fa-trash-alt"></i>
              </button>
            </td>
          `;
          lista.appendChild(linha);
        });
      } catch (err) {
        console.error('Erro ao carregar clientes:', err);
        lista.innerHTML = '<tr><td colspan="5" style="color: red;">Erro ao carregar clientes.</td></tr>';
      }
    }
    
    
    
    
  
    window.editarCliente = async (id) => {
      try {
        const res = await fetch(`http://localhost:5000/api/clientes/${id}`, {
          headers: {
            'Authorization': 'Bearer ' + token
          }
        });
        
        const cliente = await res.json();
        for (const campo in cliente) {
          if (form.elements[campo]) form.elements[campo].value = cliente[campo];
        }
        atualizarTipoCliente(form.tipo_cliente);
        aplicarMascaras();
        window.scrollTo({ top: form.offsetTop - 100, behavior: 'smooth' });
      } catch (err) {
        alert('Erro ao carregar cliente para edição.');
      }
    };
  
    window.excluirCliente = async (id) => {
      if (!confirm('Deseja excluir este cliente?')) return;
      try {
        const res = await fetch(`http://localhost:5000/api/clientes/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer ' + token
          }
        });
        
        if (!res.ok) throw new Error('Erro ao excluir cliente.');
        alert('Cliente excluído com sucesso!');
        carregarClientes();
      } catch (err) {
        alert(err.message);
      }
    };
  
    function atualizarTipoCliente(select) {
      const tipo = select.value;
    
      const dadosJuridica = document.getElementById('dados-juridica');
      const dadosFisica = document.getElementById('dados-fisica');
    
      const mostrarJuridica = tipo === 'juridica';
      const mostrarFisica = tipo === 'fisica';
    
      dadosJuridica.style.display = mostrarJuridica ? '' : 'none';
      dadosFisica.style.display = mostrarFisica ? '' : 'none';
    
      [...dadosJuridica.querySelectorAll('input')].forEach(input => {
        input.disabled = !mostrarJuridica;
        input.required = mostrarJuridica;
      });
    
      [...dadosFisica.querySelectorAll('input')].forEach(input => {
        input.disabled = !mostrarFisica;
        input.required = mostrarFisica;
      });
    
      const labelNomeFantasia = document.getElementById('label-nome-fantasia');
      if (labelNomeFantasia) {
        labelNomeFantasia.textContent = tipo === 'juridica' ? 'Nome Fantasia' : 'Nome Completo';
      }
    }
    
    
    
  
  
    function aplicarMascaras() {
      if (typeof $ !== 'undefined') {
        $('input[name="cnpj"]').mask('00.000.000/0000-00');
        $('input[name="cpf"]').mask('000.000.000-00');
        $('input[name="telefone"]').mask('(00) 0000-0000');
        $('input[name="celular"]').mask('(00) 00000-0000');
        $('input[name="cep"]').mask('00000-000');
      }
    }
  
    function configurarBuscaCEP() {
      if (typeof $ !== 'undefined') {
        $('input[name="cep"]').on('blur', async function () {
          const cep = $(this).val().replace(/\D/g, '');
          if (cep.length !== 8) return;
          try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const dados = await res.json();
            if (dados.erro) throw new Error('CEP não encontrado.');
            form.logradouro.value = dados.logradouro || '';
            form.bairro.value = dados.bairro || '';
            form.cidade.value = dados.localidade || '';
            form.uf.value = dados.uf || '';
          } catch (err) {
            alert('Erro ao buscar CEP.');
          }
        });
      }
    }
  
    function preencherUFs() {
      const uf = form.uf;
      const estados = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
        'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS',
        'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
      estados.forEach(sigla => {
        const option = document.createElement('option');
        option.value = sigla;
        option.textContent = sigla;
        uf.appendChild(option);
      });
    }
  
    function preencherTiposEndereco() {
      const tipoEndereco = form.tipo_endereco;
      ['Residencial', 'Comercial', 'Rural', 'Outro'].forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
        tipoEndereco.appendChild(option);
      });
    }
  
    function validarCNPJ(cnpj) {
      cnpj = cnpj.replace(/[^\d]+/g, '');
      if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
      let t = cnpj.length - 2, n = cnpj.substring(0, t), d = cnpj.substring(t), s = 0, p = t - 7;
      for (let i = t; i >= 1; i--) { s += n.charAt(t - i) * p--; if (p < 2) p = 9; }
      let r = s % 11 < 2 ? 0 : 11 - s % 11;
      if (r != d.charAt(0)) return false;
      t += 1; n = cnpj.substring(0, t); s = 0; p = t - 7;
      for (let i = t; i >= 1; i--) { s += n.charAt(t - i) * p--; if (p < 2) p = 9; }
      r = s % 11 < 2 ? 0 : 11 - s % 11;
      return r == d.charAt(1);
    }
  
    function validarCPF(cpf) {
      cpf = cpf.replace(/[^\d]+/g, '');
      if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
      let s = 0, r;
      for (let i = 1; i <= 9; i++) s += parseInt(cpf[i - 1]) * (11 - i);
      r = (s * 10) % 11;
      if (r === 10 || r === 11) r = 0;
      if (r !== parseInt(cpf[9])) return false;
      s = 0;
      for (let i = 1; i <= 10; i++) s += parseInt(cpf[i - 1]) * (12 - i);
      r = (s * 10) % 11;
      if (r === 10 || r === 11) r = 0;
      return r === parseInt(cpf[10]);
    }
  });
  