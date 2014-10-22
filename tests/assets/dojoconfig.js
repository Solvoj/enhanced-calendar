//loading Dojo from Google CDN.
var dojoConfig = {
    async: 1,
    //cacheBust: 1,
    parseOnLoad: true,
    tlmSiblingOfDojo: false,
    packages: [
    	{ name: "dojo", location: "../../../vendor/dojo/dojo" },
    	{ name: "dijit", location: "../../../vendor/dojo/dijit" },
    	{ name: "dojox", location: "../../../vendor/dojo/dojox" },
        { name: "ecalendar", location: "../../.." }
    ],
     locale: 'en'
};