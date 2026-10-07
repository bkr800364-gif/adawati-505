/* =========================================
   أدواتي — Main Application
   Search, categories, theme and navigation
========================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  /* ---------- Elements ---------- */

  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("toolSearch");

  const categoryTabs = document.getElementById("categoryTabs");
  const categoryButtons = document.querySelectorAll(".category-button");

  const toolsGrid = document.getElementById("toolsGrid");
  const toolCards = Array.from(document.querySelectorAll(".tool-card"));

  const toolsCounter = document.getElementById("toolsCounter");
  const emptyState = document.getElementById("emptyState");
  const clearSearchButton = document.getElementById("clearSearch");

  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");

  const mobileMenuButton = document.getElementById("mobileMenuButton");

  const mainNav = document.getElementById("mainNav");
  const navLinks = document.querySelectorAll(".nav-link");

  const currentYear = document.getElementById("currentYear");

  /* ---------- State ---------- */

  let activeCategory = "all";
  let searchQuery = "";

  /* ---------- Search normalization ---------- */

  function normalizeText(value) {
    return String(value || "")
      .toLocaleLowerCase("ar")
      .normalize("NFKC")
      .replace(/[أإآ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* ---------- Category labels ---------- */

  function getCategoryLabel(category) {
    const labels = {
      all: "جميع الأدوات",
      images: "الصور",
      documents: "الملفات والمستندات",
      coming: "الأدوات القادمة",
    };

    return labels[category] || "الأدوات";
  }

  /* ---------- Counter ---------- */

  function updateCounter(count) {
    if (count === 0) {
      toolsCounter.textContent = "لا توجد أدوات مطابقة";
      return;
    }

    if (count === 1) {
      toolsCounter.textContent = "أداة واحدة";
      return;
    }

    if (count === 2) {
      toolsCounter.textContent = "أداتان";
      return;
    }

    toolsCounter.textContent = `${count} أدوات`;
  }

  /* ---------- Filtering ---------- */

  function filterTools() {
    let visibleCount = 0;

    toolCards.forEach((card) => {
      const category = card.dataset.category || "";
      const title = card.querySelector("h3")?.textContent || "";
      const description =
        card.querySelector(".tool-card-body p")?.textContent || "";
      const keywords = card.dataset.search || "";
      const cardText = normalizeText(
        `${title} ${description} ${keywords} ${category}`,
      );

      const matchesCategory =
        activeCategory === "all" || category === activeCategory;

      const matchesSearch = !searchQuery || cardText.includes(searchQuery);

      const visible = matchesCategory && matchesSearch;

      card.hidden = !visible;

      if (visible) {
        visibleCount++;
      }
    });

    updateCounter(visibleCount);

    emptyState.hidden = visibleCount !== 0;
    toolsGrid.hidden = visibleCount === 0;
  }

  /* ---------- Search form ---------- */

  searchInput.addEventListener("input", () => {
    searchQuery = normalizeText(searchInput.value);
    filterTools();
  });

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    searchQuery = normalizeText(searchInput.value);
    filterTools();

    document.getElementById("tools").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });

  /* ---------- Categories ---------- */

  categoryTabs.addEventListener("click", (event) => {
    const button = event.target.closest(".category-button");

    if (!button) {
      return;
    }

    activeCategory = button.dataset.category || "all";

    categoryButtons.forEach((item) => {
      const isActive = item === button;

      item.classList.toggle("active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });

    filterTools();
  });

  /* ---------- Reset search ---------- */

  clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
    searchQuery = "";
    activeCategory = "all";

    categoryButtons.forEach((button) => {
      const isActive = button.dataset.category === "all";

      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    filterTools();
    searchInput.focus();
  });

  /* ---------- Theme ---------- */

  const THEME_KEY = "adawati-theme";

  function updateThemeButton() {
    const isDark = document.body.classList.contains("dark-mode");

    themeIcon.textContent = isDark ? "☀" : "☾";

    themeToggle.setAttribute(
      "aria-label",
      isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن",
    );

    themeToggle.setAttribute("title", isDark ? "الوضع الفاتح" : "الوضع الداكن");
  }

  function loadTheme() {
    try {
      const savedTheme = localStorage.getItem(THEME_KEY);

      if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
      } else {
        document.body.classList.remove("dark-mode");
      }
    } catch (error) {
      // يستمر الموقع في العمل إذا تعذر الوصول إلى التخزين.
    }

    updateThemeButton();
  }

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");

    try {
      localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    } catch (error) {
      // يظل تغيير المظهر فعالًا حتى عند تعذر حفظ الاختيار.
    }

    updateThemeButton();
  });

  /* ---------- Mobile navigation ---------- */

  function closeMobileMenu() {
    mainNav.classList.remove("open");

    mobileMenuButton.setAttribute("aria-expanded", "false");
    mobileMenuButton.setAttribute("aria-label", "فتح القائمة");
  }

  mobileMenuButton.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");

    mobileMenuButton.setAttribute("aria-expanded", String(isOpen));

    mobileMenuButton.setAttribute(
      "aria-label",
      isOpen ? "إغلاق القائمة" : "فتح القائمة",
    );
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeMobileMenu();

      navLinks.forEach((item) => {
        item.classList.toggle("active", item === link);
      });
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (
      mainNav.classList.contains("open") &&
      !mainNav.contains(event.target) &&
      !mobileMenuButton.contains(event.target)
    ) {
      closeMobileMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) {
      closeMobileMenu();
    }
  });

  /* ---------- Footer year ---------- */

  currentYear.textContent = new Date().getFullYear();

  /* ---------- Initial state ---------- */

  loadTheme();
  filterTools();

  console.log("أدواتي: تم تشغيل الموقع بنجاح.");
});
