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
        headless: false,
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

const scraps = async (params, concurrency) => {
    const runTime = []
    return [await withBrowser(async (browser) => {
        return bluebird.map(params, async (param) => {
            return withPage(browser)(async (page) => {
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
                const data = await scraperController(page, param.city, param.date)
                const afterRun = moment().diff(beforeRun, 'minutes', true);
                runTime.push(afterRun);
                return data
            });
        }, { concurrency: parseInt(concurrency) || 1 });
    }), runTime];
}


app.get('/json', async (req, response) => {
    // Web Scraping Code here
    console.log(req.query)

    const { citys, concurrency } = req.query;
    const params = []
    let revisionData, revisionRuntime = []
    if(!citys) {
        return response.status(500).json({
            message: 'Missing Params citys',
        });
    }
    if(!concurrency) {
        return response.status(500).json({
            message: 'Missing Params concurrency',
        });
    }
    citys.split(',').forEach( city => {
        dates.forEach( date => {
            params.push({
                city,
                date,
            })
        })
    })
    

    try {
        const [data, runtime] = await scraps(params, concurrency)
        const revisionParams = []
        data.map( (result, index) => {
            if(!(result?.length > 0)){
                revisionParams.push(params[index])
                data.splice(index, 1)
                runtime.splice(index, 1)
            }
        })
        if(revisionParams?.length > 0) {
            console.log('kena revisi')
            [revisionData, revisionRuntime] = await scraps(revisionParams, concurrency)
        }
        revisionRuntime = [...revisionRuntime, ...runtime]
        revisionData = [...revisionData, ...data]


        response.status(200).json({ 
            total: revisionData.map( (result,index) => ({  [`Total-${params[index].city}-next(${params[index].date})days`] : result?.length || 'Error'})), 
            runtime: revisionRuntime.map( (run,index) => ({  [`Runtime-${params[index].city}-next(${params[index].date})days`] : `${run} minutes`})), 
            revisionData 
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