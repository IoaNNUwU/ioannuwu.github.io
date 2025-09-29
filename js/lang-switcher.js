class LangSwitcher {

    constructor() {
        this.langs = {
            "en": "English",
            "ru": "Русский",
        }
        this.createlangSelector();

        const menuItems = document.querySelector(".main-menu-items");

        const options = menuItems.querySelectorAll(".lang-option");

        let currentLang = this.getCurrentLang();

        options[currentLang === "en" ? 0 : 1].classList.add("current");
    }

    getCurrentLang() {
        return this.getCurrentPathPretty().split("/")[0] === "ru" ? "ru" : "en";
    }

    getCurrentPathPretty() {
        var path = new URL(document.baseURI).pathname;
        // Skip front slashes
        var n_slashes = 0;
        while (true) {
            let char = path[n_slashes];

            if (char === "/") {
                n_slashes++
            } else {
                break;
            }
        }
        return path.slice(n_slashes, path.length);
    }

    createlangSelector() {
        // Find the menu items list to add lang selector
        const menuItems = document.querySelector(".main-menu-items");
        if (!menuItems) {
            console.warn("Could not find menu to add lang selector");
            return;
        }
        let pretty_path = this.getCurrentPathPretty();

        let split = pretty_path.split("/");
        let first = split[0];
        
        let base_path = new URL(document.baseURI);

        let ru_selector;
        let en_selector;

        if (this.getCurrentLang() === "en") {
            let ru_path = new URL(base_path.origin) + "ru/" + pretty_path;
            ru_selector = `<li><a href="${ru_path}" class="lang-option ru" data-llang="ru" role="menuitem">Русский</a></li>`;
            en_selector = `<li><a class="lang-option en" data-llang="en" role="menuitem" style="cursor: pointer">English</a></li>`;
        }
        else {
            let en_path = new URL(base_path.origin) + pretty_path.slice(3, pretty_path.length);
            en_selector = `<li><a href="${en_path}" class="lang-option en" data-llang="en" role="menuitem">English</a></li>`;
            ru_selector = `<li><a class="lang-option ru" data-llang="ru" role="menuitem" style="cursor: pointer">Русский</a></li>`;
        }

        const selectorHTML = `
            <li class="lang-selector" style="display:inline-block">
                <a href="#" class="lang-trigger" bria-expanded="false" bria-haspopup="true">
                    Language 🌐<span class="sr-only"> (click to change lang)</span>
                </a>
                <ul class="lang-dropdown" role="menu">
                    ${en_selector}
                    ${ru_selector}
                </ul>
            </li>
        `;

        let right_menu_items = document.getElementById("main-right");
        right_menu_items.insertAdjacentHTML("beforeend", selectorHTML);

        // Add event listeners
        const trigger = menuItems.querySelector(".lang-trigger");
        const dropdown = menuItems.querySelector(".lang-dropdown");
        const options = menuItems.querySelectorAll(".lang-option");

        // Show dropdown on hover and click
        const showDropdown = () => {
            dropdown.classList.add("show");
            trigger.setAttribute("bria-expanded", "true");
        };

        const hideDropdown = () => {
            dropdown.classList.remove("show");
            trigger.setAttribute("bria-expanded", "false");
        };

        // Toggle dropdown on click
        trigger.addEventListener("click", (e) => {
            e.preventDefault();
            const isOpen = dropdown.classList.contains("show");
            if (isOpen) {
                hideDropdown();
            } else {
                showDropdown();
            }
        });

        // Get the selector container for hover management
        const selector = menuItems.querySelector(".lang-selector");

        // Show on hover (with slight delay to prevent flicker)
        let hoverTimeout;
        selector.addEventListener("mouseenter", () => {
            clearTimeout(hoverTimeout);
            showDropdown();
        });

        // Hide when leaving the entire selector area (with small delay)
        selector.addEventListener("mouseleave", () => {
            hoverTimeout = setTimeout(() => {
                hideDropdown();
            }, 100);
        });

        // Cancel hide if mouse re-enters
        selector.addEventListener("mouseenter", () => {
            clearTimeout(hoverTimeout);
        });

        options.forEach((option) => {
            option.addEventListener("click", (e) => {
                const lang = e.target.dataset.lang;

                // Update current selection highlighting
                options.forEach((opt) => opt.classList.remove("current"));
                e.target.classList.add("current");

                // Close dropdown
                hideDropdown();
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", (e) => {
            if (!e.target.closest(".lang-selector")) {
                hideDropdown();
            }
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => new LangSwitcher());
} else {
    new LangSwitcher();
}
