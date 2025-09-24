
const THEMES = ["one-dark", "tokyo-night",
  "nord", "gruvbox-dark", "terminus", "oled-abyss",
  "solar-flare"];

class ThemeSwitcher {

  constructor() {
    this.themes = {
      "one-dark": "🌙 One Dark",
      "tokyo-night": "🌃 Tokyo Night",
      "nord": "❄️ Nord",
      "gruvbox-dark": "🍂 Gruvbox",
      "terminus": "🔥 Terminus",
      "oled-abyss": "🌑 OLED Abyss",
      "solar-flare": "☀️ Solar Flare",
      "word": "📄 Doc"
    };

    this.currentTheme = this.getStoredTheme();
    this.originalTheme = this.currentTheme; // Track the persistent theme
    this.init();
  }

  getStoredTheme() {
    // Priority: localStorage > system preference > default
    const stored = localStorage.getItem("theme");
    if (stored && this.themes[stored]) {
      return stored;
    }

    // Respect system preference and set appropriate defaults
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches ?
      "solar-flare" : "one-dark";
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.createThemeSelector();

    // Listen for system theme changes
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const lightModeQuery = window.matchMedia("(prefers-color-scheme: light)");

      // Select current theme
      const menuItems = document.querySelector(".main-menu-items");
      const options = menuItems.querySelectorAll(".theme-option");

      options[THEMES.indexOf(this.currentTheme)].classList.add("current");

      for (let theme in options) {
        if (theme.nodeName === this.currentTheme) {
          theme.classList.add("current");
        }
      }

      const handleSystemThemeChange = () => {
        // Only auto-switch if user hasn't manually selected a theme
        if (!localStorage.getItem("theme")) {
          if (lightModeQuery.matches) {
            this.applyTheme("gruvbox-dark");
          } else if (darkModeQuery.matches) {
            this.applyTheme("one-dark");
          }
        }
      };

      darkModeQuery.addEventListener("change", handleSystemThemeChange);
      lightModeQuery.addEventListener("change", handleSystemThemeChange);
    }
  }

  applyTheme(themeName) {
    if (!this.themes[themeName]) return;

    document.documentElement.setAttribute("data-theme", themeName);
    localStorage.setItem("theme", themeName);
    this.currentTheme = themeName;
    this.originalTheme = themeName; // Track the "real" theme

    // Update selector if it exists
    const selector = document.querySelector(".theme-selector select");
    if (selector) {
      selector.value = themeName;
    }

    this.updateIcon(themeName)

    // Update meta theme-color for browser chrome
    this.updateMetaThemeColor(themeName);

    this.updateCodeTheme(themeName);
  }

  icons = {
    "one-dark": "logo_one_dark.svg",
    "tokyo-night": "logo_tokio_night.svg",
    "nord": "logo_nord.svg",
    "gruvbox-dark": "logo_gruvbox.svg",
    "terminus": "logo_gruvbox.svg",
    "oled-abyss": "logo_oled_abyss.svg",
    "solar-flare": "logo_solar_flare.svg",
    "word": "logo_word.svg",
  }

  updateIcon(themeName) {
    let iconName = this.icons[themeName] ?? "logo_one_dark.svg";

    const icon = document.getElementById("icon")

    const base_url = new URL(document.baseURI).origin;
    let advanced_url = new URL("images", base_url).href;
    let href = new URL(iconName, advanced_url + "/images").href;

    const main_page_icon = document.getElementById("logo_on_main_page");

    if (main_page_icon != null) {
      main_page_icon.src = href;
    }
    
    icon.setAttribute("href", href)
  }

  previewTheme(themeName) {
    if (!this.themes[themeName]) return;

    this.updateIcon(themeName)

    // Store original theme if not already stored
    if (!this.originalTheme) {
      this.originalTheme = this.currentTheme;
    }

    // Apply preview theme (but don't save to localStorage)
    document.documentElement.setAttribute("data-theme", themeName);
    this.updateMetaThemeColor(themeName);

    this.updateCodeTheme(themeName);
  }

  updateCodeTheme(themeName) {
    const codeRef = document.getElementById("syntax-theme");

    if (themeName == "solar-flare" || themeName == "word") {
      codeRef.href = "/syntax-theme-light.css"
    }
    else if (themeName == "oled-abyss") {
      codeRef.href = "/syntax-theme-abyss.css"
    }
    else {
      codeRef.href = "/syntax-theme-dark.css"
    }
  }

  restoreTheme() {
    if (
      this.originalTheme &&
      this.originalTheme !== document.documentElement.getAttribute("data-theme")
    ) {
      document.documentElement.setAttribute("data-theme", this.originalTheme);
      this.updateMetaThemeColor(this.originalTheme);
      this.updateIcon(this.originalTheme);
    }
  }

  updateMetaThemeColor(themeName) {
    const themeColors = {
      "terminus": "#211f1a",
      "tokyo-night": "#1a1b26",
      "solarized-dark": "#002b36",
      "nord": "#2e3440",
      "one-dark": "#282c34",
      "gruvbox-dark": "#282828",
      "oled-abyss": "#000000",
      "solar-flare": "#ffffff",
    };

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme && themeColors[themeName]) {
      metaTheme.setAttribute("content", themeColors[themeName]);
    }
  }

  createThemeSelector() {
    // Find the menu items list to add theme selector
    const menuItems = document.querySelector(".main-menu-items");
    if (!menuItems) {
      console.warn("Could not find menu to add theme selector");
      return;
    }

    const selectorHTML = `
            <li class="theme-selector" style="display:inline-block">
                <a href="#" class="theme-trigger" aria-expanded="false" aria-haspopup="true">
                    Theme ↓<span class="sr-only"> (click to change theme)</span>
                </a>
                <ul class="theme-dropdown" role="menu">
                    ${Object.entries(this.themes)
        .map(
          ([key, name]) =>
            `<li><a href="#" class="theme-option ${key === this.currentTheme ? "one-dark" : ""}" data-theme="${key}" role="menuitem">${name}</a></li>`,
        )
        .join("")}
                </ul>
            </li>
        `;

    let right_menu_items = document.getElementById("main-right");
    right_menu_items.insertAdjacentHTML("beforeend", selectorHTML);

    // Add event listeners
    const trigger = menuItems.querySelector(".theme-trigger");
    const dropdown = menuItems.querySelector(".theme-dropdown");
    const options = menuItems.querySelectorAll(".theme-option");

    // Show dropdown on hover and click
    const showDropdown = () => {
      dropdown.classList.add("show");
      trigger.setAttribute("aria-expanded", "true");
    };

    const hideDropdown = () => {
      dropdown.classList.remove("show");
      trigger.setAttribute("aria-expanded", "false");
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
    const selector = menuItems.querySelector(".theme-selector");

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
        this.restoreTheme(); // Restore original theme when closing dropdown
      }, 100);
    });

    // Cancel hide if mouse re-enters
    selector.addEventListener("mouseenter", () => {
      clearTimeout(hoverTimeout);
    });

    // Theme selection and preview
    options.forEach((option) => {
      // Preview theme on hover
      option.addEventListener("mouseenter", (e) => {
        const previewTheme = e.target.dataset.theme;
        this.previewTheme(previewTheme);
      });

      // Apply theme permanently on click
      option.addEventListener("click", (e) => {
        e.preventDefault();
        const theme = e.target.dataset.theme;
        this.applyTheme(theme);

        // Update current selection highlighting
        options.forEach((opt) => opt.classList.remove("current"));
        e.target.classList.add("current");

        // Close dropdown
        hideDropdown();
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".theme-selector")) {
        hideDropdown();
        this.restoreTheme(); // Restore original theme when clicking outside
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new ThemeSwitcher());
} else {
  new ThemeSwitcher();
}
