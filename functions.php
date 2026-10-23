<?php
function portfolio_theme_assets() {
    wp_enqueue_style('portfolio-style', get_stylesheet_uri(), array(), '1.0.0');
    wp_enqueue_script('portfolio-script', get_template_directory_uri() . '/js/filter.js', array(), '1.0.0', true);
}
add_action('wp_enqueue_scripts', 'portfolio_theme_assets');

add_theme_support('post-thumbnails');

function portfolio_customize_register($wp_customize) {
    $wp_customize->add_section('portfolio_theme_options', array(
        'title'    => __('Personnalisation Portfolio Pro', 'portfolio-tsiory-pro'),
        'priority' => 30,
    ));

    // Logo / Image à côté de Tsiory. dans le menu
    $wp_customize->add_setting('header_logo_image_setting', array(
        'default'   => '',
        'transport' => 'refresh',
    ));
    $wp_customize->add_control(new WP_Customize_Image_Control($wp_customize, 'header_logo_image_control', array(
        'label'    => __('Logo / Image en-tête (Menu)', 'portfolio-tsiory-pro'),
        'section'  => 'portfolio_theme_options',
        'settings' => 'header_logo_image_setting',
    )));

    // Image / Animation ronde sur la section d'accueil (Accueil droite)
    $wp_customize->add_setting('hero_round_image_setting', array(
        'default'   => '',
        'transport' => 'refresh',
    ));
    $wp_customize->add_control(new WP_Customize_Image_Control($wp_customize, 'hero_round_image_control', array(
        'label'    => __('Image / Animation ronde (Accueil)', 'portfolio-tsiory-pro'),
        'section'  => 'portfolio_theme_options',
        'settings' => 'hero_round_image_setting',
    )));

    $wp_customize->add_setting('about_image_setting', array(
        'default'   => '',
        'transport' => 'refresh',
    ));
    $wp_customize->add_control(new WP_Customize_Image_Control($wp_customize, 'about_image_control', array(
        'label'    => __('Photo de profil (À propos)', 'portfolio-tsiory-pro'),
        'section'  => 'portfolio_theme_options',
        'settings' => 'about_image_setting',
    )));

    $wp_customize->add_setting('cv_file_setting', array(
        'default'   => '',
        'transport' => 'refresh',
    ));
    $wp_customize->add_control(new WP_Customize_Upload_Control($wp_customize, 'cv_file_control', array(
        'label'    => __('Fichier CV (PDF)', 'portfolio-tsiory-pro'),
        'section'  => 'portfolio_theme_options',
        'settings' => 'cv_file_setting',
    )));

    $wp_customize->add_setting('hero_title_setting', array(
        'default'   => 'Tsiory Adrien<br>Graphiste & Web Designer',
        'transport' => 'refresh',
    ));
    $wp_customize->add_control('hero_title_control', array(
        'label'    => __('Titre principal (Accueil)', 'portfolio-tsiory-pro'),
        'section'  => 'portfolio_theme_options',
        'settings' => 'hero_title_setting',
        'type'     => 'textarea',
    ));

    $wp_customize->add_setting('hero_desc_setting', array(
        'default'   => 'Professionnel polyvalent dans le digital et la création visuelle : annotation dimages, design graphique, montage vidéo et création de sites web.',
        'transport' => 'refresh',
    ));
    $wp_customize->add_control('hero_desc_control', array(
        'label'    => __('Description courte (Accueil)', 'portfolio-tsiory-pro'),
        'section'  => 'portfolio_theme_options',
        'settings' => 'hero_desc_setting',
        'type'     => 'textarea',
    ));

    $wp_customize->add_setting('about_bio_setting', array(
        'default'   => 'Je mappelle Tsiory Adrien et je suis un professionnel polyvalent dans le domaine du numérique et de la création visuelle.',
        'transport' => 'refresh',
    ));
    $wp_customize->add_control('about_bio_control', array(
        'label'    => __('Texte biographie (À propos)', 'portfolio-tsiory-pro'),
        'section'  => 'portfolio_theme_options',
        'settings' => 'about_bio_setting',
        'type'     => 'textarea',
    ));

    $wp_customize->add_setting('phone_num_setting', array(
        'default'   => '0331070897',
        'transport' => 'refresh',
    ));
    $wp_customize->add_control('phone_num_control', array(
        'label'    => __('Numéro de Téléphone', 'portfolio-tsiory-pro'),
        'section'  => 'portfolio_theme_options',
        'settings' => 'phone_num_setting',
        'type'     => 'text',
    ));

    $wp_customize->add_setting('whatsapp_num_setting', array(
        'default'   => '0346975283',
        'transport' => 'refresh',
    ));
    $wp_customize->add_control('whatsapp_num_control', array(
        'label'    => __('Numéro WhatsApp', 'portfolio-tsiory-pro'),
        'section'  => 'portfolio_theme_options',
        'settings' => 'whatsapp_num_setting',
        'type'     => 'text',
    ));

    $wp_customize->add_setting('email_addr_setting', array(
        'default'   => 'radrientsiory@gmail.com',
        'transport' => 'refresh',
    ));
    $wp_customize->add_control('email_addr_control', array(
        'label'    => __('Adresse Email', 'portfolio-tsiory-pro'),
        'section'  => 'portfolio_theme_options',
        'settings' => 'email_addr_setting',
        'type'     => 'text',
    ));
}
add_action('customize_register', 'portfolio_customize_register');
?>
