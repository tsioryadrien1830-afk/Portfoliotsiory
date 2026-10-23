document.addEventListener('DOMContentLoaded', function() {
    // 1. Menu Burger Toggle
    var menuToggle = document.getElementById('menuToggle');
    var headerRight = document.getElementById('headerRight');

    if (menuToggle && headerRight) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            headerRight.classList.toggle('active');
        });

        var navLinksMobile = headerRight.querySelectorAll('a');
        navLinksMobile.forEach(function(link) {
            link.addEventListener('click', function() {
                headerRight.classList.remove('active');
            });
        });

        document.addEventListener('click', function(e) {
            if (!headerRight.contains(e.target) && !menuToggle.contains(e.target)) {
                headerRight.classList.remove('active');
            }
        });
    }

    // 2. Lightbox Plein écran
    var lightboxModal = document.createElement('div');
    lightboxModal.className = 'custom-lightbox-modal';
    lightboxModal.innerHTML = `
        <div class="lightbox-content">
            <button class="lightbox-close" aria-label="Fermer">&times;</button>
            <div class="lightbox-media-container"></div>
        </div>
    `;
    document.body.appendChild(lightboxModal);

    var mediaContainer = lightboxModal.querySelector('.lightbox-media-container');
    var closeBtn = lightboxModal.querySelector('.lightbox-close');

    var exampleCards = document.querySelectorAll('.example-card');
    exampleCards.forEach(function(card) {
        card.addEventListener('click', function() {
            var img = card.querySelector('img');
            var video = card.querySelector('video');

            mediaContainer.innerHTML = '';

            if (img) {
                var newImg = document.createElement('img');
                newImg.src = img.src;
                newImg.alt = img.alt || 'Aperçu';
                mediaContainer.appendChild(newImg);
                lightboxModal.classList.add('active');
            } else if (video) {
                var newVideo = document.createElement('video');
                newVideo.src = video.querySelector('source') ? video.querySelector('source').src : video.src;
                newVideo.controls = true;
                newVideo.autoplay = true;
                newVideo.playsInline = true;
                mediaContainer.appendChild(newVideo);
                lightboxModal.classList.add('active');
            }
        });
    });

    function closeLightbox() {
        lightboxModal.classList.remove('active');
        var vid = mediaContainer.querySelector('video');
        if (vid) { vid.pause(); }
        mediaContainer.innerHTML = '';
    }

    closeBtn.addEventListener('click', closeLightbox);
    lightboxModal.addEventListener('click', function(e) {
        if (e.target === lightboxModal) { closeLightbox(); }
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') { closeLightbox(); }
    });

    // 3. Animation d'apparition au défilement (IntersectionObserver)
    var revealElements = document.querySelectorAll('.section-title, .subtitle, .about-grid, .example-card, .btn-contact-item');
    revealElements.forEach(function(el) {
        el.classList.add('reveal-item');
    });

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, { threshold: 0.15 });

        revealElements.forEach(function(el) {
            observer.observe(el);
        });
    } else {
        revealElements.forEach(function(el) { el.classList.add('revealed'); });
    }

    // 4. ANIMATION DES BARRES DE COMPÉTENCES AU SCROLL
    var skillProgressBars = document.querySelectorAll('.skill-progress');
    
    function animateSkillBars() {
        skillProgressBars.forEach(function(bar) {
            var targetWidth = bar.getAttribute('data-progress');
            if (targetWidth) {
                bar.style.width = targetWidth + '%';
            }
        });
    }

    var skillsSection = document.getElementById('skills');
    if (skillsSection && 'IntersectionObserver' in window) {
        var skillsObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    animateSkillBars();
                    skillsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        skillsObserver.observe(skillsSection);
    } else {
        animateSkillBars();
    }

    // 5. Filtrage des exemples
    var filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            filterButtons.forEach(function(btn) { btn.classList.remove('active'); });
            this.classList.add('active');

            var filterValue = this.getAttribute('data-filter');

            exampleCards.forEach(function(card) {
                var cardCategory = card.getAttribute('data-category');
                if (filterValue === 'all' || cardCategory === filterValue) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });

    // 6. Navigation active au scroll
    var navLinks = document.querySelectorAll('.site-nav a');
    var sections = document.querySelectorAll('section');

    window.addEventListener('scroll', function() {
        var current = '';
        var scrollPosition = window.pageYOffset + 250;

        sections.forEach(function(section) {
            var sectionTop = section.offsetTop;
            var sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(function(link) {
            link.classList.remove('active');
            var href = link.getAttribute('href');
            if (href === '#' + current) {
                link.classList.add('active');
            }
        });
    });
});
