define([
	"dojo/_base/declare", // declare
	"./EnhancedCalendar",
	"./_EnhancedDateTimeTextBox"
], function(declare, EnhancedCalendar, _EnhancedDateTimeTextBox){
	"use strict";
	// module:
	//		/EnhancedDateTextBox

	return declare([ _EnhancedDateTimeTextBox], {
		// summary:
		//		A validating, serializable, range-bound date text box with a drop down EnhancedCalendar
		// example:
		// |	new EnhancedDateTextBox({value: new Date(2009, 0, 20)})
		// example:
		// |	<input data-dojo-type='com/solvoj/widget/EnhancedDateTextBox' value='2009-01-20'>

		baseClass: "dijitTextBox dijitComboBox dijitDateTextBox",
		popupClass: EnhancedCalendar,
		_selector: "date",

		// Prevent scrollbar on EnhancedCalendar dropdown.  On iPad it often gets a scrollbar unnecessarily because Viewport
		// thinks the keyboard is showing.  Even if the keyboard is showing, it disappears when the EnhancedCalendar gets focus.
		maxHeight: Infinity,

		// value: Date
		//		The value of this widget as a JavaScript Date object, with only year/month/day specified.
		//		If specified in markup, use the format specified in `stamp.fromISOString`.
		//		set("value", ...) accepts either a Date object or a string.
		value: new Date("")	// value.toString()="NaN"
	});
});
