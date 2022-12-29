const browserObject = require('./browser');
const scraperController = require('./controller');
const express = require('express');

const puppeteer = require('puppeteer');
const app = express();
const port = 8080;




app.get('/json', async (request, response) => {
    // Web Scraping Code here
    try {
        //Start the browser and create a browser instance
        // Pass the browser instance to the scraper controller
        let browserInstance = browserObject.startBrowser();
        const data = await scraperController(browserInstance)
        response.status(200).json(data);
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