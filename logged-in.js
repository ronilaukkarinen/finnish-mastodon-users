function getAuthedUserID() {

  // Check finnish_mastodon_user_authed_id from local storage if it's not there
  if (localStorage.getItem('finnish_mastodon_users_authed_user_id') !== undefined && localStorage.getItem('finnish_mastodon_users_authed_user_acct') !== undefined && localStorage.getItem('finnish_mastodon_users_access_token')) {

    // Get authed_user_instance from local storage
    authed_user_instance_url = localStorage.getItem('finnish_mastodon_user_authed_instance_url');

    // Get access token from local storage
    access_token = localStorage.getItem('finnish_mastodon_users_access_token');

    // Get authed user's ID
    fetch(`${authed_user_instance_url}/api/v1/accounts/verify_credentials`, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      },
    })
    .then(response => response.json())
    .then(json_me => {

      // Save authed user's ID to local storage
      localStorage.setItem('finnish_mastodon_users_authed_user_id', json_me.id);
      localStorage.setItem('finnish_mastodon_users_authed_user_acct', json_me.acct);
      localStorage.setItem('finnish_mastodon_users_authed_user_url', json_me.url);

      // Get instance from URL in localStorage
      localStorage.setItem('finnish_mastodon_users_authed_user_instance', json_me.url.split('/')[2]);
    });
  }
}

function checkMe() {
  // Define user list li
  let user_list_li = document.querySelectorAll('.user-list li');

  // Get authed user acct
  let authed_user = localStorage.getItem('finnish_mastodon_users_authed_user_acct') + '@' + localStorage.getItem('finnish_mastodon_users_authed_user_instance');

  // Loop through user_list_li
  for (let i = 0; i < user_list_li.length; i++) {

    // Based on [data-user-name] and [data-user-instance], find me
    let user = user_list_li[i].getAttribute('data-user-name') + '@' + user_list_li[i].getAttribute('data-user-instance');

    // If it's me, add class
    if ( authed_user === user ) {
      // Replace .button-action with a
      if ( user_list_li[i].querySelector('.button-action') !== null ) {
        user_list_li[i].querySelector('.button-action').outerHTML = `<a href="${localStorage.getItem('finnish_mastodon_user_authed_instance_url')}/settings/profile" class="button button-me">Muokkaa profiilia</a>`;
      }
    }
  }
}

function preCheckUsers() {
  // Get users from local storage
  let listedUsers = JSON.parse(localStorage.getItem('finnish_mastodon_users')) || [];

  // Count all users that have finnish_mastodon_user_follow_status_checked_at_' + listedUsers[i].id set in localStorage
  let usersChecked = 0;

  // Reset users to be checked first
  localStorage.setItem('finnish_mastodon_users_to_be_checked', JSON.stringify([]));

  // Check me
  checkMe();

  // Loop through listedUsers
  for (let i = 0; i < listedUsers.length; i++) {

    // Check if user has been checked
    if ( localStorage.getItem(`finnish_mastodon_user_follow_status_checked_at_${listedUsers[i].id}`) !== null ) {
      usersChecked++;

      // Get authed user acct
      let authed_user = localStorage.getItem('finnish_mastodon_users_authed_user_acct') + '@' + localStorage.getItem('finnish_mastodon_users_authed_user_instance');

      // Get listed user acct
      let listed_user = listedUsers[i].acct + '@' + listedUsers[i].instance;

      // If it's not me, save it to local storage
      if ( authed_user !== listed_user ) {
        localStorage.setItem('finnish_mastodon_users_checked_amount', usersChecked);
      }
    }

    // Check not checked yet amount
    if ( localStorage.getItem('finnish_mastodon_user_follow_status_checked_at_' + listedUsers[i].id) === null ) {
      console.log('Quickly pre-checked user, we have not checked yet: ' + listedUsers[i].acct);

      // Define amount of users to be checked
      let usersToBeCheckedAmount = localStorage.getItem('finnish_mastodon_users_count') - localStorage.getItem('finnish_mastodon_users_checked_amount');

      // Save users not checked amount to local storage
      localStorage.setItem('finnish_mastodon_users_not_checked_amount', usersToBeCheckedAmount);

      // Define users to be checked list
      usersToBeChecked = JSON.parse(localStorage.getItem('finnish_mastodon_users_to_be_checked')) || [];

      // Get users we are not following and add them to a local storage
      usersToBeChecked.push({
        id: listedUsers[i].id,
        acct: listedUsers[i].acct,
        instance: listedUsers[i].instance
      });

      // Get current user count
      let currentUserCount = i - localStorage.getItem('finnish_mastodon_users_checked_amount');

      // Add user to local storage if the number of users to be checked is more than the max amount of users to be checked
      if (currentUserCount <= usersToBeCheckedAmount) {
        localStorage.setItem('finnish_mastodon_users_to_be_checked', JSON.stringify(usersToBeChecked));
      }
    }

    // Check if user we are following the user
    if ( localStorage.getItem(`finnish_mastodon_user_follow_status_${listedUsers[i].id}`) === 'true' ) {
      console.log('Quickly pre-checked user, we are following: ' + listedUsers[i].acct);

      // Add following class to user
      document.getElementById('user-'+ listedUsers[i].id).classList.add('following');

      // Set following count to local storage
      followingCount = document.getElementsByClassName('following').length;
      localStorage.setItem('finnish_mastodon_users_following_count', followingCount);

      if (document.getElementById('button-action-'+ listedUsers[i].id)) {
        // Remove has-no-action class from button
        document.getElementById('button-action-'+ listedUsers[i].id).classList.remove('has-no-action');

        // Add has-unfollow-action class to button
        document.getElementById('button-action-'+ listedUsers[i].id).classList.add('has-unfollow-action');

        // Update text to button
        document.getElementById('button-action-'+ listedUsers[i].id).innerHTML = 'Lopeta seuraaminen';
      }
    } else if ( localStorage.getItem(`finnish_mastodon_user_follow_status_${listedUsers[i].id}`) === 'false' ) {
      console.log('Quickly pre-cheked user, we are not following: ' + listedUsers[i].acct);

      // Remove following class from user
      document.getElementById('user-'+ listedUsers[i].id).classList.remove('following');

      if (document.getElementById('button-action-'+ listedUsers[i].id)) {
        // Remove has-unfollow-action class from button
        document.getElementById('button-action-'+ listedUsers[i].id).classList.remove('has-unfollow-action');

        // Add has-follow-action class to button
        document.getElementById('button-action-'+ listedUsers[i].id).classList.add('has-follow-action');

        // Update text to button
        document.getElementById('button-action-'+ listedUsers[i].id).innerHTML = 'Seuraa';
      }
    }

    // Add user to check list when hour is passed and we are following
    if ( localStorage.getItem(`finnish_mastodon_user_follow_status_${listedUsers[i].id}`) === 'true' && localStorage.getItem(`finnish_mastodon_user_follow_status_checked_at_${listedUsers[i].id}` ) < (Date.now() - 3600000) ) {
      console.log('Quickly pre-checked user, we are following and hour has passed: ' + listedUsers[i].acct);
    }

    // Add user to check list when hour is passed and we are not following
    if ( localStorage.getItem(`finnish_mastodon_user_follow_status_${listedUsers[i].id}`) === 'false' && localStorage.getItem(`finnish_mastodon_user_follow_status_checked_at_${listedUsers[i].id}`) < (Date.now() - 3600000) ) {
      console.log('Quickly pre-checked user, we are not following and hour has passed: ' + listedUsers[i].acct);
    }
  }
}

function lookupUsers() {

  // Get users from local storage
  let listedUsers = JSON.parse(localStorage.getItem('finnish_mastodon_users')) || [];

  // If users to be checked are in local storage
  if ( localStorage.getItem('finnish_mastodon_users_to_be_checked') ) {
    listedUsers = JSON.parse(localStorage.getItem('finnish_mastodon_users_to_be_checked'));
  } else {
    // If users to be checked are not in local storage, get users from local storage
    listedUsers = JSON.parse(localStorage.getItem('finnish_mastodon_users'));
  }

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
  let milliSeondsBetweenUsers = 800 * 60 * 5 / 300;

  // Get authed_user_instance from local storage
  authed_user_instance_url = localStorage.getItem('finnish_mastodon_user_authed_instance_url');

  // If Finnish mastodon user list has not been updated and listedUsers exists, do nothing
  if (localStorage.getItem('finnish_mastodon_users_list_has_been_updated') == 'false' && listedUsers.length > 0) {
    console.log('Finnish mastodon user list has not been updated and listedUsers exists, do nothing');
    return;
  }

  // All endpoints and methods can be called 300 times within 5 minutes
  // Run for loop one per second
  for (let i = 0; i < listedUsers.length; i++) {
    setTimeout(function() {

      // Add styles to see which user is being checked
      document.querySelectorAll('[data-user-name="'+ listedUsers[i].acct + '"]').forEach(function(element) {
        // Add class and then remove it after 1 second
        element.classList.add('checking-user');

        setTimeout(function() {
          element.classList.remove('checking-user');
        }, 800);
      });

      // Update #heading-users-title title when checking users
      document.getElementById('heading-users-title').innerHTML = `Tarkistetaan ketä seurataan...`;

      // Get user amount
      userAmount = document.querySelectorAll('.account-card').length;

      // If finnish_mastodon_users_not_checked_amount is defined
      if (localStorage.getItem('finnish_mastodon_users_not_checked_amount')) {
        // Change to not checked amount
        userAmount = localStorage.getItem('finnish_mastodon_users_not_checked_amount');
      }

      // Add class checking to heading-users-title and user-count
      document.getElementById('heading-users-title').classList.add('checking');
      document.getElementById('user-count').classList.add('checking');

      // Update #user-count title when checking users
      document.getElementById('user-count').innerHTML = `${i}/${userAmount}`;

      // Restore title to "Users" and user count to the original number when userAmount is same than calculated amount
      if ((i - 5) == userAmount) {
        document.getElementById('heading-users-title').innerHTML = `Käyttäjät`;
        document.getElementById('user-count').innerHTML = `${userAmount}`;
        document.getElementById('heading-users-title').classList.remove('checking');
        document.getElementById('user-count').classList.remove('checking');
      }

      // If current user has local storage not set to not null
      if (localStorage.getItem('finnish_mastodon_user_follow_status_'+ listedUsers[i].id) !== null) {

        // If we are following the current user
        if ( localStorage.getItem(`finnish_mastodon_user_follow_status_${listedUsers[i].id}`) === 'true' ) {
          console.log('Already checked, we are following: ' + listedUsers[i].acct);

          // Add following class to user
          document.getElementById('user-'+ listedUsers[i].id).classList.add('following');

          // If button-action-{id} exists
          if (document.getElementById('button-action-'+ listedUsers[i].id)) {

            // Remove has-no-action class from button
            document.getElementById('button-action-'+ listedUsers[i].id).classList.remove('has-no-action');

            // Add has-unfollow-action class to button
            document.getElementById('button-action-'+ listedUsers[i].id).classList.add('has-unfollow-action');

            // Update text to button
            document.getElementById('button-action-'+ listedUsers[i].id).innerHTML = 'Lopeta seuraaminen';
          }
        } else {

          console.log('We have already checked before, we are not following: ' + listedUsers[i].acct);

          // Remove following class from user
          document.getElementById('user-'+ listedUsers[i].id).classList.remove('following');

          // If button-action-{id} exists
          if (document.getElementById('button-action-'+ listedUsers[i].id)) {
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

        // Speed up loop time
        milliSeondsBetweenUsers = 0;

        // Skip this iteration
        return;
      }

      // First use look up endpoint to webfinger
      fetch(`${authed_user_instance_url}/api/v1/accounts/lookup?acct=${listedUsers[i].acct}@${listedUsers[i].instance}`)
      .then(response => response.json())
      .then(json => {

        // Reset loop time
        milliSeondsBetweenUsers = 800 * 60 * 5 / 300;

        // Get access token from local storage
        access_token = localStorage.getItem('finnish_mastodon_users_access_token');

        // If finnish_mastodon_user_follow_status_checked_at is not set or older than 1 hour
        if (localStorage.getItem('finnish_mastodon_user_follow_status_checked_at_'+ listedUsers[i].id) == null || moment().diff(moment(localStorage.getItem('finnish_mastodon_user_follow_status_checked_at_'+ listedUsers[i].id)), 'hours') > 1) {

          // Then check following status from relationship endpoint
          fetch(`${authed_user_instance_url}/api/v1/accounts/relationships?id[]=${json.id}`, {
            headers: {
              'Authorization': `Bearer ${access_token}`
            },
          })
          .then(response => response.json())
          .then(json_relationship => {

            // Save checked_at time to local storage as separate item
            localStorage.setItem('finnish_mastodon_user_follow_status_checked_at_'+ listedUsers[i].id, moment().format());

            // Check if following is true
            if ( json_relationship[0].following === true ) {
              console.log('Checked relationship, found an user we are following: ' + listedUsers[i].acct);

              // Update data-follow-id with relationship json id
              if (document.getElementById('button-action-'+ listedUsers[i].id)) {
                document.getElementById('button-action-'+ listedUsers[i].id).setAttribute('data-follow-id', json_relationship[0].id);
              }

              // Update id with relationship json id
              document.getElementById('user-'+ listedUsers[i].id).setAttribute('id', 'user-'+ json_relationship[0].id);

              // Add following class to user
              // Remove following class from user that has the correct [data-user-name]
              document.querySelectorAll('[data-user-name="'+ listedUsers[i].acct + '"]').forEach(function(element) {
                element.classList.add('following');
              });

              // Remove has-no-action class from button
              if (document.getElementById('button-action-'+ listedUsers[i].id)) {
                document.getElementById('button-action-'+ listedUsers[i].id).classList.remove('has-no-action');

                // Add has-unfollow-action class to button
                document.getElementById('button-action-'+ listedUsers[i].id).classList.add('has-unfollow-action');

                // Update text to button
                document.getElementById('button-action-'+ listedUsers[i].id).innerHTML = 'Lopeta seuraaminen';
              }

              // Add separate localStorage for this particular user so that we are following them
              localStorage.setItem('finnish_mastodon_user_follow_status_'+ listedUsers[i].id, 'true');
            } else {
              console.log('Checked relationship, found an user we are not following: ' + listedUsers[i].acct);

              // Timestamp checked
              listedUsers[i].checked_at = moment().format();

              // Update data-follow-id with relationship json id
              if (document.getElementById('button-action-'+ listedUsers[i].id)) {
                document.getElementById('button-action-'+ listedUsers[i].id).setAttribute('data-follow-id', json_relationship[0].id);
              }

              // Update id with relationship json id
              document.getElementById('user-'+ listedUsers[i].id).setAttribute('id', 'user-'+ json_relationship[0].id);

              // Remove following class from user that has the correct [data-user-name]
              document.querySelectorAll('[data-user-name="'+ listedUsers[i].acct + '"]').forEach(function(element) {
                element.classList.remove('following');
              });

              if (document.getElementById('button-action-'+ listedUsers[i].id)) {
                // Add has-no-action class to button
                document.getElementById('button-action-'+ listedUsers[i].id).classList.remove('has-no-action');

                // Remove has-unfollow-action class from button
                document.getElementById('button-action-'+ listedUsers[i].id).classList.remove('has-unfollow-action');

                // Add follow action to button
                document.getElementById('button-action-'+ listedUsers[i].id).classList.add('has-follow-action');

                // Update text to button
                document.getElementById('button-action-'+ listedUsers[i].id).innerHTML = 'Seuraa';
              }

              // Add separate localStorage for this particular user so that we are following them
              localStorage.setItem('finnish_mastodon_user_follow_status_'+ listedUsers[i].id, 'false');
            }

            // Get authed user instance URL just in case
            let authed_user_instance_url = localStorage.getItem('finnish_mastodon_user_authed_instance_url');

            // Get authed user acct
            let authed_user = localStorage.getItem('finnish_mastodon_users_authed_user_acct') + '@' + localStorage.getItem('finnish_mastodon_users_authed_user_instance');

            // Get listed user acct
            let listed_user = listedUsers[i].acct + '@' + listedUsers[i].instance;

            // If it's me, replace button with profile edit link
            if (listed_user == authed_user) {
              // Get .button-action under [data-user-name]
              document.querySelectorAll('[data-user-name="'+ listedUsers[i].acct + '"] .account-card__actions__button').forEach(function(element) {
                // Replace button with a
                element.innerHTML = '<a href="'+ authed_user_instance_url +'/settings/profile" class="button button-me">Muokkaa profiilia</a>';
              });
            }
          });
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

    // Update #heading-users-title title when checking users
    document.getElementById('heading-users-title').innerHTML = `Lasketaan käyttäjät...`;

    // Get authed user's ID after one second
    setTimeout(() => {
      console.log('Launching authed user verification...');
      getAuthedUserID();
    }, 2000);

    // After a few seconds, pre-check users
    setTimeout(function() {
      console.log('Launching pre check...');
      preCheckUsers();
    }, 3000);

    // After a few seconds, lookup users
    setTimeout(function() {
      console.log('Launching user lookup...');
      lookupUsers();
    }, 5000);

    // Restore users title
    setTimeout(() => {
      document.getElementById('heading-users-title').innerHTML = `Käyttäjät`;
    }, 3000);
  }

});

// Follow action
function followAction(e) {
  // Get authed_user_instance from local storage
  authed_user_instance_url = localStorage.getItem('finnish_mastodon_user_authed_instance_url');

  // Get account ID from button
  const account_id = e.target.getAttribute("data-follow-id");

  // Follow
  fetch(`${authed_user_instance_url}/api/v1/accounts/${account_id}/follow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + access_token
    }
  })
  .then(response => response.json())
  .then(json => {

    if ( json.error === "Record not found" ) {
      let url = e.target.getAttribute("data-url");

      // Open to new window
      window.open(url, '_blank');
    }

    // Add following class to account-card that has the correct data-user-name
    document.getElementById(`user-${json.id}`).classList.add('following');

    // Calculate the amount of users we're following
    let followingCount = document.getElementsByClassName('following').length;

    // Add following count to local storage
    localStorage.setItem('finnish_mastodon_users_following_count', followingCount);

    // Change button element inside user-${json.id} .account-card__actions__button
    document.getElementById(`user-${json.id}`).querySelector('.account-card__actions__button').innerHTML = `<button class="button button-action has-unfollow-action" data-follow-id="${json.id}" data-url="${json.url}">Lopeta seuraaminen</button>`;

    // Get users from local storage
    let listedUsers = JSON.parse(localStorage.getItem('finnish_mastodon_users')) || [];

    // Change listedUser following value to true
    listedUsers.forEach(function(listedUser) {
      if ( listedUser.id === json.id ) {
        localStorage.setItem('finnish_mastodon_user_follow_status_'+ listedUser.id, 'true');
      }
    });
  });
}

// unFollowAction
function unFollowAction(e) {
  // Get authed_user_instance from local storage
  authed_user_instance_url = localStorage.getItem('finnish_mastodon_user_authed_instance_url');

  // Get account ID from button
  const account_id = e.target.getAttribute("data-follow-id");

  // Follow
  fetch(`${authed_user_instance_url}/api/v1/accounts/${account_id}/unfollow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + access_token
    }
  })
  .then(response => response.json())
  .then(json => {

    if ( json.error === "Record not found" ) {
      let url = e.target.getAttribute("data-url");

      // Open to new window
      window.open(url, '_blank');
    }

    // Add following class to account-card
    document.getElementById(`user-${json.id}`).classList.remove('following');

    // Calculate the amount of users we're following
    let followingCount = document.getElementsByClassName('following').length;

    // Add following count to local storage
    localStorage.setItem('finnish_mastodon_users_following_count', followingCount);

    // Change button element inside user-${json.id} .account-card__actions__button
    document.getElementById(`user-${json.id}`).querySelector('.account-card__actions__button').innerHTML = `<button class="button button-action has-follow-action" data-follow-id="${json.id}" data-url="${json.url}">Seuraa</button>`;

    // Get users from local storage
    let listedUsers = JSON.parse(localStorage.getItem('finnish_mastodon_users')) || [];

    // Change listedUser following value to false
    listedUsers.forEach(function(listedUser) {
      if ( listedUser.id === json.id ) {
        localStorage.setItem('finnish_mastodon_user_follow_status_'+ listedUser.id, 'false');
      }
    });
 });
}

function filterFollowedUsers() {
  // Get following count from local storage
  let followingCount = localStorage.getItem('finnish_mastodon_users_following_count');

  // Get filterFollowed checkbox
  let filterFollowed = document.getElementById('filter-followed');

  // If filterFollowed is checked, filter out users we're already following
  if ( filterFollowed.checked ) {
    // Re-calculate the amount of users we're following
    followingCount = document.getElementsByClassName('following').length;
    localStorage.setItem('finnish_mastodon_users_following_count', followingCount);

    // Hide all elements that have a following class
    let following = document.getElementsByClassName('following');
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
    let following = document.getElementsByClassName('following');
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

  // Delay, otherwise won't have time to get access token from local storage
  setTimeout(function() {
    if ( access_token ) {

      // Remove hidden from #filter-followed-container
      document.getElementById('filter-followed-container').removeAttribute('hidden');

      // Add .has-filtering class to .heading class
      document.querySelector('.heading').classList.add('has-filtering');

      // Listener for filter-followed checkbox
      document.getElementById('filter-followed').addEventListener('change', function() {
        filterFollowedUsers();
      });
    }
  }, 1000);

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
