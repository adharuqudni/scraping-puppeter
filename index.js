const browserObject = require('./browser');
const scraperController = require('./controller');
const express = require('express');

const puppeteer = require('puppeteer');
const app = express();
const port = 8080;




app.get('/json', async (req, response) => {
    // Web Scraping Code here
    try {
        const {city, date} = req.query;
        //Start the browser and create a browser instance
        // Pass the browser instance to the scraper controller
        let browserInstance = browserObject.startBrowser();
        const data = await scraperController(browserInstance,city, date)
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