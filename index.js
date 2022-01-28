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
    const requestData = {"filters":[{"name":"ddl_product","value":"5"},{"name":"Name","value":""}],"clientContext":{"CountryID":"30","ProductID":"5","LangueID":""},"requestId":"c2ad65a8-c54a-4079-9511-076957882439"};
    const config = {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'Cookie': "_ga=GA1.2.737085234.1643382296; _gid=GA1.2.152033049.1643382296; Emaps-UserId=38453422-d527-4330-853d-7e610fea9447; ErMapsSession=CfDJ8Mi1o3b0cA1MgmWpqrAqyTdD6UgsqPG0nxGtrEyKiJ4DSdncGx9M+1bjKrFkkKnQT+W5YV7wt9OlhOmwTQNFalrK4RqUBJUfB91bWmKj4MLjRVdYpk+Y0azrPiyDzEQdW14hnC5PEAVsIaFHUWznD839THMDtz+fOW+D836rM+aH; TS010bb89a=015b3bbaa3d206a7144737d18de9c28a38ce993ea9fc68ec00fc865e333f14f3b4391488a1d8a092b97a6241c67c918999f9877e05; _gat_countryTracker=1; _gat=1",
        },
        body: JSON.stringify(requestData),
    };

    fetch(url, config)
        .then(response => response.json())
        .then(data => {
            fs.writeFile("scrape_ids.json", JSON.stringify(data), ()=>{console.log("done")});

            // remove not needed infos
            const filtered = [];
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
            'Cookie': "_ga=GA1.2.737085234.1643382296; _gid=GA1.2.152033049.1643382296; Emaps-UserId=38453422-d527-4330-853d-7e610fea9447; ErMapsSession=CfDJ8Mi1o3b0cA1MgmWpqrAqyTdD6UgsqPG0nxGtrEyKiJ4DSdncGx9M+1bjKrFkkKnQT+W5YV7wt9OlhOmwTQNFalrK4RqUBJUfB91bWmKj4MLjRVdYpk+Y0azrPiyDzEQdW14hnC5PEAVsIaFHUWznD839THMDtz+fOW+D836rM+aH; TS010bb89a=015b3bbaa3d206a7144737d18de9c28a38ce993ea9fc68ec00fc865e333f14f3b4391488a1d8a092b97a6241c67c918999f9877e05; _gat_countryTracker=1; _gat=1",
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
            uniqueShops.add(place.Name.toUpperCase().trim());
            allShops.push(place.Name.toUpperCase().trim());
        });

        fs.writeFile("scrape_unique_shops.json", JSON.stringify([...uniqueShops]), ()=>{console.log("done")});
        fs.writeFile("scrape_all_shops.json", JSON.stringify(allShops), ()=>{console.log("done")});
    });
}

const getShopWords = () => {
    fs.readFile('./scrape_details.json', 'utf8' , (err, data) => {
        let uniqueNames = new Set();
        let allWords = [];
        let wordCounts = {};
        let wordCountsArray = [];

        if (err) {
          console.error(err);
          return;
        }

        data = JSON.parse(data);
        data.forEach((place)=>{
            let placeWords = place.Name.split(/[ -\.,/]+/);
            //Remove empty strings from the array
            placeWords = placeWords.filter(v=>v!='');

            // add every variation of two following word options of the array, eg. [0,1,2,3] = 01,12,23
            let doubleWords = [];
            placeWords.forEach((word, index) => {
                if(index+1 < placeWords.length){
                    doubleWords.push(placeWords[index] + " " + placeWords[index+1]);
                }
            })

            placeWords=[...placeWords, ...doubleWords];
            
            placeWords.forEach((word)=>{
                allWords.push(word);
                uniqueNames.add(word);
                
                if (wordCounts.hasOwnProperty(word)) {
                    wordCounts[word]++;
                }
                else {
                    wordCounts[word]=0;
                }
            });
        });

        //convert object keys to properties
        Object.keys(wordCounts).forEach((word)=>{
            wordCountsArray.push({word: word, count: wordCounts[word]});
        });

        //descencing order
        wordCountsArray.sort((a, b) => b.count - a.count);

        fs.writeFile("scrape_unique_words.json", JSON.stringify([...uniqueNames]), ()=>{console.log("done")});
        fs.writeFile("scrape_all_words.json", JSON.stringify(allWords), ()=>{console.log("done")});
        fs.writeFile("scrape_wordcounts.json", JSON.stringify(wordCounts), ()=>{console.log("done")});
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
