import fetch from 'node-fetch';
import fs from 'fs';

// How to use
// - run the page in your browser and copy the cooke value into the headers part if it's not working for some reason.
// - run getAllIds function to gather all the shop ID
// - run getAllDetailsFromIds function what will download all the shop details for each ID
// - run getShopNames function what will collect all the shop names and unique shop names from the details
// - go crazy, do whatever you want with the data :)

const getAllIds = () => {
    const url = "https://elfogadohely.edenred.hu/Home/FindBy";
    // radius is 2 max by default, you can adjust it further to get more or less results, my goal was to get all the possible shops
    const requestData = {"latitude":"47.5049309","longitude":"19.0579076","radius":"100","radiusExtension":"0","filters":[{"name":"name","value":""},{"name":"ddl_product","value":"5"}],"clientContext":{"CountryID":"30","ProductID":"5","LangueID":""},"requestId":"a4e232cd-91da-4b4b-b74a-419202cf5162"};
    const config = {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'Cookie': "_ga=GA1.2.620796770.1637062287; _gac_UA-17546308-1=1.1639740705.CjwKCAiAh_GNBhAHEiwAjOh3ZJSQp4F60eCPhU0e7YgDWEBiWLIzM3V_E02iXOH4Ut4jkhey-O-kPxoC-c4QAvD_BwE; Emaps-UserId=f0151d5c-93b2-4d3d-ae92-6212d34ab93a; ErMapsSession=CfDJ8Mi1o3b0cA1MgmWpqrAqyTevS%2FGP%2FiDFtwkLVd7saCrpByLqFrCRxokTg9xMR8Epd%2B%2BRSic7u8RXJYmn110JxVDnO4MbUGqLyOTvjWywOeVS0TtLhn1LCMo4ZCyblXdcORDoULTzmnxVZsLxDYcERByK%2BqA%2FdoE8nz4dmKupTOrE; _gid=GA1.2.598189764.1643202677; _dc_gtm_UA-17546308-1=1; TS010bb89a=015b3bbaa39a1f07b6cf3d63f44cabe2bf9c391e3dcdb1333c00b943318ee5fbfe99f888cd6b1fc38212650739ae005219178d57b4; _gat_countryTracker=1; _gat=1",
        },
        body: JSON.stringify(requestData),
    };

    fetch(url, config)
        .then(response => response.json())
        .then(data => {
            fs.writeFile("scrape_ids.json", JSON.stringify(data), ()=>{console.log("done")});

            // DIGEST DATA
            const filtered = [];
            data =JSON.parse(data);
            data.Value.forEach((shop)=>{filtered.push(shop.I)});
            fs.writeFile("scrape_ids_pure.json", JSON.stringify(filtered), ()=>{console.log("done")});
        });
}

const getAllDetailsFromIds = () => {
    fs.readFile('./scrape_ids_pure.json', 'utf8' , (err, data) => {
        const url = "https://elfogadohely.edenred.hu/Home/FindByIds";
        const idsList = JSON.parse(data);

        const requestData = {"ids":idsList, "clientContext":{"CountryID":"30","ProductID":"5","LangueID":""}};

        const config = {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Cookie': "_ga=GA1.2.620796770.1637062287; _gac_UA-17546308-1=1.1639740705.CjwKCAiAh_GNBhAHEiwAjOh3ZJSQp4F60eCPhU0e7YgDWEBiWLIzM3V_E02iXOH4Ut4jkhey-O-kPxoC-c4QAvD_BwE; Emaps-UserId=f0151d5c-93b2-4d3d-ae92-6212d34ab93a; ErMapsSession=CfDJ8Mi1o3b0cA1MgmWpqrAqyTevS%2FGP%2FiDFtwkLVd7saCrpByLqFrCRxokTg9xMR8Epd%2B%2BRSic7u8RXJYmn110JxVDnO4MbUGqLyOTvjWywOeVS0TtLhn1LCMo4ZCyblXdcORDoULTzmnxVZsLxDYcERByK%2BqA%2FdoE8nz4dmKupTOrE; _gid=GA1.2.598189764.1643202677; _dc_gtm_UA-17546308-1=1; TS010bb89a=015b3bbaa39a1f07b6cf3d63f44cabe2bf9c391e3dcdb1333c00b943318ee5fbfe99f888cd6b1fc38212650739ae005219178d57b4; _gat_countryTracker=1; _gat=1",
            },
            body: JSON.stringify(requestData),
        };
        
        fetch(url, config)
            .then(response => response.json())
            .then(data => {
                fs.writeFile("scrape_details.json", JSON.stringify(data), ()=>{console.log("done")});
            });
    });
}

const getShopNames = () => {
    fs.readFile('./scrape_details.json', 'utf8' , (err, data) => {
        const uniqueShops = new Set();
        const allShops = [];
        if (err) {
          console.error(err);
          return;
        }

        data = JSON.parse(data);
        data.forEach((place)=>{
            uniqueShops.add(place.Name);
            allShops.push(place.Name);
        });

        fs.writeFile("scrape_unique_shops.json", JSON.stringify([...uniqueShops]), ()=>{console.log("done")});
        fs.writeFile("scrape_all_shops.json", JSON.stringify(allShops), ()=>{console.log("done")});
    });
}

const getShopWords = () => {
    fs.readFile('./scrape_details.json', 'utf8' , (err, data) => {
        //let uniqueNames = new Set();
        //let allWords = [];
        let wordCounts = {};
        let wordCountsArray = [];

        if (err) {
          console.error(err);
          return;
        }

        data = JSON.parse(data);
        data.forEach((place)=>{
            place.Name = place.Name.trim();
            let placeWords = place.Name.split(/[ -\.,/]+/);

            // add every variation of two following word options of the array, eg. [0,1,2,3] = 01,12,23
            let doubleWords = [];
            placeWords.forEach((word, index) => {
                if(index+1 < placeWords.length){
                    doubleWords.push(placeWords[index] + " " + placeWords[index+1]);
                }
            })

            placeWords=[...placeWords, ...doubleWords];
            
            placeWords.forEach((word)=>{
                //allWords.push(word);
                //uniqueNames.add(word);
                
                if (wordCounts.hasOwnProperty(word)) {
                    wordCounts[word]++;
                }
                else {
                    wordCounts[word]=0;
                }
            });
        });

        Object.keys(wordCounts).forEach((word)=>{
            wordCountsArray.push({word: word, count: wordCounts[word]});
        });

        wordCountsArray.sort((a, b) => b.count - a.count);

        //fs.writeFile("scrape_unique_words.json", JSON.stringify([...uniqueNames]), ()=>{console.log("done")});
        //fs.writeFile("scrape_all_words.json", JSON.stringify(allWords), ()=>{console.log("done")});
        //fs.writeFile("scrape_wordcounts.json", JSON.stringify(wordCounts), ()=>{console.log("done")});
        fs.writeFile("scrape_wordcounts_array_v2.json", JSON.stringify(wordCountsArray), ()=>{console.log("done")});
    });
}

// 1. Scrape ID list for all the shops available for edenred
//getAllIds();

// 2. Scrape details for all the shop ID's received previously
//getAllDetailsFromIds();

// 3. Separate shop names into a single array, also collect unique shop names
//getShopNames();

// 4. Cut shop names into words and get unique word list and double word list, also gather a count of multiple occurences
getShopWords();
