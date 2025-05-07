document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = "/frontend/login.html";
        return;
    }

    const form = document.getElementById('form-talhao');
    const lista = document.getElementById('lista-talhoes');
    const selectPropriedade = document.getElementById('select-propriedade');
    const campoBusca = document.getElementById('busca-talhao');

    carregarPropriedades();
    carregarTalhoes();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const dados = Object.fromEntries(new FormData(form));
        const id = form.querySelector('input[name="id"]').value;

        if (!dados.propriedade_id || !dados.nome_talhao) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }

        const url = id
            ? `http://localhost:5000/api/talhoes/${id}`
            : 'http://localhost:5000/api/talhoes/';
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
                console.error('❌ Erro:', resposta);
                alert('Erro ao salvar talhão: ' + (resposta?.erro || res.status));
                return;
            }

            alert('Talhão salvo com sucesso!');
            form.reset();
            form.querySelector('input[name="id"]').value = '';
            carregarTalhoes();
        } catch (err) {
            alert('Erro inesperado ao salvar talhão.');
        }
    });

    async function carregarPropriedades() {
        try {
            const res = await fetch('http://localhost:5000/api/propriedades/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const propriedades = await res.json();

            selectPropriedade.innerHTML = '<option value="">Selecione uma propriedade</option>';
            propriedades.forEach(prop => {
                const option = document.createElement('option');
                option.value = prop.id;
                option.textContent = prop.nome_propriedade;
                selectPropriedade.appendChild(option);
            });
        } catch (err) {
            console.error('Erro ao carregar propriedades:', err);
        }
    }

    async function carregarTalhoes() {
        try {
            const [resTalhoes, resPropriedades] = await Promise.all([
                fetch('http://localhost:5000/api/talhoes/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/propriedades/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const talhoes = await resTalhoes.json();
            const propriedades = await resPropriedades.json();

            lista.innerHTML = talhoes.map(t => {
                const propriedade = propriedades.find(p => p.id === t.propriedade_id);
                const nomePropriedade = propriedade ? propriedade.nome_propriedade : 'Desconhecida';

                return `
                    <tr>
                        <td>${nomePropriedade}</td>
                        <td>${t.nome_talhao}</td>
                        <td>
                            <button onclick="editarTalhao('${t.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                            <button onclick="excluirTalhao('${t.id}')" title="Excluir"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (err) {
            lista.innerHTML = `<tr><td colspan="3" style="color:red;">Erro ao carregar talhões.</td></tr>`;
        }
    }

    window.editarTalhao = async function (id) {
        try {
            const res = await fetch(`http://localhost:5000/api/talhoes/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const talhao = await res.json();

            form.elements['id'].value = talhao.id;
            form.elements['propriedade_id'].value = talhao.propriedade_id;
            form.elements['nome_talhao'].value = talhao.nome_talhao;

            window.scrollTo({ top: form.offsetTop - 100, behavior: 'smooth' });
        } catch (err) {
            alert('Erro ao carregar talhão para edição.');
        }
    };

    window.excluirTalhao = async function (id) {
        if (!confirm('Deseja excluir este talhão?')) return;

        try {
            const res = await fetch(`http://localhost:5000/api/talhoes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Erro ao excluir talhão.');

            alert('Talhão excluído com sucesso!');
            carregarTalhoes();
        } catch (err) {
            alert(err.message);
        }
    };

    campoBusca.addEventListener('input', function () {
        const filtro = campoBusca.value.toLowerCase();
        Array.from(lista.rows).forEach(row => {
            const nome = row.cells[1].textContent.toLowerCase();
            row.style.display = nome.includes(filtro) ? '' : 'none';
        });
    });
});
