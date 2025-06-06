/**
 * BluePaste Frontend JavaScript
 * Enhanced version with improved UX and security
 */
class BluePaste {
  constructor() {
    this.version = "2.0.0";
    this.init();
    this.setupEventListeners();
    this.initializeTheme();
    this.initializeEmojis();
    this.setupConsoleWarning();
    this.setupKeyboardShortcuts();
    this.setupAccessibility();
  }

  init() {
    // Cache DOM elements
    this.elements = {
      // Form elements
      pasteForm: document.getElementById("paste-form"),
      contentInput: document.getElementById("content"),
      languageSelect: document.getElementById("language"),
      submitBtn: document.getElementById("submit-btn"),
      clearBtn: document.getElementById("clear-btn"),
      previewToggle: document.getElementById("preview-toggle"),

      // Display elements
      charCount: document.getElementById("char-count"),
      previewContainer: document.getElementById("preview-container"),
      previewContent: document.getElementById("preview-code"),
      previewClose: document.getElementById("preview-close"),
      resultContainer: document.getElementById("result-container"),

      // Theme and navigation
      themeToggle: document.getElementById("theme-toggle"),
      createAnotherBtn: document.getElementById("create-another"),

      // View page elements
      qrContainer: document.getElementById("qr-container"),
      qrToggle: document.getElementById("qr-toggle"),
      qrClose: document.getElementById("qr-close"),
      shareBtn: document.getElementById("share-btn"),

      // Additional controls
      lineNumbersToggle: document.getElementById("line-numbers-toggle"),
      wordWrapToggle: document.getElementById("word-wrap-toggle"),
      fullscreenToggle: document.getElementById("fullscreen-toggle"),
      fullscreenModal: document.getElementById("fullscreen-modal"),
      fullscreenClose: document.getElementById("fullscreen-close"),
      downloadBtn: document.getElementById("download-btn"),
      forkPaste: document.getElementById("fork-paste"),
    };

    // Application state
    this.state = {
      isSubmitting: false,
      previewTimeout: null,
      isPreviewVisible: false,
      isFullscreen: false,
      lineNumbersVisible: true,
      wordWrapEnabled: false,
      currentPasteContent: null,
    };

    // Configuration
    this.config = {
      previewDelay: 500,
      maxPreviewLength: 5000,
      toastDuration: 3000,
      animationDuration: 300,
    };
  }

  setupEventListeners() {
    // Form submission
    if (this.elements.pasteForm) {
      this.elements.pasteForm.addEventListener("submit", (e) =>
        this.handleSubmit(e)
      );
    }

    // Content input events
    if (this.elements.contentInput) {
      this.elements.contentInput.addEventListener("input", () => {
        this.updateCharCount();
        this.schedulePreview();
        this.updateLineNumbers();
      });

      this.elements.contentInput.addEventListener("paste", () => {
        setTimeout(() => {
          this.updateCharCount();
          this.schedulePreview();
          this.updateLineNumbers();
        }, 100);
      });

      this.elements.contentInput.addEventListener("scroll", () => {
        this.syncLineNumbersScroll();
      });
    }

    // Button events
    this.setupButtonEvents();

    // Copy functionality
    this.setupCopyEvents();

    // Modal and overlay events
    this.setupModalEvents();

    // Social sharing
    this.setupSocialSharing();
  }

  setupButtonEvents() {
    // Clear button
    if (this.elements.clearBtn) {
      this.elements.clearBtn.addEventListener("click", () => this.clearForm());
    }

    // Preview toggle
    if (this.elements.previewToggle) {
      this.elements.previewToggle.addEventListener("click", () =>
        this.togglePreview()
      );
    }

    // Preview close
    if (this.elements.previewClose) {
      this.elements.previewClose.addEventListener("click", () =>
        this.hidePreview()
      );
    }

    // Create another
    if (this.elements.createAnotherBtn) {
      this.elements.createAnotherBtn.addEventListener("click", () =>
        this.resetToForm()
      );
    }

    // Theme toggle
    if (this.elements.themeToggle) {
      this.elements.themeToggle.addEventListener("click", () =>
        this.toggleTheme()
      );
    }

    // QR code toggle
    if (this.elements.qrToggle) {
      this.elements.qrToggle.addEventListener("click", () =>
        this.toggleQRCode()
      );
    }

    // QR close
    if (this.elements.qrClose) {
      this.elements.qrClose.addEventListener("click", () => this.hideQRCode());
    }

    // Share button
    if (this.elements.shareBtn) {
      this.elements.shareBtn.addEventListener("click", () =>
        this.handleShare()
      );
    }

    // View controls
    if (this.elements.lineNumbersToggle) {
      this.elements.lineNumbersToggle.addEventListener("click", () =>
        this.toggleLineNumbers()
      );
    }

    if (this.elements.wordWrapToggle) {
      this.elements.wordWrapToggle.addEventListener("click", () =>
        this.toggleWordWrap()
      );
    }

    if (this.elements.fullscreenToggle) {
      this.elements.fullscreenToggle.addEventListener("click", () =>
        this.toggleFullscreen()
      );
    }

    if (this.elements.fullscreenClose) {
      this.elements.fullscreenClose.addEventListener("click", () =>
        this.exitFullscreen()
      );
    }

    // Download button
    if (this.elements.downloadBtn) {
      this.elements.downloadBtn.addEventListener("click", () =>
        this.downloadPaste()
      );
    }

    // Fork paste
    if (this.elements.forkPaste) {
      this.elements.forkPaste.addEventListener("click", () => this.forkPaste());
    }
  }

  setupCopyEvents() {
    document.addEventListener("click", (e) => {
      if (
        e.target.classList.contains("copy-btn") ||
        e.target.closest(".copy-btn")
      ) {
        this.handleCopy(e);
      }
      if (
        e.target.classList.contains("copy-content-btn") ||
        e.target.closest(".copy-content-btn")
      ) {
        this.handleContentCopy(e);
      }
    });
  }

  setupModalEvents() {
    // Close modals on escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeAllModals();
      }
    });

    // Close modals on backdrop click
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-backdrop")) {
        this.closeAllModals();
      }
    });
  }

  setupSocialSharing() {
    document.addEventListener("click", (e) => {
      if (
        e.target.classList.contains("social-btn") ||
        e.target.closest(".social-btn")
      ) {
        const platform =
          e.target.dataset.platform ||
          e.target.closest(".social-btn").dataset.platform;
        this.shareOnPlatform(platform);
      }
    });
  }

  setupConsoleWarning() {
    // Enhanced console warning
    const styles = {
      title:
        "color: #ff4444; font-size: 48px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);",
      warning: "color: #ff6b6b; font-size: 18px; font-weight: bold;",
      message: "color: #ff8e8e; font-size: 14px; line-height: 1.5;",
      security: "color: #4dabf7; font-size: 14px; font-weight: bold;",
      small: "color: #adb5bd; font-size: 12px;",
    };

    console.log("%c⚠️ STOP!", styles.title);
    console.log("%c🚨 Security Warning", styles.warning);
    console.log(
      '%cThis is a browser feature intended for developers. If someone told you to copy and paste something here to enable a BluePaste feature or "hack" someone\'s account, it is a scam and will give them access to your information.',
      styles.message
    );
    console.log(
      "%c🔒 BluePaste respects your privacy and will never ask you to run code in the console.",
      styles.security
    );
    console.log(
      "%c📧 If you're a developer and found a security issue, please report it responsibly.",
      styles.small
    );

    // Disable common console methods in production
    if (
      location.hostname !== "localhost" &&
      location.hostname !== "127.0.0.1"
    ) {
      const originalLog = console.log;
      console.log = function () {
        originalLog.apply(console, [
          "🚫 Console access restricted for security.",
        ]);
      };
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Ctrl/Cmd + Enter: Submit form
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (
          this.elements.pasteForm &&
          this.elements.pasteForm.style.display !== "none"
        ) {
          e.preventDefault();
          this.handleSubmit(e);
        }
      }

      // Ctrl/Cmd + K: Focus content input
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        if (this.elements.contentInput) {
          e.preventDefault();
          this.elements.contentInput.focus();
        }
      }

      // Ctrl/Cmd + Shift + P: Toggle preview
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "P") {
        e.preventDefault();
        this.togglePreview();
      }

      // F11 or Ctrl/Cmd + Shift + F: Toggle fullscreen (view page)
      if (
        e.key === "F11" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "F")
      ) {
        if (this.elements.fullscreenToggle) {
          e.preventDefault();
          this.toggleFullscreen();
        }
      }

      // Escape: Close modals or clear form
      if (e.key === "Escape") {
        this.handleEscapeKey();
      }
    });
  }

  setupAccessibility() {
    // Announce dynamic content changes to screen readers
    this.ariaLiveRegion = document.createElement("div");
    this.ariaLiveRegion.setAttribute("aria-live", "polite");
    this.ariaLiveRegion.setAttribute("aria-atomic", "true");
    this.ariaLiveRegion.style.cssText =
      "position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;";
    document.body.appendChild(this.ariaLiveRegion);

    // Improve focus management
    this.setupFocusManagement();
  }

  setupFocusManagement() {
    // Trap focus in modals
    document.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        if (this.state.isFullscreen && this.elements.fullscreenModal) {
          this.trapFocus(e, this.elements.fullscreenModal);
        }
      }
    });
  }

  trapFocus(e, container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  initializeTheme() {
    const savedTheme = localStorage.getItem("bluepaste-theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    let theme = savedTheme || "auto";
    this.applyTheme(theme);

    // Listen for system theme changes
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (
          localStorage.getItem("bluepaste-theme") === "auto" ||
          !localStorage.getItem("bluepaste-theme")
        ) {
          this.applyTheme("auto");
        }
      });
  }

  applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    this.updateThemeIcon(theme);

    // Update highlight.js theme based on current theme
    setTimeout(() => {
      this.updateHighlightTheme();
    }, 100);
  }

  updateHighlightTheme() {
    const isDark = this.isDarkTheme();
    const highlightLink = document.querySelector('link[href*="highlight.js"]');

    if (highlightLink) {
      const newTheme = isDark ? "atom-one-dark" : "atom-one-light";
      highlightLink.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${newTheme}.min.css`;
    }
  }

  isDarkTheme() {
    const theme = document.documentElement.getAttribute("data-theme");
    if (theme === "dark") return true;
    if (theme === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    let newTheme;

    switch (currentTheme) {
      case "light":
        newTheme = "dark";
        break;
      case "dark":
        newTheme = "auto";
        break;
      default:
        newTheme = "light";
    }

    this.applyTheme(newTheme);
    localStorage.setItem("bluepaste-theme", newTheme);
    this.announceToScreenReader(`Theme changed to ${newTheme}`);
  }

  updateThemeIcon(theme) {
    const themeIcon = document.querySelector(".theme-icon");
    if (themeIcon) {
      const icons = {
        light: "☀️",
        dark: "🌙",
        auto: "🔄",
      };
      themeIcon.textContent = icons[theme] || icons.auto;
    }
  }

  initializeEmojis() {
    if (typeof twemoji !== "undefined") {
      twemoji.parse(document.body, {
        folder: "svg",
        ext: ".svg",
        callback: (icon, options) => {
          // Add loading="lazy" to emoji images for better performance
          return "".concat(options.base, options.size, "/", icon, options.ext);
        },
      });
    }
  }

  updateCharCount() {
    if (this.elements.contentInput && this.elements.charCount) {
      const count = this.elements.contentInput.value.length;
      this.elements.charCount.textContent = count.toLocaleString();

      const maxLength = parseInt(
        this.elements.contentInput.getAttribute("maxlength")
      );
      const percentage = count / maxLength;

      // Update styling based on usage
      this.elements.charCount.className = "char-count";
      if (percentage > 0.9) {
        this.elements.charCount.classList.add("char-count-danger");
      } else if (percentage > 0.7) {
        this.elements.charCount.classList.add("char-count-warning");
      }

      // Update ARIA label for accessibility
      const charCounter = document.getElementById("char-counter");
      if (charCounter) {
        charCounter.setAttribute(
          "aria-label",
          `${count} of ${maxLength.toLocaleString()} characters used`
        );
      }
    }
  }

  updateLineNumbers() {
    const lineNumbers = document.querySelector(".line-numbers");
    if (lineNumbers && this.elements.contentInput) {
      const lines = this.elements.contentInput.value.split("\n").length;
      const lineNumbersHtml = Array.from(
        { length: lines },
        (_, i) => i + 1
      ).join("\n");
      lineNumbers.textContent = lineNumbersHtml;
    }
  }

  syncLineNumbersScroll() {
    const lineNumbers = document.querySelector(".line-numbers");
    if (lineNumbers && this.elements.contentInput) {
      lineNumbers.scrollTop = this.elements.contentInput.scrollTop;
    }
  }

  schedulePreview() {
    if (this.state.previewTimeout) {
      clearTimeout(this.state.previewTimeout);
    }

    this.state.previewTimeout = setTimeout(() => {
      this.updatePreview();
    }, this.config.previewDelay);
  }

  updatePreview() {
    if (!this.elements.contentInput || !this.elements.previewContent) return;

    const content = this.elements.contentInput.value.trim();

    if (content.length === 0) {
      this.hidePreview();
      return;
    }

    if (content.length > this.config.maxPreviewLength) {
      this.elements.previewContent.textContent =
        "Content too large for preview. Submit to see highlighted version.";
      return;
    }

    try {
      const language = this.elements.languageSelect?.value || "";
      let highlightedContent;

      if (language && language !== "" && hljs.getLanguage(language)) {
        highlightedContent = hljs.highlight(content, { language }).value;
      } else {
        const result = hljs.highlightAuto(content);
        highlightedContent = result.value;
      }

      this.elements.previewContent.innerHTML = highlightedContent;

      // Re-parse emojis in preview
      if (typeof twemoji !== "undefined") {
        twemoji.parse(this.elements.previewContent);
      }
    } catch (error) {
      console.error("Preview error:", error);
      this.elements.previewContent.textContent = "Preview unavailable";
    }
  }

  togglePreview() {
    if (this.state.isPreviewVisible) {
      this.hidePreview();
    } else {
      this.showPreview();
    }
  }

  showPreview() {
    if (this.elements.previewContainer) {
      this.updatePreview();
      this.elements.previewContainer.style.display = "block";
      this.state.isPreviewVisible = true;

      if (this.elements.previewToggle) {
        document.getElementById("preview-text").textContent = "Hide Preview";
      }

      this.announceToScreenReader("Preview shown");
    }
  }

  hidePreview() {
    if (this.elements.previewContainer) {
      this.elements.previewContainer.style.display = "none";
      this.state.isPreviewVisible = false;

      if (this.elements.previewToggle) {
        document.getElementById("preview-text").textContent = "Preview";
      }

      this.announceToScreenReader("Preview hidden");
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (this.state.isSubmitting) return;

    const content = this.elements.contentInput.value.trim();
    if (!content) {
      this.showToast("Please enter some content", "error");
      this.elements.contentInput.focus();
      return;
    }

    this.state.isSubmitting = true;
    this.updateSubmitButton(true);

    try {
      const formData = {
        content: content,
        language: this.elements.languageSelect?.value || undefined,
      };

      const response = await fetch("/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        this.showResult(result);
        this.showToast("Paste created successfully! 🎉", "success");
        this.announceToScreenReader("Paste created successfully");
      } else {
        throw new Error(result.error || "Failed to create paste");
      }
    } catch (error) {
      console.error("Submit error:", error);
      this.showToast(error.message || "Failed to create paste", "error");
      this.announceToScreenReader(`Error: ${error.message}`);
    } finally {
      this.state.isSubmitting = false;
      this.updateSubmitButton(false);
    }
  }

  updateSubmitButton(isLoading) {
    if (!this.elements.submitBtn) return;

    const btnText = this.elements.submitBtn.querySelector(".btn-text");
    const btnSpinner = this.elements.submitBtn.querySelector(".btn-spinner");

    if (isLoading) {
      this.elements.submitBtn.disabled = true;
      this.elements.submitBtn.setAttribute("aria-busy", "true");
      if (btnText) btnText.style.display = "none";
      if (btnSpinner) btnSpinner.style.display = "inline-flex";
    } else {
      this.elements.submitBtn.disabled = false;
      this.elements.submitBtn.removeAttribute("aria-busy");
      if (btnText) btnText.style.display = "inline";
      if (btnSpinner) btnSpinner.style.display = "none";
    }
  }

  showResult(result) {
    // Hide form and preview
    if (this.elements.pasteForm) {
      this.elements.pasteForm.style.display = "none";
    }
    this.hidePreview();

    // Update result URLs
    const viewUrlInput = document.getElementById("view-url");
    const rawUrlInput = document.getElementById("raw-url");
    const viewPasteLink = document.getElementById("view-paste-link");

    if (viewUrlInput) viewUrlInput.value = result.url;
    if (rawUrlInput) rawUrlInput.value = result.rawUrl;
    if (viewPasteLink) viewPasteLink.href = result.url;

    // Show result container with animation
    if (this.elements.resultContainer) {
      this.elements.resultContainer.style.display = "block";
      this.elements.resultContainer.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  resetToForm() {
    // Show form, hide result
    if (this.elements.pasteForm) {
      this.elements.pasteForm.style.display = "block";
    }
    if (this.elements.resultContainer) {
      this.elements.resultContainer.style.display = "none";
    }

    // Clear form and focus
    this.clearForm();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });

    this.announceToScreenReader("Form reset, ready for new paste");
  }

  clearForm() {
    if (this.elements.contentInput) {
      this.elements.contentInput.value = "";
      this.elements.contentInput.focus();
    }

    if (this.elements.languageSelect) {
      this.elements.languageSelect.value = "";
    }

    this.hidePreview();
    this.updateCharCount();
    this.updateLineNumbers();

    this.announceToScreenReader("Form cleared");
  }

  async handleCopy(e) {
    e.preventDefault();

    let textToCopy = "";
    const button = e.target.closest(".copy-btn");

    if (button.dataset.target) {
      const targetInput = document.getElementById(button.dataset.target);
      if (targetInput) {
        textToCopy = targetInput.value;
      }
    }

    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      this.showCopyFeedback(button);
      this.showToast("Copied to clipboard! 📋", "success");
      this.announceToScreenReader("Copied to clipboard");
    } catch (error) {
      console.error("Copy failed:", error);
      this.fallbackCopy(textToCopy, button);
    }
  }

  async handleContentCopy(e) {
    e.preventDefault();

    const button = e.target.closest(".copy-content-btn");
    const content = button.dataset.content;

    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      this.showCopyFeedback(button);
      this.showToast("Content copied to clipboard! 📋", "success");
      this.announceToScreenReader("Content copied to clipboard");
    } catch (error) {
      console.error("Copy failed:", error);
      this.fallbackCopy(content, button);
    }
  }

  showCopyFeedback(button) {
    const originalContent = button.innerHTML;
    button.innerHTML = '<span class="copy-icon">✅</span>Copied!';
    button.classList.add("copied");

    setTimeout(() => {
      button.innerHTML = originalContent;
      button.classList.remove("copied");
    }, 2000);
  }

  fallbackCopy(text, button) {
    // Create temporary textarea for fallback
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);

    try {
      textarea.select();
      document.execCommand("copy");
      this.showCopyFeedback(button);
      this.showToast("Copied to clipboard! 📋", "success");
    } catch (error) {
      this.showToast("Failed to copy to clipboard", "error");
    } finally {
      document.body.removeChild(textarea);
    }
  }

  toggleQRCode() {
    if (this.elements.qrContainer) {
      const isVisible = this.elements.qrContainer.style.display !== "none";

      if (isVisible) {
        this.hideQRCode();
      } else {
        this.showQRCode();
      }
    }
  }

  showQRCode() {
    if (this.elements.qrContainer) {
      this.elements.qrContainer.style.display = "block";
      this.elements.qrContainer.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      this.announceToScreenReader("QR code shown");
    }
  }

  hideQRCode() {
    if (this.elements.qrContainer) {
      this.elements.qrContainer.style.display = "none";
      this.announceToScreenReader("QR code hidden");
    }
  }

  async handleShare() {
    const url = window.location.href;
    const title = "BluePaste";
    const text = "Check out this paste on BluePaste";

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        this.showToast("Shared successfully! 🔗", "success");
        this.announceToScreenReader("Shared successfully");
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Share failed:", error);
          this.fallbackShare(url);
        }
      }
    } else {
      this.fallbackShare(url);
    }
  }

  fallbackShare(url) {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        this.showToast("URL copied to clipboard! 📋", "success");
        this.announceToScreenReader("URL copied to clipboard");
      })
      .catch(() => {
        this.showToast("Unable to share or copy URL", "error");
      });
  }

  shareOnPlatform(platform) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent("Check out this paste on BluePaste");

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], "_blank", "noopener,noreferrer");
      this.announceToScreenReader(`Sharing on ${platform}`);
    }
  }

  toggleLineNumbers() {
    this.state.lineNumbersVisible = !this.state.lineNumbersVisible;
    const codeContainer = document.getElementById("code-container");

    if (codeContainer) {
      codeContainer.classList.toggle(
        "hide-line-numbers",
        !this.state.lineNumbersVisible
      );
    }

    this.announceToScreenReader(
      `Line numbers ${this.state.lineNumbersVisible ? "shown" : "hidden"}`
    );
  }

  toggleWordWrap() {
    this.state.wordWrapEnabled = !this.state.wordWrapEnabled;
    const codeContainer = document.getElementById("code-container");

    if (codeContainer) {
      codeContainer.classList.toggle("word-wrap", this.state.wordWrapEnabled);
    }

    this.announceToScreenReader(
      `Word wrap ${this.state.wordWrapEnabled ? "enabled" : "disabled"}`
    );
  }

  toggleFullscreen() {
    if (this.state.isFullscreen) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  enterFullscreen() {
    if (this.elements.fullscreenModal) {
      this.elements.fullscreenModal.style.display = "flex";
      this.state.isFullscreen = true;
      document.body.classList.add("fullscreen-active");

      // Focus first focusable element in modal
      const firstFocusable =
        this.elements.fullscreenModal.querySelector("button");
      if (firstFocusable) {
        firstFocusable.focus();
      }

      this.announceToScreenReader("Entered fullscreen mode");
    }
  }

  exitFullscreen() {
    if (this.elements.fullscreenModal) {
      this.elements.fullscreenModal.style.display = "none";
      this.state.isFullscreen = false;
      document.body.classList.remove("fullscreen-active");

      // Return focus to toggle button
      if (this.elements.fullscreenToggle) {
        this.elements.fullscreenToggle.focus();
      }

      this.announceToScreenReader("Exited fullscreen mode");
    }
  }

  downloadPaste() {
    const pasteContent =
      document.querySelector("#paste-code")?.textContent ||
      this.elements.contentInput?.value;

    if (!pasteContent) {
      this.showToast("No content to download", "error");
      return;
    }

    const pasteId = document.querySelector(".paste-id")?.textContent || "paste";
    const filename = `${pasteId}.txt`;

    const blob = new Blob([pasteContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    this.showToast("Downloaded successfully! 💾", "success");
    this.announceToScreenReader("File downloaded");
  }

  forkPaste() {
    const pasteContent = document.querySelector("#paste-code")?.textContent;

    if (!pasteContent) {
      this.showToast("No content to fork", "error");
      return;
    }

    // Store content in sessionStorage and redirect to home
    sessionStorage.setItem("forkContent", pasteContent);
    window.location.href = "/";
  }

  handleEscapeKey() {
    if (this.state.isFullscreen) {
      this.exitFullscreen();
    } else if (
      this.elements.qrContainer &&
      this.elements.qrContainer.style.display === "block"
    ) {
      this.hideQRCode();
    } else if (this.state.isPreviewVisible) {
      this.hidePreview();
    } else if (this.elements.contentInput && this.elements.contentInput.value) {
      if (confirm("Clear the form?")) {
        this.clearForm();
      }
    }
  }

  closeAllModals() {
    this.hideQRCode();
    this.hidePreview();
    this.exitFullscreen();
  }

  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");

    const icon = type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
    toast.innerHTML = `
          <span class="toast-icon">${icon}</span>
          <span class="toast-message">${message}</span>
          <button class="toast-close" aria-label="Close notification">✕</button>
      `;

    // Style toast
    Object.assign(toast.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: "10000",
      transform: "translateX(100%)",
      transition: "transform 0.3s ease",
      maxWidth: "400px",
    });

    document.body.appendChild(toast);

    // Add close functionality
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => this.removeToast(toast));

    // Animate in
    setTimeout(() => {
      toast.style.transform = "translateX(0)";
    }, 100);

    // Auto remove
    setTimeout(() => {
      this.removeToast(toast);
    }, this.config.toastDuration);

    // Parse emojis
    if (typeof twemoji !== "undefined") {
      twemoji.parse(toast);
    }
  }

  removeToast(toast) {
    if (toast.parentNode) {
      toast.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, this.config.animationDuration);
    }
  }

  announceToScreenReader(message) {
    if (this.ariaLiveRegion) {
      this.ariaLiveRegion.textContent = message;
      setTimeout(() => {
        this.ariaLiveRegion.textContent = "";
      }, 1000);
    }
  }

  // Initialize forked content on home page
  initializeFork() {
    const forkContent = sessionStorage.getItem("forkContent");
    if (forkContent && this.elements.contentInput) {
      this.elements.contentInput.value = forkContent;
      this.updateCharCount();
      this.updateLineNumbers();
      sessionStorage.removeItem("forkContent");
      this.showToast(
        "Paste forked successfully! You can now edit and create a new paste.",
        "success"
      );
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    const app = new BluePaste();
    app.initializeFork();
  });
} else {
  const app = new BluePaste();
  app.initializeFork();
}

// Service Worker registration for offline support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("SW registered"))
      .catch(() => console.log("SW registration failed"));
  });
}

// Performance monitoring
if (typeof performance !== "undefined") {
  window.addEventListener("load", () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType("navigation")[0];
      if (perfData) {
        console.log(
          "Page load time:",
          Math.round(perfData.loadEventEnd - perfData.fetchStart),
          "ms"
        );
      }
    }, 0);
  });
}
