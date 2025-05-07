document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = "/frontend/login.html";
        return;
    }

    const tabelaFluxoCaixa = document.getElementById('tabela-fluxo-caixa');
    const anoSelect = document.getElementById('ano');
    const mesSelect = document.getElementById('mes');
    const contaSelect = document.getElementById('conta');
    const propriedadeSelect = document.getElementById('propriedade');
    const talhaoSelect = document.getElementById('talhao');
    const aplicarFiltrosBtn = document.getElementById('btn-aplicar');

    aplicarFiltrosBtn.addEventListener('click', montarTabelaDepara);
    propriedadeSelect.addEventListener('change', carregarTalhoes);

    carregarFiltros();
    preencherAnoMes();
    montarCabecalhoDias();
    montarTabelaDepara();

    function preencherAnoMes() {
        const dataAtual = new Date();
        const anoAtual = dataAtual.getFullYear();
        const mesAtual = dataAtual.getMonth() + 1;

        for (let ano = anoAtual - 5; ano <= anoAtual + 1; ano++) {
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            if (ano === anoAtual) option.selected = true;
            anoSelect.appendChild(option);
        }

        mesSelect.value = mesAtual;
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

            propriedades.forEach(propriedade => {
                const option = document.createElement('option');
                option.value = propriedade.id;
                option.textContent = propriedade.nome_propriedade;
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

    async function buscarValoresFluxo() {
        const params = new URLSearchParams({
            ano: anoSelect.value,
            mes: mesSelect.value,
            conta: contaSelect.value,
            propriedade: propriedadeSelect.value,
            talhao: talhaoSelect.value
        });

        const res = await fetch(`http://localhost:5000/api/fluxo-diario/?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` },
            method: 'GET',
            mode: 'cors'
        });
        

        if (!res.ok) {
            console.error('Erro ao buscar valores de fluxo');
            return [];
        }

        return await res.json();
    }

    function montarCabecalhoDias() {
        const thead = tabelaFluxoCaixa.querySelector('thead');
        thead.innerHTML = '';
        const tr = document.createElement('tr');
        const thCategoria = document.createElement('th');
        thCategoria.textContent = 'Categoria';
        thCategoria.className = 'coluna-fixa th-fixada';
        tr.appendChild(thCategoria);

        const dataAtual = new Date();
        const ano = dataAtual.getFullYear();
        const mes = dataAtual.getMonth();
        const diasNoMes = new Date(ano, mes + 1, 0).getDate();

        for (let dia = 1; dia <= diasNoMes; dia++) {
            const th = document.createElement('th');
            th.textContent = dia;
            tr.appendChild(th);
        }

        const thTotal = document.createElement('th');
        thTotal.textContent = 'Total';
        tr.appendChild(thTotal);

        thead.appendChild(tr);
    }

    async function montarTabelaDepara() {
        document.getElementById('loading-fluxo').style.display = 'block';
        document.querySelector('.tabela-container').style.display = 'none';

        try {
            const params = new URLSearchParams({
                ano: anoSelect.value,
                mes: mesSelect.value,
                conta: contaSelect.value,
                propriedade: propriedadeSelect.value,
                talhao: talhaoSelect.value
            });
    
            const [deparaRes, valoresRes] = await Promise.all([
                fetch(`http://localhost:5000/api/depara?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`http://localhost:5000/api/fluxo-diario/?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
    
            if (!deparaRes.ok || !valoresRes.ok) throw new Error('Erro ao buscar dados');
    
            const categorias = await deparaRes.json();
            const valores = await valoresRes.json();
    
            const agrupado = { Entrada: {}, Saída: {} };
    
            categorias.forEach(c => {
                const tipo = c.tipo_movimentacao === 'Entrada' ? 'Entrada' : 'Saída';
                const principal = c.categoria_principal;
                const sub = c.subcategoria;
    
                if (!agrupado[tipo]) agrupado[tipo] = {};
                if (!agrupado[tipo][principal]) agrupado[tipo][principal] = new Set();
    
                if (sub) agrupado[tipo][principal].add(sub);
            });
    
            const tbody = tabelaFluxoCaixa.querySelector('tbody');
            tbody.innerHTML = '';
    
            const ano = parseInt(anoSelect.value);
            const mes = parseInt(mesSelect.value);
            const diasNoMes = new Date(ano, mes, 0).getDate();
    
            function obterValores(tipo, principal = null, sub = null) {
                if (sub !== null) {
                    const item = valores.subcategorias.find(v =>
                        v.tipo_movimentacao === tipo &&
                        v.categoria_principal === principal &&
                        v.subcategoria === sub
                    );
                    return item ? item.valores : [];
                } else if (principal !== null) {
                    const item = valores.categorias.find(v =>
                        v.tipo_movimentacao === tipo &&
                        v.categoria_principal === principal
                    );
                    return item ? item.valores : [];
                } else {
                    const item = valores.tipos.find(v =>
                        v.tipo_movimentacao === tipo
                    );
                    return item ? item.valores : [];
                }
            }
    
            function montarLinha(titulo, valoresArray, classe = '', indent = 0, tipo = 'Entrada') {
                const tr = document.createElement('tr');
                tr.classList.add(classe);tr.classList.add(classe);
                if (indent === 1) tr.classList.add('linha-categoria');// aplica para categorias principais
                
                const td = document.createElement('td');
                td.textContent = `${'↳'.repeat(indent)} ${titulo}`;
                td.className = 'coluna-fixa th-fixada indent-' + indent;
                tr.appendChild(td);
    
                let total = 0;
                for (let i = 0; i < diasNoMes; i++) {
                    const tdDia = document.createElement('td');
                    const valor = valoresArray[i] || 0;
                    tdDia.textContent = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    tdDia.classList.add(tipo === 'Entrada' ? 'entrada' : 'Saída');
                    tr.appendChild(tdDia);
                    total += valor;
                }
    
                const tdTotal = document.createElement('td');
                tdTotal.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                tdTotal.classList.add(tipo === 'Entrada' ? 'entrada' : 'Saída');
                tr.appendChild(tdTotal);
    
                return tr;
            }
    
            const ordemTipos = ['Entrada', 'Saída'];
    
            ordemTipos.forEach(tipo => {
                const tipoLabel = tipo === 'Entrada' ? 'Receita' : 'Despesa';
                const linhaTipo = montarLinha(tipoLabel, obterValores(tipo), 'categoria-principal', 0, tipo);
                tbody.appendChild(linhaTipo);
    
                const categorias = agrupado[tipo];
                for (const principal in categorias) {
                    const linhaCat = montarLinha(principal, obterValores(tipo, principal), 'subcategoria', 1, tipo);
                    tbody.appendChild(linhaCat);
    
                    categorias[principal].forEach(sub => {
                        const linhaSub = montarLinha(sub, obterValores(tipo, principal, sub), 'subcategoria', 2, tipo);
                        tbody.appendChild(linhaSub);
                    });
                }
            });
    
            // === Linhas Finais Dinâmicas ===
            const resumo = valores.resumo;
    
            function montarLinhaResumo(label, dadosArray, tipo = 'neutro') {
                const tr = document.createElement('tr');
                tr.classList.add('categoria-principal');
    
                const tdTitulo = document.createElement('td');
                tdTitulo.textContent = label;
                tdTitulo.className = 'coluna-fixa th-fixada';
                tr.appendChild(tdTitulo);
    
                let total = 0;
                for (let i = 0; i < diasNoMes; i++) {
                    const td = document.createElement('td');
                    const valor = dadosArray[i] || 0;
                    total += valor;
                    td.textContent = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    if (tipo === 'entrada') td.classList.add('entrada');
                    if (tipo === 'Saída') td.classList.add('Saída');
                    tr.appendChild(td);
                }
    
                const tdTotal = document.createElement('td');
                tdTotal.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                if (tipo === 'entrada') tdTotal.classList.add('entrada');
                if (tipo === 'Saída') tdTotal.classList.add('Saída');
                tr.appendChild(tdTotal);
    
                return tr;
            }
    
            tbody.appendChild(montarLinhaResumo('(-) Capex', resumo.capex, 'Saída'));
            tbody.appendChild(montarLinhaResumo('(-) Despesas Financeiras', resumo.despesas_financeiras, 'Saída'));
            tbody.appendChild(montarLinhaResumo('(+) Receitas Financeiras', resumo.receitas_financeiras, 'entrada'));
            tbody.appendChild(montarLinhaResumo('Geração Líquida de Caixa', resumo.geracao_liquida));
    
            // Saldo Inicial Diário
            const trSaldoInicial = document.createElement('tr');
            trSaldoInicial.classList.add('categoria-principal', 'linha-saldo-inicial');
            const tdSI = document.createElement('td');
            tdSI.textContent = 'Saldo Inicial de Caixa';
            tdSI.className = 'coluna-fixa th-fixada';
            trSaldoInicial.appendChild(tdSI);
    
            let saldoFinalDiaAnterior = Number(resumo.saldo_inicial);
            for (let i = 0; i < diasNoMes; i++) {
                const td = document.createElement('td');
                td.textContent = saldoFinalDiaAnterior.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                trSaldoInicial.appendChild(td);
                saldoFinalDiaAnterior += (resumo.geracao_liquida[i] || 0);
            }
    
            const tdTotalSI = document.createElement('td');
            tdTotalSI.textContent = Number(resumo.saldo_inicial).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            trSaldoInicial.appendChild(tdTotalSI);
            tbody.appendChild(trSaldoInicial);
    
            // Saldo Final Diário
            const trSaldoFinal = document.createElement('tr');
            trSaldoFinal.classList.add('categoria-principal', 'linha-saldo-final');
            const tdSF = document.createElement('td');
            tdSF.textContent = 'Saldo Final de Caixa';
            tdSF.className = 'coluna-fixa th-fixada';
            trSaldoFinal.appendChild(tdSF);
    
            let saldoFinal = Number(resumo.saldo_inicial);
            for (let i = 0; i < diasNoMes; i++) {
                saldoFinal += (resumo.geracao_liquida[i] || 0);
                const td = document.createElement('td');
                td.textContent = saldoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                trSaldoFinal.appendChild(td);
            }
    
            const tdTotalSF = document.createElement('td');
            tdTotalSF.textContent = saldoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            trSaldoFinal.appendChild(tdTotalSF);
            tbody.appendChild(trSaldoFinal);

            document.getElementById('loading-fluxo').style.display = 'none';
            document.querySelector('.tabela-container').style.display = 'block';

    
        } catch (err) {
            console.error('Erro ao montar tabela com dados do depara e valores:', err);
        }
    }
        
});
