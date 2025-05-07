document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    // 🔐 Verifica se o usuário está autenticado
    if (!token) {
        // Se não estiver, redireciona para login
        window.location.href = "/frontend/login.html";
        return; // Evita continuar executando o resto
    }
    const form = document.getElementById('form-tipo-documento');
    const lista = document.getElementById('lista-tipos');
    const campoBusca = document.getElementById('busca-tipo');

    const API_URL = 'http://127.0.0.1:5000/api/tipos-documento';

    carregarTipos();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dados = Object.fromEntries(new FormData(form));
        const id = dados.id;
        delete dados.id;

        const url = id ? `${API_URL}/${id}` : API_URL;
        const method = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')  // ✅ TOKEN AQUI
                },
                body: JSON.stringify(dados)
            });
            
            if (!res.ok) throw new Error('Erro ao salvar');
            alert('Salvo com sucesso!');
            form.reset();
            form.querySelector('input[name="id"]').value = '';
            carregarTipos();
        } catch (err) {
            alert(err.message);
        }
    });

    async function carregarTipos() {
        try {
            const res = await fetch(API_URL, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });
    
            if (!res.ok) {
                const erro = await res.json();
                throw new Error(erro?.erro || 'Erro ao buscar tipos de documento');
            }
    
            const tipos = await res.json();
    
            lista.innerHTML = tipos.map(t => `
                <tr>
                    <td>${t.nome}</td>
                    <td>${t.situacao}</td>
                    <td>
                        <button onclick="editarTipo('${t.id}')"><i class="fas fa-edit"></i></button>
                        <button onclick="excluirTipo('${t.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            console.error(err);
            lista.innerHTML = '<tr><td colspan="3">Erro ao carregar tipos.</td></tr>';
        }
    }
    

    window.editarTipo = async (id) => {
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });
            
            const tipo = await res.json();
            for (let campo in tipo) {
                if (form.elements[campo]) form.elements[campo].value = tipo[campo];
            }
            window.scrollTo({ top: form.offsetTop - 100, behavior: 'smooth' });
        } catch (err) {
            alert('Erro ao carregar dados');
        }
    };

    window.excluirTipo = async (id) => {
        if (!confirm('Excluir este tipo de documento?')) return;
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });
            
            
            if (!res.ok) throw new Error('Erro ao excluir');
            carregarTipos();
        } catch (err) {
            alert(err.message);
        }
    };

    campoBusca.addEventListener('input', () => {
        const termo = campoBusca.value.toLowerCase();
        const linhas = lista.querySelectorAll('tr');
        linhas.forEach(linha => {
            const nome = linha.children[0].textContent.toLowerCase();
            linha.style.display = nome.includes(termo) ? '' : 'none';
        });
    });
});
