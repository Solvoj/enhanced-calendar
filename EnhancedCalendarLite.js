define([
	"dojo/_base/array", // array.forEach array.map
	"dojo/_base/declare", // declare
	"dojo/cldr/supplemental", // cldrSupplemental.getFirstDayOfWeek
	"dojo/date", // date
	"dojox/date/islamic", // date islamic
	"dojo/date/locale",
	"dojox/date/islamic/locale", //islamic locale
	"dojo/date/stamp", // stamp.fromISOString
	"dojo/dom", // dom.setSelectable
	"dojo/dom-class", // domClass.contains
	"dojo/_base/event", // event.stop
	"dojo/_base/lang", // lang.getObject, lang.hitch
	"dojo/on",
	"dojo/sniff", // has("ie") has("webkit")
	"dojo/string", // string.substitute
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dojo/text!./templates/EnhancedCalendar.html",
	"dijit/a11yclick",	// not used directly, but template has ondijitclick in it
	"dijit/hccss"    // not used directly, but sets CSS class on <body>
], function(array, declare, cldrSupplemental, date, dislamic, locale, ilocale,stamp, dom, domClass,event, lang, on, has, string, _WidgetBase, _TemplatedMixin, template){


	// module:
	//		EnhancedCalendarLite

	var EnhancedCalendarLite = declare([_WidgetBase, _TemplatedMixin], {
		// summary:
		//		Lightweight version of Calendar widget aimed towards mobile use
		//
		// description:
		//		A simple GUI for choosing a date in the context of a monthly calendar.
		//		This widget can't be used in a form because it doesn't serialize the date to an
		//		`<input>` field.  For a form element, use EnhancedDateTextBox instead.
		//
		//		Note that the parser takes all dates attributes passed in the
		//		[RFC 3339 format](http://www.faqs.org/rfcs/rfc3339.html), e.g. `2005-06-30T08:05:00-07:00`
		//		so that they are serializable and locale-independent.
		//
		//		Also note that this widget isn't keyboard accessible; use CalendarEnhanced for that
		// example:
		//	|	var calendar = EnhancedCalendarLite({}, dojo.byId("calendarNode"));
		//
		// example:
		//	|	<div data-dojo-type="enhanced-calendar/EnhancedCalendarLite"></div>

		// Template for main calendar
		templateString: template,

		// Template for cell for a day of the week (ex: M)
		dowTemplateString:'<th class="dijitReset dijitCalendarDayLabelTemplate" role="columnheader" scope="col"><span class="dijitCalendarDayLabel" data-dojo-attach-point="calendarDayLabelOneNode"></span></th><th class="dijitReset dijitCalendarDayLabelTemplate" role="columnheader" scope="col"><span class="dijitCalendarDayLabel" data-dojo-attach-point="calendarDayLabelTwoNode"></span></th><th class="dijitReset dijitCalendarDayLabelTemplate" role="columnheader" scope="col"><span class="dijitCalendarDayLabel" data-dojo-attach-point="calendarDayLabelThreeNode"></span></th><th class="dijitReset dijitCalendarDayLabelTemplate" role="columnheader" scope="col"><span class="dijitCalendarDayLabel" data-dojo-attach-point="calendarDayLabelFourNode"></span></th><th class="dijitReset dijitCalendarDayLabelTemplate" role="columnheader" scope="col"><span class="dijitCalendarDayLabel" data-dojo-attach-point="calendarDayLabelFiveNode"></span></th><th class="dijitReset dijitCalendarDayLabelTemplate" role="columnheader" scope="col"><span class="dijitCalendarDayLabel" data-dojo-attach-point="calendarDayLabelSixNode"></span></th><th class="dijitReset dijitCalendarDayLabelTemplate" role="columnheader" scope="col"><span class="dijitCalendarDayLabel" data-dojo-attach-point="calendarDayLabelSevenNode"></span></th>',
		// Templates for a single date (ex: 13
		//									 12),
		//								and for a row for a week (ex: 20 21 22 23  24 25  26
		//															   10 11 12	13	14 15  16)		
		dateTemplateStringHijriAndGre: '<td class="dijitReset" role="gridcell" data-dojo-attach-point="dateCells"><span class="dijitCalendarDateLabel"><span class=" dijitCalendarDateLabelGregorian" data-dojo-attach-point="dateLabels"></span><span class=" dijitCalendarDateLabelHijrin" data-dojo-attach-point="dateLabelsHijrin"></span></span></td>',
		weekTemplateString: '<tr class="dijitReset dijitCalendarWeekTemplate" role="row">${d}${d}${d}${d}${d}${d}${d}</tr>',
		headerTemplateStringHijriAndGre:'<div data-dojo-attach-point="headerMonthNode"><span data-dojo-attach-point="monthLabelNode" class="dijitInline dijitCalendarMonthLabel" ></span><span data-dojo-attach-point="yearLabelNode" class="dijitInline dijitCalendarMonthLabel" ></span><span class="dijitInline" data-dojo-attach-point="separatorLabelNode"></span><div class="dijitCalendarHeaderHijri"><span data-dojo-attach-point="hijriMonthLabelNode" class="dijitInline dijitCalendarMonthLabel" ></span><span data-dojo-attach-point="hijriMonthLabelTwoNode" class="dijitInline dijitCalendarMonthLabel" ></span><span data-dojo-attach-point="hijriYearLabelNode" class="dijitInline dijitCalendarMonthLabel" ></span></div></div>',
		
		// value: Date
		//		The currently selected Date, initially set to invalid date to indicate no selection.
		value: new Date(""),
		// TODO: for 2.0 make this a string (ISO format) rather than a Date

		// datePackage: String
		//		JavaScript namespace to find calendar routines.	 If unspecified, uses Gregorian calendar routines
		//		at dojo/date and dojo/date/locale.
		datePackage: "",
		//		TODO: for 2.0, replace datePackage with dateModule and dateLocalModule attributes specifying MIDs,
		//		or alternately just get rid of this completely and tell user to use module ID remapping
		//		via require
		
		// showHijri:Boolean
		//		Variable para saber si se muestra el calendario de Hijri
		showHijri:false,
		
		// showGregorian:Boolean
		//		Variable para saber si se muestra el calendario de Gregorian, por defecto siempre se muestra.
		showGregorian:true,
		
		// dayWidth: String
		//		How to represent the days of the week in the calendar header. See locale
		dayWidth: "narrow",

		// tabIndex: String
		//		Order fields are traversed when user hits the tab key
		tabIndex: "0",

		// currentFocus: Date
		//		Date object containing the currently focused date, or the date which would be focused
		//		if the calendar itself was focused.   Also indicates which year and month to display,
		//		i.e. the current "page" the calendar is on.
		currentFocus: new Date(),

		// Put the summary to the node with role=grid
		_setSummaryAttr: "gridNode",

		baseClass: "dijitCalendar",

		_isValidDate: function(/*Date*/ value){
			// summary:
			//		Runs various tests on the value, checking that it's a valid date, rather
			//		than blank or NaN.
			// tags:
			//		private
			return value && !isNaN(value) && typeof value == "object" &&
				value.toString() != this.constructor.prototype.value.toString();
		},

		_getValueAttr: function(){
			// summary:
			//		Support get('value')

			// this.value is set to 1AM, but return midnight, local time for back-compat
			var storedVal = this._get("value");
			if(storedVal && !isNaN(storedVal)){
				var value = new this.dateClassObj(storedVal);
				value.setHours(0, 0, 0, 0);

				// If daylight savings pushes midnight to the previous date, fix the Date
				// object to point at 1am so it will represent the correct day. See #9366
				if(value.getDate() < storedVal.getDate()){
					value = this.dateModule.add(value, "hour", 1);
				}
				var result = value;
				if(this.dateModule == dislamic){
					result = value.toGregorian();
				}
				return result;
			}else{
				return null;
			}
		},

		_setValueAttr: function(/*Date|Number*/ value, /*Boolean*/ priorityChange){
			// summary:
			//		Support set("value", ...)
			// description:
			//		Set the current date and update the UI.  If the date is disabled, the value will
			//		not change, but the display will change to the corresponding month.
			// value:
			//		Either a Date or the number of seconds since 1970.
			// tags:
			//		protected
			if(typeof value == "string"){
				value = stamp.fromISOString(value);
			}
			value = this._patchDate(value);

			if(this._isValidDate(value) && !this.isDisabledDate(value, this.lang)){
				this._set("value", value);

				// Set focus cell to the new value.   Arguably this should only happen when there isn't a current
				// focus point.   This will also repopulate the grid to new month/year if necessary.
				this.set("currentFocus", value);

				// Mark the selected date
				this._markSelectedDates([value]);

				if(this._created && (priorityChange || typeof priorityChange == "undefined")){
					this.onChange(this.get('value'));
				}
			}else{
				// clear value, and mark all dates as unselected
				this._set("value", null);
				this._markSelectedDates([]);
			}
		},

		_patchDate: function(/*Date|Number*/ value){
			// summary:
			//		Convert Number into Date, or copy Date object.   Then, round to nearest day,
			//		setting to 1am to avoid issues when DST shift occurs at midnight, see #8521, #9366)
			if(value){
				value = new this.dateClassObj(value);
				value.setHours(1, 0, 0, 0);
			}
			return value;
		},

		_setText: function(node, text){
			// summary:
			//		This just sets the content of node to the specified text.
			//		Can't do "node.innerHTML=text" because of an IE bug w/tables, see #3434.
			// tags:
			//		private
			if(node){
				while(node.firstChild){
					node.removeChild(node.firstChild);
				}
				node.appendChild(node.ownerDocument.createTextNode(text));
			}
		},

		_populateGrid: function(){
			// summary:
			//		Fills in the calendar grid with each day (1-31).
			//		Call this on creation, when moving to a new month.
			// tags:
			//		private
			var that = this;
			var month = new this.dateClassObj(this.currentFocus);
			month.setDate(1);
			var firstDay = month.getDay(),
				daysInMonth = this.dateModule.getDaysInMonth(month),
				daysInPreviousMonth = this.dateModule.getDaysInMonth(this.dateModule.add(month, "month", -1)),
				today = new this.dateClassObj(),
				//A index for first day of the week,e.g. Sunday (returns 0), or Monday (returns 1), or Saturday (returns 6)
				// dayOffset = cldrSupplemental.getFirstDayOfWeek(this.lang);
				dayOffset = 6;
			if(dayOffset > firstDay){
				dayOffset -= 7;
			}

			// If they didn't provide a summary, change the default summary to match with the new month
			if(!this.summary){
				var monthNames = this.dateLocaleModule.getNames('months', 'wide', 'standAlone', this.lang, month);
				this.gridNode.setAttribute("summary", monthNames[month.getMonth()]);
			}

			// Mapping from date (as specified by number returned from Date.valueOf()) to corresponding <td>
			this._date2cell = {};

			// Iterate through dates in the calendar and fill in date numbers and style info
			array.forEach(this.dateCells, function(template, idx){
				var i = idx + dayOffset;
				var date = new this.dateClassObj(month),
					number, clazz = "dijitCalendar", adj = 0;
				if(i < firstDay){
					number = daysInPreviousMonth - firstDay + i + 1;
					adj = -1;
					clazz += "Previous";
				}else if(i >= (firstDay + daysInMonth)){
					number = i - firstDay - daysInMonth + 1;
					adj = 1;
					clazz += "Next";
				}else{
					number = i - firstDay + 1;
					clazz += "Current";
				}

				if(adj){
					date = this.dateModule.add(date, "month", adj);
				}
				date.setDate(number);

				if(!this.dateModule.compare(date, today, "date")){
					clazz = "dijitCalendarCurrentDate " + clazz;
				}

				if(this.isDisabledDate(date, this.lang)){
					clazz = "dijitCalendarDisabledDate " + clazz;
					template.setAttribute("aria-disabled", "true");
				}else{
					clazz = "dijitCalendarEnabledDate " + clazz;
					template.removeAttribute("aria-disabled");
					template.setAttribute("aria-selected", "false");
				}

				var clazz2 = this.getClassForDate(date, this.lang);
				if(clazz2){
					clazz = clazz2 + " " + clazz;
				}

				template.className = clazz + "Month dijitCalendarDateTemplate dijitCalendarDateTemplateHijri";

				// Each cell has an associated integer value representing it's date
				var dateVal = date.valueOf();
				this._date2cell[dateVal] = template;
				template.dijitDateValue = dateVal;

				///
				if(that.showHijri && that.showGregorian){
					this._setText(this.dateLabels[idx], date.getDateLocalized ? date.getDateLocalized(this.lang) : date.getDate());
					//Set Date string hijrin
					var dateHijrin = dislamic.Date();
					dateHijrin = dateHijrin.fromGregorian(date);
					this._setText(this.dateLabelsHijrin[idx], dateHijrin.getDateLocalized ? dateHijrin.getDateLocalized("ar"):dateHijrin.getDate());
				}else{
					this._setText(this.dateLabels[idx], date.getDateLocalized ? date.getDateLocalized(this.lang) : date.getDate());
					this._setText(this.dateLabelsHijrin[idx], "");
				}
			}, this);
			
			var dateGregorian = new this.dateClassObj();
			var monthNames = this.dateLocaleModule.getNames('months', 'wide', 'standAlone', this.lang);
			
			if(this.showGregorian && this.showHijri){
				var dateHijrin = dislamic.Date();
				dateHijrinInit = dateHijrin.fromGregorian(month);
				month.setDate(daysInMonth);
				var lastDate = new Date(month);
				var dateHijrinLast = dislamic.Date();
				dateHijrinLast = dateHijrinLast.fromGregorian(lastDate);
				var monthNamesHijri = this.dateLocaleModuleHijri.getNames('months', 'wide', 'standAlone', this.lang);
				this._setText(this["monthLabelNode"],monthNames[dateGregorian.getMonth()]);
				this._setText(this["yearLabelNode"],this.dateLocaleModule.format(dateGregorian, {selector:'year', locale:this.lang}));
				this._setText(this["hijriMonthLabelNode"],monthNamesHijri[dateHijrinInit.getMonth()]);
				this._setText(this["hijriYearLabelNode"],this.dateLocaleModule.format(dateHijrin, {selector:'year', locale:'ar'}));
				this._setText(this["separatorLabelNode"],"/");
				if(dateHijrinInit.getMonth()!=dateHijrinLast.getMonth()){
					this._setText(this["hijriMonthLabelTwoNode"],monthNamesHijri[dateHijrinLast.getMonth()]);
				}
			}else{
				if(this.dateModule == dislamic){
					var monthNamesH = this.dateLocaleModuleHijri.getNames('months', 'wide', 'standAlone', this.lang);
					this._setText(this["monthLabelNode"],monthNamesH[dateGregorian.getMonth()]);
					this._setText(this["yearLabelNode"],this.dateLocaleModuleHijri.format(dateGregorian, {selector:'year', locale:this.lang}));
					this._clearSetTextLabels();
				}else{
					this._setText(this["monthLabelNode"],monthNames[dateGregorian.getMonth()]);
					this._setText(this["yearLabelNode"],this.dateLocaleModule.format(dateGregorian, {selector:'year', locale:this.lang}));
					this._clearSetTextLabels();
				}
			}
			
			
			if(this.showHijri && !this.showGregorian){
				var dayNamesHijri = this.dateLocaleModule.getNames('days', this.dayWidth, 'standAlone', "ar");
				this._setTextDayNames(dayNamesHijri);
			}else{
				var dayNames =  this.dateLocaleModule.getNames('days', 'abbr', 'standAlone', this.lang);
				this._setTextDayNames(dayNames);
			}
		},

		_populateControls: function(){
			// summary:
			//		Fill in localized month, and prev/current/next years
			// tags:
			//		protected

			var month = new this.dateClassObj(this.currentFocus);
			month.setDate(1);

			var y = month.getFullYear() - 1;
			var d = new this.dateClassObj();
			array.forEach(["previous", "current", "next"], function(name){
				d.setFullYear(y++);
				this._setText(this[name + "YearLabelNode"],
					this.dateLocaleModule.format(d, {selector: 'year', locale: this.lang}));
			}, this);
		},

		goToToday: function(){
			// summary:
			//		Sets calendar's value to today's date
			this.set('value', new this.dateClassObj());
		},

		constructor: function(params /*===== , srcNodeRef =====*/){
			// summary:
			//		Create the widget.
			// params: Object|null
			//		Hash of initialization parameters for widget, including scalar values (like title, duration etc.)
			//		and functions, typically callbacks like onClick.
			//		The hash can contain any of the widget's properties, excluding read-only properties.
			// srcNodeRef: DOMNode|String?
			//		If a srcNodeRef (DOM node) is specified, replace srcNodeRef with my generated DOM tree
			this.showHijri = params.showHijri  || this.showHijri;
			this.showGregorian = params.showGregorian || this.showGregorian;
			
			this.dateModule = params.datePackage ? lang.getObject(params.datePackage, false) : date;
			
			this.dateClassObj = this.dateModule.Date || Date;
			this.dateLocaleModule = locale;//params.datePackage ? lang.getObject(params.datePackage + ".locale", false) : locale;
			this.dateLocaleModuleHijri = lang.getObject(dislamic + ".locale", false) || ilocale;
		},
		

		buildRendering: function(){
			var that = this;
			
			// Markup for days of the week (referenced from template)
			if(this.showHijri && !this.showGregorian){
				this.dateModule = dislamic;
				this.dateClassObj = this.dateModule.Date || Date;
			}
			
			this.dayCellsHtml = this.dowTemplateString;
			this.headerMonthYear = this.headerTemplateStringHijriAndGre;
			
			// Markup for dates of the month (referenced from template), but without numbers filled in
			var r = string.substitute(this.weekTemplateString, {d: ""}, function(){
				return that.dateTemplateStringHijriAndGre;
			});
			this.dateRowsHtml = [r,r,r,r,r,r].join("");
			//----
			// Instantiate from template.
			// dateCells and dateLabels arrays filled when _Templated parses my template.
			this.dateCells = [];
			this.dateLabels = [];
			//date labels hijrin
			this.dateLabelsHijrin = [];
			
			this.inherited(arguments);
			
			dom.setSelectable(this.domNode, false);
			
			var dateObj = new this.dateClassObj(this.currentFocus);
			this.set('currentFocus', dateObj, false);	// draw the grid to the month specified by currentFocus
		},
		
		_onClickShowHijri: function(/*Event*/ evt){
			// summary:
			//      Handler for showGregorianLabelNode clicks
			// tags:
			//      protected
			var node = evt.target;
			if(node){
				if(node.nodeName==='INPUT'){
					var parentNode = node.parentNode;
					if(this.showHijri){
						if(this.showGregorian){
							if(domClass.contains(parentNode, "dijitCalendarSelectedYear")){
								domClass.remove(parentNode, "dijitCalendarSelectedYear");
							}
							this.showHijri = false;
							this._refresh();
						}else{
							event.stop(evt);
							return;
						}
					}else{
						if(!domClass.contains(parentNode, "dijitCalendarSelectedYear")){
							domClass.add(parentNode, "dijitCalendarSelectedYear");
						}
						this.showHijri = true;
						this._refresh();
					}
				}
				if(node.nodeName==='SPAN'){
					event.stop(evt);
					if(this.showHijri){
						if(this.showGregorian){
							if(domClass.contains(node, "dijitCalendarSelectedYear")){
								domClass.remove(node, "dijitCalendarSelectedYear");
							}
							if(node.children[0].type=='checkbox'){
								node.children[0].checked = 0;
							}
							this.showHijri = false;
							this._refresh();
						}
					}else{
						if(!domClass.contains(node, "dijitCalendarSelectedYear")){
							domClass.add(node, "dijitCalendarSelectedYear");
						}
						if(node.children[0].type=='checkbox'){
							node.children[0].checked = 1;
						}
						this.showHijri = true;
						this._refresh();
					}
				}
			}
		},
		
		_onClickShowGregorian: function(/*Event*/ evt){
			// summary:
			//      Handler for showHijriLabelNode clicks
			// tags:
			//      protected
			var node = evt.target;
			if(node){
				if(node.nodeName==='INPUT'){
					var parentNode = node.parentNode;
					if(this.showGregorian){
						if(this.showHijri){
							if(domClass.contains(parentNode, "dijitCalendarSelectedYear")){
								domClass.remove(parentNode, "dijitCalendarSelectedYear");
							}
							this.showGregorian = false;
							this._refresh();
						}else{
							event.stop(evt);
							return;
						}
					}else{	
						if(!domClass.contains(parentNode, "dijitCalendarSelectedYear")){
							domClass.add(parentNode, "dijitCalendarSelectedYear");
						}
						this.showGregorian = true;
						this._refresh();
					}
				}
				if(node.nodeName==='SPAN'){
					event.stop(evt);
					if(this.showGregorian){
						if(this.showHijri){
							if(domClass.contains(node, "dijitCalendarSelectedYear")){
								domClass.remove(node, "dijitCalendarSelectedYear");
							}
							if(node.children[0].type=='checkbox'){
								node.children[0].checked = 0;
							}
							this.showGregorian = false;
							this._refresh();
						}
					}else{
						if(!domClass.contains(node, "dijitCalendarSelectedYear")){
							domClass.add(node, "dijitCalendarSelectedYear");
						}
						if(node.children[0].type=='checkbox'){
							node.children[0].checked = 1;
						}
						this.showGregorian = true;
						this._refresh();
					}
				}
			}
		},
		
		_clearSetTextLabels:function(){
			this._setText(this["separatorLabelNode"],"");
			this._setText(this["hijriMonthLabelNode"],"");
			this._setText(this["hijriYearLabelNode"],"");
			this._setText(this["hijriMonthLabelTwoNode"], "");
		},
		
		_setTextDayNames:function(dayNames){
			var dayOffset = 6;
			this._setText(this["calendarDayLabelOneNode"],dayNames[dayOffset++ % 7]);
			this._setText(this["calendarDayLabelTwoNode"],dayNames[dayOffset++ % 7]);
			this._setText(this["calendarDayLabelThreeNode"],dayNames[dayOffset++ % 7]);
			this._setText(this["calendarDayLabelFourNode"],dayNames[dayOffset++ % 7]);
			this._setText(this["calendarDayLabelFiveNode"],dayNames[dayOffset++ % 7]);
			this._setText(this["calendarDayLabelSixNode"],dayNames[dayOffset++ % 7]);
			this._setText(this["calendarDayLabelSevenNode"],dayNames[dayOffset++ % 7]);
		},
		
		_refresh: function(){
			if(this.showHijri&&!this.showGregorian){
				if(this.dateModule != dislamic){
					this.dateModule = dislamic;
					this.dateClassObj = this.dateModule.Date || Date;
					this.dateLocaleModuleHijri = lang.getObject(dislamic + ".locale", false) || ilocale;//lang.getObject("locale", false, dislamic);
					var dateHijrin = dislamic.Date();
					this.currentFocus = dateHijrin.fromGregorian(this.currentFocus);
				}
				dayNamesHijri = this.dateLocaleModuleHijri.getNames('days', this.dayWidth, 'standAlone', this.lang),
				this._setTextDayNames(dayNamesHijri);
				this._setCurrentFocusAttr(this.currentFocus,false,true);
			}
			if(!this.showHijri && this.showGregorian){
				if(this.dateModule == dislamic){
					this.dateModule = date;
					this.dateClassObj = this.dateModule.Date || Date;
				}
				dayNames = this.dateLocaleModule.getNames('days', 'abbr', 'standAlone', this.lang),
				this._setTextDayNames(dayNames);
				this._setCurrentFocusAttr(this.currentFocus,false,true);
			}
			if(this.showHijri && this.showGregorian){
				if(this.dateModule == dislamic){
					this.dateModule = date;
					this.dateClassObj = this.dateModule.Date || Date;
					this.dateLocaleModule = locale;
					this.currentFocus = this.currentFocus.toGregorian();
					dayNames = this.dateLocaleModule.getNames('days', 'abbr', 'standAlone', this.lang),
					this._setTextDayNames(dayNames);
					this._setCurrentFocusAttr(this.currentFocus,false,true);
				}else{
					this._setCurrentFocusAttr(this.currentFocus,false,true);
				}
			}
			
		},
		
		postCreate: function(){
			this.inherited(arguments);
			this._connectControls();

			// add class CSS and check initial values for Gregorian and Hijri checkbox.
			if(this.showGregorian){
				if(!domClass.contains(this.clickShowGregorianNode, "dijitCalendarSelectedYear")){
					domClass.add(this.clickShowGregorianNode, "dijitCalendarSelectedYear");
				}
				if(this.clickShowGregorianNode.children[0].type=='checkbox'){
					this.clickShowGregorianNode.children[0].checked = 1;
				}
			}else{
				if(domClass.contains(this.clickShowGregorianNode, "dijitCalendarSelectedYear")){
					domClass.remove(this.clickShowGregorianNode, "dijitCalendarSelectedYear");
				}
				if(this.clickShowGregorianNode.children[0].type=='checkbox'){
					this.clickShowGregorianNode.children[0].checked = 0;
				}
			}
			if(this.showHijri){
				if(!domClass.contains(this.clickShowHijriNode, "dijitCalendarSelectedYear")){
					domClass.add(this.clickShowHijriNode, "dijitCalendarSelectedYear");
				}
				if(this.clickShowHijriNode.children[0].type=='checkbox'){
					this.clickShowHijriNode.children[0].checked = 1;
				}
			}else{
				if(domClass.contains(this.clickShowHijriNode, "dijitCalendarSelectedYear")){
					domClass.remove(this.clickShowHijriNode, "dijitCalendarSelectedYear");
				}
				if(this.clickShowHijriNode.children[0].type=='checkbox'){
					this.clickShowHijriNode.children[0].checked = 0;
				}
			}
			

		},

		_connectControls: function(){
			// summary:
			//		Set up connects for increment/decrement of months/years
			// tags:
			//		protected
			
			var connect = lang.hitch(this, function(nodeProp, part, amount){
				return on(this[nodeProp], "click", lang.hitch(this, function(){
					this._setCurrentFocusAttr(this.dateModule.add(this.currentFocus, part, amount));
				}));
			});

			this.own(
				connect("incrementMonth", "month", 1),
				connect("decrementMonth", "month", -1)
				//connect("nextYearLabelNode", "year", 1),
				//connect("previousYearLabelNode", "year", -1)

			);
		},

		_setCurrentFocusAttr: function(/*Date*/ date, /*Boolean*/ forceFocus, /*Boolean*/ forceRefresh){
			// summary:
			//		If the calendar currently has focus, then focuses specified date,
			//		changing the currently displayed month/year if necessary.
			//		If the calendar doesn't have focus, updates currently
			//		displayed month/year, and sets the cell that will get focus
			//		when Calendar is focused.
			// forceFocus:
			//		If true, will focus() the cell even if calendar itself doesn't have focus
			//forceRefresh:
			//		If true, refresh cel value of calendar.
			var oldFocus = this.currentFocus,
				oldCell = this._getNodeByDate(oldFocus);
			date = this._patchDate(date);

			this._set("currentFocus", date);

			// If the focus is on a different month than the current calendar month, switch the displayed month.
			// Also will populate the grid initially, on Calendar creation.
			if(!this._date2cell || this.dateModule.difference(oldFocus, date, "month") != 0 || forceRefresh){
				this._populateGrid();
				this._populateControls();
				this._markSelectedDates([this.value]);
			}
			
			var monthNames = this.dateLocaleModule.getNames('months', 'wide', 'standAlone', this.lang);
			if(this.showGregorian && this.showHijri){
				var dateHijrin = dislamic.Date();
				month = new Date(date);
				month.setDate(1);
				dateHijrinInit = dateHijrin.fromGregorian(month);
				daysInMonth = this.dateModule.getDaysInMonth(month);
				month.setDate(daysInMonth);
				var lastDate = new Date(month);
				var dateHijrinLast = dislamic.Date();
				dateHijrinLast = dateHijrinLast.fromGregorian(lastDate);
				var monthNamesHijri = this.dateLocaleModuleHijri.getNames('months', 'wide', 'standAlone', this.lang);
				this.monthLabelNode.innerHTML = monthNames[date.getMonth()];
				this.yearLabelNode.innerHTML = this.dateLocaleModule.format(date, {selector:'year', locale:this.lang});
				this.hijriMonthLabelNode.innerHTML = monthNamesHijri[dateHijrinInit.getMonth()];
				this.hijriYearLabelNode.innerHTML = this.dateLocaleModule.format(dateHijrin, {selector:'year', locale:'ar'});
				this.separatorLabelNode.innerHTML = "/";
				if(dateHijrinInit.getMonth()!=dateHijrinLast.getMonth()){
					this.hijriMonthLabelTwoNode.innerHTML = monthNamesHijri[dateHijrinLast.getMonth()];
				}
			}else{
				if(this.dateModule == dislamic){
					var monthNamesH = this.dateLocaleModuleHijri.getNames('months', 'wide', 'standAlone', this.lang);
					this._clearSetTesxtLabelsNode();
					this.monthLabelNode.innerHTML = monthNamesH[date.getMonth()];
					this.yearLabelNode.innerHTML = this.dateLocaleModuleHijri.format(date, {selector:'year', locale:this.lang});
				}else{
					this._clearSetTesxtLabelsNode();
					this.monthLabelNode.innerHTML = monthNames[date.getMonth()];
					this.yearLabelNode.innerHTML = this.dateLocaleModule.format(date, {selector:'year', locale:this.lang});
				}
			}
			
			// set tabIndex=0 on new cell, and focus it (but only if Calendar itself is focused)
			var newCell = this._getNodeByDate(date);
			newCell.setAttribute("tabIndex", this.tabIndex);
			if(this.focused || forceFocus){
				newCell.focus();
			}

			// set tabIndex=-1 on old focusable cell
			if(oldCell && oldCell != newCell){
				if(has("webkit")){    // see #11064 about webkit bug
					oldCell.setAttribute("tabIndex", "-1");
				}else{
					oldCell.removeAttribute("tabIndex");
				}
			}
			
		},
		
		_clearSetTesxtLabelsNode:function(){
			this.hijriMonthLabelTwoNode.innerHTML = "";
			this.hijriMonthLabelNode.innerHTML = "";
			this.hijriYearLabelNode.innerHTML = "";
			this.separatorLabelNode.innerHTML = "";
		},
		
		focus: function(){
			// summary:
			//		Focus the calendar by focusing one of the calendar cells
			this._setCurrentFocusAttr(this.currentFocus, true);
		},

		_onDayClick: function(/*Event*/ evt){
			// summary:
			//		Handler for day clicks, selects the date if appropriate
			// tags:
			//		protected
			evt.stopPropagation();
			evt.preventDefault();
			for(var node = evt.target; node && !node.dijitDateValue; node = node.parentNode){
				;
			}
			if(node && !domClass.contains(node, "dijitCalendarDisabledDate")){
				this.set('value', node.dijitDateValue);
			}
		},

		_getNodeByDate: function(/*Date*/ value){
			// summary:
			//		Returns the cell corresponding to the date, or null if the date is not within the currently
			//		displayed month.
			value = this._patchDate(value);
			return value && this._date2cell ? this._date2cell[value.valueOf()] : null;
		},

		_markSelectedDates: function(/*Date[]*/ dates){
			// summary:
			//		Marks the specified cells as selected, and clears cells previously marked as selected.
			//		For EnhancedCalendarLite at most one cell is selected at any point, but this allows an array
			//		for easy subclassing.

			
			// Function to mark a cell as selected or unselected
			function mark(/*Boolean*/ selected, /*DomNode*/ cell){
				domClass.toggle(cell, "dijitCalendarSelectedDate", selected);
				cell.setAttribute("aria-selected", selected ? "true" : "false");
			}

			// Clear previously selected cells.
			array.forEach(this._selectedCells || [], lang.partial(mark, false));
			// Mark newly selected cells.  Ignore dates outside the currently displayed month.
			this._selectedCells = array.filter(array.map(dates, this._getNodeByDate, this), function(n){
				return n;
			});
			array.forEach(this._selectedCells, lang.partial(mark, true));
		},

		onChange: function(/*Date*/ /*===== date =====*/){
			// summary:
			//		Called only when the selected date has changed
		},

		isDisabledDate: function(/*===== dateObject, locale =====*/){
			// summary:
			//		May be overridden to disable certain dates in the calendar e.g. `isDisabledDate=dojo.date.locale.isWeekend`
			// dateObject: Date
			// locale: String?
			// tags:
			//		extension
			/*=====
			 return false; // Boolean
			 =====*/
		},

		getClassForDate: function(/*===== dateObject, locale =====*/){
			// summary:
			//		May be overridden to return CSS classes to associate with the date entry for the given dateObject,
			//		for example to indicate a holiday in specified locale.
			// dateObject: Date
			// locale: String?
			// tags:
			//		extension

			/*=====
			 return ""; // String
			 =====*/
		}
	});

	EnhancedCalendarLite._MonthWidget = declare("EnhancedCalendarLite._MonthWidget", _WidgetBase, {
		// summary:
		//		Displays name of current month padded to the width of the month
		//		w/the longest name, so that changing months doesn't change width.
		//
		//		Create as:
		// |	new Calendar._MonthWidget({
		// |			lang: ...,
		// |			dateLocaleModule: ...
		// |		})

		_setMonthAttr: function(month){
			// summary:
			//		Set the current month to display as a label
			var monthNames = this.dateLocaleModule.getNames('months', 'wide', 'standAlone', this.lang, month),
				spacer =
					(has("ie") == 6 ? "" : "<div class='dijitSpacer'>" +
						array.map(monthNames,function(s){
							return "<div>" + s + "</div>";
						}).join("") + "</div>");

			// Set name of current month and also fill in spacer element with all the month names
			// (invisible) so that the maximum width will affect layout.   But not on IE6 because then
			// the center <TH> overlaps the right <TH> (due to a browser bug).
			this.domNode.innerHTML =
				spacer +
					"<div class='dijitCalendarMonthLabel dijitCalendarCurrentMonthLabel'>" +
					monthNames[month.getMonth()] + "</div>";
		}
	});

	return EnhancedCalendarLite;
});
