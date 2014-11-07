$( document ).ready(function() {
	
	/********************************* Variables *********************************/
	
	/* Constants */
	var NUM_SLICES = 4; // The current number of slices on the button
	//Stores the color array for the app. top level is theme and inside we have theme name and array of colors
	var DEFAULT_COLORS = [["Default",["#EFEFEF","#2B3A42","#DDD","#E74C3C"]],
						  ["Dark",["black","yellow","yellow","#E74C4C"]]];
	//The default links to populate the button with
	var DEFAULT_LINKS = [["Facebook","http://www.facebook.com"], 
						 ["Gmail","http://gmail.com"],
						 ["Settings",chrome.extension.getURL('/html/options.html')],
						 ["Calendar","http://calendar.google.com"]];
	/* Variables */
	//Fonts supported by the extension
	var fonts = ["Lobster","PT Sans","Nova Square"]
	//Theme colors
	var primaryColor;
	var secondaryColor; 
	var tertiaryColor;
	var quaternaryColor;
	//Script populated color theme array
	var colors;
	//Index of the currently selected theme in the color theme array
	var themeIndex = 0;
	//Index of the currently selected font style
	var textIndex = 0;
	//State of the minify navy checkbox
	var minChecked = true;
	//Variable used to keep track of the currently used slice
	var currentSlice = null;
	//Variable used to indicate whether the theme colors are currently being modified
	var colorsMod = false;
	//Variable used to keep track of whether a new color theme is being created
	var creatingTheme = false;

	/********************************* Main Program Flow *********************************/

	loadButtonAttributes();//Load the slice labels
	loadColors();//Load the color array from memory
	populateFontDropdown();//Populate all the fonts in the dropdown
	populateColorPickers();//Create the color pickers
	loadPreferences();//Load the user's preferences and update the display accordingly

	/********************************* Font Management Code *********************************/
	/*
	 * Apply the currently selected font to the page
	 */
	function applyFonts(){
		var fontObjects  = [".link-circle a p"];
		for(var i=0;i<fontObjects.length;i++)
			$(fontObjects[i]).css("font-family",fonts[textIndex]);
		$("#fontdropdown select").val(textIndex);//Ensure the proper font is selected
	}
	/*
	* Populate the font dropdown with all the fonts supported by the theme
	*/
	function populateFontDropdown(){
		var dropdown = $("#fontdropdown select");
		for(var i=0;i<fonts.length;i++)
			dropdown.append($('<option></option>')
         .attr("value",i)
         .text(fonts[i]));
		$("#fontdropdown select").val(textIndex);//Ensure the proper font is selected
	}
	/*
	* Listen for changes in the value selected in the font dropfown menu and act accordingly
	*/
    $(document).on('change','#fontdropdown select',function(value){
			textIndex = $(this).find("option:selected").attr('value');
			savePreferences();//Save current theme preferences
			applyFonts();//save current theme
    });


	/********************************* Color Management Code *********************************/

	/*
	* Apply the currently loaded colors to all of the HTML items that the color theme pertains to
	*/
	function applyColors(){
		var primaryObjects = [[".navy-button","backgroundColor"],["#dragButton","backgroundColor"],[".link-circle","backgroundColor"]];
		colorObjects(primaryObjects,primaryColor);
		var secondaryObjects = [[".link-circle a","color"],[".navy-button","borderColor"]];
		colorObjects(secondaryObjects,secondaryColor);
		var tertiaryObjects = [[".link-circle","borderColor"],[".slice","borderColor"]];
		colorObjects(tertiaryObjects,tertiaryColor);
		var quaternaryObjects = [["#dragButton","borderColor"]];
		colorObjects(quaternaryObjects,quaternaryColor);
	}
	/*
	* Helper method for applyColors that applies a given color to all of the color objects in a given array
	*/
	function colorObjects(objectsArray,color){
		for(var i=0;i<objectsArray.length;i++)
		{
			$(objectsArray[i][0]).css(objectsArray[i][1],color);
		}
	}
	/*
	* Sets the colors from the theme at the specified index in the color array as the current theme colors
	* Also ensures that the dropdowns have the proper items selected
	*/
	function chooseColorTheme(colorIndex){
		//Check input bounds
		if(colorIndex>colors.length)
			return
		//Load the colors
		primaryColor = colors[colorIndex][1][0];
		secondaryColor = colors[colorIndex][1][1];
		tertiaryColor = colors[colorIndex][1][2];
		quaternaryColor = colors[colorIndex][1][3];
		applyColors();//Apply the colors to the current theme
		$("#color-dropdown select").val(colorIndex);//Select the theme in the main dropdown
		$("#theme-mod-dropdown select").val(colorIndex);// Select the theme in the color mod dropdown
	}
	/*
	* Create the spectrum color picker objects on the page and monitors color changes.
	* If the color is changed, set the appropriate color variable to the color and apply the colors.
	* This creates a live preview of color changing without actually modifying any themes.
	*/
	function populateColorPickers(){
		$(".basic").spectrum({ //Color pickers are labeled with the "basic" class
		    showInput: true,
		    clickoutFiresChange: true,
		    showButtons:false,
		    move: function(color){ //On changing the color, update the button
		    	color = color.toHexString();
		    	//Figure out what color we're changing and set the appropriate color variable
		    	switch($(this).attr("id")){ 
		    		case "primary-picker":
		    		primaryColor =  color;
		    		break;
		    		case "secondary-picker":
		    		secondaryColor = color;
		    		break;
		    		case "tertiary-picker":
		    		tertiaryColor = color;
		    		break;
		    		case "quaternary-picker":
		    		quaternaryColor = color;
		    		break;
		    	}
		    	applyColors();//Update the colors on the page to reflect the changes
		    }
		});
	}
	/*
	* Populate both color theme dropdowns with all of the color themes and
	* Ensure that the proper item is selected in both
	*/
	function populateThemeDropdowns(){
		//First, empty out all of the color selectors
		$("#theme-mod-dropdown select").empty();
		$("#color-dropdown select").empty();
		//Then go through all of the themes and add an option for each
		for(var i=0;i<colors.length;i++)
		{
			$("#color-dropdown select").append('<option value="'+i+'">'+colors[i][0]+"</option>");
			$("#theme-mod-dropdown select").append('<option value="'+i+'">'+colors[i][0]+"</option>");
		}
		//Give the individual pickers their unique final options
		$("#theme-mod-dropdown select").append('<option value="create-theme">New Theme...</option>');//Add the option to create a theme
		$("#color-dropdown select").append('<option value="create-theme">Edit Themes...</option>');//Add the option to create a theme
		//Select the proper modification item in both dropdowns
		$("#theme-mod-dropdown select").val(themeIndex);
		$("#color-dropdown select").val(themeIndex);
	}
	/*
	* Monitor the enter key being pressed in the theme creation window and
	* act accordingly if it is pressed
	*/
	$(".color-theme-creation").keypress(function(e)
        {
            code= (e.keyCode ? e.keyCode : e.which);//Get the button's keycode
            if (code == 13){ //If the enter key was presssed, save the theme
            e.preventDefault();
            saveNewThemeAttributes();
        	}
        });
	/*
	* Monitor clicks on the save button and save the theme if the button is pressed
	*/
	$("#color-save").click(function(){
		saveNewThemeAttributes();
	});
	/*
	* Monitor clicks on the cancel button and restore previous state if it was pressed
	*/
	$("#color-cancel").click(function(){
		hideColorModPage();
	});
	/*
	* Monitor clicks on the delete button and delete the current theme if the button is pressed
	*/
	$("#color-delete").click(function(){
		if (confirm('Delete this theme? This action cannot be undone.')) {
    		deleteTheme();//Delete the selected theme
		}	 
	});

	/*
	* Deletes the theme currently selected on the theme modification dropdown
	*/
	function deleteTheme(){
		var deleteIndex=$("#theme-mod-dropdown select").val();
		if(deleteIndex=="0") return; //The user should not be able to delete the default theme
		//Delete the theme from the color theme array
		colors.splice(deleteIndex,1);
		//If the actual theme selected is at or after the theme that was deleted, shift it
		if(themeIndex>=deleteIndex) themeIndex--;
		//Save the themes to storage
		saveColors();
		//Save the theme selections to storage
		savePreferences();
		//Select the previous theme on the theme page
		$("#theme-mod-dropdown select").val(deleteIndex-1).change(); //Update the currently shown theme

	}

	/*
	* Saves the current theme and closes the theme modification window
	*/
	function saveNewThemeAttributes(){
		var themeName="";
		if(creatingTheme)//If we're creaing a new theme, 
		{
			//Grab the new theme name
			themeName = $("#theme-name").val();
			//Ensure that the theme name has not been used yet
			for(var i=0;i<colors.length;i++)
			{
				if(colors[i][0]==themeName)
				{
					$("#name-warning-dialog").fadeIn("fast");
					return;
				}
			}
			//If the name was not found, make sure the dialog fades out
			$("#name-warning-dialog").fadeOut("fast");
			//Ensure the theme name is of the proper length
			if(themeName.length>15||themeName.length<1){
				$(".warning-dialog").fadeIn("fast");
				return;
			}
			//If the name length is fine, make sure the dialog fades out
			$(".warning-dialog").fadeOut("fast");
		}
		else //If we're not creating a new theme, grab the name of the theme that is being edited
			themeName= colors[$("#theme-mod-dropdown select").val()][0];
		//Create a theme from the theme name and the currently selected colors
		var theme =[themeName,[primaryColor, secondaryColor,tertiaryColor,quaternaryColor]];
		//See if the theme is already contained in the theme database
		var themeFound=false;
		for(var i=0;i<colors.length;i++){
			if(colors[i][0]==themeName){
				//If found, replace the theme in the color theme array
				colors[i] = theme;
				//Set the current theme to the newly edited theme
				themeIndex = i;
				themeFound=true;
				break;
			}
		} 
		//If the theme wasn't found, add it to the end of the color list
		if(!themeFound){
			colors[colors.length] = theme;
			themeIndex = colors.length-1;
		}
		//Save the colors to storage
		saveColors();
		//Save the selected theme
		savePreferences();
		//Hide the color modification page
		hideColorModPage();
	}
	/*
	* Show the color modification page
	*/
	function showColorModPage(){
		colorsMod = true;
		populateThemeDropdowns(); //Make sure the theme dropdown has been populated
		setUpColorChoosers();//Make sure the color choosers are set up
		if(themeIndex==0) $("#color-delete").fadeOut("fast");//Hide the delete button if the user is viewing the default theme
		$(".color-theme-creation").fadeIn("fast");//Fade in the color theme creation page
		$(".color-theme-creation").css('pointer-events','all');
		$(".not-main").fadeOut("fast");//Fade out everything that is not the color modification page
		$(".not-main").css('pointer-events','none');
	}
	/*
	* Hide the color modification page
	*/
	function hideColorModPage(){
		colorsMod = false;//The user is no longer modifying colors
		creatingTheme = false;//The user is no longer creating a theme
		//Clear the Theme name field
		$("#theme-name").val("");
		//Fade out the color modification page
		$("#color-delete").fadeIn("fast");
		$("#theme-name-div").fadeOut("fast");
		//If no problems were found, make sure the warnings fade out
		$("#name-warning-dialog").fadeOut("fast");
		$(".warning-dialog").fadeOut("fast");
		chooseColorTheme(themeIndex);//Revert all colors to what they should be for the current theme
		$(".color-theme-creation").fadeOut("fast");
		$(".color-theme-creation").css('pointer-events','none');
		//Fade back in all the other elements on the page
		$(".not-main").fadeIn("fast");
		$(".not-main").css('pointer-events','all');
	}
	/*
	* Set the color pickers to display the current colors maintained in script variables
	*/
	function setUpColorChoosers(){
		$("#primary-picker").spectrum("set",primaryColor);
		$("#secondary-picker").spectrum("set",secondaryColor);
		$("#tertiary-picker").spectrum("set",tertiaryColor);
		$("#quaternary-picker").spectrum("set",quaternaryColor);
	}

	/*
	* Listen for color theme selection changes and update the theme
	*/ 
	$(document).on('change','#color-dropdown select',function(value){
		var selectedVal = $(this).find("option:selected").attr('value');
		if(selectedVal!="create-theme") //If the user is selecting a new theme
		{
			themeIndex = $(this).find("option:selected").attr('value'); //Change the current theme
			savePreferences();//Save current theme preferences
            chooseColorTheme(themeIndex);//Apply the selected theme to the page
        }
        else
        {
        	showColorModPage();
        }
    });
    /*
    * Listen for the user selecting a different theme to modify
    */
	$(document).on('change',"#theme-mod-dropdown select",function(value){
		var selectedVal = $(this).find("option:selected").attr("value");
		if(selectedVal!="create-theme") //If the user is selecting an already created theme
		{
			if(selectedVal!="0")$("#color-delete").fadeIn("fast"); //Show the delete button if not on the default theme
			else
			{
			$("#color-delete").fadeOut("fast"); // Otherwise, hide it
			console.log("doing this");	
			} 
			console.log("here");	
			$("#theme-name-div").fadeOut("fast");//Make sure the name text block is gone
			chooseColorTheme(selectedVal); //Apply the selected theme to the page
			setUpColorChoosers(); //Update the theme colors in the page's color pickers
			creatingTheme = false;//The user is not currently creating a theme
		}
		else
		{
			$("#color-delete").fadeOut("fast");//Hide the delete button
			$("#theme-name-div").fadeIn("fast");//Give the user a text block to enter the theme name into
			creatingTheme =true;//Set a boolean indicating that the user is creating a theme
		}
	});
	
	/********************************* Button Slice Listeners and Functions *********************************/

	/* 
	* Bind a listener to keep track of the mouse hovering over the links on the navy button
	*/
	$(".slice")
	//If the mouse enters the button, change the color and add a hover class
	.mouseenter(function(event){
		$(this).children().addClass('hover');
		$(this).children().animate({ //Change the slice colors
	          	backgroundColor: secondaryColor
	         },100);
		$(this).children().children().animate({ //Change the slice text color
	          	color: primaryColor
	         },100);

	})
	//If the mouse leaves the button, change the color back to normal and remove the hover class
	.mouseleave(function(event){
		
		$(this).children().removeClass('hover');
		$(this).children().animate({ //Return the slice colors to their defaults
	          	backgroundColor: primaryColor
	         },100);
		$(this).children().children().animate({ //Animate the object to indicate it can be dragged
	          	color: secondaryColor
	         },100);
		
	})
	//If the slice is clicked, open the link modification page
	.mousedown(function(){
		currentSlice=$(this);
		showLinkModPage($(this));//Show the link modification window
	});
	/* 
	* Show the link modification page for a given slice
	*/
	function showLinkModPage(currentSlice){
		$("#settings-header").text("Modify the "+currentSlice.children().attr('name'));//Set the name of the settings box to be the link name
		$("#button-title").val(currentSlice.children().children().children().text());//Set the title input to be the button's label
		$("#button-link").val(currentSlice.children().children().attr('name'));//Set the link input to be that of the button's current URL
		if(!colorsMod){ //Make sure we aren't also modifying the theme colors
		$("#modify-link-page").fadeIn("fast"); //Show the link modification page
		$("#modify-link-page").css('pointer-events','all');//Give the page its pointer events
		}	
	}
	/*
	* Hide the link modification page and take away its pointer events
	*/
	function hideLinkModPage(){
		$(".warning-dialog").fadeOut("fast");
		$("#modify-link-page").fadeOut("fast");
		$("#modify-link-page").css('pointer-events','none');
	}
	/*
	* Listen for the enter keystroke and save link attributes if the enter key is pressed
	*/
	$("#modify-link-page").keypress(function(e)
        {
            code= (e.keyCode ? e.keyCode : e.which);//Get the button's keycode
            if (code == 13) saveNewAttributes(); //If the enter key was pressed, save the button's attributes and close the window
     	});
	/*
	* Monitor the save button being clicked and save the link if the button is pressed
	*/
	$("#link-save").click(function(){
		saveNewAttributes();
	});
	/*
	* Save the link modify attributes and close the window
	*/
	function saveNewAttributes(){
		//Check to make sure the input is below the max allowed length
		if($("#button-title").val().length>10)
		{
			//If it's above the allowed length, show a warning dialog
			$(".warning-dialog").fadeIn("fast");
			return;
		}
		//If no error was found, fade out the warning dialog
		$(".warning-dialog").fadeOut("fast");
		//Make sure we are modifying a slice
		if(currentSlice!=null){
			currentSlice.children().children().children().text($("#button-title").val());//Set the current slice to have the title input text
			currentSlice.children().children().attr('name',$("#button-link").val());//Set the current slice to have the title input name attrubute
		}
		saveButtonAttributes();//Save the new links
		hideLinkModPage();//Hide the settings dialog
	}
	/*
	* Monitor the black overlay on the window and close the link dialog if it's clicked
	*/
	$(".blackout-box").mousedown(function(){
		hideLinkModPage();
	});

	/********************************* Radio Button Listeners *********************************/

	/*
	* If the minimization radiobutton is clicked, save the new value
	*/
	$("#min-switch").change(function(){
		minChecked = $(this).prop("checked");
		savePreferences();
	});
	
	/********************************* Data Saving and Retreival *********************************/

	/*
	* Save the navy button links to chrome storage
	*/
	function saveButtonAttributes(){
		var buttonVals = [[],[],[],[]]; //Create a [name,link] array for the slices
		for(var i=1;i<=NUM_SLICES;i++){
			buttonVals[i-1][0] = $("#link"+i).children().children().text();//Grab the button title
			buttonVals[i-1][1] = $("#link"+i).children().attr("name");//Grab the button link
		}
		chrome.storage.sync.set({'buttonLabels' : buttonVals},function(){});
	}
	/*
	* Load the navy button links from chrome storage and populate the settings page accordingly
	*/
	function loadButtonAttributes(){
		var buttonVals = null;
		chrome.storage.sync.get('buttonLabels',function(value){ //Grab the button values
			{
			buttonVals = value.buttonLabels;
			}
			if(buttonVals==null){ //If the button values haven't been saved yet, load the defaults
				buttonVals = DEFAULT_LINKS;
			}
			//Populate the button slices with appropriae links
			for(var i=1;i<=NUM_SLICES;i++)
			{
				$("#link"+i).children().children().text(buttonVals[i-1][0]);//Populate the button titles
				$("#link"+i).children().attr("name",buttonVals[i-1][1]);//Insert the button link
			}
		});
	}
	/*
	* Save the color themes from storage
	*/
	function saveColors(){
		chrome.storage.sync.set({'navyColors':colors},function(){});
	}
	/*
	* Load color themes from storage
	*/
	function loadColors(){
		chrome.storage.sync.get('navyColors',function(value){
			colors = value.navyColors;
			if(colors == null) //If the colors didn't exist in chrome storage,
			{
				colors = DEFAULT_COLORS; //Load the default
			}
			populateThemeDropdowns();//Populate the color dropdown with the correct options
			chooseColorTheme(themeIndex);//Reapply the selected color theme to the page
			
		});
	}
	/*
	* Save the current theme selection and other user preferences to chrome storage
	*/
	function savePreferences(){
		var preferences = [themeIndex,minChecked,textIndex];//Gather the preferences
		chrome.storage.sync.set({'navyPreferences':preferences},function(){});
	}
	/*
	* Load the user's theme selection and other preferences from storage
	*/
	function loadPreferences(){
		var preferences = null;
		chrome.storage.sync.get('navyPreferences',function(value){
			preferences = value.navyPreferences;
			if(preferences!=null) //If user preferences were loaded
			{
				//Set the variables encoded in preferences and perform appropriate actions
				themeIndex = preferences[0];//Get the color theme
				chooseColorTheme(themeIndex);//Change the color theme
				minChecked = preferences[1];//Get the min-button check state
				$("#min-switch").attr("checked",minChecked);//Update the minimizing switch value
				textIndex = preferences[2];//Grab the selected text
				applyFonts();//Apply the selected fonts to the button
			}
		});
	}
	
	/* 
	* Listen for changes in the Chrome storage and update the page accordingly 
	*/
 	chrome.storage.onChanged.addListener(function(changes, namespace) {
        for (key in changes) {
          var storageChange = changes[key]; //Get the variables that were changed
          if(key=="buttonLabels"){ //If the slice links were changed, reupdate them
          	loadButtonAttributes();
          }
          if(key=="navyColors")//If the color themes were changed, re-populate the color dropdowns and apply the color theme
          {
          	//Populate the main color dropdown
          	populateThemeDropdowns();
          	chooseColorTheme(themeIndex);
          }
        }
      });

	/********************************* Miscellaneous Functions *********************************/

	/*
	* Make sure the client doesn't get a popup when right clicking on the page
	*/
	if (document.addEventListener) {
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        }, false);
    } else {
        document.attachEvent('oncontextmenu', function() {
            window.event.returnValue = false;
        });
    }

});
