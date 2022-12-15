// User list
$(document).ready(() => {
  // Update aria-busy for user-count
  $("#user-count").attr("aria-busy", "true");

  // Update aria-busy for user-list
  $("#user-list").attr("aria-busy", "true");

  // Parse CSV and add users
  $.get("following_accounts.csv", (result) => {
    let csv = result;
    let lines = csv.split("\n");
    lines.shift();
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

        $.getJSON("https://"+instance+"/api/v1/accounts/lookup?acct="+user, (json) => {
          let display_name = json.display_name;
          let bio = json.note;
          display_name = twemoji.parse(display_name, {className: "emojione"});
          bio = twemoji.parse(bio, {className: "emojione"});
          try {
            if (json.emojis.length > 0) {
              json.emojis.forEach(dp_emoji => {
                display_name = display_name.replaceAll(`:${dp_emoji.shortcode}:`, `<img src="${dp_emoji.url}" alt="Emoji ${dp_emoji.shortcode}" class="emojione">`);
                bio = bio.replaceAll(`:${dp_emoji.shortcode}:`, `<img src="${dp_emoji.url}" alt="Emoji ${dp_emoji.shortcode}" class="emojione">`);
              });
            }
          } catch (e) {}
          // Append simple user list item to user-list
          // $("#user-list").append(`<li><a href="https://${instance}/@${acct}" class="status__display-name" aria-label="Seuraa käyttäjää ${user}"><div class="status__avatar"><div class="account__avatar" style="width: 46px; height: 46px;"><img src="${json.avatar}" alt="Käyttäjäkuva käyttäjälle ${acct}"></div></div><span class="display-name"><bdi><strong class="display-name__html">${display_name}</strong></bdi> <span class="display-name__account">${user}</span></span></a><a tabindex="-1" aria-hidden="true" href="https://${instance}/@${acct}" class="button">Profiili</a></li>`);

          // Append explore__suggestions account-card to user-list
          $("#user-list").append(`<li class="account-card">\
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
                <a href="https://${instance}/@${acct}" class="button">Profiili</a>\
              </div>\
            </div>\
          </li>`);
        });
        counter++;

        // Update aria-busy for user-list
        $("#user-list").attr("aria-busy", "false");

        $("#user-count").html(counter);

        // Update aria-busy for user-count
        $("#user-count").attr("aria-busy", "false");
      }
    });
  });

  // Last updated
  moment.locale('fi');

  // Get last modified time from the csv file with $.ajax
  const lastUpdated = $.ajax({
    url: 'following_accounts.csv',
    type: 'HEAD',
    async: false
  }).getResponseHeader('Last-Modified');

  const lastUpdatedDate = moment(lastUpdated);
  const lastUpdatedElement = document.getElementById('updated');

  // Add last updated in textual format to element title attribute
  lastUpdatedElement.setAttribute('title', lastUpdatedDate.format('LLLL'));

  // Last updated from now
  const lastUpdatedFromNow = lastUpdatedDate.fromNow();
  lastUpdatedElement.innerHTML = lastUpdatedFromNow;
});
