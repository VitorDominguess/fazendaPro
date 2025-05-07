document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        redirecionarParaLogin();
        return;
    }

    const form = document.getElementById('form-safra');
    const lista = document.getElementById('lista-safras');
    const campoBusca = document.getElementById('busca-safra');

    carregarSafras();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const dados = Object.fromEntries(new FormData(form));

        function converterMesAnoParaData(str) {
            if (!str || !str.includes('-')) return null;
            const [ano, mes] = str.split('-');
            return `${ano}-${mes}-01`;
        }

        if (!dados.nome_safra || !dados.inicio_safra || !dados.fim_safra) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }

        dados.inicio_safra = converterMesAnoParaData(dados.inicio_safra);
        dados.fim_safra = converterMesAnoParaData(dados.fim_safra);

        const id = form.querySelector('input[name="id"]').value;
        const url = id
            ? `http://localhost:5000/api/safras/${id}`
            : 'http://localhost:5000/api/safras/';
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

            if (response.status === 401) return redirecionarParaLogin();

            const resposta = await response.json();

            if (!response.ok) throw new Error(resposta?.erro || 'Erro ao salvar safra.');

            alert('Safra salva com sucesso!');
            form.reset();
            form.querySelector('input[name="id"]').value = '';
            carregarSafras();
        } catch (err) {
            alert(err.message);
        }
    });

    async function carregarSafras() {
        try {
            const res = await fetch('http://localhost:5000/api/safras/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) return redirecionarParaLogin();

            const safras = await res.json();

            lista.innerHTML = safras.map(safra => `
                <tr>
                    <td>${safra.nome_safra}</td>
                    <td>${formatarDataVisual(safra.inicio_safra)}</td>
                    <td>${formatarDataVisual(safra.fim_safra)}</td>
                    <td>
                        <button onclick="editarSafra('${safra.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                        ${safra.ativo
                            ? `<button onclick="excluirSafra('${safra.id}')" title="Excluir"><i class="fas fa-trash-alt"></i></button>`
                            : `<button onclick="reativarSafra('${safra.id}')" title="Reativar"><i class="fas fa-undo"></i></button>`
                        }
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            lista.innerHTML = `<tr><td colspan="4" style="color:red;">Erro ao carregar safras.</td></tr>`;
        }
    }

    window.reativarSafra = async function (id) {
        if (!confirm('Deseja reativar esta safra?')) return;

        try {
            const res = await fetch(`http://localhost:5000/api/safras/${id}/reativar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) return redirecionarParaLogin();
            if (!res.ok) throw new Error('Erro ao reativar safra.');

            alert('Safra reativada com sucesso!');
            carregarSafras();
        } catch (err) {
            alert(err.message);
        }
    };

    window.editarSafra = async function (id) {
        try {
            const res = await fetch(`http://localhost:5000/api/safras/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) return redirecionarParaLogin();

            const safra = await res.json();

            form.elements['id'].value = safra.id;
            form.elements['nome_safra'].value = safra.nome_safra;
            form.elements['inicio_safra'].value = extrairAnoMes(safra.inicio_safra);
            form.elements['fim_safra'].value = extrairAnoMes(safra.fim_safra);

            window.scrollTo({ top: form.offsetTop - 100, behavior: 'smooth' });
        } catch (err) {
            alert('Erro ao carregar safra para edição.');
        }
    };

    window.excluirSafra = async function (id) {
        if (!confirm('Deseja excluir esta safra?')) return;

        try {
            const res = await fetch(`http://localhost:5000/api/safras/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) return redirecionarParaLogin();
            if (!res.ok) throw new Error('Erro ao excluir safra.');

            alert('Safra excluída com sucesso!');
            carregarSafras();
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

    function formatarDataVisual(dataISO) {
        if (!dataISO || !dataISO.includes('-')) return '';
        const [ano, mes] = dataISO.split('-');
        return `${mes}/${ano}`;
    }

    function extrairAnoMes(dataCompleta) {
        if (!dataCompleta || !dataCompleta.includes('-')) return '';
        const [ano, mes] = dataCompleta.split('-');
        return `${ano}-${mes}`;
    }

    function redirecionarParaLogin() {
        localStorage.removeItem('token');
        window.location.href = '/frontend/login.html';
    }
});
