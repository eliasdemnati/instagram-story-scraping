const puppeteer = require('puppeteer');
const Axios = require('axios');
const Debug = require('debug');

const NO_STORY_TO_LOAD = 'No story to load';

class Scrapper {
  constructor(target) {
    this.page = {};
    this.working = false;
    this.username = process.env.USERNAME;
    this.password = process.env.PASSWORD;
    this.uploadTarget = process.env.UPLOAD_TARGET;
    this.target = target;
    this.logger = new Debug(`log-${this.target}`);
    this.logger(`Launching ${this.target} scrapper`);
  }

  async connectToAccount() {
    const usernameInput = 'input[name="username"]';
    const passwordInput = 'input[name="password"]';
    const connectButton = 'button[type="submit"]';
    const pressToSee = '.JkC_e';
  
    await this.page.goto(`https://www.instagram.com/stories/${this.target}`, { waitUntil: 'domcontentloaded' });
    
    // If we get redirected to the target main page, it means there are no stories
    if (this.page.url() === `https://www.instagram.com/${this.target}/`) {
      throw NO_STORY_TO_LOAD;
    }

    // Wait for connection inputs to be loaded
    await this.page.waitForSelector(usernameInput);
    await this.page.waitForSelector(passwordInput);
    await this.page.waitForSelector(connectButton);
    
    // Type credentials manually and connect
    await this.page.type(usernameInput, process.env.USERNAME);
    await this.page.type(passwordInput, process.env.PASSWORD);
    await this.page.click(connectButton);
  
    // Press to see stories
    await this.page.waitForSelector(pressToSee);
    await this.page.click(pressToSee);
  };
  
  async scrap() {
    this.working = true;
    this.logger('Starting logging session');

    // Chromium doesn't load .mp4 natively, therefore it's easier to use Chrome
    puppeteer.launch({ executablePath: process.env.CHROME_BIN, args: ['--no-sandbox'] }).then(async browser => {
      this.page = await browser.newPage();
    
      
      try {
        await this.connectToAccount();
      } catch (error) {
        if (error === NO_STORY_TO_LOAD) {
          this.logger('Login process timedout or crashed. Probably no story to fetch.');
          this.working = false;
          await browser.close();
          return;
        }
      } 

      await this.page.setRequestInterception(true);

      browser.on('disconnected', () => {
        this.logger('Ending scraping session');
        this.working = false;
      });
  
      this.page.on('request', async interceptedRequest => {
        const requestUrl = interceptedRequest.url();
    
        // Check if we get redirected to homepage, means there are no more stories
        if (this.page.url() === 'https://www.instagram.com/') {
          await browser.close();
        }
    
        // Post media to upload server
        if ((requestUrl.includes('.jpg') && !requestUrl.includes('150x150')) || requestUrl.includes('.mp4')) {
          Axios.post(`${process.env.UPLOAD_TARGET}/instagram/${this.target}/story/upload`, { requestUrl })
            .then(() => this.logger('Sent new story'))
            .catch(() => this.logger('Error when sending story'));
        }
    
        interceptedRequest.continue();
      });
    });
  };
  
  scrapLoop() {
    // To improve: better management of the fetching loop
    setInterval(() => {
      if (!this.working) {
        this.working = true;
        setTimeout(() => this.scrap(), 30000);
      }
    }, 1000);
  };
}


module.exports = Scrapper;
