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

          fetch("https://" + instance + "/api/v1/accounts/lookup?acct=" + user, { cache: "force-cache" })
          .then(response => response.json())
          .then(json => {
            let display_name = json.display_name;
            let bio = json.note;
                display_name = twemoji.parse(display_name, {className: "emojione"});
                bio = twemoji.parse(bio, {className: "emojione"});

                // If display name is empty, use username
                if (display_name === "") {
                  display_name = acct;
                }

              // Follow link/button
              let followButton = `<a id="button-action-${json.id}" href="https://${user_instance}/@${acct}" class="button button-action">Profiili</a>`;

              try {
                if (json.emojis.length > 0) {

                  json.emojis.forEach(dp_emoji => {
                    display_name = display_name.replaceAll(`:${dp_emoji.shortcode}:`, `<img src="${dp_emoji.url}" alt="Emoji ${dp_emoji.shortcode}" class="emojione">`);
                      bio = bio.replaceAll(`:${dp_emoji.shortcode}:`, `<img src="${dp_emoji.url}" alt="Emoji ${dp_emoji.shortcode}" class="emojione">`);
                    });
                  }
              } catch (e) {}

              // Get access_token from local storage
              access_token = localStorage.getItem('finnish_mastodon_users_access_token');

              // If we have access_token, let's do magic
              if (access_token) {

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

                        // Update user count from finnish_mastodon_users_following_count local storage
                        const followingCount = localStorage.getItem('finnish_mastodon_users_following_count');
                        const userCount = document.getElementById('user-count');
                        userCount.innerHTML = followingCount;
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
                fetch(`https://${instance}/api/v1/accounts/verify_credentials?access_token=${access_token}`, { cache: "force-cache" })
                .then(response => response.json())
                .then(json_me => {
                  // Save authed user's ID to local storage
                  authed_user_id = json_me.id;
                  localStorage.setItem('finnish_mastodon_users_authed_user_id', authed_user_id);
                });

                // Get authed user id from local storage
                authed_user_id = localStorage.getItem('finnish_mastodon_users_authed_user_id');

                // Check if we follow the user by using the search endpoint
                fetch(`https://${instance}/api/v1/accounts/search?q=${user}&following=true&access_token=${access_token}&limit=1`, { cache: "no-cache" })
                .then(response => response.json())
                .then(json_search => {
                  let following_each_other = false;

                  // If user with correct ID is found, we follow the user
                  if (json_search[0].id && json_search[0].id === json.id) {
                    following_each_other = true;
                  }

                  // If we follow each other, add follow button
                  if (following_each_other) {

                    // Add button to button with id button-action-<user_id>
                    document.getElementById(`actions__button-${json.id}`).innerHTML = `<a href="https://${instance}/web/follow_requests/${json.id}" class="button button-action">Lopeta seuraaminen</a>`;

                    // Add following class to account-card
                    document.getElementById(`user-${json.id}`).classList.add('following');

                    // Calculate the amount of users we're following
                    const followingCount = document.getElementsByClassName('following').length;

                    // Add following count to local storage
                    localStorage.setItem('finnish_mastodon_users_following_count', followingCount);
                  }

                  // If we don't follow each other, add follow button
                  if (!following_each_other) {

                    // Add button to button with id button-action-<user_id>
                    document.getElementById(`actions__button-${json.id}`).innerHTML = `<a href="https://${instance}/web/follow_requests/${json.id}" class="button button-action">Seuraa</a>`;

                    // Add unfollowing class to account-card
                    document.getElementById(`user-${json.id}`).classList.add('unfollowing');
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

                <p><a href="https://${instance}/@${user}">Siirry profiilisivulle</a></p>\
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

              // Count users
              counter++;

              // Append userTemplate to user-list, use Vanilla JS .append
              let userList = document.getElementById("user-list");
              let userTemplateNode = document.createRange().createContextualFragment(userTemplate);
              userList.append(userTemplateNode);

              // Update user-count
              let userCount = document.getElementById("user-count");
              userCount.innerHTML = counter;

              // Update aria-busy for user-count
              userCount.setAttribute('aria-busy', 'false');

              // Update aria-busy for user-list
              userList.setAttribute('aria-busy', 'false');

            })
            .catch(error => {
              console.log(error);
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
});
