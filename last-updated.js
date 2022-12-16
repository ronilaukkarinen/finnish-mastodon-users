// When DOM is ready
addEventListener('DOMContentLoaded', (event) => {

  // Set locale for moment.js
  moment.locale('fi');

  // Get last modified time response header of following_accounts.csv file with fetch
  fetch('following_accounts.csv', {
    method: 'HEAD'
  })
  // Add last modified premise to element
  .then(response => {

    // Set up moment.js
    moment.locale('fi');

    const lastUpdated = response.headers.get('Last-Modified');
    const lastUpdatedDate = moment(lastUpdated);

    const lastUpdatedElement = document.getElementById('updated');

    // Add last updated in textual format to element title attribute
    lastUpdatedElement.setAttribute('title', lastUpdatedDate.locale('fi').format('LLLL'));

    // Last updated from now
    const lastUpdatedFromNow = lastUpdatedDate.fromNow();
    lastUpdatedElement.innerHTML = lastUpdatedFromNow;
  })
  .catch(error => {
    console.error('Error:', error);
  });
});
