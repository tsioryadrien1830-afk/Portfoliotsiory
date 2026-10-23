<?php
get_header();
$theme_uri = get_template_directory_uri();

$hero_welcome = get_theme_mod("hero_welcome_setting", "Bienvenue !");
$hero_title   = get_theme_mod("hero_title_setting", "Tsiory Adrien<br>Graphiste & Web Designer");
$hero_desc    = get_theme_mod("hero_desc_setting", "Professionnel polyvalent dans le digital et la création visuelle : annotation d'images, design graphique, montage vidéo et création de sites web.");
$about_bio    = get_theme_mod("about_bio_setting", "Je m'appelle Tsiory Adrien et je suis un professionnel polyvalent dans le domaine du numérique et de la création visuelle. J'ai travaillé comme opérateur en ligne, spécialisé dans l'annotation et la segmentation d'images. En parallèle, je suis graphiste avec une maîtrise de Photoshop, Illustrator, InDesign, ainsi qu'en montage vidéo et en création de sites web (WordPress).");

$hero_round_img = get_theme_mod("hero_round_image_setting");
if (!$hero_round_img) {
    $hero_round_img = $theme_uri . "/assets/images/hero-round-animated.svg";
}

$phone_num   = get_theme_mod("phone_num_setting", "0331070897");
$whatsapp_num = get_theme_mod("whatsapp_num_setting", "0346975283");
$email_addr  = get_theme_mod("email_addr_setting", "radrientsiory@gmail.com");

$cv_file_url = get_theme_mod("cv_file_setting");
if (!$cv_file_url) {
    $cv_file_url = $theme_uri . "/assets/documents/CV_Tsiory_Adrien.pdf";
}

$phone_clean = preg_replace("/[^0-9+]/", "", $phone_num);
$whatsapp_digits = preg_replace("/[^0-9]/", "", $whatsapp_num);
if (strpos($whatsapp_digits, "0") === 0) {
    $whatsapp_clean = "+261" . substr($whatsapp_digits, 1);
} else {
    $whatsapp_clean = "+" . $whatsapp_digits;
}
?>

<!-- SECTION HERO / ACCUEIL -->
<section class="hero-section" id="accueil">
    <div class="hero-container-flex hero-fade-in-right">
        <div class="hero-content">
            <div class="hero-welcome-tag"><?php echo esc_html($hero_welcome); ?></div>
            <h1 class="hero-title"><?php echo wp_kses_post($hero_title); ?></h1>
            <p class="hero-description"><?php echo esc_html($hero_desc); ?></p>
            <div class="btn-group-action">
                <a href="#examples" class="btn-yellow">Voir mes réalisations</a>
            </div>
        </div>
        <div class="hero-decoration-round">
            <img src="<?php echo esc_url($hero_round_img); ?>" alt="Illustration Rond Animé">
        </div>
    </div>
</section>

<main class="portfolio-container">

    <!-- SECTION A PROPOS -->
    <section class="about-section" id="about">
        <div class="about-grid">
            <div class="about-img">
                <?php 
                $about_image = get_theme_mod("about_image_setting");
                if ($about_image) : ?>
                    <img src="<?php echo esc_url($about_image); ?>" alt="Photo de profil">
                <?php else : ?>
                    <img src="<?php echo $theme_uri; ?>/assets/images/profile-placeholder.svg" alt="Photo de profil">
                <?php endif; ?>
            </div>
            <div class="about-text">
                <h2 class="section-title" style="text-align: left;">A <span>propos</span></h2>
                <div class="subtitle" style="text-align: left;">Une vision, un style</div>
                <p><?php echo nl2br(esc_html($about_bio)); ?></p>
                
                <div class="btn-group-action">
                    <a href="<?php echo esc_url($cv_file_url); ?>" download class="btn-yellow">
                        <svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:currentColor;vertical-align:middle;margin-right:8px;"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                        <span>Mon CV</span>
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- SECTION COMPETENCES -->
    <section class="skills-section" id="skills">
        <h2 class="section-title">Compé<span>tences</span></h2>
        <div class="subtitle">Savoir-faire et domaines d'expertise</div>
        
        <div class="skills-grid">
            <div class="skill-card">
                <div class="skill-title"><span>Photoshop</span><span class="skill-percent">95%</span></div>
                <div class="skill-bar"><div class="skill-progress" data-progress="95" style="width: 0%;"></div></div>
            </div>
            <div class="skill-card">
                <div class="skill-title"><span>Web Design</span><span class="skill-percent">100%</span></div>
                <div class="skill-bar"><div class="skill-progress" data-progress="100" style="width: 0%;"></div></div>
            </div>
            <div class="skill-card">
                <div class="skill-title"><span>Illustrator</span><span class="skill-percent">90%</span></div>
                <div class="skill-bar"><div class="skill-progress" data-progress="90" style="width: 0%;"></div></div>
            </div>
            <div class="skill-card">
                <div class="skill-title"><span>WordPress</span><span class="skill-percent">75%</span></div>
                <div class="skill-bar"><div class="skill-progress" data-progress="75" style="width: 0%;"></div></div>
            </div>
            <div class="skill-card">
                <div class="skill-title"><span>After Effects</span><span class="skill-percent">70%</span></div>
                <div class="skill-bar"><div class="skill-progress" data-progress="70" style="width: 0%;"></div></div>
            </div>
            <div class="skill-card">
                <div class="skill-title"><span>Montage vidéo</span><span class="skill-percent">85%</span></div>
                <div class="skill-bar"><div class="skill-progress" data-progress="85" style="width: 0%;"></div></div>
            </div>
            <div class="skill-card">
                <div class="skill-title"><span>InDesign</span><span class="skill-percent">80%</span></div>
                <div class="skill-bar"><div class="skill-progress" data-progress="80" style="width: 0%;"></div></div>
            </div>
            <div class="skill-card">
                <div class="skill-title"><span>Annotation d'images</span><span class="skill-percent">100%</span></div>
                <div class="skill-bar"><div class="skill-progress" data-progress="100" style="width: 0%;"></div></div>
            </div>
        </div>
    </section>

    <!-- SECTION EXEMPLES -->
    <section class="examples-section" id="examples">
        <h2 class="section-title">Exem<span>ples</span></h2>
        <div class="subtitle">Une sélection de mes réalisations : logos, images, vidéos et animations.</div>

        <div class="filter-buttons">
            <button class="filter-btn active" data-filter="all">Tout</button>
            <button class="filter-btn" data-filter="logos">Logos</button>
            <button class="filter-btn" data-filter="images">Images</button>
            <button class="filter-btn" data-filter="videos">Vidéos</button>
        </div>

        <div class="examples-grid">
            <div class="example-card" data-category="logos">
                <img src="<?php echo $theme_uri; ?>/assets/images/example-logo1.svg" alt="Logo">
                <div class="example-overlay">
                    <div class="example-title">Logo + Identité visuelle</div>
                    <div class="example-sub">Illustrator + Photoshop</div>
                </div>
            </div>
            <div class="example-card" data-category="images">
                <img src="<?php echo $theme_uri; ?>/assets/images/example-retouche.svg" alt="Retouche">
                <div class="example-overlay">
                    <div class="example-title">Retouche d'image TOPO</div>
                    <div class="example-sub">Photoshop</div>
                </div>
            </div>
            <div class="example-card" data-category="videos">
                <video class="scroll-play-video" muted loop playsinline preload="metadata">
                    <source src="<?php echo $theme_uri; ?>/assets/videos/projet-video.mp4" type="video/mp4">
                </video>
                <div class="example-overlay">
                    <div class="example-title">Montage vidéo</div>
                    <div class="example-sub">Blender + After Effects</div>
                </div>
            </div>
            <div class="example-card" data-category="logos">
                <img src="<?php echo $theme_uri; ?>/assets/images/example-branding.svg" alt="Branding">
                <div class="example-overlay">
                    <div class="example-title">Logo + Branding</div>
                    <div class="example-sub">Illustrator</div>
                </div>
            </div>
            <div class="example-card" data-category="images">
                <img src="<?php echo $theme_uri; ?>/assets/images/example-visuel.svg" alt="Visuel">
                <div class="example-overlay">
                    <div class="example-title">Composition visuelle</div>
                    <div class="example-sub">Photoshop</div>
                </div>
            </div>
            <div class="example-card" data-category="videos">
                <video class="scroll-play-video" muted loop playsinline preload="metadata">
                    <source src="<?php echo $theme_uri; ?>/assets/videos/mon-animation.mp4" type="video/mp4">
                </video>
                <div class="example-overlay">
                    <div class="example-title">site one page </div>
                    <div class="example-sub">Wordpress</div>
                </div>
            </div>
        </div>
    </section>

    <!-- SECTION CONTACT -->
    <section class="contact-section" id="contact">
        <h2 class="section-title">Con<span>tact</span></h2>
        <div class="subtitle">Un projet en tête ? N'hésitez pas à me contacter directement !</div>

        <div class="contact-buttons-group">
            <a href="tel:<?php echo esc_attr($phone_clean); ?>" class="btn-contact-item">
                <svg viewBox="0 0 24 24"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                <div class="btn-contact-text">
                    <span class="btn-contact-title">Tél :</span>
                    <span class="btn-contact-val"><?php echo esc_html($phone_num); ?></span>
                </div>
            </a>

            <a href="https://wa.me/<?php echo esc_attr(ltrim($whatsapp_clean, '+')); ?>" target="_blank" class="btn-contact-item">
                <svg viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.51 1.036 3.531l-.679 2.479 2.548-.668c.983.536 2.111.838 3.308.838 3.18 0 5.766-2.586 5.767-5.766.001-3.18-2.585-5.78-5.767-5.78zm3.385 8.163c-.144.405-.837.774-1.17.822-.312.043-.72.062-2.17-.532-1.854-.759-3.045-2.651-3.138-2.775-.093-.124-.752-1.002-.752-1.91 0-.909.475-1.356.645-1.531.17-.175.371-.219.495-.219.124 0 .248.001.356.006.114.005.267-.043.418.32.155.372.532 1.298.578 1.392.046.093.077.202.015.326-.062.124-.093.202-.186.31-.093.108-.196.241-.28.324-.093.093-.19.195-.082.381.108.186.48 0.792 1.03 1.282.707.63 1.304.825 1.49 0.918.186.093.295.077.403-.046.108-.124.464-.542.588-.728.124-.186.248-.155.418-.093.17.062 1.082.51 1.268.603.186.093.31.14.356.217.046.077.046.45-.098.855z"/></svg>
                <div class="btn-contact-text">
                    <span class="btn-contact-title">WhatsApp :</span>
                    <span class="btn-contact-val"><?php echo esc_html($whatsapp_clean); ?></span>
                </div>
            </a>

            <a href="mailto:<?php echo esc_attr($email_addr); ?>" class="btn-contact-item">
                <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                <div class="btn-contact-text">
                    <span class="btn-contact-title">Email :</span>
                    <span class="btn-contact-val"><?php echo esc_html($email_addr); ?></span>
                </div>
            </a>
        </div>
    </section>

</main>

<?php
get_footer();
?>
