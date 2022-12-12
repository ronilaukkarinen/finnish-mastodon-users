// User list
$(document).ready(() => {
  // Parse CSV and add users
  // $.get("following_accounts.csv", (result) => {
  //   let csv = result;
  //   let lines = csv.split("\n");
  //   lines.shift();
  //   $("#user-list").html("");
  //   let counter = -1;
  //   lines.forEach((line) => {
  //     if (line !== "") {
  //       let parts = line.split(",");
  //       let user = parts[0];
  //       let acct = user.split("@")[0];
  //       let instance = user.split("@")[1];
  //       $.getJSON("https://"+instance+"/api/v1/accounts/lookup?acct="+user, (json) => {
  //         let display_name = json.display_name;
  //         display_name = twemoji.parse(display_name, {className: "emojione"});
  //         try {
  //             if (json.emojis.length > 0) {
  //                 json.emojis.forEach(dp_emoji => {
  //                     display_name = display_name.replaceAll(`:${dp_emoji.shortcode}:`, `<img src="${dp_emoji.url}" alt="Emoji ${dp_emoji.shortcode}" class="emojione">`);
  //                 });
  //             }
  //         } catch (e) {}
  //         $("#user-list").append(`<li><a href="https://${instance}/@${acct}" title="rolle" class="status__display-name" rel="noopener noreferrer"><div class="status__avatar"><div class="account__avatar" style="width: 46px; height: 46px;"><img src="${json.avatar}" alt="${acct}"></div></div><span class="display-name"><bdi><strong class="display-name__html">${display_name}</strong></bdi> <span class="display-name__account">${user}</span></span></a><a href="https://${instance}/@${acct}" class="button">Seuraa</a></li>`);
  //       });
  //       counter++;
  //       $("#user-count").html(counter);
  //     }
  //   });
  // });

    // Set client ID
    const clientId = "X";
    const clientSecret = "X";

    // Get redirect URL based on current URL
    const redirectUrl = window.location.href;

    // First, login with button, redirect to app
    $("#login").click(() => {
      window.location.href = `https://mementomori.social/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUrl}&response_type=code&scope=read`;
    });

    // Get code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    // Check if access token is present in localStorage
    if (localStorage.getItem("access_token")) {
      $("#login").hide();
      $("#user-list").show();

      // Get current account ID, authorize with user token
      $.ajax({
        url: "https://mementomori.social/api/v1/accounts/verify_credentials",
        type: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`
        },
        success: (data) => {

          // Get current user following list and get following_accounts.csv and compare and add button to follow/unfollow based on the data
          $.getJSON(`https://mementomori.social/api/v1/accounts/${data.id}/following?limit=5000`, (json) => {

          console.log(json);

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
                  $.getJSON("https://"+instance+"/api/v1/accounts/lookup?acct="+user, (json) => {
                    let display_name = json.display_name;
                    display_name = twemoji.parse(display_name, {className: "emojione"});
                    try {
                        if (json.emojis.length > 0) {
                            json.emojis.forEach(dp_emoji => {
                                display_name = display_name.replaceAll(`:${dp_emoji.shortcode}:`, `<img src="${dp_emoji.url}" alt="Emoji ${dp_emoji.shortcode}" class="emojione">`);
                            });
                        }
                    } catch (e) {}

                    // Check if user is already followed and show markup based on following data
                    let following = false;

                    // Loop through following list and check if user is already followed without forEach!
                    console.log(json);
                    for (let i = 0; i < json.length; i++) {
                      if (json[i].acct === acct) {
                        following = true;
                        break;
                      }
                    }

                    if (following) {
                      $("#user-list").append(`<li><a href="https://${instance}/@${acct}" title="rolle" class="status__display-name" rel="noopener noreferrer"><div class="status__avatar"><div class="account__avatar" style="width: 46px; height: 46px;"><img src="${json.avatar}" alt="${acct}"></div></div><span class="display-name"><bdi><strong class="display-name__html">${display_name}</strong></bdi> <span class="display-name__account">${user}</span></span></a><a href="https://${instance}/@${acct}" class="button unfollow">Unfollow</a></li>`);
                    } else {
                      $("#user-list").append(`<li><a href="https://${instance}/@${acct}" title="rolle" class="status__display-name" rel="noopener noreferrer"><div class="status__avatar"><div class="account__avatar" style="width: 46px; height: 46px;"><img src="${json.avatar}" alt="${acct}"></div></div><span class="display-name"><bdi><strong class="display-name__html">${display_name}</strong></bdi> <span class="display-name__account">${user}</span></span></a><a href="https://${instance}/@${acct}" class="button follow">Follow</a></li>`);
                    }

                  });
                  counter++;
                  $("#user-count").html(counter);
                }
              });
            });
          }
        );
        }
      });

    } else {
      // If code is present, get access token
    if (code) {
      $.ajax({
        url: "https://mementomori.social/oauth/token",
        type: "POST",
        data: {
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUrl,
          grant_type: "authorization_code",
          scope: "read",
          code: code
        },
        success: (data) => {

          // Save access token to localStorage
          localStorage.setItem("access_token", data.access_token);

          // Hide login button
          $("#login").hide();

          // Show user list
          $("#user-list").show();
        }

      });
    }

    // If access token is present, show user list
    if (localStorage.getItem("access_token")) {
      $("#login").hide();
      $("#user-list").show();
    }

  }

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
