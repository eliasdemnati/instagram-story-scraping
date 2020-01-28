const puppeteer = require('puppeteer');
const Axios = require('axios');

let page;

const env = {
  target: 'kyliejenner',
  username: 'eliasappa',
  password: '36riwuj1v2htkoXk',
  uploadTarget: 'http://localhost:3000',
};

const connectToAccount = async () => {
  const usernameInput = 'input[name="username"]';
  const passwordInput = 'input[name="password"]';
  const connectButton = 'button[type="submit"]';
  const pressToSee = '.JkC_e';

  // await page.emulate(iPhonex);
  await page.goto(`https://www.instagram.com/stories/${env.target}`, { waitUntil: 'domcontentloaded' });
  
  // Wait for connection inputs to be loaded
  await page.waitForSelector(usernameInput);
  await page.waitForSelector(passwordInput);
  await page.waitForSelector(connectButton);
  
  // Type credentials manually and connect
  await page.type(usernameInput, env.username);
  await page.type(passwordInput, env.password);
  await page.click(connectButton);
  
  // Refuse to remind password (puppeteer won't remember it anyway)
  // await page.waitForSelector(connectLater);
  // await page.click(connectLater);

  // Press to see stories
  await page.waitForSelector(pressToSee);
  await page.click(pressToSee);
};

puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' }).then(async browser => {
  page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', async interceptedRequest => {
    const requestUrl = interceptedRequest.url();

    if (page.url() === 'https://www.instagram.com/') {
      browser.close();
    }

    if ((requestUrl.includes('.jpg') && !requestUrl.includes('150x150')) || requestUrl.includes('.mp4')) {
      Axios.post(`${env.uploadTarget}/instagram/${env.target}/story/upload`, { requestUrl }).catch(() => console.log('Couldnt send file'));
    }

    interceptedRequest.continue();
  });

  await connectToAccount();
});
