// Function for getting a cookie in Vanilla JS
function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");

  // Check in case it doesn't exist
  if (parts.length == 1) return null;

  // Return the cookie value, error if it doesn't exist
  try {
    return parts.pop().split(";").shift();
  }
  catch {
    return null;
  }
}

// Function for authing
function auth() {
  // Instance URL
  const authInstance = document.getElementById('auth-instance');

  // Validate URL field
  if (!authInstance.value) {
    authInstance.classList.add('is-invalid');

  // If is not URL
  } else if (!authInstance.value.startsWith('https://')) {
    authInstance.classList.add('is-invalid');
  } else {

    // Save instance URL to local storage
    localStorage.setItem('finnish_mastodon_user_authed_instance_url', authInstance.value);

    // Add instance URL as variable
    const authedInstanceUrl = localStorage.getItem('finnish_mastodon_user_authed_instance_url');

    // Authorize with our own auth.php file from current location
    const auth = new URL(window.location.href + "auth.php?instance=" + authedInstanceUrl);

    // Go to Mastodon auth page
    window.location.href = `${auth}`;
  }
}

// Function for revoking auth
function revoke() {
  // Auth button
  const authButton = document.getElementById('button-auth');

  // Instance URL
  const authedInstanceUrl = localStorage.getItem('finnish_mastodon_user_authed_instance_url');

  // Clear the value of the instance URL field
  document.getElementById('auth-instance').value = '';

  // Remove the instance URL from local storage
  localStorage.removeItem('finnish_mastodon_user_authed_instance_url');

  // Change button text
  authButton.innerText = 'Kirjaudu sisään';

  // Remove access token cookie
  document.cookie = "finnish_mastodon_users_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  localStorage.removeItem('finnish_mastodon_users_access_token');

  // Remove access token from local storage
  localStorage.removeItem('finnish_mastodon_users_access_token');

  // Remove code from cookies
  document.cookie = "finnish_mastodon_users_code=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  localStorage.removeItem('finnish_mastodon_users_code');

  // Remove token redirect from cookies
  document.cookie = "finnish_mastodon_users_token_redirect=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  // Remove instance from cookies
  document.cookie = "finnish_mastodon_users_instance=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  // Revoke access token with our own auth.php file
  const revoke = new URL(window.location.href + "auth.php?instance=" + authedInstanceUrl + "&revoke=true");
  window.location.href = `${revoke}`;
}

// When DOM is ready
addEventListener('DOMContentLoaded', () => {

  // Init
  let access_token = null;

  // Auth button
  const authButton = document.getElementById('button-auth');

  // Instance URL
  const authInstance = document.getElementById('auth-instance');

  // Initial login button
  authButton.innerText = 'Kirjaudu sisään';

  // If we have just logged out
  if (window.location.href.includes('logout=true')) {
    // Remove access token cookie
    document.cookie = "finnish_mastodon_users_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    access_token = null;

    // Remove finnish_mastodon_users_token_redirect
    document.cookie = "finnish_mastodon_users_token_redirect=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Remove finnish_mastodon_users_instance
    document.cookie = "finnish_mastodon_users_instance=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Remove access token from local storage
    localStorage.removeItem('finnish_mastodon_users_access_token');

    // Remove finnish_mastodon_users_count from local storage
    localStorage.removeItem('finnish_mastodon_users_count');

    // Remove instance name from local storage
    localStorage.removeItem('finnish_mastodon_users_authed_user_id');

    // Remove instance URL from local storage
    localStorage.removeItem('finnish_mastodon_user_authed_instance_url');

    // Remove finnish_mastodon_users_authed_user_acct
    localStorage.removeItem('finnish_mastodon_users_authed_user_acct');

    // Remove finnish_mastodon_users_authed_user_instance
    localStorage.removeItem('finnish_mastodon_users_authed_user_instance');

    // Remove finnish_mastodon_users_list_has_been_updated
    localStorage.removeItem('finnish_mastodon_users_list_has_been_updated');

    // Remove finnish_mastodon_users_timestamp
    localStorage.removeItem('finnish_mastodon_users_timestamp');

    // Remove finnish_mastodon_users_authed_user_url
    localStorage.removeItem('finnish_mastodon_users_authed_user_url');

    // Remove finnish_mastodon_users_last_updated
    localStorage.removeItem('finnish_mastodon_users_last_updated');

    // Remove finnish_mastodon_users_to_be_checked
    localStorage.removeItem('finnish_mastodon_users_to_be_checked');

    // Remove finnish_mastodon_users_following_count
    localStorage.removeItem('finnish_mastodon_users_checked_amount');

    // Remove finnish_mastodon_users_not_checked_amount
    localStorage.removeItem('finnish_mastodon_users_not_checked_amount');

    // Remove all finnish_mastodon_user_follow_status_*
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i).includes('finnish_mastodon_user_follow_status_')) {
        localStorage.removeItem(localStorage.key(i));
      }
    }

    // Clear logout from URL
    window.history.replaceState({}, document.title, "/" + window.location.pathname.split("/")[1] + "/");
  } else {
    // Get access_token from a cookie
    access_token = getCookie('finnish_mastodon_users_access_token');
  }

  // If we have access_token, save it to local storage
  if (access_token) {
    // Save
    localStorage.setItem('finnish_mastodon_users_access_token', access_token)

    // Clear access_token from URL
    window.history.replaceState({}, document.title, "/" + window.location.pathname.split("/")[1] + "/");
  }

  // If we have logged in
  if (localStorage.getItem('finnish_mastodon_users_access_token')) {

    // Change login button to logout button
    authButton.innerText = 'Kirjaudu ulos';

    // Lock instance URL field and add instance URL to it
    authInstance.value = localStorage.getItem('finnish_mastodon_user_authed_instance_url');
    authInstance.setAttribute('readonly', true);

    // Add event listener to logout button
    authButton.addEventListener('click', () => {
      revoke();
    })

  } else {
    // Authenticate request with a click of a button
    authButton.addEventListener('click', () => {
      auth();
    })

    // Authenticate request with Enter key
    authInstance.addEventListener('keyup', (e) => {
      if (e.keyCode === 13) {
        auth();
      }
    }
    )
  }
});
