// Styles
import './style.css'

// Import moment.js with Finnish locale
import moment from 'moment/min/moment-with-locales';

// Set Finnish locale
moment.locale('fi')

// Import twemoji
import twemoji from 'twemoji'

// When DOM is ready
addEventListener('DOMContentLoaded', (event) => {

  // Get last modified time response header of following_accounts.csv file with fetch
  fetch('following_accounts.csv', {
    method: 'HEAD'
  })
  // Add last modified premise to element
  .then(response => {

    // Set up moment.js
    moment.locale('fi');

    const lastUpdated = response.headers.get('Last-Modified');
    const lastUpdatedDate = moment(lastUpdated);

    const lastUpdatedElement = document.getElementById('updated');

    // Add last updated in textual format to element title attribute
    lastUpdatedElement.setAttribute('title', lastUpdatedDate.locale('fi').format('LLLL'));

    // Last updated from now
    const lastUpdatedFromNow = lastUpdatedDate.fromNow();
    lastUpdatedElement.innerHTML = lastUpdatedFromNow;
  })
  .catch(error => {
    console.error('Error:', error);
  });

  // ----------------------------------------

  // Auth button
  const authButton = document.getElementById('button-auth')

  // Instance URL
  const authInstance = document.getElementById('auth-instance')

  // Initial login button
  authButton.innerText = 'Kirjaudu sisään'

  const showInstructions = document.getElementById('show-instructions');
  const instructions = document.getElementById('instructions');

  showInstructions.addEventListener('click', (event) => {
    const isExpanded = showInstructions.getAttribute('aria-expanded') === 'true' || false;

    // Hidden attribute toggle
    instructions.hidden = !instructions.hidden;

    showInstructions.setAttribute('aria-expanded', !isExpanded);
    instructions.setAttribute('aria-hidden', isExpanded);
  });

  // Save code to local storage
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  if (code) {
    localStorage.setItem('finnish_mastodon_users_code', code)

    // Get access token
    const token = new URL(localStorage.getItem('finnish_mastodon_user_authed_instance') + "/oauth/token")
    token.searchParams.set('client_id', import.meta.env.VITE_MASTODON_CLIENT_ID)
    token.searchParams.set('client_secret', import.meta.env.VITE_MASTODON_CLIENT_SECRET)
    token.searchParams.set('redirect_uri', import.meta.env.VITE_MASTODON_REDIRECT_URI)
    token.searchParams.set('code', code)
    token.searchParams.set('grant_type', 'authorization_code')
    token.searchParams.set('scope', 'read write follow')

    // Save access token to local storage
    fetch(token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data => {
        localStorage.setItem('finnish_mastodon_users_access_token', data.access_token)
        localStorage.setItem('finnish_mastodon_users_token_type', data.token_type)
        localStorage.setItem('finnish_mastodon_users_scope', data.scope)
        localStorage.setItem('finnish_mastodon_users_created_at', data.created_at)

        // Redirect back to the app
        window.location.href = import.meta.env.VITE_MASTODON_REDIRECT_URI
      })
  }

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

      // Remoke Mastodon access
      const revoke = new URL(localStorage.getItem('finnish_mastodon_user_authed_instance') + "/oauth/revoke")
      revoke.searchParams.set('client_id', import.meta.env.VITE_MASTODON_CLIENT_ID)
      revoke.searchParams.set('client_secret', import.meta.env.VITE_MASTODON_CLIENT_SECRET)
      revoke.searchParams.set('token', localStorage.getItem('finnish_mastodon_users_code'))

      fetch(revoke, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
    })
  } else {
    // Authenticate request with a click of a button
    authButton.addEventListener('click', (event) => {

      // Validate URL field
      if (!authInstance.value) {
        authInstance.classList.add('is-invalid')
      } else {
        // Save instance URL to local storage
        localStorage.setItem('finnish_mastodon_user_authed_instance', authInstance.value)

        // Authorize
        const auth = new URL( localStorage.getItem('finnish_mastodon_user_authed_instance') + "/oauth/authorize")
        auth.searchParams.set('client_id', import.meta.env.VITE_MASTODON_CLIENT_ID)
        auth.searchParams.set('redirect_uri',  import.meta.env.VITE_MASTODON_REDIRECT_URI)
        auth.searchParams.set('response_type', 'code')
        auth.searchParams.set('scope', 'read write follow')

        // Go to Mastodon auth page
        window.location.href = `${auth}`
      }
    })
  }

  // ----------------------------------------
  // Parse CSV and add users in Vanilla JS
  fetch("following_accounts.csv")
    .then(response => response.text())
    .then(result => {
      let csv = result;
      let lines = csv.split("\n");
      lines.shift();
      document.getElementById("user-list").innerHTML = "";
      let counter = 0;
      lines.forEach((line) => {
        if (line !== "") {
          let parts = line.split(",");
          let user = parts[0];
          let acct = user.split("@")[0];
          let instance = user.split("@")[1];

          // Exceptions for vivaldi.net and testausserveri.fi
          // Add instances to array
          let instanceExceptions = [
            "vivaldi.net",
            "mastodon.ellipsis.fi",
            "mastodon.testausserveri.fi",
            "masto.henkkalaukka.fi",
          ];

          // Check if instance is in array
          if (instanceExceptions.includes(instance)) {
            // If instance is in array, change user to acct
            user = acct;

            // Exception for vivaldi.net
            if ( instance === "vivaldi.net" ) {
              instance = "social.vivaldi.net";
            }
          }

          fetch("https://"+instance+"/api/v1/accounts/lookup?acct="+user)
            .then(response => response.json())
            .then(json => {
              let display_name = json.display_name;
              let bio = json.note;
              display_name = twemoji.parse(display_name, {className: "emojione"});
              bio = twemoji.parse(bio, {className: "emojione"});

              // Init follow button
              let followButton = `<a href="https://${instance}/@${user}" class="button">Siirry profiiliin</a>`;

            try {
              if (json.emojis.length > 0) {
                json.emojis.forEach(dp_emoji => {
                  display_name = display_name.replaceAll(`:${dp_emoji.shortcode}:`, `<img src="${dp_emoji.url}" alt="Emoji ${dp_emoji.shortcode}" class="emojione">`);
                    bio = bio.replaceAll(`:${dp_emoji.shortcode}:`, `<img src="${dp_emoji.url}" alt="Emoji ${dp_emoji.shortcode}" class="emojione">`);
                  });
                }
              } catch (e) {}

              // If we're logged in, add follow button if not already following (check relationship)
              if (localStorage.getItem('finnish_mastodon_users_access_token')) {

                fetch(localStorage.getItem('finnish_mastodon_user_authed_instance') + "/api/v1/accounts/search?access_token=" + localStorage.getItem('finnish_mastodon_users_access_token') + "&q=" + user + "&following=true&limit=1")
                  .then(response => response.json())
                  .then(json_relationship => {

                  console.log(user);
                  console.log(json_relationship);

                  // Check if we're following the user, if the first search result from following is actually our user
                  if (json_relationship.length > 0 && json.id === json_relationship[0].id) {
                    followButton = `<button class="button button-unfollow" data-id="${json.id}" data-instance="${instance}" data-acct="${acct}" data-user="${user}">Lopeta seuraaminen</button>`;
                  } else {
                    followButton = `<button class="button button-follow" data-id="${json.id}" data-instance="${instance}" data-acct="${acct}" data-user="${user}">Seuraa</button>`;
                  }

              // Template for user-list to use in innerHTML
              let userTemplate = `
              <li class="account-card">\
              <a class="account-card__permalink" href="https://${instance}/@${acct}" class="status__display-name" aria-label="Seuraa käyttäjää ${user}">\
                <div class="account-card__header" aria-hidden="true">\
                  <img src="${json.header}" alt="Käyttäjän ${acct} header-kuva">\
                </div>\
                <div class="account-card__title">\
                  <div class="account-card__title__avatar">\
                    <div class="account__avatar" style="width: 56px; height: 56px;">\
                      <img src="${json.avatar}" alt="Käyttäjän ${acct} profiilikuva">\
                    </div>
                  </div>\
                  <span class="display-name">\
                    <bdi>\
                      <strong class="display-name__html">${display_name}</strong>\
                    </bdi>\
                    <span class="display-name__account">${user}</span>\
                  </span>\
                </div>\
              </a>\
              <div class="account-card__bio">\
                ${bio}\
              </div>\
              <div class="account-card__actions">\
                <div class="account-card__counters">\
                  <div class="account-card__counters__item">\
                    <span>${json.statuses_count}</span>\
                    <small><span>Viestit</span></small>\
                  </div>\
                  <div class="account-card__counters__item">\
                    <span>${json.following_count}</span>\
                    <small><span>Seuraajat</span></small>\
                  </div>\
                  <div class="account-card__counters__item">\
                    <span>${json.followers_count}</span>\
                    <small><span>Seurataan</span></small>\
                  </div>\
                </div>\
                <div class="account-card__actions__button">\
                  ${followButton}\
                </div>\
              </div>\
            </li>
            `

            // Add event listener to button-unfollow and button-follow
            function unfollow() {
              // Add event listener to button-unfollow
              const unfollowButtons = document.querySelectorAll('.button-unfollow')
              unfollowButtons.forEach((unfollowButton) => {
                unfollowButton.addEventListener('click', (event) => {
                  const account = event.target.getAttribute('data-id')

                  // Unfollow account
                  const unfollow = new URL(localStorage.getItem('finnish_mastodon_user_authed_instance') + "/api/v1/accounts/" + account + "/unfollow")
                  fetch(unfollow, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': localStorage.getItem('finnish_mastodon_users_token_type') + ' ' + localStorage.getItem('finnish_mastodon_users_access_token')
                    }
                  })
                    .then(response => response.json())
                    .then(data => {

                    // Remove button-unfollow and add button-follow
                    event.target.classList.remove('button-unfollow')
                    event.target.classList.add('button-follow')

                    // Change text to "Follow"
                    event.target.innerHTML = "Seuraa"
                    })
                })
              })
            }

            // Add event listener to button-follow
            function follow() {

              // Add event listener to button-follow
              const followButtons = document.querySelectorAll('.button-follow')
              followButtons.forEach((followButton) => {
                followButton.addEventListener('click', (event) => {
                  const account = event.target.getAttribute('data-id')

                  // Follow account
                  const follow = new URL(localStorage.getItem('finnish_mastodon_user_authed_instance') + "/api/v1/accounts/" + account + "/follow")
                  fetch(follow, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': localStorage.getItem('finnish_mastodon_users_token_type') + ' ' + localStorage.getItem('finnish_mastodon_users_access_token')
                    }
                  })
                    .then(response => response.json())
                    .then(data => {

                      // Replace follow button (event target) class
                      event.target.classList.remove('button-follow');
                      event.target.classList.add('button-unfollow');

                      // Replace follow button (event target) text
                      event.target.innerHTML = "Lopeta seuraaminen";
                    })
                })
              })
            }

            // Append userTemplate to user-list
            document.getElementById("user-list").innerHTML += userTemplate;
            follow();
            unfollow();
            });

          }

          });

          counter++;
          document.getElementById("user-count").innerHTML = counter;
        }
      });
    }
  );

});

const headerInfo = `
<h1>
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512"><path fill="currentColor" d="M64 144c26.5 0 48-21.5 48-48s-21.5-48-48-48S16 69.5 16 96s21.5 48 48 48zM192 64c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zM64 464c26.5 0 48-21.5 48-48s-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48zm48-208c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48z"/></svg>
  Suomalaiset Mastodon-käyttäjät
</h1>

<p>Koska Mastodonin käyttäjiä on alkuun hieman hankala löytää palvelun hajautuksen vuoksi, olen kasannut tähän listan suomalaisista käyttäjistä eri instansseilta, käyttäjien itsensä suostumuksella. Listaa päivitetään säännöllisesti.</p>

<h2>Seuraa nappia painamalla</h2>

<p>Jotta voit seurata ihmisiä suoraan listalta, sinun täytyy ensin sallia lupa sovelluksen käyttöön. Tämän jälkeen voit seurata listaa painamalla <b>Seuraa</b>-nappia.</p>

  <div class="label_input">
    <label for="auth-instance">Instanssisi URL-osoite</label>

    <div class="label_input__wrapper">
      <input type="url" class="auth-input" id="auth-instance" placeholder="https://mastodon.social">
      <button class="button" id="button-auth">Ladataan...</button>
    </div>
  </div>
`

const instructions = `
<!-- Accessible show instructions toggle -->
<button class="button" id="show-instructions" aria-expanded="false" aria-controls="instructions"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 512 512"><path fill="currentColor" d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512zM169.8 165.3c7.9-22.3 29.1-37.3 52.8-37.3h58.3c34.9 0 63.1 28.3 63.1 63.1c0 22.6-12.1 43.5-31.7 54.8L280 264.4c-.2 13-10.9 23.6-24 23.6c-13.3 0-24-10.7-24-24V250.5c0-8.6 4.6-16.5 12.1-20.8l44.3-25.4c4.7-2.7 7.6-7.7 7.6-13.1c0-8.4-6.8-15.1-15.1-15.1H222.6c-3.4 0-6.4 2.1-7.5 5.3l-.4 1.2c-4.4 12.5-18.2 19-30.6 14.6s-19-18.2-14.6-30.6l.4-1.2zM288 352c0 17.7-14.3 32-32 32s-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32z"/></svg>Haluatko listalle? Kuinka seurata? Katso ohjeet</button>

<div id="instructions" aria-hidden="true" hidden>
  <h2>Ilmoita itsesi listalle</h2>
  <p>Lista toimii suostumusperiaatteella. En lisää ketään ilman käyttäjän itsensä lupaa. Haluatko listalle? Lähetä käyttäjälle <a href="https://mementomori.social/@rolle">@rolle@mementomori.social</a> yksityisviesti tai julkinen vastaus <a href="https://mementomori.social/@rolle/109489389453580937">postaukseen</a>. Tätä listaa ei jaeta missään muualla kuin tässä URL-osoitteessa ja listan käyttäminen muuhun kuin Mastodonissa seuraamiseen on kielletty.</p>

  <h2>Kuinka seurata listan käyttäjiä</h2>

  <p>Olen rakentamassa listalle automatiikkaa niin, että jatkossa voisit seurata käyttäjiä suoraan tältä sivulta. Jos haluat auttaa kehityksessä, <a href="https://github.com/ronilaukkarinen/finnish-mastodon-users/issues/7"></a>katso issue #7</a>. Sitä odotellessa, lue ohjeet alta.</p>

  <h3>Jos haluat seurata käyttäjiä yksitellen</b>, tähän löytyy useampi tapa:</h3>

  <ul>
    <li>Kopioi seurattavan ihmisen profiilin koko osoite leikepöydälle. Tämän jälkeen laita se Mastodon-instanssisi tai sovelluksesi hakuun (usein <b>Selaa</b> alta). Käyttäjän löytyessä klikkaa <b>Seuraa</b>.</li>
    <li>Lataa <a href="https://github.com/raikasdev/mastodon4-redirect">Mastodon4 Redirect</a>-selainlaajennos (<a href="https://addons.mozilla.org/en-US/firefox/addon/mastodon4-redirect/">Firefox</a> tai <a href="https://chrome.google.com/webstore/detail/mastodon4-redirect/acbfckpoogjdigldffcbldijhgnjpfnc">Chrome</a>). Laita lisäosan asetuksiin oman instanssisi URL-osoite. Tämän jälkeen klikkaa alta <b>Seuraa</b>, jonka jälkeen sinut ohjataan käyttäjän profiiliin, josta voit klikata <b>Seuraa</b> suoraan onnistuneesti.</li>
    <li>Lataa <a href="https://github.com/bramus/mastodon-profile-redirect">Mastodon Profile Redirect</a>-selainlaajennos (<a href="https://addons.mozilla.org/en-US/firefox/addon/mastodon-profile-redirect/">Firefox</a> tai <a href="https://chrome.google.com/webstore/detail/mastodon-profile-redirect/limifnkopacddgpihodacjeckfkpbfoe">Chrome</a>). Laita lisäosan asetuksiin oman instanssisi URL-osoite. Klikkaa alta <b>Seuraa</b>, sitten klikkaa selaimen lisäosapalkista lisäosan kuvaketta. Kun selaimesi on ohjannut profiiliin, klikkaa <b>Seuraa</b> normaalisti.</li>
    <li>Lataa <a href="https://fo.llow.social/roam">Roam Chrome-lisäosa</a> ja laita asetuksiin oman instanssisi osoite. Klikkaa alta <b>Seuraa</b>, sitten klikkaa selaimen lisäosapalkista lisäosan kuvaketta, josta pääset seuraamaan käyttäjää.</li>
  </ul>

  <h3>Jos haluat seurata kaikkia käyttäjiä kerralla</h3>

  <p>Lataa CSV-tiedosto alta ja tuo se asetuksiisi kohdasta <b>Asetukset &rarr; Tuo / Vie &rarr; Tuo &rarr; Seurattujen lista</b>.</p>

  <p>
    <a href="following_accounts.csv" class="button">Lataa CSV</a>
  </p>
</div>
`

const footer = `
<footer>
<p>Käsin koodattu ja <a href="https://github.com/ronilaukkarinen/finnish-mastodon-users">avointa lähdekoodia</a>. <span class="updated">Päivitetty viimeksi <time id="updated"></time>.</span></p>
</footer>
`

const usersContent = `
<h2>Käyttäjät (<span class="user-count" id="user-count" aria-live="polite">...</span>)</h2>

<ul class="user-list" id="user-list" aria-live="polite">Ladataan...</ul>
</section>
`

document.querySelector('#app').innerHTML = `
<section>
${headerInfo}
${instructions}
${usersContent}
${footer}
`
