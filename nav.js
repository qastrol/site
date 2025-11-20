document.addEventListener("DOMContentLoaded", function () {
    const navContainer = document.getElementById("navbar");

    // Quick switch for navigation variants.
    // Change `NAV_VARIANT` to 'kerst' to enable the KerstKnallers variant.
    // One quick edit: set NAV_VARIANT = 'kerst' (default is 'default').
    const NAV_VARIANT = 'default'; // 'default' | 'kerst'

    const homeHref = NAV_VARIANT === 'kerst' ? 'kerstknallers.html' : 'index.html';
    const secondLinkHref = NAV_VARIANT === 'kerst' ? 'alerts.html' : 'noobpoints.html';
    const secondLinkLabel = NAV_VARIANT === 'kerst' ? 'Alerts' : 'Noob-Points!';

    // Navigatie HTML direct insluiten (brand links, navigatie rechts)
    const navHTML = `
            <header class="site-header">
                <div class="nav-container">
                    <div class="site-branding">
                        <a href="${homeHref}" class="site-title">Qastrol</a>
                    </div>
                    <nav class="site-nav" aria-label="Hoofd navigatie">
                        <ul id="nav-menu">
                            <li><a href="${homeHref}">Home</a></li>
                            <li><a href="${secondLinkHref}">${secondLinkLabel}</a></li>
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

    // After injecting the header into the page, adjust page spacing so the header
    // doesn't overlap content (especially on mobile). Then initialize behavior.
    function adjustContentForHeader() {
        const header = document.querySelector('.site-header');
        const content = document.querySelector('.content');
        const navMenu = document.getElementById('nav-menu');
        if (header && content) {
            // set top padding equal to header height so content is never hidden
            const h = header.offsetHeight;
            content.style.paddingTop = (h + 8) + 'px';
            // if the nav menu is absolutely positioned on mobile, place it below header
            if (navMenu) {
                navMenu.style.top = h + 'px';
            }
        }
    }

    // Run initial scripts and wire events
    executeNavScripts();
    // Adjust on load and on resize in case header height changes (responsive)
    adjustContentForHeader();
    window.addEventListener('resize', adjustContentForHeader);

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

        // Toggle menu and ensure aria-expanded is updated for accessibility
        hamburger.addEventListener("click", (ev) => {
            const isOpen = navMenu.classList.toggle("show"); // add/remove 'show'
            hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            // position the menu under the header (recompute in case of dynamic header)
            const header = document.querySelector('.site-header');
            if (header && navMenu) navMenu.style.top = header.offsetHeight + 'px';
            ev.stopPropagation();
        });

        // Sluit het menu wanneer ergens anders op de pagina wordt geklikt
        document.addEventListener('click', (event) => {
            if (!hamburger.contains(event.target) && !navMenu.contains(event.target)) {
                navMenu.classList.remove('show');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    }
});
