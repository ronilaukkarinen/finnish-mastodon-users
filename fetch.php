<?php
// Disable some rules we don't need here
// phpcs:disable WordPress.NamingConventions, WordPress.WhiteSpace, WordPress.Security, Generic.WhiteSpace, WordPress.WP, Generic.Formatting.MultipleStatementAlignment, PEAR.Functions.FunctionCallSignature, WordPress.Arrays.ArrayIndentation, WordPress.Arrays.MultipleStatementAlignment, Generic.Arrays.DisallowShortArraySyntax, Squiz.PHP.CommentedOutCode, WordPress.PHP.YodaConditions, WordPress.PHP.DiscouragedPHPFunctions

// Fetch individual user json locally to a directory from following_accounts.csv
// Usage: php fetch.php
// Cron job for every 1 hour: 0 * * * * php /home/mastodon/suomalaiset-mastodon-kayttajat/fetch.php

// Set up some variables
$csv = 'following_accounts.csv';
$dir = 'cache';
$csv_data = array_map('str_getcsv', file($csv));
$csv_data = array_slice($csv_data, 1); // Remove header row
$csv_data = array_map(null, ...$csv_data); // Transpose array
$csv_data = array_combine($csv_data[0], $csv_data[1]); // Make array associative

// Only allow command line use
if (php_sapi_name() !== 'cli') {
  die('This script can only be run from the command line.');
}

// Fetch json from API
foreach ($csv_data as $key => $value) {
  // If key contains mastodon.testausserveri.fi, replace it with testausserveri.fi
  if ( strpos($key, 'mastodon.testausserveri.fi') !== false ) {
    $key = str_replace('mastodon.testausserveri.fi', 'testausserveri.fi', $key);
  }

  $url = 'https://mementomori.social/api/v1/accounts/lookup?acct=' . $key;
  $json = file_get_contents($url);
  $obj = json_decode($json);

  if (empty($obj)) {
    echo 'No user found for ' . $key . PHP_EOL;
    continue;
  }

  // Save json to file, use username as file name
  $file = $dir . '/' . $key . '.json';

  // If file exists, skip it
  if ( file_exists( $file ) ) {
    echo $key . ' already exists, skipping' . PHP_EOL;
    continue;
  } else {
    file_put_contents($file, $json);
  }

  // Echo message
  echo $key . ' saved to ' . $file . PHP_EOL;
}
