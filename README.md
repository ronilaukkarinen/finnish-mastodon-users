# Finnish Mastodon users

This is a source code of the list for Finnish Mastodon users. Currently manually updated except for the user number. Perhaps adding some automatic functionality later on.

![_Users_rolle_Projects_suomalaiset-mastodon-kayttajat_index html (1)](https://user-images.githubusercontent.com/1534150/206854327-2919be07-6793-4edd-be1e-5211570f0c58.png)

## How to add yourself to the list

If you are **a non-techincal person**: Send a message to [@rolle@mementomori.social](https://mementomori.social/@rolle).

If you are **a technical person or a coder**:

1. [Fork this repository](https://github.com/ronilaukkarinen/finnish-mastodon-users/fork)
2. Edit [following_accounts.csv](https://github.com/ronilaukkarinen/finnish-mastodon-users/blob/master/following_accounts.csv) and add yourself.
3. Open the original user profile in its original instance. Get the a-link element inside `status__info` div with your developer tools:

![Screen-Shot-2022-12-10-14-43-02](https://user-images.githubusercontent.com/1534150/206855747-c9d1066c-4abd-479a-8583-50595158a00a.png)

4. Edit the first link to point to the full link of the user profile instead of just /@username.
5. Add follow button with the user link
6. Send a Pull Request with these changes
