# Enhanced Calendar

Based on the [Dojo Toolkit](http://dojotoolkit.org) component Calendar that can show both Gregorian and Hijri calendar at the same time. Currently Dojo Calendar doesn't provide the option to show both Gregorian and Hijri calendars at the same time. There could be certain scenarios in which that functionality is desirable. 

#### Enhanced Calendar provides:

+ The functionality of [Dijit Calendar](http://dojotoolkit.org/reference-guide/1.10/dijit/Calendar.html).
+ A property to define which calendar is shown by default.
+ Check boxes to select whether to show Gregorian, Hijri or both calendars.
+ Enhanced DateTextBox component.

## Quick Start

+ `git clone git://github.com/Solvoj/enhanced-calendar.git`
+ Add [dojo sdk](https://github.com/dojo) (or a symbolic link to the dojo sdk) under the vendor folder as follows:
```
└── vendor
    └── dojo
        ├── dojo
        └── util
```
+ Point your browser to `http://host/path/to/enhanced-calendar/tests/index.html`

### In Brief
```
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8">
            <title>Enhanced Calendar</title>
        </head>
    
        <body>
            

        
            <script>
                var dojoConfig = {
                    async: 1,
                    packages: [
                        { name: "enhanced-calendar", location: "path/to/enhanced-calendar" }
                    ]
                };
            </script>
        
            <script type="text/javascript" src="path/to/dojo/dojo/dojo.js"></script>
    
            <script>
                require(["enhanced-calendar", "dojo/query"], function (ECalendar, query) {
                    query("#loading-button").on("click", function(e){
                        query(e.target).button('loading');
                        setTimeout(function(){
                            query(e.target).button('reset');
                        }, 2000);
                    });
                });
            </script>
        </body>
    </html>
```

## Useful resources

+ [Enhanced Calendar Website with examples](http://demos.solvoj.com/calendar/)
+ [Dojo Reference Guide (latest release version)](http://dojotoolkit.org/reference-guide/)
+ [Dojo Reference Guide (Dojo trunk)](http://livedocs.dojotoolkit.org/)

## License

Enhanced Calendar is licensed under the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0)