document.addEventListener("DOMContentLoaded", function () {
    const navContainer = document.getElementById("navbar");

        // Navigatie HTML direct insluiten (brand links, navigatie rechts)
        const navHTML = `
            <header class="site-header">
                <div class="nav-container">
                    <div class="site-branding">
                        <a href="index.html" class="site-title">Qastrol</a>
                    </div>
                    <nav class="site-nav" aria-label="Hoofd navigatie">
                        <ul id="nav-menu">
                            <li><a href="index.html">Home</a></li>
                            <li><a href="noobpoints.html">Noob-Points!</a></li>
                            <li><a href="tts.html">TTS-stemmen</a></li>
                            <li><a href="soundeffects.html">Sound Effects</a></li>
                            <li>
                                <button id="mode-toggle" title="Zet dark mode aan/uit">
                                    <i id="mode-icon" class="fas fa-sun"></i>
                                </button>
                            </li>
                        </ul>
                    </nav>
                    <button class="hamburger" id="hamburger" aria-label="Menu" aria-expanded="false">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </header>
        `;

    // Voeg de navigatie HTML toe aan de container
    navContainer.innerHTML = navHTML;

    // Voer de logica uit voor de dark mode en het hamburger-menu
    executeNavScripts();

    function executeNavScripts() {
        const modeToggle = document.getElementById("mode-toggle");
        const modeIcon = document.getElementById("mode-icon");
        const html = document.documentElement;

        // Dark mode logica
        const isDarkMode = localStorage.getItem("dark-mode") === "true";
        if (isDarkMode) {
            html.setAttribute("data-theme", "dark");
            modeIcon.classList.replace("fa-sun", "fa-moon");
        } else {
            html.setAttribute("data-theme", "light");
            modeIcon.classList.replace("fa-moon", "fa-sun");
        }

        modeToggle.addEventListener("click", () => {
            const currentTheme = html.getAttribute("data-theme");
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            html.setAttribute("data-theme", newTheme);

            if (newTheme === "dark") {
                modeIcon.classList.replace("fa-sun", "fa-moon");
            } else {
                modeIcon.classList.replace("fa-moon", "fa-sun");
            }

            localStorage.setItem("dark-mode", newTheme === "dark");
        });

        // Hamburger-menu logica
        const hamburger = document.getElementById("hamburger");
        const navMenu = document.getElementById("nav-menu");

        hamburger.addEventListener("click", () => {
            navMenu.classList.toggle("show"); // Voeg de 'show' klasse toe of verwijder deze
        });

        // Sluit het menu wanneer ergens anders op de pagina wordt geklikt
        document.addEventListener("click", (event) => {
            if (!hamburger.contains(event.target) && !navMenu.contains(event.target)) {
                navMenu.classList.remove("show");
            }
        });
    }
});
