// When DOM is ready
addEventListener('DOMContentLoaded', () => {

  // Auth button
  const authButton = document.getElementById('button-auth');

  // Instance URL
  const authInstance = document.getElementById('auth-instance');

  // Initial login button
  authButton.innerText = 'Kirjaudu sisään';

  // If we have logged in
  if (localStorage.getItem('finnish_mastodon_users_access_token')) {

    // Change login button to logout button
    authButton.innerText = 'Kirjaudu ulos'

    // Lock instance URL field and add instance URL to it
    authInstance.value = localStorage.getItem('finnish_mastodon_user_authed_instance')
    authInstance.setAttribute('readonly', true)

    authButton.addEventListener('click', (event) => {
      localStorage.removeItem('code')
      authButton.innerText = 'Kirjaudu sisään'

      // Revoke access token with our own auth.php file
      const revoke = new URL("auth.php?instance=" + authedInstance + "&revoke=true")

      // Go to Mastodon auth page
      window.location.href = `${revoke}`
    })
  } else {
    // Authenticate request with a click of a button
    authButton.addEventListener('click', (event) => {

      // Validate URL field
      if (!authInstance.value) {
        authInstance.classList.add('is-invalid');

      // If is not URL
      } else if (!authInstance.value.startsWith('https://')) {
        authInstance.classList.add('is-invalid');
      } else {
        // Save instance URL to local storage
        localStorage.setItem('finnish_mastodon_user_authed_instance', authInstance.value)

        // Add instance URL as variable
        const authedInstance = localStorage.getItem('finnish_mastodon_user_authed_instance')

        // Authorize with our own auth.php file
        const auth = new URL("auth.php?instance=" + authedInstance)

        // Go to Mastodon auth page
        window.location.href = `${auth}`
      }
    })
  }

});
