// ES Module imports
import Swiper from 'https://cdn.jsdelivr.net/npm/swiper@11/swiper.min.mjs';
// Import modules one by one: modules/index.min.mjs pulls in all ~25 of them
import Navigation from 'https://cdn.jsdelivr.net/npm/swiper@11/modules/navigation.min.mjs';
import Pagination from 'https://cdn.jsdelivr.net/npm/swiper@11/modules/pagination.min.mjs';
import EffectCoverflow from 'https://cdn.jsdelivr.net/npm/swiper@11/modules/effect-coverflow.min.mjs';

document.addEventListener('DOMContentLoaded', function() {
    // ============================================
    // Swiper slider with modular imports (~40KB instead of 150KB)
    // ============================================
    new Swiper(".swiper", {
        modules: [Navigation, Pagination, EffectCoverflow],
        effect: "coverflow",
        grabCursor: true,
        centeredSlides: true,
        centeredSlidesBounds: true,
        centerInsufficientSlides: true,
        loop: true,
        speed: 400,
        spaceBetween: -100,
        coverflowEffect: {
            rotate: 0,
            stretch: 0,
            depth: 100,
            modifier: 5,
            slideShadows: false,
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        slidesPerView: 1.5,
        breakpoints: {
            320: { spaceBetween: -150 },
            560: { spaceBetween: -175 },
            768: { spaceBetween: -250 },
            992: { spaceBetween: -375 },
            1400: { spaceBetween: -450 },
        },
    });

    // ============================================
    // GLightbox (vanilla - no jQuery needed)
    // ============================================
    if (typeof GLightbox !== 'undefined') {
        GLightbox({
            selector: '.glightbox',
            touchNavigation: true,
            loop: true,
            closeButton: true
        });
    }

    // ============================================
    // Product film: autoplay while visible, pause toggle, respects reduced motion.
    // No autoplay on small screens: the film is unreadable there until tapped.
    // ============================================
    const filmFigure = document.querySelector('.film__video');
    const filmVideo = document.querySelector('.film__video-player');
    const filmToggle = document.querySelector('.film__video-toggle');
    if (filmFigure && filmVideo && filmToggle) {
        let userPaused = window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 767.98px)').matches;

        const setToggleState = (playing) => {
            filmFigure.classList.toggle('is-paused', !playing);
            filmToggle.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
            filmToggle.querySelector('i').className = playing ? 'ph-bold ph-pause' : 'ph-bold ph-play';
        };
        filmVideo.addEventListener('play', () => setToggleState(true));
        filmVideo.addEventListener('pause', () => setToggleState(false));

        filmToggle.addEventListener('click', () => {
            userPaused = !filmVideo.paused;
            if (userPaused) {
                filmVideo.pause();
            } else {
                filmVideo.play().catch(() => {});
            }
        });

        new IntersectionObserver((entries) => {
            if (userPaused) return;
            if (entries[0].isIntersecting) {
                filmVideo.play().catch(() => {});
            } else {
                filmVideo.pause();
            }
        }, { threshold: 0.5 }).observe(filmVideo);
    }

    // ============================================
    // Demo modal: play the film when opened, stop it when closed
    // ============================================
    const demoModal = document.getElementById('demoModal');
    const demoVideo = demoModal?.querySelector('.demo-modal__player');
    if (demoModal && demoVideo) {
        demoModal.addEventListener('shown.bs.modal', () => {
            if (filmVideo) filmVideo.pause();
            demoVideo.play().catch(() => {});
        });
        demoModal.addEventListener('hide.bs.modal', () => {
            demoVideo.pause();
            demoVideo.currentTime = 0;
        });
    }

    // ============================================
    // Scroll top button (vanilla)
    // ============================================
    if (window.VanillaHelpers) {
        new VanillaHelpers.ScrollTopButton();
    }

    // ============================================
    // Fixed menu with active link tracking (vanilla)
    // ============================================
    if (window.VanillaHelpers) {
        const navbar = document.querySelector('header .navbar');
        if (navbar) {
            new VanillaHelpers.FixedMenu(navbar, {
                fixedClass: ' ',
                delay: 200
            });
        }
    }

    // ============================================
    // Smooth scroll (vanilla)
    // ============================================
    if (window.VanillaHelpers) {
        new VanillaHelpers.SmoothScroll('.navbar-nav, .scroll-down', {
            offsetSelector: '.navbar'
        });
    }

    // ============================================
    // Contact form with captcha (vanilla)
    // ============================================
    if (window.VanillaHelpers) {
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            const captchaValidator = new VanillaHelpers.CaptchaValidator({
                question: contactForm.querySelector('.captcha__question'),
                answer: contactForm.querySelector('.captcha__answer'),
                errorClass: 'valid-error'
            });

            new VanillaHelpers.AjaxForm(contactForm, {
                captchaValidator: captchaValidator,
                successMsg: 'Thank you! We shall reply to you very soon!',
                errorClass: 'valid-error'
            });
        }
    }

    // ============================================
    // Delegated click behavior (vanilla)
    // ============================================
    document.querySelectorAll('[data-delegated-click]').forEach(function(el) {
        el.addEventListener('click', function(e) {
            var selector = this.getAttribute('data-delegated-click');
            e.preventDefault();
            var target = document.querySelector(selector);
            if (target) {
                target.click();
            }
        });
    });

    // ============================================
    // Add class to body on ready (vanilla)
    // ============================================
    document.body.classList.add('js-ready');

    // ============================================
    // Mobile Menu (mmenu-light)
    // ============================================
    if (typeof MmenuLight !== 'undefined') {
        const menu = new MmenuLight(
            document.querySelector('#m-menu'),
            'all'
        );

        const navigator = menu.navigation({
            title: 'Menu'
        });

        const drawer = menu.offcanvas({
            position: 'left'
        });

        // Open menu on hamburger click
        document.querySelector('#hamburger').addEventListener('click', (e) => {
            e.preventDefault();
            drawer.open();
        });

        // Close menu when clicking links
        document.querySelectorAll('#m-menu a').forEach(link => {
            link.addEventListener('click', () => {
                drawer.close();
            });
        });
    }

    // ============================================
    // Hash highlight (vanilla)
    // ============================================
    function updateHighlight(targetId) {
        document.querySelectorAll('.js-target-highlight').forEach(function(el) {
            el.classList.remove('js-target-highlight');
        });

        if (targetId) {
            var target = document.getElementById(targetId);
            if (target) {
                target.classList.add('js-target-highlight');
            }
        }
    }

    // Set initial highlight on page load
    var hash = window.location.hash.substring(1);
    if (hash) {
        updateHighlight(hash);
    }

    // Handle anchor clicks for same-page navigation
    document.addEventListener('click', function(e) {
        var anchor = e.target.closest('a[href*="#"]');
        if (!anchor) return;

        var href = anchor.getAttribute('href');
        // Skip external links
        if (href.startsWith('http://') || href.startsWith('https://')) return;
        var currentPath = window.location.pathname;
        var hashIndex = href.indexOf('#');
        if (hashIndex === -1) return;

        var targetPath = href.slice(0, hashIndex);
        var targetHash = href.slice(hashIndex + 1);

        // Only handle same-page navigation
        if (targetPath === currentPath || targetPath === '' || targetPath === './') {
            // Don't prevent default for glightbox links
            if (anchor.classList.contains('glightbox')) return;

            e.preventDefault();

            if (targetHash) {
                history.pushState(null, null, currentPath + '#' + targetHash);
                updateHighlight(targetHash);

                var targetEl = document.getElementById(targetHash);
                if (targetEl) {
                    var offset = 100;
                    var navbar = document.querySelector('.navbar');
                    if (navbar) {
                        offset = navbar.offsetHeight;
                    }
                    var scrollTop = targetEl.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({
                        top: scrollTop,
                        behavior: 'smooth'
                    });
                }
            }
        }
    });

    // Handle browser back/forward button
    window.addEventListener('popstate', function() {
        var hash = window.location.hash.substring(1);
        updateHighlight(hash);

        if (hash) {
            var target = document.getElementById(hash);
            if (target) {
                var offset = 100;
                var navbar = document.querySelector('.navbar');
                if (navbar) {
                    offset = navbar.offsetHeight;
                }
                var scrollTop = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: scrollTop,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// Also trigger hash highlight on window load
window.addEventListener('load', function() {
    var hash = window.location.hash.substring(1);
    if (hash) {
        var target = document.getElementById(hash);
        if (target) {
            target.classList.add('js-target-highlight');
        }
    }
});
