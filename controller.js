const pageScraper = require('./scraper');
async function scrapeAll(browserInstance, city, date){
	let browser;
	try{
		browser = await browserInstance;
		const data =  await pageScraper.scraper(browser,city, date);	
		return data
	}
	catch(err){
		console.log("Could not resolve the browser instance => ", err);
	}
}

module.exports = (browserInstance, city, date) => scrapeAll(browserInstance, city, date)