document.addEventListener('DOMContentLoaded', () => {
    const splitter = document.getElementById('splitter');
    const leftPanel = document.querySelector('.left-panel');
    const rightPanel = document.querySelector('.right-panel');

    let isResizing = false;
    let lastDownX = 0;

    splitter.addEventListener('mousedown', (e) => {
        isResizing = true;
        lastDownX = e.clientX;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const offsetRight = window.innerWidth - (e.clientX - document.querySelector('.container').offsetLeft);
        leftPanel.style.width = `${e.clientX - leftPanel.offsetLeft}px`;
        rightPanel.style.width = `${offsetRight}px`;
    });

    window.addEventListener('mouseup', () => {
        isResizing = false;
    });

    // Fonction pour afficher le contenu du module
    function showModule(module) {
        const contentDiv = document.getElementById('module-content');
        contentDiv.innerHTML = `<p>Contenu pour le module ${module}</p>`; // Remplacez par le contenu réel du module
    }

    // Fonction pour démarrer le terminal
    function startTerminal() {
        fetch('/launch-terminal')
            .then(response => response.json())
            .then(data => {
                const iframe = document.getElementById('terminal-frame');
                iframe.innerHTML = `<iframe src="${data.url}" frameborder="0" width="100%" height="100%"></iframe>`;
                updateTimer(); // Start timer
            })
            .catch(error => console.error('Erreur:', error));
    }

    // Fonction pour arrêter le terminal
    function stopTerminal() {
        fetch('/exit-lab')
            .then(response => response.json())
            .then(data => {
                const iframe = document.getElementById('terminal-frame');
                iframe.innerHTML = '';
                console.log(data.message);
            })
            .catch(error => console.error('Erreur:', error));
    }

    // Fonction pour mettre à jour le timer
    function updateTimer() {
        const timerElement = document.getElementById('timer');
        let time = 0;
        setInterval(() => {
            time++;
            const minutes = Math.floor(time / 60);
            const seconds = time % 60;
            timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }
});
