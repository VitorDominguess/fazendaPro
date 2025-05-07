document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = "/frontend/login.html";
        return;
    }

    const form = document.getElementById('form-propriedade');
    const lista = document.getElementById('lista-propriedades');
    const campoBusca = document.getElementById('busca-propriedade');

    carregarPropriedades();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = form.querySelector('input[name="nome_propriedade"]').value.trim();

        if (!nome) {
            alert('Preencha o nome da propriedade.');
            return;
        }

        const dados = { nome_propriedade: nome };

        try {
            const id = form.querySelector('input[name="id"]').value;
            const url = id
                ? `http://localhost:5000/api/propriedades/${id}`
                : 'http://localhost:5000/api/propriedades/';
            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dados),
            });

            if (!response.ok) throw new Error('Erro ao salvar propriedade.');

            alert('Propriedade salva com sucesso!');
            form.reset();
            form.querySelector('input[name="id"]').value = '';
            carregarPropriedades();
        } catch (err) {
            alert(err.message);
        }
    });

    async function carregarPropriedades() {
        try {
            const res = await fetch('http://localhost:5000/api/propriedades/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const propriedades = await res.json();

            lista.innerHTML = propriedades.map(prop => `
                <tr>
                    <td>${prop.nome_propriedade}</td>
                    <td>
                        <button onclick="editarPropriedade('${prop.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                        <button onclick="excluirPropriedade('${prop.id}')" title="Excluir"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            lista.innerHTML = `<tr><td colspan="2" style="color:red;">Erro ao carregar propriedades.</td></tr>`;
        }
    }

    window.editarPropriedade = async function (id) {
        try {
            const res = await fetch(`http://localhost:5000/api/propriedades/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const propriedade = await res.json();

            form.elements['nome_propriedade'].value = propriedade.nome_propriedade;
            form.elements['id'].value = propriedade.id;

            window.scrollTo({ top: form.offsetTop - 100, behavior: 'smooth' });
        } catch (err) {
            alert('Erro ao carregar propriedade para edição.');
        }
    };

    window.excluirPropriedade = async function (id) {
        if (!confirm('Deseja excluir esta propriedade?')) return;

        try {
            const res = await fetch(`http://localhost:5000/api/propriedades/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error('Erro ao excluir propriedade.');

            alert('Propriedade excluída com sucesso!');
            carregarPropriedades();
        } catch (err) {
            alert(err.message);
        }
    };

    campoBusca.addEventListener('input', function () {
        const filtro = campoBusca.value.toLowerCase();
        Array.from(lista.rows).forEach(row => {
            const nome = row.cells[0].textContent.toLowerCase();
            row.style.display = nome.includes(filtro) ? '' : 'none';
        });
    });
});
