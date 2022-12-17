<?php
// Disable some rules we don't need here
// phpcs:disable WordPress.NamingConventions, WordPress.WhiteSpace, WordPress.Security, Generic.WhiteSpace, WordPress.WP, Generic.Formatting.MultipleStatementAlignment, PEAR.Functions.FunctionCallSignature, WordPress.Arrays.ArrayIndentation, WordPress.Arrays.MultipleStatementAlignment, Generic.Arrays.DisallowShortArraySyntax, Squiz.PHP.CommentedOutCode
// Require composer
require './vendor/autoload.php';

// Set up phpdotenv
$dotenv = Dotenv\Dotenv::createImmutable( '../' );
$dotenv->load();

// Get .env variables
$redirect_uri = $_ENV['MASTODON_REDIRECT_URI'];
$scope = 'read read:accounts read:follows write write:follows follow';

// First, get the instance from GET parameter
$instance = $_GET['instance'];

// Save instance to local cookie
if ( isset( $_GET['instance'] ) ) {

  // Check that we have a valid instance URL
  if ( filter_var( $instance, FILTER_VALIDATE_URL ) === false ) {
    die( 'Invalid instance URL' );
  }

  // Save instance URL to cookies
  setcookie( 'finnish_mastodon_users_instance', $_GET['instance'], time() + ( 10 * 365 * 24 * 60 * 60 ) );

  // Save token redirect URL to cookies
  setcookie( 'finnish_mastodon_users_token_redirect', $redirect_uri . '/auth.php', time() + ( 10 * 365 * 24 * 60 * 60 ) );
}

// Redirect to the instance's authorization page
// If we're revoking access
if ( isset( $_GET['revoke'] ) ) {
  // Get the instance URL from cookie
  $instance = $_COOKIE['finnish_mastodon_users_instance'];

  // POST revoke request
  $client = new GuzzleHttp\Client();
  $response = $client->request( 'POST', $instance . '/oauth/revoke', [
    'form_params' => [
      'client_id' => $client_id,
      'client_secret' => $client_secret,
      'token' => $_COOKIE['finnish_mastodon_users_access_token'],
    ],
  ] );

// Redirect back to the app
header( 'Location: ' . $redirect_uri . '?logout=true' );

} else {
  // Check if we already have the code
  if ( isset( $_GET['code'] ) ) {
    $code = $_GET['code'];

    // Get the instance URL from cookie
    $instance = $_COOKIE['finnish_mastodon_users_instance'];

    // Get the instance URL from cookie this time
    $redirect_uri_token = $_COOKIE['finnish_mastodon_users_token_redirect'];

    // Get the client ID and secret from cookies
    $client_id = $_COOKIE['finnish_mastodon_users_client_id'];
    $client_secret = $_COOKIE['finnish_mastodon_users_client_secret'];

    // POST with header
    $client = new GuzzleHttp\Client();
    $response = $client->request( 'POST', $instance . '/oauth/token', [
      'form_params' => [
        'client_id' => $client_id,
        'client_secret' => $client_secret,
        'redirect_uri' => $redirect_uri_token,
        'grant_type' => 'authorization_code',
        'code' => $code,
        'scope' => $scope,
      ],
    ] );

    // Decode the response
    $response = json_decode( $response->getBody() );

    // Get access token
    $access_token = $response->access_token;

    // Save access token to local cookie
    setcookie( 'finnish_mastodon_users_access_token', $access_token, time() + ( 10 * 365 * 24 * 60 * 60 ) );

    // Redirect back to the app
    header( 'Location: ' . $redirect_uri );

  } else {

    // Create an application
    $client = new GuzzleHttp\Client();
    $response = $client->request( 'POST', $instance . '/api/v1/apps', [
      'form_params' => [
        'client_name' => 'Suomalaiset Mastodon-käyttäjät',
        'redirect_uris' => $redirect_uri . '/auth.php',
        'scopes' => $scope,
        'website' => 'https://mementomori.social/suomalaiset-mastodon-kayttajat',
      ],
    ] );

    // Decode the response
    $response = json_decode( $response->getBody() );

    // Get client ID and secret
    $client_id = $response->client_id;
    $client_secret = $response->client_secret;

    // Save client_id and client_secret to cookies
    setcookie( 'finnish_mastodon_users_client_id', $client_id, time() + ( 10 * 365 * 24 * 60 * 60 ) );
    setcookie( 'finnish_mastodon_users_client_secret', $client_secret, time() + ( 10 * 365 * 24 * 60 * 60 ) );

    // Redirect to the instance's authorization page
    header( 'Location: ' . $instance . '/oauth/authorize?client_id=' . $client_id . '&redirect_uri=' . $redirect_uri . '/auth.php&instance=' . $instance . '&response_type=code&scope=' . $scope . '&force_login=true' );
  }
}
