<?php
// Require composer
require './vendor/autoload.php';

// Set up phpdotenv
$dotenv = Dotenv\Dotenv::createImmutable( '../' );
$dotenv->load();

// Handle OAUTH2 authentication with Mastodon

// Disable some rules we don't need here
// phpcs:disable WordPress.NamingConventions, WordPress.WhiteSpace, WordPress.Security, Generic.WhiteSpace

// First, get the instance from GET parameter
$instance = $_GET['instance'];

// Check that we have a valid instance URL
if ( filter_var( $instance, FILTER_VALIDATE_URL ) === false ) {
  die( 'Invalid instance URL' );
}

// Redirect to the instance's authorization page
// If we're revoking access
if ( isset( $_GET['revoke'] ) ) {
  // Redirect to the instance's revoke page
  header( 'Location: ' . $instance . '/oauth/revoke?client_id=' . $_ENV['MASTODON_CLIENT_ID'] . '&redirect_uri=' . $_ENV['MASTODON_REDIRECT_URI'] );
  die();
} else {
  // If we're authorizing
  header( 'Location: ' . $instance . '/oauth/authorize?client_id=' . $_ENV['MASTODON_CLIENT_ID'] . '&redirect_uri=' . $_ENV['MASTODON_REDIRECT_URI'] . '&response_type=code&scope=read+write+follow' );
}
