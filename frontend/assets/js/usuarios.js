document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    // 🔐 Verifica se o usuário está autenticado
    if (!token) {
        window.location.href = "/frontend/login.html";
        return;
    }

    const form = document.getElementById('form-usuario');
    const listaUsuarios = document.getElementById('lista-usuarios');
    const buscaInput = document.getElementById('busca-usuario');
    const btnCancelar = document.querySelector('.btn-cancelar');
    const senhaInput = document.querySelector('input[name="senha"]');
    const confirmarSenhaInput = document.querySelector('input[name="confirmar_senha"]');

    // Feedback visual para senhas
    const senhaFeedback = document.createElement('small');
    senhaFeedback.style.display = 'block';
    senhaFeedback.style.marginTop = '5px';
    senhaInput.parentNode.appendChild(senhaFeedback);

    const confirmarFeedback = document.createElement('small');
    confirmarFeedback.style.display = 'block';
    confirmarFeedback.style.marginTop = '5px';
    confirmarSenhaInput.parentNode.appendChild(confirmarFeedback);

    function carregarUsuarios() {
        fetch('http://127.0.0.1:5000/usuarios/')
            .then(res => {
                if (!res.ok) throw new Error('Erro ao carregar usuários');
                return res.json();
            })
            .then(usuarios => {
                listaUsuarios.innerHTML = '';
                usuarios.forEach(usuario => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${usuario.nome}</td>
                        <td>${usuario.email}</td>
                        <td>${formatarPerfil(usuario.tipo)}</td>
                        <td>${formatarStatus(usuario.status)}</td>
                        <td class="acoes">
                            <button class="btn-editar" onclick="editarUsuario('${usuario.id}')">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn-excluir" onclick="excluirUsuario('${usuario.id}')">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                        </td>
                    `;
                    listaUsuarios.appendChild(tr);
                });
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao carregar usuários');
            });
    }

    function formatarPerfil(perfil) {
        const perfis = {
            'admin': 'Administrador',
            'gerente': 'Gerente',
            'analista': 'Analista',
            'assistente': 'Assistente'
        };
        return perfis[perfil] || perfil;
    }

    function formatarStatus(status) {
        return status === 'ativo'
            ? '<span class="status-ativo">Ativo</span>'
            : '<span class="status-inativo">Inativo</span>';
    }

    function validarSenhas() {
        const senha = senhaInput.value;
        const confirmacao = confirmarSenhaInput.value;

        senhaInput.style.borderColor = '';
        confirmarSenhaInput.style.borderColor = '';
        senhaFeedback.textContent = '';
        confirmarFeedback.textContent = '';

        if (senha && confirmacao) {
            if (senha !== confirmacao) {
                senhaInput.style.borderColor = '#ff4444';
                confirmarSenhaInput.style.borderColor = '#ff4444';
                confirmarFeedback.textContent = 'As senhas não coincidem';
                confirmarFeedback.style.color = '#ff4444';
                return false;
            } else {
                senhaInput.style.borderColor = '#00C851';
                confirmarSenhaInput.style.borderColor = '#00C851';
                confirmarFeedback.textContent = 'Senhas coincidem!';
                confirmarFeedback.style.color = '#00C851';
                return true;
            }
        }
        return null;
    }

    senhaInput.addEventListener('input', validarSenhas);
    confirmarSenhaInput.addEventListener('input', validarSenhas);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('usuario-id').value;
        const metodo = id ? 'PUT' : 'POST';
        const url = id ? `http://127.0.0.1:5000/usuarios/${id}` : `http://127.0.0.1:5000/usuarios/`;

        const senhaPreenchida = senhaInput.value.trim() !== '' || confirmarSenhaInput.value.trim() !== '';

        if (metodo === 'POST' || senhaPreenchida) {
            const validacaoSenhas = validarSenhas();
            if (validacaoSenhas === false) {
                alert('Por favor, corrija os erros nas senhas antes de enviar.');
                confirmarSenhaInput.focus();
                return;
            } else if (validacaoSenhas === null) {
                alert('Por favor, preencha ambos os campos de senha.');
                if (!senhaInput.value) senhaInput.focus();
                else confirmarSenhaInput.focus();
                return;
            }
        }

        const formData = new FormData(form);
        const dados = {
            nome: formData.get('nome'),
            email: formData.get('email'),
            perfil: formData.get('perfil'),
            situacao: formData.get('situacao')
        };

        if (senhaPreenchida) {
            dados.senha = formData.get('senha');
        }

        try {
            const response = await fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            if (!response.ok) {
                const erro = await response.json();
                throw new Error(erro.erro || 'Erro ao salvar usuário');
            }

            form.reset();
            document.getElementById('usuario-id').value = '';
            carregarUsuarios();
            alert('Usuário salvo com sucesso!');
        } catch (error) {
            console.error('Erro:', error);
            alert(error.message);
        }
    });

    btnCancelar.addEventListener('click', () => {
        form.reset();
        document.getElementById('usuario-id').value = '';
        senhaInput.style.borderColor = '';
        confirmarSenhaInput.style.borderColor = '';
        senhaFeedback.textContent = '';
        confirmarFeedback.textContent = '';
    });

    buscaInput.addEventListener('input', () => {
        const termo = buscaInput.value.toLowerCase();
        const linhas = listaUsuarios.querySelectorAll('tr');
        linhas.forEach(linha => {
            const texto = linha.textContent.toLowerCase();
            linha.style.display = texto.includes(termo) ? '' : 'none';
        });
    });

    window.editarUsuario = async function(id) {
        try {
            const response = await fetch(`http://127.0.0.1:5000/usuarios/${id}`);
            if (!response.ok) throw new Error('Erro ao carregar usuário');

            const usuario = await response.json();

            form.nome.value = usuario.nome;
            form.email.value = usuario.email;
            form.perfil.value = usuario.tipo;
            form.situacao.value = usuario.status;
            document.getElementById('usuario-id').value = usuario.id;

            form.senha.value = '';
            form.confirmar_senha.value = '';
            senhaInput.style.borderColor = '';
            confirmarSenhaInput.style.borderColor = '';
            senhaFeedback.textContent = '';
            confirmarFeedback.textContent = '';

            form.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao carregar usuário para edição');
        }
    };

    window.excluirUsuario = async function(id) {
        if (!confirm('Tem certeza que deseja excluir este usuário permanentemente?')) return;

        try {
            const response = await fetch(`http://127.0.0.1:5000/usuarios/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            const resultado = await response.json();

            if (!response.ok) {
                throw new Error(resultado.erro || 'Erro ao excluir usuário');
            }

            alert(resultado.mensagem || 'Usuário excluído com sucesso!');
            carregarUsuarios();
        } catch (error) {
            console.error('Erro na exclusão:', error);
            alert(error.message || 'Erro ao excluir usuário');
        }
    };

    carregarUsuarios();
});
