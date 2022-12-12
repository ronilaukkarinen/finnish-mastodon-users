// User list
$(document).ready(() => {
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
        $.getJSON("https://"+instance+"/api/v1/accounts/lookup?acct="+user, (json) => {
          $("#user-list").append(`<li><a href="https://${instance}/@${acct}" title="rolle" class="status__display-name" rel="noopener noreferrer"><div class="status__avatar"><div class="account__avatar" style="width: 46px; height: 46px;"><img src="${json.avatar}" alt="${acct}"></div></div><span class="display-name"><bdi><strong class="display-name__html">${json.display_name}</strong></bdi> <span class="display-name__account">${user}</span></span></a><a href="https://${instance}/@${acct}" class="button">Seuraa</a></li>`);
        });
        counter++;
        $("#user-count").html(counter);
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
