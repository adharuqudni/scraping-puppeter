const browserObject = require('./browser');
const scraperController = require('./controller');
const express = require('express');
const puppeteer = require('puppeteer-extra')
const { executablePath } = require('puppeteer')
const path = require('path');
const fs = require('fs');
const bluebird = require('bluebird');
const randomUseragent = require('random-useragent');
const moment = require('moment');


const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36';
const app = express();
const port = 8080;
const dates = ['1', '7', '14']
let browserInstance


// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

if (fs.existsSync(path.join(__dirname, 'dump'))) {
    console.log('Directory exists!')
} else {
    console.log('Directory not found.')
    fs.mkdir(path.join(__dirname, 'dump'), (err) => {
        if (err) {
            return console.error(err);
        }
        console.log('Directory created successfully!');
    });
}

const withBrowser = async (fn) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--disable-gpu',
            '--disable-setuid-sandbox',
            '--no-sandbox',
            '--incognito',
        ],
        ignoreHTTPSErrors: true,
        dumpio: false,
        executablePath: executablePath(),
    });
    try {
        return await fn(browser);
    } finally {
        await browser.close();
    }
}

const withPage = (browser) => async (fn) => {
    const page = await browser.newPage();
    try {
        return await fn(page);
    } finally {
        await page.close();
    }
}


app.get('/json', async (req, response) => {
    // Web Scraping Code here
    const { city } = req.query;
    const runTime = []
    try {
        const results = await withBrowser(async (browser) => {
            return bluebird.map(dates, async (date) => {
                return withPage(browser)(async (page) => {
                    console.log(city)
                    const beforeRun = moment();
                    await page.setViewport({
                        width: 1920,
                        height: 3000,
                        deviceScaleFactor: 1,
                        hasTouch: false,
                        isLandscape: false,
                        isMobile: false,
                    });
                    const userAgent = randomUseragent.getRandom();
                    const UA = userAgent || USER_AGENT;
                    await page.setUserAgent(UA);
                    await page.setJavaScriptEnabled(true);
                    await page.setDefaultNavigationTimeout(0);
                    await page.goto('https://m.tiket.com/sewa-mobil');
                    console.log(`Navigating to https://m.tiket.com/sewa-mobil...`);
                    const data = await scraperController(page, city, date)
                    const afterRun = moment().diff(beforeRun, 'seconds');
                    runTime.push(afterRun);
                    return data
                });
            }, { concurrency: 4 });
        });

        response.status(200).json({ 
            total: results.map( (result,index) => ({  [`${city}-date${dates[index]}`] : result.length})), 
            runtime: runTime.map( (run,index) => ({  [`${city}-date${dates[index]}`] : run})), 
            results 
        });
    } catch (error) {
        console.log(error);
        response.status(500).json({
            message: 'Server error occurred',
        });
    }
});

app.listen(port, () => {
    console.log(`Example app listening at :${port}`);
});