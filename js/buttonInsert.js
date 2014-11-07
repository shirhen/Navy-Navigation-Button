/***
Swype Fast Navigation Button V 1.0.4
https://github.com/zdb3/Swype
Contributer: Zachary Bears http://zacharybears.com/
License: GNU
***/
/********************************* Constants *********************************/

//The default X and Y positions of the button
var DEFAULT_X = 50;
var DEFAULT_Y = 50;
//The speed at which to execute theme animations
var ANIMATION_SPEED = 100;
//The speed at which to move the button with
var DRAG_SPEED = 300;
//Stores the color array for the app. top level is theme and inside we have theme name and array of colors
var DEFAULT_COLORS = [["Default",["#EFEFEF","#2B3A42","#DDD","#E74C3C"]],
					  ["Dark",["black","yellow","yellow","#E74C4C"]]];
//The default links to populate the button with --- !! NOT USED -> the data is in data.js !! ---- 
var DEFAULT_LINKS = [["home","http://www.home.com"]];
//The HTML to be inserted into the header of the page
var HEAD_HTML = ''; // not used
var BODY_HTML = '<div class="navy-prevent"></div><div class="navy-outer"> <div class="navy-container" id="draggable"> <div class="navy-button">  </div>  <div class="navy-select-buttons">   <div class="navy-nav"> <ul class="circle" id="listUrls">   </div>  </div>	</div></div>';

/********************************* Variables *********************************/

//Fonts supported by the extension
var fonts = ["Lobster","PT Sans","Nova Square"]
//Theme colors
var primaryColor;
var secondaryColor; 
var tertiaryColor;
var quaternaryColor;
//Script populated color theme array
var colors;
//Indicates whether the button is currently being dragged
var isDragging = false;
//Index of the currently selected theme in the color theme array
var themeIndex = 0;
//Indicates whether the mouse has been clicked in the navy button
var isMouseDown=false; 
//Indicates whether the mouse is hovering over the navy button
var isHovering=false; 
//Indicates whether the button has been placed in its initial position
var isPlaced = false;
 //The location of the button on the screen
var btnLoc = [DEFAULT_X, DEFAULT_Y];
//The number of times the click button has been released on the navy button. Used for link minimization
var upclicks = 0;
//Keeps track of whether the user is hovering over the drag button
var onDragButton = false;
//Index of the currently selected font style
var textIndex = 0;
//State of the minify navy checkbox
var minChecked = true;
// Hold the window resize interval and work as a flag
var windowInterval = false;
//Jquery window object
var $win = $(window); 
//Initial Window Dimensions
var dimensions = [ $win.width(), $win.height() ]; 


/********************************* Main Program Flow *********************************/

$("head").append(HEAD_HTML);//Add the font loading code to the head of the document
$("body").append(BODY_HTML);//Add the navy button to the document body
loadPos();//Move the button to its initial position
loadColors();//Load button colors from storage
//loadLinks();//Load the button links from storage
loadPreferences();//Load user preferences

/********************************* Data Storage and Loading *********************************/	

/*
* Store the button position to Chrome storage
*/
function savePos(x,y){
	var fixedBounds = checkButtonBounds(x,y); //Make sure the bounds are clamped to the acceptable locations
	x=fixedBounds[0];	//Grab the clamped x value
	y=fixedBounds[1];	//Grab the clamped y value
	//Save the locations as a fraction of the display width
	relativex = x/$(window).width();
	relativey = y/$(window).height();
	chrome.storage.sync.set({'navyPos' : [relativex,relativey]},function(){
	});
}
/*
* Load the button position from Chrome storage and move the button to that location
*/
function loadPos(){
	var location = null;
	chrome.storage.sync.get('navyPos',function(value){ //Grab the button's position from Chrome storage
		location = value.navyPos;
		if(location==null) //If the location wasn't found,
		{
			location = [DEFAULT_X,DEFAULT_Y];//Move the button to the default position
		}
		else //If the location was good
		{
			//Change the coordinates from percent window width to actual window width
			location[0] *= $(window).width();
			location[1] *= $(window).height();
		}
		location = checkButtonBounds(location[0],location[1]); //Clamp the bounds to the current window
		btnLoc = location; //Set the current location of the button to the loaded position
		if(!isPlaced){ //If the button hasn't been placed yet, make it appear in the newly loaded position
			$(".navy-container").attr('style','top:'+location[1]+'px; left:'+location[0]+'px;');
			isPlaced = true;
		}
		else{ 
			animateButton(location[0],location[1]);//Otherwise, animate the button to its new location
		}
		
	});	
}
/*
* Load the button colors from storage and apply the current color theme to the button
*/
function loadColors(){
		chrome.storage.sync.get('navyColors',function(value){
			colors = value.navyColors;
			if(colors == null) //If the colors didn't exist in chrome storage,
			{
				colors = DEFAULT_COLORS; //Load the default
			}
			chooseColorTheme(themeIndex);//Reapply the selected color theme to the page
			
		});
}
/*
* Load the navy button links and populate the button with the loaded links
*/
function loadLinks(){
	var buttonVals = null;
		chrome.storage.sync.get('buttonLabels',function(value){ //Grab the button values
			{
			buttonVals = value.buttonLabels;
			}
			if(buttonVals==null){ //If the button values haven't been saved yet, load the defaults
				buttonVals = DEFAULT_LINKS;
			}

			//Populate the button slices with appropriae links
			for(var i=1;i<=4;i++)
			{
				$("#link"+i).children().children().text(buttonVals[i-1][0]);//Populate the button titles
				$("#link"+i).children().attr("href",buttonVals[i-1][1]);//Insert the button link
			}
		});
}
/*
* Load the user preferences and update the button accordingly
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
			textIndex = preferences[2];//Grab the selected text
			applyFonts();//Apply the selected fonts to the button
		}
	});
}
/*
* Listen for changes in the Chrome storage and update button accordingly 
*/
chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (key in changes) {
    	var storageChange = changes[key]; //Get the variables that were changed
        if(key=="navyPos"){ //If the button position changed, animate the button to its new position
          	//Change from the scaled down coordinates to the actual ones
			storageChange.newValue[0] *= $(window).width();
			storageChange.newValue[1] *= $(window).height();
          	animateButton(storageChange.newValue[0],storageChange.newValue[1]); //Animate the button to its new location
          }
        if(key=="buttonLabels"){ //If the slice links were changed, reupdate them
        	loadLinks();
		}
        if(key=="navyColors")//If the color themes were changed, re-populate the color dropdowns and apply the color theme
        {
          	colors = storageChange.newValue;
          	chooseColorTheme(themeIndex);
        }
        if(key=="navyPreferences")//If preferences were changed, load the new theme preferences
        {
          	loadPreferences();
        }
    }
});

/********************************* Button Attribute Management *********************************/
	
/*
* Apply the current font to the button
*/
function applyFonts(){
	var fontObjects  = [".link-circle a p"];
	for(var i=0;i<fontObjects.length;i++)
		$(fontObjects[i]).css("font-family",fonts[textIndex]);
}
/*
* Set the button color theme to the currently selected colors
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
}
/*
* Apply the currently loaded colors to all of the HTML items that the color theme pertains to
*/
function applyColors(){
	var primaryObjects = [[".navy-button","backgroundColor"],["#dragButton","backgroundColor"],[".link-circle","backgroundColor"]];
	colorObjects(primaryObjects,primaryColor);
	var secondaryObjects = [[".link-circle a p","color"],[".navy-button","borderColor"]];
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

/********************************* Button Position and Dragging Management *********************************/

/* 
* Check to make sure the button and its container are within window bounds. Returns a valid clamped button location 
*/
function checkButtonBounds(x,y){
	var width = $(".navy-container").width();//Get the outer width and height of the button
	var height = $(".navy-container").height();
	//Compare the button position to the window bounds and clamp if necessary
	if(y<0) y=0;
	else if(y>$(window).height()-height) y=$(window).height()-height;
	if(x<0) x=0;
	else if(x>$(window).width()-width) x=$(window).width()-width;
	return [x,y]; //Return the clamped coordinates
}
/*
* Animates the button from its current location to that given by the specified x and y coordinates 
*/
function animateButton(x,y){
	//Get the button's current position
    var xpos = $(".navy-container").css("left"); //Grab the "left" position of the navy button
    xpos = xpos.substring(0,xpos.length-2)*1; //Chop of the "px" from the end of the string and convert to an int
    var ypos = $(".navy-container").css("top");  //Grab the "top" position of the navy button
    ypos = ypos.substring(0,ypos.length-2)*1; //Chop of the "px" from the end of the string and convert to an int
    var newLocation = checkButtonBounds(x,y); //Clamp the new position to the window bounds
    btnLoc = newLocation;//Set the button position tracker to the button's current position
    //Figure out the change in button location from its current location
    var deltaX = newLocation[0]-xpos;
    var deltaY = newLocation[1]-ypos;
    //Animate the button to the newly updated position using a swing animation
    $(".navy-container").animate({
        left: ["+="+deltaX.toString(),"swing"],
        top: ["+="+deltaY.toString(),"swing"]
    },DRAG_SPEED);
          	
}
/*
* Make the button draggable
*/
$("#draggable").draggable({
	handle: ".navy-button", //Use the drag button to drag everything
	cursor:"crosshair",
	start: function(){isDragging=true;$(".navy-select-buttons").fadeOut("fast");},
	stop: function(){//When the user releases their mouse,
		upclicks=0;//Make sure drag release isn't counted as a click
		//$(".navy-select-buttons").fadeIn("fast");//Show the buttons
		isDragging = false;
		var buttonPosition = $(".navy-container").position(); //Grab the button's current position
		savePos(buttonPosition.left,buttonPosition.top); // Save this new position to Chrome storage
	}
});
/*
* Monitor window resizing and move the button if necessary
*/
$(window).resize(function(){
	if( !windowInterval ) //if the interval is not set,
    {
        windowInterval  = setInterval( function() { //initialize it
            //and check to see if the dimenions have changed or remained the same
            if( dimensions[ 0 ] === $win.width() && dimensions[ 1 ] ===  $win.height() )
            {   //if they are the same, then we are no longer resizing the window
                clearInterval( windowInterval ); //deactivate the interval
                windowInterval = false; //use it as a flag
                loadPos();//Once the window has stopped moving, reload the button position with the new window width
            }
            else
            {
                 dimensions[ 0 ] =    $win.width(); //else keep the new dimensions
                 dimensions[ 1 ] =    $win.height();
            }
        }, 100 );  //perform this check every 64ms
    }
});

/********************************* Button Click and Hover Listeners *********************************/

/*
* Add required listeners to the navy button for desired functionality
*/
$(".navy-button")
	//If the user clicks on the navy button
	.mousedown(function(){
		isMouseDown=true;//Set the mouse button state to down
		//display the buttons and give them ability to accept pointer events
		$(".navy-select-buttons").fadeIn("fast");
		$(".navy-select-buttons").css('pointer-events','all');
	})
	//If the user releases their click on the navy button
	.mouseup(function(e){
		onDragButton=false;//The user is no longer dragging
		upclicks++;//Incriment the number of times the button has been clicked
	})
	//If the user's mouse enters the navy button
	.mouseenter(function(){
		isHovering=true;//The user is currently hovering on the navy button
	})
	.mouseleave(function(){
		isHovering=false;//The user is no longer hovering on the navy button
	});
/* 
* Listen for mouse events on individual circle slices
*/
$(".slice")
	//If the mouse enters a slice
	.mouseenter(function(event){ 
		if(!isDragging)//If we're not dragging
		{
			$(this).children().addClass('hover'); //Add the hover class to the slice so it is known the mouse is hovering over it
			$(this).children().animate({ //Change the slice color to indicate that it is being hovered over
		        backgroundColor: secondaryColor,
		    },ANIMATION_SPEED);
			$(this).children().children('a').children().animate({//Change the font color to the hover color
				color:primaryColor
			},ANIMATION_SPEED);
		}
	})
	//If the mouse leaves the slice
	.mouseleave(function(event){
			$(this).children().removeClass('hover');
			$(this).children().animate({ //Change the button color to indicate it is not selected
		        backgroundColor: primaryColor
		    },ANIMATION_SPEED);
			$(this).children().children('a').children().animate({//Change the text color to the not hovered color
				color:secondaryColor
			},ANIMATION_SPEED);	
	})
	//If the mouse is released on a slice
	.mouseup(function(event){
		if(!isDragging)//If we're not dragging
		{
			window.location.href = $(this).children().children('a').attr('href');//Change the window address to that of the link pointed to by the slice
		}
	});
/*
* Add required listeners to the window to ensure the proper state is maintained on the button
*/
$(document)
	//If the user releases a mouse button
	.mouseup(function(){
		isMouseDown=false;//The mouse is now up
		if((!isHovering||upclicks>1)&!isDragging){//If the user is no longer hovering on the button or the menu is opened
		$(".navy-select-buttons").fadeOut("fast");//close the menu
		$(".navy-select-buttons").css('pointer-events','none');
		upclicks=0;//Reset the button click count
		}
	});

/********************************* Miscellaneous Functions *********************************/

/*
* Kill right click functionality if the user is hovering over the navy button
*/ 
/* TODO: maybe need to change the option.html functionality
if (document.addEventListener) {
        document.addEventListener('contextmenu', function(e) {
        	if(isDragging||isHovering)
        	{
            	e.preventDefault();
            	window.location.href = chrome.extension.getURL('/html/options.html');//Navigate to the settings page
       		}
        }, false);
} else {
        document.attachEvent('oncontextmenu', function() {
        	if(isDragging||isHovering){
        	window.location.href = chrome.extension.getURL('/html/options.html');//Navigate to the settings page
       		window.event.returnValue = false;
       	}
        });

}*/
/*******************************************************/

  var source = '{{#each urls}}  <li class="item slice link-circle">    <a href="{{url}}"> <p> {{title}} </p> <img src=""/></a>  </li>  {{/each}}    </ul>  ';
  var template = Handlebars.compile(source);

  var data = { urls: [
  	{title: "Home", url: "http://www.home.idf", image: "img/home.png"},
    {title: "facebook", url: "http://www.facebook.com" ,image: "img/facebook.png"},
    {title: "gmail", url: "http://www.gmail.com", image: "img/globe.png"}
  ]};
  document.getElementById('listUrls').innerHTML = template(data);
  for (var i=0; i< data.urls.length; i++)
  {
	//Code for displaying <extensionDir>/images/myimage.png:
	var imgURL =chrome.extension.getURL(data.urls[i].image);
	$('#listUrls img')[i].src = imgURL;  
  }