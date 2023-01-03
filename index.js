const browserObject = require('./browser');
const scraperController = require('./controller');
const express = require('express');
const puppeteer = require('puppeteer-extra')
const {executablePath} = require('puppeteer')
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


app.get('/json', async (req, response) => {
    // Web Scraping Code here
    try {
        const {city, date} = req.query;
        //Start the browser and create a browser instance
        // Pass the browser instance to the scraper controller        
        let browserInstance = await puppeteer.launch({
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

        // let browserInstance = browserObject.startBrowser();
        const data = await scraperController(browserInstance,city, date)
        await browserInstance.close()
        response.status(200).json({total: data.length, data});
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