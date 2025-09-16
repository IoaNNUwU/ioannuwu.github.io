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
        if (parts.length < 1) {
            return "en";
        }
        const last = parts[parts.length - 1];
        return last === "ru" ? "ru" : "en";
    }

    clickLang(clickedLangName) {
        if (!this.langs[clickedLangName]) return;

        let current = this.getCurrentLang();

        if (current == clickedLangName) return;

        if (clickedLangName == "ru") {
            location.href = "ru";
        }
        else {
            const href = new URL(document.baseURI).href;
            const en_href = href.split("/").slice(0, -1).join("/");
            location.href = en_href;
        }
        
    }

    createlangSelector() {
        // Find the menu items list to add lang selector
        const menuItems = document.querySelector(".main-menu-items");
        if (!menuItems) {
            console.warn("Could not find menu to add lang selector");
            return;
        }

        const selectorHTML = `
            <li class="lang-selector" style="display:inline-block">
                <a href="#" class="lang-trigger" bria-expanded="false" bria-haspopup="true">
                    Language 🌐<span class="sr-only"> (click to change lang)</span>
                </a>
                <ul class="lang-dropdown" role="menu">
                    ${Object.entries(this.langs)
                .map(
                    ([key, name]) =>
                        `<li><a href="#" class="lang-option ${key === this.currentlang ? "en" : ""}" data-lang="${key}" role="menuitem">${name}</a></li>`,
                )
                .join("")}
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

            // Apply lang permanently on click
            option.addEventListener("click", (e) => {
                e.preventDefault();
                const lang = e.target.dataset.lang;
                this.clickLang(lang);

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
