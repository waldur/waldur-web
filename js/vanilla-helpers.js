'use strict';

/**
 * Vanilla JS helpers - replaces jQuery plugins from helpers.js
 * - ScrollTopButton
 * - FixedMenu (sticky header with active link tracking)
 * - SmoothScroll
 * - CaptchaValidator
 * - AjaxForm
 *
 * Note: Mobile menu is handled by mmenu-light (CDN)
 */

(function() {
    // ============================================
    // ScrollTopButton - Scroll to top button
    // ============================================
    class ScrollTopButton {
        constructor(options = {}) {
            this.animateSpeed = options.animateSpeed || 400;
            this.disableWidth = options.disableWidth || 768;
            this.isActive = false;
            this.isDisabled = false;
            this.btn = null;
            this.init();
        }

        init() {
            this.render();
            this.bindHandlers();
            this.checkWidth();
            this.checkScroll();
        }

        render() {
            this.btn = document.createElement('div');
            this.btn.id = 'scrollUp';
            this.btn.innerHTML = '<i class="upButton"></i>';
            this.btn.style.display = 'none';
            document.body.appendChild(this.btn);
        }

        bindHandlers() {
            this.btn.addEventListener('click', () => this.scrollToTop());
            window.addEventListener('scroll', () => this.checkScroll());
            window.addEventListener('resize', () => this.checkWidth());
        }

        checkScroll() {
            if (this.isDisabled) return;

            const scrollY = window.scrollY || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;

            if (!this.isActive && scrollY > windowHeight) {
                this.showBtn();
            } else if (this.isActive && scrollY < windowHeight) {
                this.hideBtn();
            }
        }

        checkWidth() {
            const width = document.documentElement.clientWidth;

            if (!this.isDisabled && width <= this.disableWidth) {
                this.isDisabled = true;
                this.hideBtn();
            } else if (this.isDisabled && width > this.disableWidth) {
                this.isDisabled = false;
                this.checkScroll();
            }
        }

        showBtn() {
            this.btn.style.display = 'block';
            this.btn.style.opacity = '0';
            this.btn.style.bottom = '-20px';

            requestAnimationFrame(() => {
                this.btn.style.transition = `opacity ${this.animateSpeed}ms, bottom ${this.animateSpeed}ms`;
                this.btn.style.opacity = '1';
                this.btn.style.bottom = '40px';
            });

            this.isActive = true;
        }

        hideBtn() {
            this.btn.style.transition = `opacity ${this.animateSpeed}ms, bottom ${this.animateSpeed}ms`;
            this.btn.style.opacity = '0';
            this.btn.style.bottom = '-20px';

            setTimeout(() => {
                if (!this.isActive) {
                    this.btn.style.display = 'none';
                }
            }, this.animateSpeed);

            this.isActive = false;
        }

        scrollToTop() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }

    // ============================================
    // FixedMenu - Sticky header with active section tracking
    // ============================================
    class FixedMenu {
        constructor(element, options = {}) {
            this.menu = typeof element === 'string' ? document.querySelector(element) : element;
            if (!this.menu) return;

            this.fixedClass = options.fixedClass || 'js__top-fixed';
            this.activeClass = options.activeClass || 'active';
            this.delay = options.delay || 100;
            this.menuIsFixed = false;
            this.staticMenuPosition = -1;
            this.activeLink = null;
            this.links = [];

            this.init();
        }

        init() {
            this.links = this.getLinks();
            this.getStaticMenuPos();
            this.setActiveLink();

            window.addEventListener('scroll', this.throttle(() => {
                this.toggleMenuPosition();
                this.setActiveLink();
            }, this.delay));

            window.addEventListener('resize', () => this.getStaticMenuPos());
            window.addEventListener('load', () => {
                this.getStaticMenuPos();
                this.setActiveLink();
            });
        }

        getLinks() {
            const anchors = this.menu.querySelectorAll('a[href*="#"]');
            return Array.from(anchors).filter(el => this.getElement(el.href));
        }

        getElement(url) {
            const hashIndex = url.indexOf('#');
            if (hashIndex === -1) return null;

            const path = url.slice(0, hashIndex);
            const id = url.slice(hashIndex + 1);

            if (!this.isCurrPage(path) || id.length < 2) return null;
            return document.getElementById(id);
        }

        isCurrPage(url) {
            const currPath = window.location.origin + window.location.pathname;
            return currPath === url || currPath === url + 'index.html' || url === '';
        }

        getStaticMenuPos() {
            if (this.menu.offsetParent === null) return; // hidden

            this.menu.classList.remove(this.fixedClass);
            this.menuIsFixed = false;
            this.staticMenuPosition = this.menu.getBoundingClientRect().top + window.pageYOffset;
            this.toggleMenuPosition();
        }

        toggleMenuPosition() {
            if (this.menu.offsetParent === null) return; // hidden

            if (window.pageYOffset <= this.staticMenuPosition && this.menuIsFixed) {
                this.menu.classList.remove(this.fixedClass);
                this.menuIsFixed = false;
            } else if (window.pageYOffset > this.staticMenuPosition && !this.menuIsFixed) {
                this.menu.classList.add(this.fixedClass);
                this.menuIsFixed = true;
            }
        }

        setActiveLink() {
            if (this.menu.offsetParent === null) return; // hidden

            const menuRect = this.menu.getBoundingClientRect();
            const checkPoint = menuRect.bottom + 100;

            for (const link of this.links) {
                const target = this.getElement(link.href);
                if (!target) continue;

                const rect = target.getBoundingClientRect();
                if (rect.top <= checkPoint && rect.bottom > checkPoint) {
                    if (this.activeLink !== link) {
                        if (this.activeLink) {
                            this.activeLink.closest('li')?.classList.remove(this.activeClass);
                        }
                        link.closest('li')?.classList.add(this.activeClass);
                        this.activeLink = link;
                    }
                    return;
                }
            }

            // No section in view
            if (this.activeLink) {
                this.activeLink.closest('li')?.classList.remove(this.activeClass);
                this.activeLink = null;
            }
        }

        throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
    }

    // ============================================
    // SmoothScroll - Smooth scrolling to anchors
    // ============================================
    class SmoothScroll {
        constructor(containerSelector, options = {}) {
            this.containers = document.querySelectorAll(containerSelector);
            this.offset = options.offset || 0;
            this.offsetSelector = options.offsetSelector || null;

            this.init();
        }

        init() {
            this.containers.forEach(container => {
                container.addEventListener('click', (e) => this.handleClick(e));
            });
        }

        handleClick(e) {
            const anchor = e.target.closest('a[href*="#"]:not([data-scroll="disable"])');
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            const hashIndex = href.indexOf('#');
            if (hashIndex === -1) return;

            const path = href.slice(0, hashIndex);
            const id = href.slice(hashIndex + 1);

            // Check if same page
            const currPath = window.location.pathname;
            if (path && path !== currPath && !path.endsWith(currPath)) return;

            const target = document.getElementById(id);
            if (!target) return;

            e.preventDefault();
            this.scrollTo(target);
        }

        scrollTo(target) {
            let offset = this.offset;

            if (this.offsetSelector) {
                const offsetEl = document.querySelector(this.offsetSelector);
                if (offsetEl) {
                    offset = offsetEl.offsetHeight;
                }
            }

            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    // ============================================
    // CaptchaValidator - Math captcha for forms
    // ============================================
    class CaptchaValidator {
        constructor(options = {}) {
            this.questionEl = options.question instanceof Element ?
                options.question : document.querySelector(options.question);
            this.answerEl = options.answer instanceof Element ?
                options.answer : document.querySelector(options.answer);
            this.errorClass = options.errorClass || 'valid-error';
            this.correctAnswer = null;
            this.errorEl = null;

            if (this.questionEl && this.answerEl) {
                this.init();
            }
        }

        init() {
            this.generateCaptcha();
            this.createErrorElement();
            this.answerEl.addEventListener('focus', () => this.hideError());
        }

        generateCaptcha() {
            const n1 = this.randomInt(1, 10);
            const n2 = this.randomInt(1, 10);
            const ops = ['+', '-', '*'];
            const op = ops[this.randomInt(0, ops.length - 1)];

            let answer;
            switch (op) {
                case '+': answer = n1 + n2; break;
                case '-': answer = n1 - n2; break;
                case '*': answer = n1 * n2; break;
            }

            this.questionEl.textContent = `${n1} ${op} ${n2} = ?`;
            this.correctAnswer = answer;
        }

        createErrorElement() {
            this.errorEl = document.createElement('label');
            this.errorEl.className = this.errorClass;
            this.errorEl.setAttribute('for', this.answerEl.id);
            this.errorEl.textContent = 'Correct captcha is required.';
        }

        validate() {
            const answer = parseInt(this.answerEl.value, 10);
            const isValid = !isNaN(answer) && answer === this.correctAnswer;

            if (!isValid) {
                this.generateCaptcha();
                this.showError();
            } else {
                this.hideError();
            }

            return isValid;
        }

        showError() {
            this.answerEl.classList.add(this.errorClass);
            if (!this.errorEl.parentNode) {
                this.answerEl.parentNode.insertBefore(this.errorEl, this.answerEl.nextSibling);
            }
        }

        hideError() {
            this.answerEl.classList.remove(this.errorClass);
            if (this.errorEl.parentNode) {
                this.errorEl.parentNode.removeChild(this.errorEl);
            }
        }

        randomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    }

    // ============================================
    // AjaxForm - Form submission with validation
    // ============================================
    class AjaxForm {
        constructor(form, options = {}) {
            this.form = typeof form === 'string' ? document.querySelector(form) : form;
            if (!this.form) return;

            this.captchaValidator = options.captchaValidator || null;
            this.successMsg = options.successMsg || 'Message sent successfully!';
            this.errorMsg = options.errorMsg || 'Sorry, something went wrong. Please try again.';
            this.errorClass = options.errorClass || 'valid-error';

            this.successBlock = this.form.querySelector('.ajax-form__message_success');
            this.errorBlock = this.form.querySelector('.ajax-form__message_error');
            this.pendingBlock = this.form.querySelector('.ajax-form__message_pending');
            this.submitBtn = this.form.querySelector('[type="submit"]');

            this.isSending = false;
            this.init();
        }

        init() {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));

            // Add real-time validation feedback
            this.form.querySelectorAll('input, textarea').forEach(field => {
                field.addEventListener('blur', () => this.validateField(field));
                field.addEventListener('input', () => {
                    if (field.classList.contains(this.errorClass)) {
                        this.validateField(field);
                    }
                });
            });
        }

        validateField(field) {
            const isValid = field.checkValidity();
            const errorEl = field.parentNode.querySelector(`.${this.errorClass}`);

            if (!isValid) {
                field.classList.add(this.errorClass);
                if (!errorEl) {
                    const error = document.createElement('label');
                    error.className = this.errorClass;
                    error.setAttribute('for', field.id);
                    error.textContent = field.validationMessage || 'This field is required.';
                    field.parentNode.appendChild(error);
                }
            } else {
                field.classList.remove(this.errorClass);
                if (errorEl) errorEl.remove();
            }

            return isValid;
        }

        handleSubmit(e) {
            e.preventDefault();

            if (this.isSending) return;

            // Validate all fields
            let isValid = true;
            this.form.querySelectorAll('input[required], textarea[required]').forEach(field => {
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });

            // Validate captcha
            if (this.captchaValidator && !this.captchaValidator.validate()) {
                isValid = false;
            }

            if (!isValid) return;

            this.send();
        }

        async send() {
            this.isSending = true;
            this.hideMessages();
            this.showPending();
            this.disableSubmit();

            const formData = new FormData(this.form);
            const data = {};
            formData.forEach((value, key) => {
                if (key !== 'captcha') { // Exclude captcha from submission
                    data[key] = value;
                }
            });

            try {
                const response = await fetch(this.form.action, {
                    method: this.form.method || 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                this.hidePending();

                if (response.ok) {
                    this.showSuccess(this.successMsg);
                    this.form.reset();
                    if (this.captchaValidator) {
                        this.captchaValidator.generateCaptcha();
                    }
                } else {
                    this.showError(this.errorMsg);
                }
            } catch (error) {
                console.error('Form submission error:', error);
                this.hidePending();
                this.showError(this.errorMsg);
            } finally {
                this.isSending = false;
                this.enableSubmit();
            }
        }

        showSuccess(message) {
            if (this.successBlock) {
                this.successBlock.innerHTML = `<span>${message}</span>`;
                this.successBlock.style.display = 'block';
                setTimeout(() => this.hideMessages(), 10000);
            }
        }

        showError(message) {
            if (this.errorBlock) {
                this.errorBlock.innerHTML = `<span>${message}</span>`;
                this.errorBlock.style.display = 'block';
                setTimeout(() => this.hideMessages(), 10000);
            }
        }

        showPending() {
            if (this.pendingBlock) {
                this.pendingBlock.style.display = 'block';
            }
        }

        hidePending() {
            if (this.pendingBlock) {
                this.pendingBlock.style.display = 'none';
            }
        }

        hideMessages() {
            [this.successBlock, this.errorBlock, this.pendingBlock].forEach(el => {
                if (el) el.style.display = 'none';
            });
        }

        disableSubmit() {
            if (this.submitBtn) {
                this.submitBtn.disabled = true;
                this.submitBtn.classList.add('ajax-form__submit_disabled');
            }
        }

        enableSubmit() {
            if (this.submitBtn) {
                this.submitBtn.disabled = false;
                this.submitBtn.classList.remove('ajax-form__submit_disabled');
            }
        }
    }

    // ============================================
    // Export to window
    // ============================================
    window.VanillaHelpers = {
        ScrollTopButton,
        FixedMenu,
        SmoothScroll,
        CaptchaValidator,
        AjaxForm
    };
})();
