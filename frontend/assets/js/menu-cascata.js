document.addEventListener('DOMContentLoaded', () => {
    // Abre e fecha submenus ao clicar
    document.querySelectorAll('.has-submenu > a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            const parent = link.parentElement;
            const submenu = parent.querySelector('.submenu');

            // Fecha todos os outros submenus
            document.querySelectorAll('.has-submenu').forEach(item => {
                if (item !== parent) {
                    item.classList.remove('open');
                    const otherSub = item.querySelector('.submenu');
                    if (otherSub) otherSub.style.maxHeight = null;
                }
            });

            // Alterna submenu clicado
            if (parent.classList.contains('open')) {
                parent.classList.remove('open');
                submenu.style.maxHeight = null;
            } else {
                parent.classList.add('open');
                submenu.style.maxHeight = submenu.scrollHeight + "px";
            }
        });
    });
});