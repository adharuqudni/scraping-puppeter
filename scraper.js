const moment = require('moment');
const fs = require('fs');


const scraperObject = {
    url: 'https://m.tiket.com/sewa-mobil',
    async scraper(page, city = "Jakarta", date = 1) {
        const detail = []
        const today = moment();
        console.log(city, date)
        const selected_date = moment().add(date, 'days');
        const month_diff = Math.round(selected_date.diff(today, 'months', true));
        const today_format = today.format("YYYY-MM-DD--HH-mm-ss");

        try {
            const skipButton = 'div:nth-child(2) > .sc-ckVGcZ > .sc-cMljjf .tix-button:nth-child(1)';
            await page.waitForSelector(skipButton, { timeout: 5000 });
            await page.click(skipButton);
            await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
        } catch (e) {
            console.log('ga ada sekipnya ', e)
        } finally {
            const filterLocationButton = "div:nth-child(2) > .sc-ckVGcZ > .sc-jKJlTe:nth-child(1) .field"
            await page.waitForSelector(filterLocationButton);
            await page.click(filterLocationButton);

            //filterlocation
            await page.waitForTimeout(2000);

            const locationButton = ".title.bold"
            await page.waitForSelector(locationButton);
            await page.evaluate((locationButton, city) => {
                [...document.querySelectorAll(locationButton)].find(element => element.textContent === city).click();
            }, locationButton, city);

            // const locationButton = `//*[contains(text(),'${city}')]`
            // await page.waitForXPath(locationButton);
            // const elementToClick = await page.$x(locationButton);
            // await elementToClick[0].evaluate(b => b.click());

            await page.waitForTimeout(2000);
            //Filter Date
            const filterDateButton = "div:nth-child(2) .sc-ckVGcZ > .sc-jKJlTe:nth-child(2) .field"
            await page.waitForSelector(filterDateButton);
            await page.click(filterDateButton);

            const listDate = `:nth-child(${4 + month_diff}) > .month > .week > .day-container > .day`;
            await page.waitForSelector(listDate);
            const int_day = parseInt(selected_date.format("D"));
            console.log(int_day);
            await page.evaluate((int_day, month_diff) => {
                const dayElement = [...document.querySelectorAll(`:nth-child(${4 + month_diff}) > .month > .week > .day-container > .day`)][(int_day - 1)].click()
            }, int_day, month_diff);


            const submitDateButton = ".button-save-date"
            await page.waitForSelector(submitDateButton);
            await page.evaluate(date => {
                document.querySelector('.button-save-date').click();
            }, submitDateButton);

            await page.waitForTimeout(2000);

            const findButton = "div:nth-child(2) > .sc-ckVGcZ .tix-button"
            await page.waitForSelector(findButton);
            await page.click(findButton);

            try {
                const okButton = ".tix-btn-tooltip"
                await page.waitForSelector(okButton, { timeout: 5000 });
                await page.click(okButton);
            } catch (e) {
                console.log(e)
            } finally {
                await page.waitForTimeout(2000);

                await page.waitForSelector('.sc-cJSrbW');

                const listCard = await page.$$(".tix-card")
                for (const [i, card] of listCard.entries()) {
                    await page.waitForSelector(".sc-caSCKo > span");
                    const titleElement = await card.$('.sc-caSCKo > span')
                    const title = await (await titleElement.getProperty('textContent')).jsonValue()

                    await page.waitForSelector(".sc-kjoXOD > ul > li:nth-child(1) > span");
                    const baggageElement = await card.$('.sc-kjoXOD > ul > li:nth-child(1) > span')
                    const baggage = await (await baggageElement.getProperty('textContent')).jsonValue()

                    await page.waitForSelector(".sc-kjoXOD > ul > li:nth-child(2) > span");
                    const passengerElement = await card.$('.sc-kjoXOD > ul > li:nth-child(2) > span')
                    const passenger = await (await passengerElement.getProperty('textContent')).jsonValue()

                    await page.waitForSelector(".sc-cHGsZl > p:nth-child(2)");
                    const priceElement = await card.$('.sc-cHGsZl > p:nth-child(2)')
                    const price = await (await priceElement.getProperty('textContent')).jsonValue()

                    await card.click();
                    await page.waitForTimeout(2000);
                    await page.waitForSelector(".sc-gxMtzJ > .tix-card");
                    const listVendor = await page.$$(".sc-gxMtzJ > .tix-card")
                    await page.screenshot({ path: `./dump/fullpage-${i}.png`, fullPage: true, captureBeyondViewport: false });
                    const vendors = []
                    for (const [index, vendor] of listVendor.entries()) {
                        await page.waitForSelector(".sc-caSCKo > span");
                        const titleVendorElement = await vendor.$('.sc-caSCKo > span')
                        const titleVendor = await (await titleVendorElement.getProperty('textContent')).jsonValue()

                        await page.waitForSelector(".sc-hqyNC > div:nth-child(2) > .mobile");
                        const realPriceVendorElement = await vendor.$('.sc-hqyNC > div:nth-child(2) > .mobile')
                        const realPriceVendor = await (await realPriceVendorElement.getProperty('textContent')).jsonValue()

                        await page.waitForSelector(".sc-hqyNC > div:nth-child(2) > .b2");
                        const priceVendorElement = await vendor.$('.sc-hqyNC > div:nth-child(2) > .b2')
                        const priceVendor = await (await priceVendorElement.getProperty('textContent')).jsonValue()
                        const tags = []

                        try {
                            await page.waitForSelector(".sc-TOsTZ", { timeout: 5000 });
                            const tagElements = await vendor.$$('.sc-TOsTZ')
                            for (const tag of tagElements) {
                                await page.waitForSelector("small");
                                const titleTagElement = await tag.$('small')
                                const titleTag = await (await titleTagElement.getProperty('textContent')).jsonValue()
                                tags.push(titleTag)
                            }
                        } catch (e) {
                            console.log(e)
                        } finally {
                            await vendor.screenshot({ path: `./dump/screenshot-${i}#${index}-${title.split(' ').join('-').split('/').join('-')}-${titleVendor.split(' ').join('-')}.png` })
                            detail.push({
                                source: "tiket.com",
                                scrapping_at: moment().format(),
                                channel_name: "Rent Car",
                                start_time: moment().format(),
                                end_time: selected_date.format(),
                                car_type: title,
                                passengers: parseInt(passenger),
                                baggage: parseInt(baggage),
                                vendor: titleVendor,
                                customer_price: parseInt(priceVendor.match(/\d/g).join("")),
                                price: parseInt(realPriceVendor.match(/\d/g).join("")),
                                tagging: tags
                            })
                        }



                    }
                    const closeButton = ".bs-icon-close"
                    await page.waitForSelector(closeButton);
                    await page.click(closeButton);
                    await page.waitForTimeout(1000);

                    // Loop through each of those links, open a new page instance and get the relevant data from them
                }
            }
        }
        return detail
    }
}

module.exports = scraperObject;