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
        const href = new URL(document.baseURI).href;
        const parts = href.split("/");

        var last = parts[parts.length - 1];

        var i = 2;
        while (last == "") {
            last = parts[parts.length - i];
            i++;
        }
        return last === "ru" ? "ru" : "en";
    }

    getCurrentPathPretty() {
        const href = new URL(document.baseURI).href;

        var n_slashes = 0;
        while (true) {
            let char = href[href.length - 1 - n_slashes];
            if (char != "/") {
                break;
            }
            n_slashes += 1;
        }
        return href.slice(0, href.length - n_slashes);
    }

    createlangSelector() {
        // Find the menu items list to add lang selector
        const menuItems = document.querySelector(".main-menu-items");
        if (!menuItems) {
            console.warn("Could not find menu to add lang selector");
            return;
        }

        let curr_path = this.getCurrentPathPretty();

        let ru_selector;
        let en_selector;

        if (this.getCurrentLang() === "en") {
            ru_selector = `<li><a href="${curr_path}/ru" class="lang-option ru" data-llang="ru" role="menuitem">Русский</a></li>`;
            en_selector = `<li><a class="lang-option en" data-llang="en" role="menuitem" style="cursor: pointer">English</a></li>`;
        }
        else {
            en_selector = `<li><a href="${curr_path.slice(0, curr_path.length - 2)}" class="lang-option en" data-llang="en" role="menuitem">English</a></li>`;
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

        menuItems.insertAdjacentHTML("beforeend", "<li id='main-right' style='position: relative; margin-left: auto;'/>");

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
