// Inicializa Select2 para os filtros
$(document).ready(function() {
    $('.filter-select').select2({
        placeholder: "Selecione...",
        allowClear: true,
        width: 'resolve'
    });

    carregarFiltros();

    // Tab functionality
    $('.tab').on('click', function() {
        const tabId = $(this).data('tab');
        
        // Remove active class from all tabs and tab contents
        $('.tab').removeClass('active');
        $('.tab-content').removeClass('active');
        
        // Add active class to clicked tab and corresponding content
        $(this).addClass('active');
        $(`#${tabId}-tab`).addClass('active');
    });

    // Carrega os dados da API quando a página é carregada
    loadDashboardData();

    // Configura o evento de clique para o botão Aplicar Filtros
    $('.btn-apply').on('click', function() {
        loadDashboardData();
    });

    // Configura o evento de clique para o botão Limpar Filtros
    $('.btn-clear').on('click', function() {
        $('.filter-select').val(null).trigger('change');
        loadDashboardData();
    });
});

// Variáveis globais para armazenar os gráficos
let cashFlowChart, expensesByCategoryChart, revenueVsExpensesChart, bankBalanceChart;
let revenueByProductChart, costByPlotChart, marginByCropChart, expensesByDreChart;
let financialIndicatorsChart, cashProjectionChart;

function loadDashboardData() {
    // Obtém os valores dos filtros
    const periodo = $('#periodo').val();
    const categoria = $('#categoria').val();
    const produto = $('#produto').val();
    const safra = $('#safra').val();
    const talhao = $('#talhao').val();

    // Monta os parâmetros da requisição
    const params = new URLSearchParams();
    if (safra) safra.forEach(id => params.append('safra', id));
    if (talhao) talhao.forEach(id => params.append('talhao', id));
    if (categoria) categoria.forEach(id => params.append('categoria', id));
    if (produto) produto.forEach(id => params.append('produto', id));


    // Faz a requisição para a API
    fetch(`http://127.0.0.1:5000/api/movimentacoes/dashboard?${params.toString()}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao carregar dados do dashboard');
        }
        return response.json();
    })
    .then(data => {
        // Atualiza os cards de resumo
        updateSummaryCards(data.cards);
        
        // Atualiza os gráficos
        updateCharts(data);
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao carregar dados do dashboard');
    });
}

function updateSummaryCards(cardsData) {
    $('.card-value').eq(0).text(`R$ ${cardsData.totalGeral.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    $('.card-value').eq(1).text(`R$ ${cardsData.fertilizantes.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    $('.card-value').eq(2).text(`R$ ${cardsData.receitaLiquida.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    $('.card-value').eq(3).text(`${cardsData.margemContribuicao.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%`);
}

function updateCharts(data) {
    // Atualiza ou cria os gráficos com os dados da API
    updateCashFlowChart(data);
    updateExpensesByCategoryChart(data);
    updateRevenueVsExpensesChart(data);
    updateBankBalanceChart(data);
    updateRevenueByProductChart(data);
    updateCostByPlotChart(data);
    updateMarginByCropChart(data);
    updateExpensesByDreChart(data);
    updateFinancialIndicatorsChart(data);
    updateCashProjectionChart(data);
}

function updateCashFlowChart(data) {
    const ctx = document.getElementById('cashFlowChart').getContext('2d');
    
    if (cashFlowChart) {
        cashFlowChart.data.labels = data.datasFluxo;
        cashFlowChart.data.datasets[0].data = data.tabela[0].slice(1); // Entradas
        cashFlowChart.data.datasets[1].data = data.tabela[1].slice(1); // Saídas
        cashFlowChart.data.datasets[2].data = data.tabela[2].slice(1); // Saldo
        cashFlowChart.update();
    } else {
        cashFlowChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.datasFluxo,
                datasets: [
                    {
                        label: 'Entradas',
                        data: data.tabela[0].slice(1),
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        tension: 0.1
                    },
                    {
                        label: 'Saídas',
                        data: data.tabela[1].slice(1),
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 2,
                        tension: 0.1
                    },
                    {
                        label: 'Saldo',
                        data: data.tabela[2].slice(1),
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 2,
                        tension: 0.1
                    }
                ]
            },
            options: getDefaultLineChartOptions('Fluxo de Caixa')
        });
    }
}

function updateExpensesByCategoryChart(data) {
    const ctx = document.getElementById('expensesByCategoryChart').getContext('2d');
    const categories = Object.keys(data.categorias);
    const values = Object.values(data.categorias);
    
    if (expensesByCategoryChart) {
        expensesByCategoryChart.data.labels = categories;
        expensesByCategoryChart.data.datasets[0].data = values;
        expensesByCategoryChart.update();
    } else {
        expensesByCategoryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Gastos por Categoria',
                    data: values,
                    backgroundColor: getDefaultColors(categories.length, 0.7),
                    borderColor: getDefaultColors(categories.length, 1),
                    borderWidth: 1
                }]
            },
            options: getDefaultBarChartOptions('Gastos por Categoria')
        });
    }
}

function updateRevenueVsExpensesChart(data) {
    const ctx = document.getElementById('revenueVsExpensesChart').getContext('2d');
    
    if (revenueVsExpensesChart) {
        revenueVsExpensesChart.data.datasets[0].data = [data.comparativo.receita];
        revenueVsExpensesChart.data.datasets[1].data = [data.comparativo.despesa];
        revenueVsExpensesChart.update();
    } else {
        revenueVsExpensesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Comparativo'],
                datasets: [
                    {
                        label: 'Receitas',
                        data: [data.comparativo.receita],
                        backgroundColor: 'rgba(75, 192, 192, 0.7)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Despesas',
                        data: [data.comparativo.despesa],
                        backgroundColor: 'rgba(255, 99, 132, 0.7)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: getDefaultBarChartOptions('Comparativo Receitas vs Despesas')
        });
    }
}

function updateBankBalanceChart(data) {
    const ctx = document.getElementById('bankBalanceChart').getContext('2d');
    
    if (bankBalanceChart) {
        bankBalanceChart.data.labels = data.datasFluxo;
        bankBalanceChart.data.datasets[0].data = data.banco;
        bankBalanceChart.update();
    } else {
        bankBalanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.datasFluxo,
                datasets: [
                    {
                        label: 'Saldo Consolidado',
                        data: data.banco,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        tension: 0.1
                    }
                ]
            },
            options: getDefaultLineChartOptions('Evolução do Saldo Bancário')
        });
    }
}

function updateRevenueByProductChart(data) {
    const ctx = document.getElementById('revenueByProductChart').getContext('2d');
    const produtos = Object.keys(data.produtos);
    const valores = Object.values(data.produtos);
    
    if (revenueByProductChart) {
        revenueByProductChart.data.labels = produtos;
        revenueByProductChart.data.datasets[0].data = valores;
        revenueByProductChart.update();
    } else {
        revenueByProductChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: produtos,
                datasets: [{
                    label: 'Receita por Produto',
                    data: valores,
                    backgroundColor: getDefaultColors(produtos.length, 0.7),
                    borderColor: getDefaultColors(produtos.length, 1),
                    borderWidth: 1
                }]
            },
            options: getDefaultBarChartOptions('Receita por Produto')
        });
    }
}

function updateCostByPlotChart(data) {
    const ctx = document.getElementById('costByPlotChart').getContext('2d');
    const talhoes = Object.keys(data.talhoes);
    const valores = Object.values(data.talhoes);
    
    if (costByPlotChart) {
        costByPlotChart.data.labels = talhoes;
        costByPlotChart.data.datasets[0].data = valores;
        costByPlotChart.update();
    } else {
        costByPlotChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: talhoes,
                datasets: [{
                    label: 'Custo por Talhão',
                    data: valores,
                    backgroundColor: getDefaultColors(talhoes.length, 0.7),
                    borderColor: getDefaultColors(talhoes.length, 1),
                    borderWidth: 1
                }]
            },
            options: getDefaultBarChartOptions('Custo por Talhão')
        });
    }
}

function updateMarginByCropChart(data) {
    const ctx = document.getElementById('marginByCropChart').getContext('2d');
    // Supondo que temos dados de margem por cultura - ajuste conforme sua API
    const culturas = ['Laranja Pera', 'Laranja Bahia', 'Tangerina', 'Limão', 'Lichia'];
    const margens = [35, 28, 42, 25, 50]; // Exemplo - substitua pelos dados reais
    
    if (marginByCropChart) {
        marginByCropChart.data.labels = culturas;
        marginByCropChart.data.datasets[0].data = margens;
        marginByCropChart.update();
    } else {
        marginByCropChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: culturas,
                datasets: [{
                    label: 'Margem de Contribuição (%)',
                    data: margens,
                    backgroundColor: getDefaultColors(culturas.length, 0.7),
                    borderColor: getDefaultColors(culturas.length, 1),
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Margem de Contribuição por Cultura (%)'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.raw + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });        
    }
}

function updateExpensesByDreChart(data) {
    const ctx = document.getElementById('expensesByDreChart').getContext('2d');
    // Supondo que temos dados de despesas por DRE - ajuste conforme sua API
    const dres = ['Operacional', 'Capex', 'Financeiro', 'Administrativo'];
    const valores = [30000, 20000, 10000, 5000]; // Exemplo - substitua pelos dados reais
    
    if (expensesByDreChart) {
        expensesByDreChart.data.labels = dres;
        expensesByDreChart.data.datasets[0].data = valores;
        expensesByDreChart.update();
    } else {
        expensesByDreChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: dres,
                datasets: [{
                    data: valores,
                    backgroundColor: getDefaultColors(dres.length, 0.7),
                    borderColor: getDefaultColors(dres.length, 1),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Despesas por Tipo de DRE'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: R$ ${value.toLocaleString('pt-BR')} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

function updateFinancialIndicatorsChart(data) {
    const ctx = document.getElementById('financialIndicatorsChart').getContext('2d');
    // Supondo que temos dados de indicadores financeiros - ajuste conforme sua API
    const indicadores = ['Margem Contrib.', 'Capex/Receita', 'Desp. Financeiras', 'Lucratividade'];
    const valores = [35, 15, 8, 12]; // Exemplo - substitua pelos dados reais
    
    if (financialIndicatorsChart) {
        financialIndicatorsChart.data.labels = indicadores;
        financialIndicatorsChart.data.datasets[0].data = valores;
        financialIndicatorsChart.update();
    } else {
        financialIndicatorsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: indicadores,
                datasets: [{
                    label: 'Indicadores (%)',
                    data: valores,
                    backgroundColor: getDefaultColors(indicadores.length, 0.7),
                    borderColor: getDefaultColors(indicadores.length, 1),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Indicadores Financeiros (%)'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.raw + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }
}

function updateCashProjectionChart(data) {
    const ctx = document.getElementById('cashProjectionChart').getContext('2d');
    // Supondo que temos dados de projeção de caixa - ajuste conforme sua API
    const meses = ['Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const otimista = [80000, 85000, 90000, 95000, 100000, 105000, 110000, 115000, 120000];
    const realista = [80000, 82000, 84000, 86000, 88000, 90000, 92000, 94000, 96000];
    const pessimista = [80000, 78000, 76000, 74000, 72000, 70000, 68000, 66000, 64000];
    
    if (cashProjectionChart) {
        cashProjectionChart.data.labels = meses;
        cashProjectionChart.data.datasets[0].data = otimista;
        cashProjectionChart.data.datasets[1].data = realista;
        cashProjectionChart.data.datasets[2].data = pessimista;
        cashProjectionChart.update();
    } else {
        cashProjectionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: meses,
                datasets: [
                    {
                        label: 'Projeção Otimista',
                        data: otimista,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        borderDash: [],
                        tension: 0.1
                    },
                    {
                        label: 'Projeção Realista',
                        data: realista,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 2,
                        borderDash: [],
                        tension: 0.1
                    },
                    {
                        label: 'Projeção Pessimista',
                        data: pessimista,
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 2,
                        borderDash: [],
                        tension: 0.1
                    }
                ]
            },
            options: getDefaultLineChartOptions('Projeção de Caixa')
        });
    }
}

// Funções auxiliares
function getDefaultColors(count, opacity) {
    const rawColors = [
        'rgba(44, 80, 66, OPACITY)',   // Verde escuro (variação do --primary-color)
        'rgba(61, 107, 90, OPACITY)',  // Verde médio (variação do --primary-light)
        'rgba(31, 58, 48, OPACITY)',   // Verde muito escuro (variação do --primary-dark)
        'rgba(204, 204, 204, OPACITY)', // Cinza claro (variação do --gray-dark)
        'rgba(240, 240, 240, OPACITY)', // Cinza muito claro (variação do --gray-light)
        'rgba(119, 119, 119, OPACITY)', // Cinza texto leve (variação do --text-light)
        'rgba(51, 51, 51, OPACITY)'    // Cinza escuro (variação do --text-color)
    ];

    return rawColors.slice(0, count).map(c => c.replace('OPACITY', opacity));
}


function getDefaultBarChartOptions(title) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: title
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return 'R$ ' + context.raw.toLocaleString('pt-BR');
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return 'R$ ' + value.toLocaleString('pt-BR');
                    }
                }
            }
        }
    };
}

function carregarFiltros() {
    fetch('http://127.0.0.1:5000/api/movimentacoes/filtros', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        preencherSelect('#safra', data.safras);
        preencherSelect('#talhao', data.talhoes);
        preencherSelect('#categoria', data.produtos); // ou use uma tabela separada se categoria for diferente
    })
    .catch(error => {
        console.error('Erro ao carregar filtros:', error);
        alert('Erro ao carregar opções de filtro');
    });
}

function preencherSelect(selector, itens) {
    const select = document.querySelector(selector);
    if (!select) {
        console.warn(`Elemento ${selector} não encontrado`);
        return;
    }

    select.innerHTML = `<option></option>`;
    itens.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.nome_produto || item.nome_safra || item.nome_talhao || item.nome_propriedade || item.nome;
        select.appendChild(option);
    });

    $(selector).select2();  // reinicializa o Select2
}




function getDefaultLineChartOptions(title) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: title
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return context.dataset.label + ': R$ ' + context.raw.toLocaleString('pt-BR');
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return 'R$ ' + value.toLocaleString('pt-BR');
                    }
                }
            }
        }
    };
}