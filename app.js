// User list
$(document).ready(() => {
  // Parse CSV and add users
  $.get("following_accounts.csv", (result) => {
    let csv = result;
    let lines = csv.split("\n");
    lines.shift();

    // Update aria-busy for user-count
    const userCount = document.getElementById('user-count');
    userCount.setAttribute('aria-busy', 'true');

    // Update aria-busy for user-list
    const userList = document.getElementById('user-list');
    userList.setAttribute('aria-busy', 'true');

    $("#user-list").html("");

    let counter = -1;
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

        $.getJSON("https://" + instance + "/api/v1/accounts/lookup?acct="+user, (json) => {
          let display_name = json.display_name;
          let bio = json.note;
              display_name = twemoji.parse(display_name, {className: "emojione"});
              bio = twemoji.parse(bio, {className: "emojione"});

            // Follow link/button
            let followButton = `<a href="https://${instance}/@${user}" class="button button-action">Profiili</a>`;

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
            <div class="account-card__actions__button" id="actions__button-${json.id}">\
              ${followButton}\
            </div>\
          </div>\
          </li>`;

          // Count users
          counter++;

          // Append userTemplate to user-list
          $("#user-list").append(`${userTemplate}`);

          // Update user-count
          $("#user-count").html(counter);

          }).fail((jqXHR, textStatus, errorThrown) => {
            console.log("Error: " + errorThrown);
            console.log("Status: " + textStatus);
            console.dir(jqXHR);

            // Update aria-busy for user-count
            userCount.setAttribute('aria-busy', 'false');
          }).done(() => {
            // Update aria-busy for user-count
            userCount.setAttribute('aria-busy', 'false');
          });
      }
    });
  });

  // Expand/Collapse single account-card based on user id
  function expandCollapseUser(id) {
    let user = document.getElementById("user-"+id);
    let button = document.getElementById("button-"+id);

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
