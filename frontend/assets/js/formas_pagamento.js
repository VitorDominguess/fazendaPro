
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = "/frontend/login.html";
        return;
    }

    const form = document.getElementById('form-forma-pagamento');
    const lista = document.getElementById('lista-formas');
    const campoBusca = document.getElementById('busca-forma');

    const API_URL = 'http://127.0.0.1:5000/api/formas-pagamento';

    carregarFormas();

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
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(dados)
            });

            if (!res.ok) throw new Error('Erro ao salvar');

            alert('Salvo com sucesso!');
            form.reset();
            form.querySelector('input[name="id"]').value = '';
            await carregarFormas();
        } catch (err) {
            alert(err.message);
        }
    });

    async function carregarFormas() {
        try {
            const res = await fetch(API_URL, {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (!res.ok) throw new Error('Erro ao buscar dados');
            const formas = await res.json();

            lista.innerHTML = formas.map(f => `
                <tr>
                    <td>${f.nome}</td>
                    <td>${f.situacao}</td>
                    <td>
                        <button onclick="editarForma('${f.id}')"><i class="fas fa-edit"></i></button>
                        <button onclick="excluirForma('${f.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            lista.innerHTML = '<tr><td colspan="3">Erro ao carregar formas.</td></tr>';
        }
    }

    window.editarForma = async (id) => {
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (!res.ok) throw new Error('Erro ao buscar a forma');
            const forma = await res.json();

            for (let campo in forma) {
                if (form.elements[campo]) {
                    form.elements[campo].value = forma[campo];
                }
            }

            window.scrollTo({ top: form.offsetTop - 100, behavior: 'smooth' });
        } catch (err) {
            alert('Erro ao carregar dados');
        }
    };

    window.excluirForma = async (id) => {
        if (!confirm('Deseja excluir esta forma de pagamento?')) return;

        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (!res.ok) throw new Error('Erro ao excluir');
            await carregarFormas();
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
