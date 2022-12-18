// Cache functions
let cache = {};

// Better caching function
async function getData(url) {
  return new Promise((resolve, reject) => {
    if (cache[url]) {
      resolve(cache[url].data);
    } else {
      fetch(url, { cache: "force-cache" })
      .then(response => response.json())
      .then(data => {
        cache[url] = {
          data: data,
          time: new Date()
        };
        resolve(data);
      })
      .catch(error => {
        reject(error);
      });
    }
  });
}

// Better interval to clear cache with more human readable times
setInterval(() => {
  let now = new Date();
  const clearCacheTimeMinutes = 30;
  const clearCacheTime = clearCacheTimeMinutes * 60 * 1000;
  for (let url in cache) {
    if (now - cache[url].time > clearCacheTime) {
      delete cache[url];
    }
  }
}, 1000 * 60);

// Fetch local json file data
async function getLocalJsonData(url) {
  return new Promise((resolve, reject) => {
    fetch(url, { cache: "no-cache" })
    .then(response => response.json())
    .then(data => {
      resolve(data);
    })
    .catch(error => {
      reject(error);
    });
  });
}

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {

  // If we have index.html in URL, remove it
  if (window.location.href.includes("index.html")) {
    window.history.replaceState({}, document.title, "/" + window.location.pathname.split("/")[1] + "/");
  }

  // Parse CSV and add users with XMLHTTPRequest
  const req = new XMLHttpRequest();
  req.open('GET', 'following_accounts.csv', true);
  req.send(null);
  req.onreadystatechange = function () {
    if (req.readyState === 4 && req.status === 200) {
      let csv = req.responseText;
      let lines = csv.split("\n");
      lines.shift();

      // Update aria-busy for user-count
      const userCount = document.getElementById('user-count');
      userCount.setAttribute('aria-busy', 'true');

      // Update aria-busy for user-list
      const userList = document.getElementById('user-list');
      userList.setAttribute('aria-busy', 'true');

      document.getElementById("user-list").innerHTML = "";

      let counter = 0;
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        if (line !== "") {
          let parts = line.split(",");
          let user = parts[0];
          let acct = user.split("@")[0];
          let user_instance = user.split("@")[1];

          // If we're to use the user's instance
          let instance = user_instance;

          // Exceptions for testausserveri.fi still needed with my own instance
          if (user_instance === "mastodon.testausserveri.fi") {
            user = acct + "@testausserveri.fi";
          }

          // Use my own instance instead to avoid rate limits
          instance = "mementomori.social";

          // Get local json file for user
          getLocalJsonData(`cache/${user}.json`)
          .then(json => {
            let display_name = json.display_name;
            let bio = json.note;
                display_name = twemoji.parse(display_name, {className: "emojione"});
                bio = twemoji.parse(bio, {className: "emojione"});

              // If display name is empty, use username
              if (display_name === "") {
                display_name = acct;
              }

              // Get access_token from local storage
              access_token = localStorage.getItem('finnish_mastodon_users_access_token');

              // Follow link/button
              // Default is to the original instance
              let instance_link = `https://${user_instance}/@${acct}`;

              // If we have access_token, let's have the authetintaced user's instance for easier following if the follow functionality is not working
              if ( access_token ) {
                instance_link = `https://${instance}/@${user}`;
              }

              let followButton = `<a id="button-action-${json.id}" href="${instance_link}" class="button button-action">Profiili</a>`;

              try {
                if (json.emojis.length > 0) {

                  json.emojis.forEach(dp_emoji => {
                    display_name = display_name.replaceAll(`:${dp_emoji.shortcode}:`, `<img src="${dp_emoji.url}" alt="Emoji ${dp_emoji.shortcode}" class="emojione">`);
                      bio = bio.replaceAll(`:${dp_emoji.shortcode}:`, `<img src="${dp_emoji.url}" alt="Emoji ${dp_emoji.shortcode}" class="emojione">`);
                    });
                  }
              } catch (e) {}

              // If we have access_token, let's do magic
              if (access_token) {

                // Get authed_user_instance from local storage
                authed_user_instance = localStorage.getItem('finnish_mastodon_user_authed_instance');

                // Add follow button by default
                // Add button to button with id button-action-<user_id>
                followButton = `<button class="button button-action has-no-action" data-url="${authed_user_instance}/@${acct}@${user_instance}">Seuraa</button>`;

                // Add class to body that we don't have a filtering feature
                document.body.classList.add('has-user-filtering-disabled');

                // Make it possible to filter out followed users with a checkbox
                // Only one iteration
                if (counter === 0) {

                  // Remove hidden attribute from filter-followed-container
                  const filterFollowedContainer = document.getElementById('filter-followed-container');
                  filterFollowedContainer.removeAttribute('hidden');

                  // Add class to body that we have access_token
                  document.body.classList.add('has-access-token');

                  // Get filterFollowed checkbox
                  const filterFollowed = document.getElementById('filter-followed');

                  filterFollowed.addEventListener('change', function() {
                    if (this.checked) {

                      // Hide all elements that have a following class
                      const following = document.getElementsByClassName('following');
                      for (let i = 0; i < following.length; i++) {
                        // Add hidden attribute to hide the element
                        following[i].setAttribute('hidden', 'hidden');

                        // Update user count by substracting amount from finnish_mastodon_users_following_count local storage
                        const followingCount = localStorage.getItem('finnish_mastodon_users_following_count');
                        const totalUsercount = localStorage.getItem('finnish_mastodon_users_count');
                        const userCount = document.getElementById('user-count');
                        userCount.innerHTML = totalUsercount - followingCount;
                      }
                    } else {
                      // Show all elements that have a following class
                      const following = document.getElementsByClassName('following');
                      for (let i = 0; i < following.length; i++) {
                        // Remove hidden attribute to show the element
                        following[i].removeAttribute('hidden');

                        // Restore user count number to the original number
                        const userCount = document.getElementById('user-count');
                        userCount.innerHTML = counter;
                      }
                    }
                  });
                }

                // Fetch and store authed user's ID to a variable
                let authed_user_id = "";

                // Get authed_user_instance from local storage
                authed_user_instance = localStorage.getItem('finnish_mastodon_user_authed_instance');

                // Only one iteration
                if (counter === 0) {
                  getData(`${authed_user_instance}/api/v1/accounts/verify_credentials?access_token=${access_token}`)
                  // fetch(`${authed_user_instance}/api/v1/accounts/verify_credentials?access_token=${access_token}`, { cache: "force-cache" })
                  // .then(response => response.json())
                  .then(json_me => {

                  // Save authed user's ID to local storage
                  authed_user_id = json_me.id;
                  localStorage.setItem('finnish_mastodon_users_authed_user_id', authed_user_id);
                  });
                }

                // Get authed user id from local storage
                authed_user_id = localStorage.getItem('finnish_mastodon_users_authed_user_id');

                // Check if we follow the user by using the search endpoint
                getData(`${authed_user_instance}/api/v1/accounts/search?q=${user}&following=true&access_token=${access_token}&limit=1`)
                // fetch(`${authed_user_instance}/api/v1/accounts/search?q=${user}&following=true&access_token=${access_token}&limit=1`, { cache: "no-cache" })
                // .then(response => response.json())
                .then(json_search => {

                  // If request is not rate limited
                  if (json_search.error !== "Too many requests") {

                    // Get buttons inside elements that do NOT have following class
                    const buttons_for_not_following = document.querySelectorAll(`#user-${json.id}:not(.following) button`);

                    // Remove has-no-action class from all buttons from users we're not following
                    for (let i = 0; i < buttons_for_not_following.length; i++) {
                      buttons_for_not_following[i].classList.remove('has-no-action');
                    }

                    // Show filtering
                    document.body.classList.remove('has-user-filtering-disabled');
                  }

                  // If user with correct ID is found, we follow the user
                  if (json_search[0].id === json.id) {

                    // Add button to button with id button-action-<user_id>
                    document.getElementById(`actions__button-${json.id}`).innerHTML = `<button class="button button-action">Lopeta seuraaminen</button>`;

                    // Add following class to account-card
                    document.getElementById(`user-${json.id}`).classList.add('following');

                    // Calculate the amount of users we're following
                    const followingCount = document.getElementsByClassName('following').length;

                    // Add following count to local storage
                    localStorage.setItem('finnish_mastodon_users_following_count', followingCount);

                    // Unfollow with a click of a button
                    document.getElementById(`actions__button-${json.id}`).addEventListener('click', function() {

                      // Get authed_user_instance from local storage
                      authed_user_instance = localStorage.getItem('finnish_mastodon_user_authed_instance');

                      fetch(`${authed_user_instance}/api/v1/accounts/${json.id}/unfollow?access_token=${access_token}`, { method: 'POST' })
                      .then(response => response.json())
                      .then(json => {
                        // Remove following class from account-card
                        document.getElementById(`user-${json.id}`).classList.remove('following');

                        // Change to follow button
                        document.getElementById(`actions__button-${json.id}`).innerHTML = `<button class="button button-action
                        has-action">Seuraa</button>`;

                        // Calculate the amount of users we're following
                        const followingCount = document.getElementsByClassName('following').length;

                        // Add following count to local storage
                        localStorage.setItem('finnish_mastodon_users_following_count', followingCount);

                        // Update user count from finnish_mastodon_users_following_count local storage
                        const userCount = document.getElementById('user-count');
                        userCount.innerHTML = followingCount;

                        // If filter-followed is checked, hide the account-card
                        if (document.getElementById('filter-followed').checked) {
                          document.getElementById(`user-${json.id}`).setAttribute('hidden', 'hidden');
                        }
                      });
                    });
                  }

                  // If we are the user, add edit button
                  if (json.id === authed_user_id) {

                    // Add button to button with id button-action-<user_id>
                    document.getElementById(`actions__button-${json.id}`).innerHTML = `<a href="https://${user_instance}/settings/profile" class="button button-action">Muokkaa</a>`;

                    // Add me to account card
                    document.getElementById(`user-${json.id}`).classList.add('me');
                  }
                }
              );

              }

              // User template
              let userTemplate = `
              <li class="account-card collapsed" id="user-${json.id}">\
              <button id="button-${json.id}" class="button-collapse account-card__permalink" aria-label="Näytä käyttäjän ${acct} lisätiedot" aria-expanded="false" aria-controls="user-${json.id}">\
                <span class="screen-reader-text">Näytä lisätiedot</span>\
              </button>\
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
                    <span class="display-name__account">@${user}</span>\
                  </span>\
                </div>\
              </a>\
              <div class="account-card__bio">\
                ${bio}\

                <p><a href="${instance_link}">Siirry profiilisivulle</a></p>\
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
                <div class="account-card__actions__button" id="actions__button-${json.id}">\
                  ${followButton}\
                </div>\
              </div>\
              </li>`;

              counter++;

              if (counter === 1) {
                // Get user count from file/usercount.json
                fetch('cache/usercount.json')
                .then(response => response.text())
                .then(usercountNumber => {
                  // Add user count number to local storage
                  localStorage.setItem('finnish_mastodon_users_count', usercountNumber);
                });
              }

              // Get user count number from local storage
              const realUserCount = localStorage.getItem('finnish_mastodon_users_count');

              // Determine when counter is the user count amount
              if (counter > realUserCount - 4) {

                // Update aria-busy for user-count
                const userCount = document.getElementById('user-count');
                userCount.setAttribute('aria-busy', 'false');

                // Update aria-busy for user-list
                const userList = document.getElementById('user-list');
                userList.setAttribute('aria-busy', 'false');

                // Hide skeleton
                const skeleton = document.getElementById('skeleton');
                skeleton.style.display = 'none';
              }

              // Append userTemplate to user-list, use Vanilla JS .append
              let userList = document.getElementById("user-list");
              let userTemplateNode = document.createRange().createContextualFragment(userTemplate);
              userList.append(userTemplateNode);

              // Update user-count
              let userCount = document.getElementById("user-count");
              userCount.innerHTML = counter;

              // Default follow action
              document.getElementById(`actions__button-${json.id}`).addEventListener('click', function() {

                // Get authed_user_instance from local storage
                authed_user_instance = localStorage.getItem('finnish_mastodon_user_authed_instance');

                fetch(`${authed_user_instance}/api/v1/accounts/${json.id}/follow?access_token=${access_token}`, { method: 'POST' })
                .then(response => response.json())
                .then(json => {

                 // Add following class to account-card
                 document.getElementById(`user-${json.id}`).classList.add('following');

                 // Calculate the amount of users we're following
                 const followingCount = document.getElementsByClassName('following').length;

                 // Add following count to local storage
                 localStorage.setItem('finnish_mastodon_users_following_count', followingCount);

                 // Add button to button with id button-action-<user_id>
                 document.getElementById(`actions__button-${json.id}`).innerHTML = `<button class="button button-action">Lopeta seuraaminen</button>`;
               });
              });

            })
            .catch(error => {
              console.log(error);

              // Update aria-busy for user-list
              const userList = document.getElementById('user-list');
              userList.setAttribute('aria-busy', 'false');

              // Only for one iteration
              if (counter === 0) {
                // Replace rate limit message inside #heading-users
                document.getElementById('heading-users').innerHTML = 'Palvelimella on juuri nyt liikaa kuormaa. Kokeile hetken päästä uudelleen...';
              }
            }
          );
        }
      }
    }
  }

  // Expand/Collapse single account-card based on user id
  function expandCollapseUser(id) {
    let user = document.getElementById("user-"+id);
    let button = document.getElementById("button-"+id);

    // Check if user is undefined and do nothing if it is
    if (user === null) {
      return;
    }

    if (user.classList.contains("collapsed")) {
      user.classList.remove("collapsed");
      button.getElementsByTagName("span")[0].innerHTML = "Piilota lisätiedot";
      button.setAttribute("aria-expanded", "false");
    } else {
      user.classList.add("collapsed");
      button.getElementsByTagName("span")[0].innerHTML = "Näytä lisätiedot";
      button.setAttribute("aria-expanded", "true");
    }
  }

  // Run expandCollapseUser() on click
  document.addEventListener("click", function(e) {
    if (e.target && e.target.id.includes("button-")) {
      let id = e.target.id.split("button-")[1];
      expandCollapseUser(id);
    }
  });

  // If button has has-no-action class, get its URL and move to it
  document.addEventListener("click", function(e) {
    if (e.target && e.target.classList.contains("has-no-action")) {
      let url = e.target.getAttribute("data-url");

      // Open to new window
      window.open(url, '_blank');
    }
  });
});
