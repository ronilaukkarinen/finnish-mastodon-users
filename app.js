// Parse CSV and add users with Vanilla JS
function parseCSV() {
  // Get CSV file
  var request = new XMLHttpRequest();
  request.open("GET", "following_accounts.csv", false);
  request.send(null);
  var csv = request.responseText;

  // Split CSV into lines
  var lines = csv.split("\n");
  lines.shift();

  // Clear user list
  document.getElementById("user-list").innerHTML = "";

  // Add users
  var counter = -1;
  lines.forEach((line) => {
    if (line !== "") {
      var parts = line.split(",");
      var user = parts[0];
      var acct = user.split("@")[0];
      var instance = user.split("@")[1];
      var request = new XMLHttpRequest();

      // Cache requests for 30 minutes
      request.setRequestHeader("Cache-Control", "max-age=1800");

      // Get user info
      request.open("GET", "https://"+instance+"/api/v1/accounts/lookup?acct="+user, false);
      request.send(null);
      var json = JSON.parse(request.responseText);
      document.getElementById("user-list").innerHTML += `<li><a href="https://${instance}/@${acct}" title="rolle" class="status__display-name" rel="noopener noreferrer"><div class="status__avatar"><div class="account__avatar" style="width: 46px; height: 46px;"><img src="${json.avatar}" alt="${acct}"></div></div><span class="display-name"><bdi><strong class="display-name__html">${json.display_name}</strong></bdi> <span class="display-name__account">${user}</span></span></a><a href="https://${instance}/@${acct}" class="button">Seuraa</a></li>`;
      counter++;
      document.getElementById("user-count").innerHTML = counter;
    }
  });
}

// DOMContentLoaded
document.addEventListener("DOMContentLoaded", function(event) {
  parseCSV();

  // Last updated
  moment.locale('fi');
  const lastUpdatedDate = moment(lastUpdated);
  const lastUpdatedElement = document.getElementById('updated');

  // Add last updated in textual format to element title attribute
  lastUpdatedElement.setAttribute('title', lastUpdatedDate.format('LLLL'));

  // Last updated from now
  const lastUpdatedFromNow = lastUpdatedDate.fromNow();
  lastUpdatedElement.innerHTML = lastUpdatedFromNow;
});
