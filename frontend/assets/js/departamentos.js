document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = "/frontend/login.html";
        return;
    }

    const form = document.getElementById('form-departamento');
    const lista = document.getElementById('lista-departamentos');
    const campoBusca = document.getElementById('busca-departamento');

    carregarDepartamentos();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nomeInput = form.querySelector('input[name="nome_departamento"]');
        const nome = nomeInput ? nomeInput.value.trim() : '';

        if (!nome) {
            alert('Preencha o nome do departamento.');
            return;
        }

        const dados = { nome };
        const id = form.querySelector('input[name="id"]').value;
        const url = id
            ? `http://localhost:5000/api/departamentos/${id}`
            : 'http://localhost:5000/api/departamentos/';
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

            const resultado = await response.json();

            if (!response.ok) {
                console.error('Erro ao salvar departamento:', resultado);
                throw new Error(resultado?.erro || 'Erro desconhecido.');
            }

            alert('Departamento salvo com sucesso!');
            form.reset();
            form.querySelector('input[name="id"]').value = '';
            carregarDepartamentos();
        } catch (err) {
            alert(err.message);
        }
    });

    async function carregarDepartamentos() {
        if (!lista) return;

        try {
            const res = await fetch('http://localhost:5000/api/departamentos/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const departamentos = await res.json();

            lista.innerHTML = departamentos.map(dep => `
                <tr>
                    <td>${dep.nome}</td>
                    <td>
                        <button onclick="editarDepartamento('${dep.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                        <button onclick="excluirDepartamento('${dep.id}')" title="Excluir"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            lista.innerHTML = `<tr><td colspan="2" style="color:red;">Erro ao carregar departamentos.</td></tr>`;
        }
    }

    window.editarDepartamento = async function (id) {
        try {
            const res = await fetch(`http://localhost:5000/api/departamentos/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const departamento = await res.json();

            form.elements['nome_departamento'].value = departamento.nome;
            form.elements['id'].value = departamento.id;

            window.scrollTo({ top: form.offsetTop - 100, behavior: 'smooth' });
        } catch (err) {
            alert('Erro ao carregar departamento para edição.');
        }
    };

    window.excluirDepartamento = async function (id) {
        if (!confirm('Deseja excluir este departamento?')) return;

        try {
            const res = await fetch(`http://localhost:5000/api/departamentos/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Erro ao excluir departamento.');

            alert('Departamento excluído com sucesso!');
            carregarDepartamentos();
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
