<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tsiory - Portfolio Pro</title>
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>

<?php
$phone_num   = get_theme_mod('phone_num_setting', '0331070897');
$whatsapp_num = get_theme_mod('whatsapp_num_setting', '0346975283');
$email_addr  = get_theme_mod('email_addr_setting', 'radrientsiory@gmail.com');

$header_logo_img = get_theme_mod('header_logo_image_setting');
if (!$header_logo_img) {
    $header_logo_img = get_template_directory_uri() . '/assets/images/header-logo-icon.svg';
}

$phone_clean = preg_replace('/[^0-9+]/', '', $phone_num);
$whatsapp_digits = preg_replace('/[^0-9]/', '', $whatsapp_num);
if (strpos($whatsapp_digits, '0') === 0) {
    $whatsapp_clean = '+261' . substr($whatsapp_digits, 1);
} else {
    $whatsapp_clean = '+' . $whatsapp_digits;
}
?>

<header class="site-header">
    <div class="site-logo">
        <a href="#accueil" style="display: flex; align-items: center; gap: 12px; text-decoration: none;">
            <img src="<?php echo esc_url($header_logo_img); ?>" alt="Logo T" class="site-logo-icon">
            <span class="logo-text-title">Tsiory<span class="dot">.</span></span>
        </a>
    </div>

    <!-- Bouton Burger Mobile -->
    <button class="menu-toggle" id="menuToggle" aria-label="Menu">
        <span></span>
        <span></span>
        <span></span>
    </button>

    <div class="header-right" id="headerRight">
        <nav class="site-nav">
            <a href="#accueil" class="active">Accueil</a>
            <a href="#about">A propos</a>
            <a href="#skills">Compétences</a>
            <a href="#examples">Exemples</a>
            <a href="#contact">Contact</a>
        </nav>
        <div class="social-icons">
            <a href="tel:<?php echo esc_attr($phone_clean); ?>" class="social-btn" title="Téléphone (<?php echo esc_attr($phone_num); ?>)">
                <svg viewBox="0 0 24 24"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
            </a>
            <a href="https://wa.me/<?php echo esc_attr(ltrim($whatsapp_clean, '+')); ?>" target="_blank" class="social-btn" title="WhatsApp (<?php echo esc_attr($whatsapp_clean); ?>)">
                <svg viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.51 1.036 3.531l-.679 2.479 2.548-.668c.983.536 2.111.838 3.308.838 3.18 0 5.766-2.586 5.767-5.766.001-3.18-2.585-5.78-5.767-5.78zm3.385 8.163c-.144.405-.837.774-1.17.822-.312.043-.72.062-2.17-.532-1.854-.759-3.045-2.651-3.138-2.775-.093-.124-.752-1.002-.752-1.91 0-.909.475-1.356.645-1.531.17-.175.371-.219.495-.219.124 0 .248.001.356.006.114.005.267-.043.418.32.155.372.532 1.298.578 1.392.046.093.077.202.015.326-.062.124-.093.202-.186.31-.093.108-.196.241-.28.324-.093.093-.19.195-.082.381.108.186.48 0.792 1.03 1.282.707.63 1.304.825 1.49 0.918.186.093.295.077.403-.046.108-.124.464-.542.588-.728.124-.186.248-.155.418-.093.17.062 1.082.51 1.268.603.186.093.31.14.356.217.046.077.046.45-.098.855z"/></svg>
            </a>
            <a href="mailto:<?php echo esc_attr($email_addr); ?>" class="social-btn" title="Email (<?php echo esc_attr($email_addr); ?>)">
                <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
            </a>
        </div>
    </div>
</header>
