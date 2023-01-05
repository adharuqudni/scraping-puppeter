const browserObject = require('./browser');
const scraperController = require('./controller');
const express = require('express');
const puppeteer = require('puppeteer-extra')
const { executablePath } = require('puppeteer')
const path = require('path');
const fs = require('fs');

const app = express();
const port = 8080;



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

let browserInstance = puppeteer.launch({
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


app.get('/json', async (req, response) => {
    // Web Scraping Code here
    try {
        const { city, date } = req.query;
        const data = await scraperController(browserInstance, city, date)
        response.status(200).json({ total: data.length, data });
    } catch (error) {
        console.log(error);
        response.status(500).json({
            message: 'Server error occurred',
        });
    }
});

process.on('uncaughtException', function (err) {
    browserInstance.close()
});

app.listen(port, () => {
    console.log(`Example app listening at :${port}`);
});