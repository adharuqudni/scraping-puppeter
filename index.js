const browserObject = require('./browser');
const scraperController = require('./controller');


exports.json = async (req, res) => {
    try {
        const {city, date} = req.query;
        console.log(req.query)
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
  };
  