document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = "/frontend/login.html";
        return;
    }

    const tabela = document.getElementById('tabela-fluxo-anual');
    const anoSelect = document.getElementById('ano');
    const contaSelect = document.getElementById('conta');
    const propriedadeSelect = document.getElementById('propriedade');
    const talhaoSelect = document.getElementById('talhao');
    const aplicarFiltrosBtn = document.getElementById('btn-aplicar');
    const containerTabela = document.getElementById('container-tabela');

    aplicarFiltrosBtn.addEventListener('click', montarTabela);
    propriedadeSelect.addEventListener('change', carregarTalhoes);

    carregarFiltros();
    preencherAno();
    montarTabela();

    function preencherAno() {
        const anoAtual = new Date().getFullYear();
        for (let ano = anoAtual - 5; ano <= anoAtual + 1; ano++) {
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            if (ano === anoAtual) option.selected = true;
            anoSelect.appendChild(option);
        }
    }

    async function carregarFiltros() {
        try {
            const [contasRes, propriedadesRes] = await Promise.all([
                fetch('http://localhost:5000/api/contas-bancarias', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('http://localhost:5000/api/propriedades', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const contas = await contasRes.json();
            const propriedades = await propriedadesRes.json();

            contas.forEach(conta => {
                const option = document.createElement('option');
                option.value = conta.id;
                option.textContent = conta.nome_banco;
                contaSelect.appendChild(option);
            });

            propriedades.forEach(prop => {
                const option = document.createElement('option');
                option.value = prop.id;
                option.textContent = prop.nome_propriedade;
                propriedadeSelect.appendChild(option);
            });

            if (propriedades.length > 0) {
                propriedadeSelect.value = propriedades[0].id;
                await carregarTalhoes();
            }
        } catch (err) {
            console.error('Erro ao carregar filtros:', err);
        }
    }

    async function carregarTalhoes() {
        const propriedadeId = propriedadeSelect.value;
        talhaoSelect.innerHTML = '<option value="todos">Todos os talhões</option>';

        if (!propriedadeId || propriedadeId === 'todas') return;

        try {
            const res = await fetch(`http://localhost:5000/api/talhoes?propriedade_id=${propriedadeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const talhoes = await res.json();

            talhoes.forEach(t => {
                const option = document.createElement('option');
                option.value = t.id;
                option.textContent = t.nome_talhao || t.nome;
                talhaoSelect.appendChild(option);
            });
        } catch (err) {
            console.error('Erro ao carregar talhões:', err);
        }
    }

    async function montarTabela() {
        containerTabela.classList.add('carregando');

        const params = new URLSearchParams({
            ano: anoSelect.value,
            conta: contaSelect.value,
            propriedade: propriedadeSelect.value,
            talhao: talhaoSelect.value
        });

        try {
            const res = await fetch(`http://localhost:5000/api/fluxo-anual/?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Erro ao buscar dados');

            const data = await res.json();
            const resumo = data.resumo;
            const tbody = tabela.querySelector('tbody');
            tbody.innerHTML = '';

            function montarLinha(titulo, valoresArray, classe = '', tipo = '', indent = 0) {
                const tr = document.createElement('tr');
                if (classe) classe.split(' ').forEach(cls => tr.classList.add(cls));

                const tdTitulo = document.createElement('td');
                tdTitulo.textContent = `${'↳'.repeat(indent)} ${titulo}`;
                tdTitulo.className = 'coluna-fixa th-fixada indent-' + indent;
                tr.appendChild(tdTitulo);

                let total = 0;
                for (let i = 0; i < 12; i++) {
                    const td = document.createElement('td');
                    const valor = valoresArray[i] || 0;
                    td.textContent = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    if (tipo === 'entrada') td.classList.add('entrada');
                    if (tipo === 'saida') td.classList.add('saida');
                    total += valor;
                    tr.appendChild(td);
                }

                const tdTotal = document.createElement('td');
                tdTotal.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                if (tipo === 'entrada') tdTotal.classList.add('entrada');
                if (tipo === 'saida') tdTotal.classList.add('saida');
                tr.appendChild(tdTotal);

                return tr;
            }

            const tipos = data.tipos || [];
            const categorias = data.categorias || [];
            const subcategorias = data.subcategorias || [];

            tipos.forEach(tipoObj => {
                const tipo = tipoObj.tipo_movimentacao;
                tbody.appendChild(montarLinha(tipo === 'Entrada' ? 'Receita' : 'Despesa', tipoObj.valores, 'categoria-principal', tipo === 'Entrada' ? 'entrada' : 'saida', 0));

                categorias.filter(c => c.tipo_movimentacao === tipo).forEach(cat => {
                    tbody.appendChild(montarLinha(cat.categoria_principal, cat.valores, 'categoria-intermediaria', tipo === 'Entrada' ? 'entrada' : 'saida', 1));

                    subcategorias.filter(s => s.tipo_movimentacao === tipo && s.categoria_principal === cat.categoria_principal).forEach(sub => {
                        tbody.appendChild(montarLinha(sub.subcategoria, sub.valores, 'subcategoria', tipo === 'Entrada' ? 'entrada' : 'saida', 2));
                    });
                });
            });

            tbody.appendChild(montarLinha('(-) Capex', resumo.capex, 'categoria-principal', 'saida'));
            tbody.appendChild(montarLinha('(-) Despesas Financeiras', resumo.despesas_financeiras, 'categoria-principal', 'saida'));
            tbody.appendChild(montarLinha('(+) Receitas Financeiras', resumo.receitas_financeiras, 'categoria-principal', 'entrada'));
            tbody.appendChild(montarLinha('Geração Líquida de Caixa', resumo.geracao_liquida, 'categoria-principal'));

            const saldoInicial = resumo.saldo_inicial || 0;
            const trSaldoInicial = document.createElement('tr');
            trSaldoInicial.classList.add('categoria-principal', 'linha-saldo-inicial');
            const tdSI = document.createElement('td');
            tdSI.textContent = 'Saldo Inicial de Caixa';
            tdSI.className = 'coluna-fixa th-fixada';
            trSaldoInicial.appendChild(tdSI);

            let acumulado = saldoInicial;
            for (let i = 0; i < 12; i++) {
                const td = document.createElement('td');
                td.textContent = acumulado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                acumulado += (resumo.geracao_liquida[i] || 0);
                trSaldoInicial.appendChild(td);
            }

            const tdTotalSI = document.createElement('td');
            tdTotalSI.textContent = saldoInicial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            trSaldoInicial.appendChild(tdTotalSI);
            tbody.appendChild(trSaldoInicial);

            const trSaldoFinal = document.createElement('tr');
            trSaldoFinal.classList.add('categoria-principal', 'linha-saldo-final');
            const tdSF = document.createElement('td');
            tdSF.textContent = 'Saldo Final de Caixa';
            tdSF.className = 'coluna-fixa th-fixada';
            trSaldoFinal.appendChild(tdSF);

            let final = saldoInicial;
            for (let i = 0; i < 12; i++) {
                final += (resumo.geracao_liquida[i] || 0);
                const td = document.createElement('td');
                td.textContent = final.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                trSaldoFinal.appendChild(td);
            }

            const tdTotalSF = document.createElement('td');
            tdTotalSF.textContent = final.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            trSaldoFinal.appendChild(tdTotalSF);
            tbody.appendChild(trSaldoFinal);

        } catch (err) {
            console.error('Erro ao montar tabela:', err);
        } finally {
            containerTabela.classList.remove('carregando');
        }
    }
});
