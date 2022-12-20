function getAuthedUserID() {

  // Check finnish_mastodon_user_authed_id from local storage if it's not there
  if (!localStorage.getItem('finnish_mastodon_users_authed_user_id') && localStorage.getItem('finnish_mastodon_users_access_token')) {

    // Get authed_user_instance from local storage
    authed_user_instance = localStorage.getItem('finnish_mastodon_user_authed_instance');

    // Get access token from local storage
    access_token = localStorage.getItem('finnish_mastodon_users_access_token');

    // Get authed user's ID
    fetch(`${authed_user_instance}/api/v1/accounts/verify_credentials?access_token=${access_token}`, { cache: "force-cache" })
    .then(response => response.json())
    .then(json_me => {

      // Save authed user's ID to local storage
      authed_user_id = json_me.id;
      localStorage.setItem('finnish_mastodon_users_authed_user_id', authed_user_id);
    });

    console.log('Access token found: ' + access_token);
  }
}

function lookupUsers() {

  // Get users from local storage
  let listedUsers = JSON.parse(localStorage.getItem('finnish_mastodon_users')) || [];

  // Get last modified time response header of following_accounts.csv file with fetch
  fetch('following_accounts.csv', {
    method: 'HEAD'
  })
  // Add last modified premise to element
  .then(response => {

    const lastUpdated = response.headers.get('Last-Modified');
    const lastUpdatedDate = moment(lastUpdated);

    // If last updated time is different from local storage
    if (lastUpdatedDate != localStorage.getItem('finnish_mastodon_users_last_updated')) {

      // Save last updated time to local storage
      localStorage.setItem('finnish_mastodon_users_last_updated', lastUpdatedDate);

      // Save info about the update in local storage
      localStorage.setItem('finnish_mastodon_users_list_has_been_updated', 'true');
    } else {
      localStorage.setItem('finnish_mastodon_users_list_has_been_updated', 'false');
    }
  })

  // Get milliseconds for 300 requests per 5 minutes
  let milliSeondsBetweenUsers = 1000 * 60 * 5 / 300;

  // Get authed_user_instance from local storage
  authed_user_instance = localStorage.getItem('finnish_mastodon_user_authed_instance');

  // If Finnish mastodon user list has not been updated and listedUsers exists, do nothing
  if (localStorage.getItem('finnish_mastodon_users_list_has_been_updated') == 'false' && listedUsers.length > 0) {
    console.log('Finnish mastodon user list has not been updated and listedUsers exists, do nothing');
    return;
  }

  // All endpoints and methods can be called 300 times within 5 minutes
  // Run for loop one per second
  for (let i = 0; i < listedUsers.length; i++) {
    setTimeout(function() {

      // First use look up endpoint to webfinger
      fetch(`${authed_user_instance}/api/v1/accounts/lookup?acct=${listedUsers[i].acct}@${listedUsers[i].instance}`)
      .then(response => response.json())
      .then(json => {

        // Get user amount from local storage
        userAmount = localStorage.getItem('finnish_mastodon_users_count');

        // Get access token from local storage
        access_token = localStorage.getItem('finnish_mastodon_users_access_token');

        // Update #heading-users-title title when checking users
        document.getElementById('heading-users-title').innerHTML = `Tarkistetaan seurataanko käyttäjää...`;

        // Add class checking to heading-users-title and user-count
        document.getElementById('heading-users-title').classList.add('checking');
        document.getElementById('user-count').classList.add('checking');

        // Update #user-count title when checking users
        document.getElementById('user-count').innerHTML = `${i}/${userAmount}`;

        // If we have not checked in 1 hour or following status does not exist
        if (moment().diff(listedUsers[i].checked_at, 'hours') > 1 || listedUsers[i].following == undefined) {

          // Add styles to see which user is being checked
          document.querySelectorAll('[data-user-name="'+ listedUsers[i].acct +'@'+ listedUsers[i].instance +'"]').forEach(function(element) {
              element.classList.add('checking-user');
          });

          // When user has been checked, remove styles
          setTimeout(function() {
            document.querySelectorAll('[data-user-name="'+ listedUsers[i].acct +'@'+ listedUsers[i].instance +'"]').forEach(function(element) {
              element.classList.remove('checking-user');
            });
          }, 1000);

          // Then check following status from relationship endpoint
          fetch(`${authed_user_instance}/api/v1/accounts/relationships?id[]=${json.id}`, {
            headers: {
              'Authorization': `Bearer ${access_token}`
            },
          })
          .then(response => response.json())
          .then(json_relationship => {

            console.log(json_relationship[0]);

              // Check if following is true and checked_at is defined and it's not within 1 hour
              if (json_relationship[0].following) {
                console.log('Checked relationship, found an user we are following: ' + listedUsers[i].acct);

                // Save checked_at to local storage
                listedUsers[i].checked_at = moment().format();

                // Update data-follow-id with relationship json id
                document.getElementById('button-action-'+ listedUsers[i].id).setAttribute('data-follow-id', json_relationship[0].id);

                // Update id with relationship json id
                document.getElementById('user-'+ listedUsers[i].id).setAttribute('id', 'user-'+ json_relationship[0].id);

                // Add following class to user
                // Remove following class from user that has the correct [data-user-name]
                document.querySelectorAll('[data-user-name="'+ listedUsers[i].acct +'@'+ listedUsers[i].instance +'"]').forEach(function(element) {
                  element.classList.add('following');
                });

                // Remove has-no-action class from button
                document.getElementById('button-action-'+ listedUsers[i].id).classList.remove('has-no-action');

                // Add has-unfollow-action class to button
                document.getElementById('button-action-'+ listedUsers[i].id).classList.add('has-unfollow-action');

                // Update text to button
                document.getElementById('button-action-'+ listedUsers[i].id).innerHTML = 'Lopeta seuraaminen';

                // Update following status to local storage if following not already exists
                if (!listedUsers[i].following) {
                  listedUsers[i].following = true;
                }
              } else {
                console.log('Checked relationship, found an user we not following: ' + listedUsers[i].acct);

                // Timestamp checked
                listedUsers[i].checked_at = moment().format();

                // Update data-follow-id with relationship json id
                document.getElementById('button-action-'+ listedUsers[i].id).setAttribute('data-follow-id', json_relationship[0].id);

                // Update id with relationship json id
                document.getElementById('user-'+ listedUsers[i].id).setAttribute('id', 'user-'+ json_relationship[0].id);

                // Remove following class from user that has the correct [data-user-name]
                document.querySelectorAll('[data-user-name="'+ listedUsers[i].acct +'@'+ listedUsers[i].instance +'"]').forEach(function(element) {
                  element.classList.remove('following');
                });

                // Add has-no-action class to button
                document.getElementById('button-action-'+ listedUsers[i].id).classList.remove('has-no-action');

                // Remove has-unfollow-action class from button
                document.getElementById('button-action-'+ listedUsers[i].id).classList.remove('has-unfollow-action');

                // Add follow action to button
                document.getElementById('button-action-'+ listedUsers[i].id).classList.add('has-follow-action');

                // Update text to button
                document.getElementById('button-action-'+ listedUsers[i].id).innerHTML = 'Seuraa';

                // Update following status to local storage if following not already exists
                if (listedUsers[i].following) {
                  listedUsers[i].following = false;
                }
              }

          });

        // If following status is defined and checked_at is defined and it's within 1 hour
        } else {

          if (listedUsers[i].following == 'true') {
            console.log('We have already checked before (' + listedUsers[i].following + '), we are following: ' + listedUsers[i].acct);

            // Add following class to user
            document.getElementById('user-'+ listedUsers[i].id).classList.add('following');

            // Remove has-no-action class from button
            document.getElementById('button-action-'+ listedUsers[i].id).classList.remove('has-no-action');

            // Add has-unfollow-action class to button
            document.getElementById('button-action-'+ listedUsers[i].id).classList.add('has-unfollow-action');

            // Update text to button
            document.getElementById('button-action-'+ listedUsers[i].id).innerHTML = 'Lopeta seuraaminen';
          } else {
            console.log('We have already checked before (' + listedUsers[i].following + '), we are not following: ' + listedUsers[i].acct);

            // Remove following class from user
            document.getElementById('user-'+ listedUsers[i].id).classList.remove('following');

            // Add has-no-action class to button
            document.getElementById('button-action-'+ listedUsers[i].id).classList.add('has-no-action');

            // Remove has-unfollow-action class from button
            document.getElementById('button-action-'+ listedUsers[i].id).classList.remove('has-unfollow-action');

            // Add follow action to button
            document.getElementById('button-action-'+ listedUsers[i].id).classList.add('has-follow-action');

            // Update text to button
            document.getElementById('button-action-'+ listedUsers[i].id).innerHTML = 'Seuraa';
          }

        }
      });
    }, milliSeondsBetweenUsers * i);
  }
}

// Window load event used just in case window height is dependant upon images
window.addEventListener('load', function() {

  // Get access_token from local storage
  access_token = localStorage.getItem('finnish_mastodon_users_access_token');

  if ( access_token) {
    // Get authed user's ID after one second
    setTimeout(() => {
      getAuthedUserID();
    }, 2000);

    // After a few seconds, lookup users
    setTimeout(function() {
      lookupUsers();
    }, 4000);
  }

});

// Follow action
function followAction(e) {
  // Get authed_user_instance from local storage
  authed_user_instance = localStorage.getItem('finnish_mastodon_user_authed_instance');

  // Get account ID from button
  const account_id = e.target.getAttribute("data-follow-id");

  // Follow
  fetch(`${authed_user_instance}/api/v1/accounts/${account_id}/follow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + access_token
    }
  })
  .then(response => response.json())
  .then(json => {

    console.log(json);

    if ( json.error === "Record not found" ) {
      let url = e.target.getAttribute("data-url");

      // Open to new window
      window.open(url, '_blank');
    }

    // Add following class to account-card that has the correct data-user-name
    document.getElementById(`user-${json.id}`).classList.add('following');

    // Calculate the amount of users we're following
    const followingCount = document.getElementsByClassName('following').length;

    // Add following count to local storage
    localStorage.setItem('finnish_mastodon_users_following_count', followingCount);

    // Change button element inside user-${json.id} .account-card__actions__button
    document.getElementById(`user-${json.id}`).querySelector('.account-card__actions__button').innerHTML = `<button class="button button-action has-unfollow-action" data-follow-id="${json.id}" data-url="${json.url}">Lopeta seuraaminen</button>`;

    // Get users from local storage
    let listedUsers = JSON.parse(localStorage.getItem('finnish_mastodon_users')) || [];

    // Change listedUser following value to true
    listedUsers.forEach(function(listedUser) {
      if ( listedUser.id === json.id ) {
        listedUser.following = true;
      }
    });
  });
}

// unFollowAction
function unFollowAction(e) {
  // Get authed_user_instance from local storage
  authed_user_instance = localStorage.getItem('finnish_mastodon_user_authed_instance');

  // Get account ID from button
  const account_id = e.target.getAttribute("data-follow-id");

  // Follow
  fetch(`${authed_user_instance}/api/v1/accounts/${account_id}/unfollow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + access_token
    }
  })
  .then(response => response.json())
  .then(json => {

    console.log(json);

    if ( json.error === "Record not found" ) {
      let url = e.target.getAttribute("data-url");

      // Open to new window
      window.open(url, '_blank');
    }

    // Add following class to account-card
    document.getElementById(`user-${json.id}`).classList.remove('following');

    // Calculate the amount of users we're following
    const followingCount = document.getElementsByClassName('following').length;

    // Add following count to local storage
    localStorage.setItem('finnish_mastodon_users_following_count', followingCount);

    // Change button element inside user-${json.id} .account-card__actions__button
    document.getElementById(`user-${json.id}`).querySelector('.account-card__actions__button').innerHTML = `<button class="button button-action has-follow-action" data-follow-id="${json.id}" data-url="${json.url}">Seuraa</button>`;

    // Get users from local storage
    let listedUsers = JSON.parse(localStorage.getItem('finnish_mastodon_users')) || [];

    // Change listedUser following value to false
    listedUsers.forEach(function(listedUser) {
      if ( listedUser.id === json.id ) {
        listedUser.following = false;
      }
    });
 });
}

function filterFollowedUsers() {
  // Get users from local storage
  let listedUsers = JSON.parse(localStorage.getItem('finnish_mastodon_users')) || [];

  // Get following count from local storage
  const followingCount = localStorage.getItem('finnish_mastodon_users_following_count');

  // Get authed user's ID from local storage
  const authedUserID = localStorage.getItem('finnish_mastodon_user_authed_id');

  // Get filterFollowed checkbox
  const filterFollowed = document.getElementById('filter-followed');

  // If filterFollowed is checked, filter out users we're already following
  if ( filterFollowed.checked ) {
    // Hide all elements that have a following class
    const following = document.getElementsByClassName('following');
    for (let i = 0; i < following.length; i++) {

      // Add hidden attribute to hide the element
      following[i].setAttribute('hidden', 'hidden');

      // Update user count by substracting amount from finnish_mastodon_users_following_count local storage
      if ( !document.getElementById('user-count').classList.contains('checking') ) {
        const followingCount = localStorage.getItem('finnish_mastodon_users_following_count');
        const totalUsercount = localStorage.getItem('finnish_mastodon_users_count');
        const userCount = document.getElementById('user-count');
        userCount.innerHTML = totalUsercount - followingCount;
      }
    }
  } else {
    // Show all elements that have a following class
    const following = document.getElementsByClassName('following');
    for (let i = 0; i < following.length; i++) {
      // Remove hidden attribute to show the element
      following[i].removeAttribute('hidden');

      // Restore user count number to the original number
      if ( !document.getElementById('user-count').classList.contains('checking') ) {
        const totalUsercount = localStorage.getItem('finnish_mastodon_users_count');
        const userCount = document.getElementById('user-count');
        userCount.innerHTML = totalUsercount;
      }
    }
  }
}

// DOMContentLoaded event used to make sure all HTML is loaded
document.addEventListener('DOMContentLoaded', function() {

  // Get access token from local storage
  access_token = localStorage.getItem('finnish_mastodon_users_access_token');

  if ( access_token ) {
    // Remove hidden from #filter-followed-container
    document.getElementById('filter-followed-container').removeAttribute('hidden');

    // Listener for filter-followed checkbox
    document.getElementById('filter-followed').addEventListener('change', function() {
      filterFollowedUsers();
    });
  }

  // If button has has-no-action class, add event listener to open profile in new window
  document.addEventListener("click", function(e) {
    if (e.target && e.target.classList.contains("has-no-action")) {
      let url = e.target.getAttribute("data-url");

      // Open to new window
      window.open(url, '_blank');
    }

    // Follow and unfollow actions
    if (e.target && e.target.classList.contains("has-follow-action")) {
      followAction(e);
    }

    if (e.target && e.target.classList.contains("has-unfollow-action")) {
      unFollowAction(e);
    }
  });
});
