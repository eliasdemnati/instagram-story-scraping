# Instagram Story Scraping

The purpose of this project is to automatically fetch Instagram stories from given accounts. It was initially built in order to create an archive of celebrities stories, but this project is now abandoned. I can be used as an OSINT tool.

It can fetch pictures aswell as videos, in the best quality available. It works for private or public accounts, as long as the account used for fetching is following the target.

## How does it work ?

The principle is easy. It is built upon the `puppeteer` library. Using it, we simply automate the connection to the fetching Instagram account. Then, we visit the page `https://instagram.com/stories/${targetName}` which will either load the stories of the account, or redirect to the Instagram home page if there isn't any story to load.

Each time a story is loaded, we intercept the network activity and we get the URL of the media. Weirdly enough, the URL is completely public and we can access it without any authentication. So finally, we are able to save the file and use it as we want. In my case, the file will be uploaded in to a web server.

The scraper can fetch multiple accounts simultaneously. We add accounts to fetch using the endpoint. The accounts are saved in a small databases, so each time you relaunch the server, the scraping relaunch itself.

Please note that this project is **NOT** future proof. Instagram could change how any of this works and the project would be instantly obsolete.

## How to use it ?

Clone this project and create a `.env` file at the root directory of the repository. This file needs to have these informations:

```
USERNAME= Username of the fetching account
PASSWORD= Password of the fetching account
UPLOAD_TARGET= Server URL where the fetched file will be uploaded
PORT= Port used by the fetcher
CHROME_BIN= Path of Google Chrome
```

Puppeteer needs to use Chrome instead of Chromium, because Chromium doesn't natively load MP4 files, which is used for videos.
I suggest using a dummy account for the account used for fetching. Then, you can run this project using Docker, or NodeJS directly.

You can add new account to fetch with a request POST to `http://yourip:PORT/:username` where `username` is the fetching target.

The fetch routine will begin, and any media will be sent with a POST request to `http://UPLOAD_TARGET/instagram/${username}/story/upload` with the following body:

```
{
  "requestUrl": ...
}
```

Where `requestUrl` is the URL of the story.

### Feel free to use this project as you want.
