const pageScraper = require('./scraper');
async function scrapeAll(browserInstance){
	let browser;
	try{
		browser = await browserInstance;
		const data =  await pageScraper.scraper(browser);	
		browser.close()
		return pageScraper.detail
	}
	catch(err){
		console.log("Could not resolve the browser instance => ", err);
	}
}

module.exports = (browserInstance) => scrapeAll(browserInstance)