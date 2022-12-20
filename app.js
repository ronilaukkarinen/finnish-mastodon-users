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
            let user_id = json.id;
            let acct = json.acct;
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

              // Default to the original instance
              let instance_link = `https://${user_instance}/@${acct}`;

              // Follow button for logged out users
              let followButton = `<a id="button-action-${json.id}" href="${instance_link}" class="button button-action" aria-label="Mene käyttäjän ${acct} profiiliin">Profiili</a>`;

              // If we have access_token, let's have the authetintaced user's instance for easier following if the follow functionality is not working
              if ( access_token ) {
                // Get authed_user_instance from local storage
                authed_user_instance = localStorage.getItem('finnish_mastodon_user_authed_instance');
                instance_link = `${authed_user_instance}/@${user}`;

                // Follow button for logged in users
                followButton = `<button id="button-action-${json.id}" class="button button-action has-no-action" aria-label="Seuraa käyttäjää ${acct}, avautuu uuteen ikkunaan" data-follow-id="${json.id}" data-url="${instance_link}">Seuraa</button>`;
              }

              try {
                if (json.emojis.length > 0) {

                  json.emojis.forEach(dp_emoji => {
                    display_name = display_name.replaceAll(`:${dp_emoji.shortcode}:`, `<img src="${dp_emoji.url}" alt="Emoji ${dp_emoji.shortcode}" class="emojione">`);
                      bio = bio.replaceAll(`:${dp_emoji.shortcode}:`, `<img src="${dp_emoji.url}" alt="Emoji ${dp_emoji.shortcode}" class="emojione">`);
                    });
                  }
              } catch (e) {}

              // User template
              let userTemplate = `
              <li class="account-card collapsed" id="user-${json.id}" data-user-name="${acct}@${user_instance}" data-user-id="${json.id}" data-user-instance="${user_instance}">\
              <button id="button-collapse-${json.id}" class="button-collapse account-card__permalink" aria-label="Näytä käyttäjän ${acct} lisätiedot" aria-expanded="false" aria-controls="user-${json.id}">\
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

              // Save timestamp of the last time user list has been generated
              localStorage.setItem('finnish_mastodon_users_timestamp', Date.now());

              // Push all users to a local storage array if they're not already there but only for the max users
              let listedUsers = JSON.parse(localStorage.getItem('finnish_mastodon_users')) || [];

              // If the listed user has following parameter, don't add it to the list
              if (listedUsers.find(user => user.following)) {
                return;
              }

              listedUsers.push({
                "id": user_id,
                "acct": acct,
                "instance": instance,
              });

              // If there's already amount of users in local storage, don't add more
              if ( listedUsers.length <= localStorage.getItem('finnish_mastodon_users_count') ) {
                localStorage.setItem('finnish_mastodon_users', JSON.stringify(listedUsers))
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

            })
            .catch(error => {
              console.log(error);

              // Update aria-busy for user-list
              const userList = document.getElementById('user-list');
              userList.setAttribute('aria-busy', 'false');

              // Only for one iteration
              if (counter === 0) {
                // Replace rate limit message inside #heading-users

                if(error.message === "Too Many Requests") {
                  document.getElementById('heading-users').innerHTML = 'Palvelimella on juuri nyt liikaa kuormaa. Kokeile hetken päästä uudelleen...';
                }
              }
            }
          );
        }
      }
    }
  }

  // Expand/Collapse single account-card based on user id
  function expandCollapseUser(id) {
    // Get [data-user-id]
    let user = document.querySelector("[data-user-id='"+id+"']");
    let button = document.getElementById("button-collapse-"+id);

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
    if (e.target && e.target.id.includes("button-collapse-")) {
      let id = e.target.id.split("button-collapse-")[1];
      expandCollapseUser(id);
    }
  });

  // Filter with search input
  document.getElementById("search").addEventListener("keyup", function() {
    let search = document.getElementById("search").value.toLowerCase();
    let users = document.getElementsByClassName("account-card");

    for (let i = 0; i < users.length; i++) {
      let account_username = users[i].getElementsByClassName("display-name__account")[0].innerHTML.toLowerCase();
      let account_display_name = users[i].getElementsByClassName("display-name")[0].innerHTML.toLowerCase();
      let account_bio = users[i].getElementsByClassName("account-card__bio")[0].innerHTML.toLowerCase();

      if (account_bio.includes(search) || account_display_name.includes(search) || account_username.includes(search)) {
        users[i].style.display = "block";
      } else {
        users[i].style.display = "none";
      }
    }
  });
});
