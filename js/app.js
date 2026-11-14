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
    // "See Waldur in action" tour: one player, a tab per short clip.
    // Plays muted while in view and moves on to the next clip at the end;
    // no autoplay on small screens or with reduced motion, until tapped.
    // The control bar plays and pauses, seeks, and goes full screen.
    // ============================================
    const tourStage = document.querySelector('.tour__stage');
    const tourVideo = document.querySelector('.tour__player');
    const tourToggle = document.querySelector('.tour__toggle');
    const tourSeek = document.querySelector('.tour__seek');
    const tourTime = document.querySelector('.tour__time');
    const tourFullscreen = document.querySelector('.tour__fullscreen');
    const tourSummary = document.querySelector('.tour__summary');
    const tourTabs = [...document.querySelectorAll('.tour__tab')];
    if (tourStage && tourVideo && tourToggle && tourSeek && tourTime && tourTabs.length) {
        const small = window.matchMedia('(max-width: 767.98px)');
        let userPaused = window.matchMedia('(prefers-reduced-motion: reduce)').matches || small.matches;
        let inView = false;
        let current = 0;
        let scrubbing = false;
        let hideTimer = null;

        const clock = (seconds) => {
            const s = Math.max(0, Math.floor(seconds || 0));
            return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        };
        const parseClock = (text) => {
            const [m, s] = (text || '0:00').split(':').map(Number);
            return (m || 0) * 60 + (s || 0);
        };
        const duration = () => tourVideo.duration || parseClock(tourTabs[current].dataset.duration);
        const showTime = (time) => {
            const total = duration();
            tourSeek.max = total || 1;
            tourSeek.value = time;
            tourSeek.style.setProperty('--progress', total ? time / total : 0);
            tourSeek.setAttribute('aria-valuetext', `${clock(time)} of ${clock(total)}`);
            tourTime.textContent = `${clock(time)} / ${clock(total)}`;
            tourTabs[current].style.setProperty('--progress', total ? time / total : 0);
        };
        const play = () => tourVideo.play().catch(() => {});
        const setToggleState = (playing) => {
            tourStage.classList.toggle('is-paused', !playing);
            tourToggle.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
            tourToggle.querySelector('i').className = playing ? 'ph-bold ph-pause' : 'ph-bold ph-play';
        };
        const select = (index, autoplay) => {
            current = (index + tourTabs.length) % tourTabs.length;
            const tab = tourTabs[current];
            tourTabs.forEach((other) => {
                const active = other === tab;
                other.classList.toggle('is-active', active);
                other.setAttribute('aria-selected', active ? 'true' : 'false');
                other.style.removeProperty('--progress');
            });
            // Keep the active tab in view where the tabs scroll sideways
            tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
            tourStage.setAttribute('aria-labelledby', tab.id);
            if (tourSummary) tourSummary.textContent = tab.dataset.summary;
            tourVideo.poster = tab.dataset.poster;
            tourVideo.setAttribute('aria-label', tab.dataset.title);
            tourVideo.src = small.matches ? tab.dataset.srcSmall : tab.dataset.src;
            showTime(0);
            if (autoplay) play();
        };
        const togglePlay = () => {
            userPaused = !tourVideo.paused;
            if (userPaused) {
                tourVideo.pause();
            } else {
                play();
            }
        };
        // On touch screens the bar shows on a tap and hides again a few seconds later
        const revealControls = () => {
            tourStage.classList.add('is-revealed');
            clearTimeout(hideTimer);
            hideTimer = setTimeout(() => tourStage.classList.remove('is-revealed'), 3000);
        };

        tourVideo.addEventListener('play', () => setToggleState(true));
        tourVideo.addEventListener('pause', () => setToggleState(false));
        tourVideo.addEventListener('loadedmetadata', () => showTime(tourVideo.currentTime));
        tourVideo.addEventListener('timeupdate', () => {
            if (!scrubbing) showTime(tourVideo.currentTime);
        });
        tourVideo.addEventListener('ended', () => {
            if (!scrubbing) select(current + 1, inView && !userPaused);
        });

        // A click on the picture plays or pauses. On a touch screen, a tap while the
        // bar is hidden only shows the bar.
        let tapRevealed = false;
        tourStage.addEventListener('pointerdown', (event) => {
            if (event.pointerType !== 'touch') return;
            tapRevealed = !tourVideo.paused && !tourStage.classList.contains('is-revealed');
            revealControls();
        });
        tourVideo.addEventListener('click', () => {
            if (tapRevealed) {
                tapRevealed = false;
                return;
            }
            togglePlay();
        });

        tourSeek.addEventListener('pointerdown', () => { scrubbing = true; });
        tourSeek.addEventListener('input', () => {
            const time = Number(tourSeek.value);
            showTime(time);
            tourVideo.currentTime = time;
        });
        const endScrub = () => {
            if (!scrubbing) return;
            scrubbing = false;
            showTime(tourVideo.currentTime);
        };
        tourSeek.addEventListener('change', endScrub);
        tourSeek.addEventListener('pointerup', endScrub);
        tourSeek.addEventListener('pointercancel', endScrub);
        // Arrow keys step by five seconds rather than by a sliver of the clip
        tourSeek.addEventListener('keydown', (event) => {
            const step = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5 }[event.key];
            if (!step) return;
            event.preventDefault();
            tourVideo.currentTime = Math.min(Math.max(tourVideo.currentTime + step, 0), duration());
            showTime(tourVideo.currentTime);
        });

        tourTabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                userPaused = false;
                select(index, true);
            });
        });
        tourToggle.addEventListener('click', togglePlay);

        // Full screen: the stage itself, so the bar comes along; iPhones only
        // fullscreen a video element, in their own player
        if (tourFullscreen && (document.fullscreenEnabled || tourVideo.webkitEnterFullscreen)) {
            tourFullscreen.hidden = false;
            tourFullscreen.addEventListener('click', () => {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else if (tourStage.requestFullscreen) {
                    tourStage.requestFullscreen().catch(() => {});
                } else {
                    tourVideo.webkitEnterFullscreen();
                }
            });
            document.addEventListener('fullscreenchange', () => {
                const full = document.fullscreenElement === tourStage;
                tourFullscreen.setAttribute('aria-label', full ? 'Exit full screen' : 'Full screen');
                tourFullscreen.querySelector('i').className = full ? 'ph-bold ph-corners-in' : 'ph-bold ph-corners-out';
            });
        }

        new IntersectionObserver((entries) => {
            inView = entries[0].isIntersecting;
            if (userPaused || document.fullscreenElement) return;
            if (inView) {
                play();
            } else {
                tourVideo.pause();
            }
        }, { threshold: 0.5 }).observe(tourVideo);

        showTime(0);
    }

    // ============================================
    // Videos page: load the YouTube embed (privacy-enhanced mode) only on click
    // ============================================
    document.querySelectorAll('.videos__player').forEach((player) => {
        player.addEventListener('click', () => {
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube-nocookie.com/embed/${player.dataset.videoId}?autoplay=1&rel=0`;
            iframe.title = player.dataset.videoTitle;
            iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
            iframe.allowFullscreen = true;
            // Replace the button rather than filling it: a <button> must not contain an embedded player
            const frame = document.createElement('div');
            frame.className = 'videos__frame';
            frame.appendChild(iframe);
            player.replaceWith(frame);
            iframe.focus();
        }, { once: true });
    });

    // ============================================
    // Demo modal: play the film when opened (pausing the tour), stop it when closed
    // ============================================
    const demoModal = document.getElementById('demoModal');
    const demoVideo = demoModal?.querySelector('.demo-modal__player');
    if (demoModal && demoVideo) {
        demoModal.addEventListener('shown.bs.modal', () => {
            if (tourVideo) tourVideo.pause();
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
    // The highlight box is for an item within a page, such as a solution card. A whole page
    // section (the homepage's Features, How it works, ...) is only scrolled to: boxed, it would
    // spill over the sections around it.
    function isHighlightable(el) {
        return !!el && el.tagName !== 'SECTION';
    }

    function updateHighlight(targetId) {
        document.querySelectorAll('.js-target-highlight').forEach(function(el) {
            el.classList.remove('js-target-highlight');
        });

        var target = targetId && document.getElementById(targetId);
        if (isHighlightable(target)) {
            target.classList.add('js-target-highlight');
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

// Whether the visitor has scrolled by themselves since the page started loading
var visitorScrolled = false;
['wheel', 'touchmove', 'keydown'].forEach(function(type) {
    window.addEventListener(type, function() {
        visitorScrolled = true;
    }, { once: true, passive: true });
});

// Also trigger hash highlight on window load (not for whole page sections, as above)
window.addEventListener('load', function() {
    var hash = window.location.hash.substring(1);
    var target = hash && document.getElementById(hash);
    if (!target) {
        return;
    }
    if (target.tagName !== 'SECTION') {
        target.classList.add('js-target-highlight');
    }
    // The browser set off for the anchor before the screenshots carousel was set up, which
    // shortens the page above it: aim again now that the layout has settled.
    if (!visitorScrolled) {
        target.scrollIntoView();
    }
});
