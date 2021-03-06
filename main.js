var devices = [];                       // All devices
var personal_devices = [];              // Computers/laptops and mobile devices
var routing_devices = [];               // Network boxes, tv boxes, or other routers/switches
var array_wireless_devices = [];
var array_level1_wired_devices = [];    // push devices in this storage array ; will be useful to collapse them all with one function
var connections = [];
var max_tv_devices = 2;
var bool_add_last = false;
// Drag-and-drop specific stuff
var dragging = null; // item that is being dragged
var hovering = null; // item currently hovering over
// for network complexities
var network_complexity = undefined;
var n_tv_boxes;
var n_wireless_devices;
var n_wired_devices;
// Dvice names
var a_random_names = ["Ralph", "Elena", "Rex", "Mordecai", "Betty White", "Nancy", "Jamilah", "Jim", "Judy", "Francine", "Mom", "Dad", "Steve", "Kengo", "Kumar"];
var a_random_rooms = ["Office", "Poolside", "Living Room", "Bedroom", "Upstairs", "Downstairs", "Basement", "War Room", "Den", "Library", "Man Cave", "Garage", "Gameroom"];
// For SVG div, when it needs to be resized to make sure lines that go beyond bottom of screen are drawn.
var svg_div_height_multiplier = 1;

$(document).ready(function() {
  $("#svg_container").svg();  // Initialize the SVG canvas
  $("#controller").hide();    // Hide the Controller div for the Drag-and-Drop feature
  
  // NEW - Set network complexity, populate and layout network.
  // _layout_type = "tree cascading";
  _layout_type = "accordion grid";
  setNetworkComplexity( "low" );
});

// Choose one of three prototypical networks, based on Google's specifications.
function setNetworkComplexity( cur_network_complexity ) {

  // Set the network complexity.
  network_complexity = cur_network_complexity;
  switch( network_complexity ) {
    case "low": 
      n_tv_boxes = 1;
      n_wireless_devices = 1;
      n_wired_devices = 0;
      break;
    case "average": 
      n_tv_boxes = 2;
      n_wireless_devices = 4;
      n_wired_devices = 1;
      break;
    case "high":
      n_tv_boxes = 6;
      n_wireless_devices = 10;
      n_wired_devices = 5;
      break;
  }
  // Then, refresh the layout with this new complexity.
  refreshLayout();
}
// Refresh the current layout. Useful after changing the network complexity, to run the same layout we already had.
function refreshLayout() {
  if ( _layout_type === "accordion grid" ) { populateDevicesAccordionGrid(); layoutDevices('accordion grid'); }
  else if ( _layout_type === "grid" ) { populateDevicesGrid(); layoutDevices('grid'); }
  else if ( _layout_type === "tree cascading" ) { populateDevicesDefault(); layoutDevices('tree cascading'); }
  else if ( _layout_type === "physics" ) { populateDevicesPhysics(); layoutDevices('physics'); }
  else if ( _layout_type === "random" ) { populateDevicesDefault(); layoutDevices('random'); }
  else if ( _layout_type === "random grid" ) { populateDevicesDefault(); layoutDevices('random grid'); }
  // NB: this fct doesnt apply to Collapsed Nodes and Drag-n-Drop features, its only for layouts.
}

// Final proposal's version of populateDevicesGrid().
function populateDevicesAccordionGrid() {

  // - - - - - - - - - - - - - - - SETUP - - - - - - - - - - - - - - - - - 

  resetLayouts();
  $('#container_background').show();    // show this as a background for the wired zone specifically ; because the connectors are at the lowest background index, we can't use a background color in the wired zone directly as it would hide the connectors, so we use this div instead.
  $("#container").hide();
  $("#container_final").show();
  // Remove attribute at start so that it may be repopulated when the layout function is completed.
  if ( $("#container_background").attr("top_original") !== undefined ) {
    $("#container_background").removeAttr("top_original");
  }

  // Reset SVG container's top position at 0
  $("#svg_container svg").css({ top: 0 });
  var expandingSubnode = null;      // stores a device that has been clicked to expand. Controls additional accordia behavior.

  var n_columns = 4;
  var a_random_names_grid = a_random_names;
  var a_random_rooms_grid = a_random_rooms;
  $('#menu li ul li a').filter(function(){ return $(this).text() === 'Toggle Connector Style';}).css("color", "#D2D2D2");       // Grey-out the Toggle Connectors menu item, it doesn't apply to this layout. This is reset in the common reset function.

  // Create containers for Wired zone (accordion + devices) and Wireless zone (accordion + devices).
  $("#container_final").append("<div class='row wireless'><div class='floated_left' style='padding:10px'>&nbsp;</div><div class='floated_right' style='padding:10px'>YOUR 2.4GHZ WIRELESS NETWORK</div><div id='wireless_accordion' class='floated_left'><div class='accordion'></div></div><div id='wireless_container' class='floated_right clear'></div></div>");
  $("#container_final").append("<div class='row wired'><div class='floated_left' style='padding:10px'>&nbsp;</div><div class='floated_right' style='padding:10px'>YOUR WIRED NETWORK</div><div id='wired_accordion' class='floated_left'><div class='accordion'></div></div><div id='wired_container' class='floated_right clear'></div></div>");

  // Create the main Network Box
  var network_box = new Device("Network Box", "networkbox");
  devices.push(network_box);  // devices[0] is always the network box
  network_box.el.appendTo( $("#wired_container") );
  $("#wired_accordion .accordion").append(network_box.advanced_accordion_settings);
  var counter_id_accordion_wired = 0;         // counts the ID of this device in the accordion. The order in which they're added to the accordion makes their ID.
  network_box.id_accordion = counter_id_accordion_wired;      // store the ID in the device object.
  counter_id_accordion_wired++;

  // Manually set height of the following containers.
  // This would be impossible to set automatically using only CSS unless our devices were using position:relative. But since our system was all built using position:absolute, we must set the container height manually using JS.
  if ( network_complexity === "low" ) {
    $("#wired_accordion").css("height", 3 * devices[0].size.height);
    $("#wired_container").css("height", 3 * devices[0].size.height);
    $("#wireless_accordion").css("height", 2 * devices[0].size.height);
    $("#wireless_container").css("height", 2 * devices[0].size.height);
    $("#container_background").css("height", 3 * devices[0].size.height);
  } else if ( network_complexity === "average" ) {
    $("#wired_accordion").css("height", 3 * devices[0].size.height);
    $("#wired_container").css("height", 3 * devices[0].size.height);
    $("#wireless_accordion").css("height", 2 * devices[0].size.height);
    $("#wireless_container").css("height", 2 * devices[0].size.height);
    $("#container_background").css("height", 3 * devices[0].size.height);
  } else if ( network_complexity === "high" ) {
    $("#wired_accordion").css("height", 4 * devices[0].size.height);
    $("#wired_container").css("height", 4 * devices[0].size.height);
    $("#wireless_accordion").css("height", 4 * devices[0].size.height);
    $("#wireless_container").css("height", 4 * devices[0].size.height);
    $("#container_background").css("height", 4 * devices[0].size.height);
  }

  // - - - - - - - - - - - - - - - WIRELESS DEVICES - - - - - - - - - - - - - - - - - 

  // Create the Wireless Network device/icon.
  var first_row = $("<div class='wireless_grid_row'></div>");
  first_row.appendTo( $('#wireless_container') );
  var wireless_network = new Device("Wi-Fi Network", "wireless_network" );
  devices.push(wireless_network);
  wireless_network.el.appendTo( first_row );
  // append the HTML of it's settings to the accordion div.
  $("#wireless_accordion .accordion").append(wireless_network.advanced_accordion_settings);
  wireless_network.is_wireless = true;   // add custom attribute for layout positioning & accordion.
  var counter_id_accordion_wireless = 0;         // counts the ID of this device in the accordion. The order in which they're added to the accordion makes their ID.
  wireless_network.id_accordion = counter_id_accordion_wireless;      // store the ID in the device object.
  counter_id_accordion_wireless++;

  // Wireless devices
  for ( var i = 0; i < n_wireless_devices; i++ ) {
    // place items in rows, each row of the grid contains up to the number of columns. Useful for positioning the last row horizontally in the center.
    if ( i % n_columns === 0 ) {
      var cur_row = $("<div class='wireless_grid_row'></div>");
      cur_row.appendTo( $('#wireless_container') );
    }

    // create a wireless device
    var type = Math.random() < 0.5 ? "phone" : "laptop";
    var name = a_random_names_grid.splice( random(0, a_random_names_grid.length), 1 ) + "'s " + type.charAt(0).toUpperCase() + type.slice(1);
    var wireless_device = new Device(name, type );
    wireless_device.is_wireless = true;   // add custom attribute for layout positioning & accordion.
    devices.push(wireless_device);
    array_wireless_devices.push(wireless_device);
    
    wireless_device.el.appendTo( cur_row );
    // wireless_device.el.appendTo( $('#wireless_container') );
    
    // connections
    var connection = new Connection(devices[0], wireless_device, "wireless", 1 );
    connection.changeShape("invisible");
    connections.push( connection );
    
    // append the HTML of the current device's settings to the accordion div.
    $("#wireless_accordion .accordion").append(wireless_device.advanced_accordion_settings);
    wireless_device.id_accordion = counter_id_accordion_wireless;
    console.log("t- wireless_device.id_accordion = "+ wireless_device.id_accordion)
    counter_id_accordion_wireless++;
  }

  
  // - - - - - - - - - - - - - - - WIRED DEVICES - - - - - - - - - - - - - - - - - 

  // WIRED - TV Boxes and TVs
  if (n_tv_boxes > 3) {
    // we need to place surplus TV Boxes in level 2
    var n_tv_boxes_level1 = 3;
    var n_tv_boxes_level2 = n_tv_boxes - 3;
  } else {
    var n_tv_boxes_level1 = n_tv_boxes;
    var n_tv_boxes_level2 = 0;
  }
  var n_remaining_slots_level1 = 4 - n_tv_boxes_level1;
  // Create Level1 TV Boxes
  for ( var i = 0; i < n_tv_boxes_level1; i++ ) {
    var name = a_random_rooms_grid.splice( random(0, a_random_rooms_grid.length), 1 ) + " TV Box";
    var box_device = new Device(name, "tvbox");
    var tv_device = new Device("TV", "tv");
    devices.push(box_device);
    routing_devices.push(box_device);
    array_level1_wired_devices.push(box_device);
    devices.push(tv_device);
    box_device.el.appendTo( $('#wired_container') );
    tv_device.el.appendTo( $('#wired_container') );
    // In advance, connect TV to TV Box (but it wont display until TV Box is connected to Network Box).
    var connection = new Connection(box_device, tv_device, "wired", 1);
    connection.changeShape("90s");
    connections.push(connection);
    // click function to collapse/uncollapse TV Box : it always starts uncollapsed, showing its TV
    box_device.el.click((function(dev) { return function() { 
  
      // If accordion is open, close it and set the var of the expanding device so it is expanded in accordionactivate.
      var active = $( "#wireless_accordion .accordion" ).accordion( "option", "active" );
      console.log("********** active = "+ active)
      if (active) {
        expandingSubnode = dev;
        $( "#wireless_accordion .accordion" ).accordion( "option", "active", false );
      } else {
        expandingSubnode = null;   // reset it
        // open this clicked node
        dev.expandSubnodes();
        layoutDevices('accordion grid');
      }

    } })(box_device));


    $("#wired_accordion .accordion").append(box_device.advanced_accordion_settings);
    box_device.id_accordion = counter_id_accordion_wired;      // store the ID in the device object.
    console.log("t- box_device.id_accordion = "+ box_device.id_accordion)
    counter_id_accordion_wired++;
  } 
  
  // WIRED - Personal Devices and Routers
  // Create remaining Level 1 devices and their Level2 children, if any.
  var array_level2_wired_devices = [];
  $("#wired_container").append("<div id='level2'></div>");
  var n_personal_devices = 0;

  //  if there are more devices than empty slots on Level1...
  if ( n_wired_devices > n_remaining_slots_level1 ) {
    console.log("t- WIRED - Personal devices --------------- MORE THAN slots : "+ n_wired_devices);

    // need routers
    var n_cur_wired = 0;
    var n_so_far = 0;

    for (var i = 0; i < n_remaining_slots_level1; i++) {

      // Determine how many devices go in each slot.
      if (i != n_remaining_slots_level1-1) {
        n_cur_wired = Math.floor( n_wired_devices / n_remaining_slots_level1 );
      } else {
        n_cur_wired = n_wired_devices - n_so_far;
      }
      n_so_far += n_cur_wired;

      console.log("----- i = "+ i);
      console.log("n_cur_wired = "+ n_cur_wired);
      console.log("n_so_far = "+ n_so_far);

      // If this slot has more than 1 device, create a router then connect those devices to it.
      if ( n_cur_wired > 1 ) {
        var is_last_row = false;
        var routing_device = new Device("Router", "router");
        devices.push(routing_device);
        routing_devices.push(routing_device);
        array_level1_wired_devices.push(routing_device);
        routing_device.el.appendTo( $('#wired_container') );
        routing_device.expanded = false;  // Start off closed
        routing_device.el.click((function(dev) { return function() {
          
          // If accordion is open, close it and set the var of the expanding device so it is expanded in accordionactivate.
          var active = $( "#wireless_accordion .accordion" ).accordion( "option", "active" );
          console.log("********** active = "+ active)
          if (active) {
            expandingSubnode = dev;
            $( "#wireless_accordion .accordion" ).accordion( "option", "active", false );
          } else {
            expandingSubnode = null;   // reset it
            // open this clicked node
            dev.expandSubnodes();
            layoutDevices('accordion grid');
          }
          
        } })(routing_device));
        
        // LEVEL 2 personal devices
        for ( var j = 0; j < n_cur_wired; j++ ) {
          // place items in rows, each row of the grid contains up to the number of columns. Useful for positioning the last row horizontally in the center.
          if ( j % n_columns === 0 ) {
            var cur_row = $("<div class='wired_grid_row'></div>");
            cur_row.appendTo( $('#level2') );                             // move device to level2 div container, to position them centrally in #container
            // if this is the last row, set bool to true
            if ( j + n_columns >= n_cur_wired ) is_last_row = true;
          }
          // create a personal device
          n_personal_devices++;   //unused : for sequentially numbering devices correctly below...
          var type = Math.random() < 0.5 ? "storage" : "laptop";
          if (type === "laptop") var name = a_random_names_grid.splice( random(0, a_random_names_grid.length), 1 ) + "'s " + type.charAt(0).toUpperCase() + type.slice(1);
          if (type === "storage") var name = a_random_rooms_grid.splice( random(0, a_random_rooms_grid.length), 1 ) + " " + type.charAt(0).toUpperCase() + type.slice(1);
          var personal_device_level2 = new Device(name, type );
          devices.push(personal_device_level2);
          array_level2_wired_devices.push(personal_device_level2);
          personal_device_level2.el.appendTo( cur_row );
          // create a connection to its routing device
          var connection = new Connection(routing_device, personal_device_level2, "wired", 1 );
          // if this is the last row, use a special type of connector: 90s_level2
          if (is_last_row) { 
            connection.changeShape("90s_level2");
          } else {
            connection.changeShape("90s");
          }
          connections.push( connection );
          // 
          console.log("************** j = "+ j);
          console.log(personal_device_level2);
          console.log(array_level2_wired_devices);
          console.log('New Level2 device '+ j + ': ' + type + ', on Router ' + i );





          $("#wired_accordion .accordion").append(personal_device_level2.advanced_accordion_settings);
          personal_device_level2.id_accordion = counter_id_accordion_wired;      // store the ID in the device object.
          console.log("t- personal_device_level2.id_accordion = "+ personal_device_level2.id_accordion)
          counter_id_accordion_wired++;
        }
        // LEVEL 2 extra tv boxes : if we have more than 3 tv boxes, place remanining ones under the last router.
        if ( n_tv_boxes_level2 > 0 ) {
          for ( var w = 0; w < n_tv_boxes_level2; w++ ) {
            var name = a_random_rooms_grid.splice( random(0, a_random_rooms_grid.length), 1 ) + " TV Box";
            var box_device = new Device(name, "tvbox");
            devices.push(box_device);
            // NB: do not add devide to routing_devices, as these in Level2 will not have any child devices.
            array_level2_wired_devices.push(box_device);
            box_device.el.appendTo( cur_row );
            // In advance, connect TV to TV Box (but it wont display until TV Box is connected to Network Box).
            var connectionTVBox = new Connection(routing_device, box_device, "wired", 1 );
            // if this is the last row, use a special type of connector: 90s_level2
            if (is_last_row) { 
              connectionTVBox.changeShape("90s_level2");
            } else {
              connectionTVBox.changeShape("90s");
            }
            connections.push( connectionTVBox );




            $("#wired_accordion .accordion").append(box_device.advanced_accordion_settings);
            box_device.id_accordion = counter_id_accordion_wired;      // store the ID in the device object.
            console.log("t- box_device.id_accordion = "+ box_device.id_accordion)
            counter_id_accordion_wired++;
          }
        }
      } 
      // If only 1 device for this Level1 slot, make it a personal device, not a router.
      else {
        var type = Math.random() < 0.5 ? "storage" : "laptop";
        if (type === "laptop") var name = a_random_names_grid.splice( random(0, a_random_names_grid.length), 1 ) + "'s " + type.charAt(0).toUpperCase() + type.slice(1);
        if (type === "storage") var name = a_random_rooms_grid.splice( random(0, a_random_rooms_grid.length), 1 ) + " " + type.charAt(0).toUpperCase() + type.slice(1); 
        var wired_device_level1 = new Device(name, type);
        devices.push(wired_device_level1);
        array_level1_wired_devices.push(wired_device_level1);
        wired_device_level1.el.appendTo( $('#wired_container') );





        $("#wired_accordion .accordion").append(wired_device_level1.advanced_accordion_settings);
        wired_device_level1.id_accordion = counter_id_accordion_wired;      // store the ID in the device object.
        console.log("t- wired_device_level1.id_accordion = "+ wired_device_level1.id_accordion)
        counter_id_accordion_wired++;
      }
    }
  //  else, there are enough open slots for our devices in Level1...
  } else {
    // add wired devices to Level1 directly...
    // console.log("t- WIRED - Personal devices ----- LESS THAN or EQUAL to slots.");

    for ( var i = 0; i < n_wired_devices; i++ ) {
      var type = Math.random() < 0.5 ? "storage" : "laptop";
      if (type === "laptop") var name = a_random_names_grid.splice( random(0, a_random_names_grid.length), 1 ) + "'s " + type.charAt(0).toUpperCase() + type.slice(1);
      if (type === "storage") var name = a_random_rooms_grid.splice( random(0, a_random_rooms_grid.length), 1 ) + " " + type.charAt(0).toUpperCase() + type.slice(1);
      var wired_device_level1 = new Device(name, type);
      devices.push(wired_device_level1);
      array_level1_wired_devices.push(wired_device_level1);
      wired_device_level1.el.appendTo( $('#wired_container') );






      $("#wired_accordion .accordion").append(wired_device_level1.advanced_accordion_settings);
      wired_device_level1.id_accordion = counter_id_accordion_wired;      // store the ID in the device object.
      console.log("t- wired_device_level1.id_accordion = "+ wired_device_level1.id_accordion)
      counter_id_accordion_wired++;
    }
  }

  // Create connections for each Level1 device to Network Box.
  for ( var i = 0; i < array_level1_wired_devices.length; i++ ) {
    var connection = new Connection(devices[0], array_level1_wired_devices[i], "wired", 1);
    connection.changeShape("90s");
    connections.push(connection);
  }


  // - - - - - - - - - - - - - - - LAST - - - - - - - - - - - - - - - - - 



   // Once we are done populating the HTML of the 2 accordions, we instantiate it.
  $(".accordion").accordion({ active: false, collapsible: true, heightStyle: "content",
    // this event fires immediately when accordion header is clicked, instead of after the animation is complete.
    beforeActivate: function( event, ui ) {
      console.log("BEFORE ---- "+ $(this).outerHeight())
      
      // add .clear so the content div wraps its floated elements.
      $(".accordion .ui-accordion-content").addClass("clear");      // Use this float-clearing method instead of using 'overflow:hidden', because this allows us to use the 'box-shadow' property, if desired.
    }
  });
  // For the Wireless accordion, apply behavior so that if it spills down onto the Wired zone, push down the Wired zone.
  $( "#wireless_accordion .accordion" ).on( "accordionactivate", function( event, ui ) {
    console.log("ACTIVATE wireless_accordion.outerHeight ---- "+ $("#wireless_accordion").outerHeight())
    console.log("ACTIVATE this.outerHeight ---- "+ $(this).outerHeight())
    
    // Calculate whether the wireless accordion has spilled out of its zone.
    var overflow = $(this).outerHeight() - $("#wireless_accordion").outerHeight();      // ie. current accordion's height - accordion container's height
    console.log("ACTIVATE overflow = "+ overflow)

    if (overflow > 0) {
      console.log("---- ENTER OVERFLOW")

      // 1) push down the Wired zone.
      $(".row.wired").css({ position: "relative" });
      $(".row.wired").animate({
        top: overflow
      });

      // 2) push down the Wired device area's background.
      var top_original = $("#container_background").attr("top_original");
      // console.log("*** OVERFLOW *** top_original = "+ typeof top_original)
      // console.log("*** OVERFLOW *** overflow = "+ typeof overflow)
      var top_new = Number(Number(top_original)+overflow);
      console.log("*** OVERFLOW *** top_original+overflow = "+ top_new)
      // $("#container_background").attr("top_original", top_original)
      $("#container_background").animate({
        top: top_new
      });

      // 3) push down the SVG container
      console.log($("#svg_container svg").top)
      $("#svg_container svg").animate({
        top: overflow
      });
    } else {
      $(".row.wired").css({ position: "relative" });
      $(".row.wired").animate({
        top: 0
      });
      var top_original = $("#container_background").attr("top_original");
      console.log("*** NOT OVERFLOW *** top_original = "+ $("#container_background").position().top)
      console.log("*** NOT OVERFLOW *** top_original = "+ top_original)
      $("#container_background").animate({
        top: top_original
      });
      $("#svg_container svg").animate({
        top: 0
      });

      // If expandingSubnode contains a device, we must expand it only after closing this accordion.
      if (expandingSubnode !== null) {
          // open this clicked node
          expandingSubnode.expandSubnodes();
          layoutDevices('accordion grid');        
      }
        
    }

  });

  
  // Do stuff to all devices...
  for ( var i = 0; i < devices.length; i++ ) {
    // Clicking on a device's icon display its settings panel. Stop propagation so the event doesn't go to the document.click fct in common.js which would immediately close the panel.
    if ( devices[i].type !== "router"  &&  devices[i].type !== "tv" ) {
      
        devices[i].el.find(".icon").click((function(clickedDevice) { return function(e) { 
          e.stopPropagation(); 
          
          // Doing this checking because of TV boxes. We want to show details if node is open, but expand it if node is closed.
          if (clickedDevice.expanded === true) {
            

            // Open corresponding accordion panel.
            console.log("**** id_accordion = "+ clickedDevice.id_accordion)
            console.log("**** is_wireless = "+ clickedDevice.is_wireless)
            if (clickedDevice.is_wireless === true) {
              console.log("######## WIRELESS ACTIVE? = "+ $( "#wireless_accordion .accordion" ).accordion( "option", "active"))
              // if already open, close it.
              if ($( "#wireless_accordion .accordion" ).accordion( "option", "active") !== false) {           // false means its closed.
                // Hack: since there is no close() function for the jQueryUI accordion, we attempt to close all odd-numbered accordion headers, since they always represent wireless headers.
                for (var i=1; i<100; i+=2) {
                  $( "#wireless_accordion .accordion #ui-accordion-"+i+"-header-"+ clickedDevice.id_accordion ).click();
                }
              } else {
                $( "#wireless_accordion .accordion" ).accordion( "option", "active", clickedDevice.id_accordion );
              }
            } else {
              console.log("######## WIRED ACTIVE? = "+ $( "#wired_accordion .accordion" ).accordion( "option", "active"))
              // if already open, close it.
              if ($( "#wired_accordion .accordion" ).accordion( "option", "active") !== false) {
                // Hack: since there is no close() function for the jQueryUI accordion, we attempt to close all odd-numbered accordion headers, since they always represent wireless headers.
                for (var i=2; i<100; i+=2) {
                  $( "#wired_accordion .accordion #ui-accordion-"+i+"-header-"+ clickedDevice.id_accordion ).click();
                }
              } else {
                $( "#wired_accordion .accordion" ).accordion( "option", "active", clickedDevice.id_accordion );   // TODO : replace with Toggle open/close
              }
            }
            

          } else {
            
            console.log("********** expanded = "+ clickedDevice.expanded)

            // clickedDevice.expandSubnodes(); 
            // layoutDevices('accordion grid');

            // If accordion is open, close it and set the var of the expanding device so it is expanded in accordionactivate.
            var active = $( "#wireless_accordion .accordion" ).accordion( "option", "active" );
            console.log("********** active = "+ active)
            if (active) {
              expandingSubnode = clickedDevice;
              $( "#wireless_accordion .accordion" ).accordion( "option", "active", false );
            } else {
              expandingSubnode = null;   // reset it
              // open this clicked node
              clickedDevice.expandSubnodes();
              layoutDevices('accordion grid');
            }

          }

        } })(devices[i]));
      
    }
  }
  
  // When we hover over an accordion header, highlight the corresponding device icon in the device area.
  // For Wireless devices :
  $("#wireless_accordion .accordion h3.ui-accordion-header").hover( 
    // on hover-in
    function() {
      var accordion_id = $(this).attr("id").split("-");                        // Grab the ID of the accordion header we hovered.
      accordion_id = Number(accordion_id[accordion_id.length-1])
      var hovered_device = $.grep(devices, function(device){                // Get the device matching that ID.
        return (device.id_accordion === accordion_id) && (device.is_wireless === true);
      });
      hovered_device = hovered_device[0];
      // hovered_device.highlight(true);                                       // highlight the device.
      hovered_device.el.addClass("highlight_accordion");
    },
    function() {
      var accordion_id = $(this).attr("id").split("-");
      accordion_id = Number(accordion_id[accordion_id.length-1])
      var hovered_device = $.grep(devices, function(device){
        return (device.id_accordion === accordion_id) && (device.is_wireless === true);
      });
      hovered_device = hovered_device[0];
      // hovered_device.highlight(false);                                      // remove the highlight on the device.
      hovered_device.el.removeClass("highlight_accordion");
    }
  );
  // For Wired devices :
  $("#wired_accordion .accordion h3.ui-accordion-header").hover( 
    // on hover-in
    function() {
      var accordion_id = $(this).attr("id").split("-");                        // Grab the ID of the accordion header we hovered.
      accordion_id = Number(accordion_id[accordion_id.length-1])
      var hovered_device = $.grep(devices, function(device){               // Get the device matching that ID.
        return (device.id_accordion === accordion_id) && (device.is_wireless !== true);
      });
      hovered_device = hovered_device[0];
      // hovered_device.highlight(true);                                      // highlight the device.
      hovered_device.el.addClass("highlight_accordion");
    },
    function() {
      var accordion_id = $(this).attr("id").split("-");
      accordion_id = Number(accordion_id[accordion_id.length-1])
      var hovered_device = $.grep(devices, function(device){
        return (device.id_accordion === accordion_id) && (device.is_wireless !== true);
      });
      hovered_device = hovered_device[0];
      // hovered_device.highlight(false);                                    // remove the highlight on the device.
      hovered_device.el.removeClass("highlight_accordion");
    }
  );
  
  // Add functionality for option to change device icon in accordion panel.
  $(".accordion .change_type .icon").click(function() {
    var clickedIconType = $(this).attr('type');
    var associatedDeviceID = $(this).closest('li.change_type').attr("device_id");
    var associatedDevice = $.grep(devices, function(device){                // Get the device matching that ID.
      return (device.id === Number(associatedDeviceID));
    });
    associatedDevice = associatedDevice[0];
    // console.log(associatedDeviceID)
    // console.log(associatedDevice[0])
    associatedDevice.changeType(clickedIconType);
  });

  // In network box's accordion panel, add popup to Restart button.
  var modalPopup = "<div id='dialog' title='Restarting Network'><p>Restarting the network may temporarily interrupt TV and internet service.</p></div>";
  $(modalPopup).appendTo("#container_final");
  $( "#dialog" ).dialog({
      autoOpen: false,
      resizable: false,
      height: 170,
      width: 350,
      modal: false,
      dialogClass: 'restart',
      buttons: {
        OK: function() {
          $( this ).dialog( "close" );
        },
        Cancel: function() {
          $( this ).dialog( "close" );
        }
      }
    });
  $(".accordion .ui-accordion-content .restart").click(function() {
    $( "#dialog" ).dialog( "open" );
  });

  // Upon editing the device name in the accordion panel, reflect the new name in the device area and in the current panel's header.
  $(".accordion .ui-accordion-content").find($("input.content-name")).blur(function() { 
    return editNameAccordionDevice(this);
  });
  $(".accordion .ui-accordion-content").find($("input.content-name")).keydown(function(event) { 
    if (event.keyCode == 13) { return editNameAccordionDevice(this); }
  });
  function editNameAccordionDevice(_this) {

    console.log("CLICK CONTENT NAME")
    console.log(_this.value)

    //  Get the wireless or wired container
    var accordion_container = $(_this).closest(".accordion").parent();
    var accordion_container_id = accordion_container.attr("id");
    
    console.log(accordion_container_id)

    // Find the device corresponding to the current accoridon panel.
    var cur_content_panel_id = $(_this).closest(".ui-accordion-content").attr("id").split("-");
    cur_content_panel_id = Number(cur_content_panel_id[cur_content_panel_id.length-1]);
    var cur_device = $.grep(devices, function(device){               // Get the device matching that ID.
      if (accordion_container_id.indexOf("wireless") !== -1) {
        return (device.id_accordion === cur_content_panel_id) && (device.is_wireless === true);  
      } else if (accordion_container_id.indexOf("wired") !== -1) {
        return (device.id_accordion === cur_content_panel_id) && (device.is_wireless !== true);  
      }
    });
    cur_device = cur_device[0];

    // Store the new device name.
    cur_device.name = _this.value;
    // Update device name in the device area.
    cur_device.el.find(".name").text(cur_device.name);
    // Update name in this device's accordion header.
    $("#"+accordion_container_id+" .accordion").find($("#"+accordion_container_id+" .accordion").accordion( "option", "header" ))
      .eq(cur_device.id_accordion)
      .find($("a.header-name")).text(cur_device.name);
  }

  // Upon editing the Wifi password in the accordion panel, reflect the change in the device area under the Wifi device.
  $(".accordion .ui-accordion-content").find($("input.content-password")).blur(function() { 
    return editPasswordAccordionDevice(this);
  });
  $(".accordion .ui-accordion-content").find($("input.content-password")).keydown(function(event) { 
    if (event.keyCode == 13) { return editPasswordAccordionDevice(this); }
  });
  function editPasswordAccordionDevice(_this) {
    // Get the Wireless network device.
    var cur_device = $.grep(devices, function(device){
      return (device.type === "wireless_network");  
    });
    cur_device = cur_device[0];
    cur_device.password = _this.value;    
    cur_device.el.find(".password").text(cur_device.password);
  }
  
}

// TODO: decide if we keep this or not. It is technicaly correct, but is highly undesirable. Thus, proves necessity of a collapsible network.
function populateDevicesDefault() {
  resetLayouts();

  // Create 1 Network Box
  devices.push(new Device("Network Box", "networkbox"));  // devices[0] is always the network box
  routing_devices.push(devices[0]);
  devices[0].mass = 100;
  
  // var n_tv_devices = Math.round(Math.random() * max_tv_devices);
  var n_tv_devices = n_tv_boxes;
  var a_random_names_grid = a_random_names;
  var a_random_rooms_grid = a_random_rooms;
  var personal_device_types = ["phone", "laptop", "storage"];
  
  // Create TV Boxes with their TVs for Network Box.
  for ( var i = 0; i < n_tv_devices; i++ ) {
    var room = a_random_rooms_grid[ random(0, a_random_rooms_grid.length) ];
    var box_device = new Device(room + " TV Box", "tvbox");
    var tv_device = new Device(room + " TV", "tv");
    devices.push(box_device);
    routing_devices.push(box_device);
    devices.push(tv_device);

    // Connect TVs to TV Box
    connections.push(new Connection(box_device, tv_device, "wired", 1));
    // // Choose a parent router that is not itself
    // var parent_router = routing_devices[random(0, routing_devices.length)];
    // while ( parent_router === box_device ) {
    //   // console.log("-populateDevicesDefault() ---- parent_router === box_device ");
    //   parent_router = routing_devices[random(0, routing_devices.length)];
    // }
    // connections.push(new Connection(parent_router, box_device, "wired", 1));
    connections.push(new Connection(devices[0], box_device, "wired", 1));
  }
  
  // Create wireless devices
  for ( var i = 0; i < n_wireless_devices; i++ ) {
    var type = personal_device_types[ random(0, personal_device_types.length) ];
    if (type === "laptop" || type === "phone") var name = a_random_names_grid.splice( random(0, a_random_names_grid.length), 1 ) + "'s " + type.charAt(0).toUpperCase() + type.slice(1);
    if (type === "storage") var name = a_random_rooms_grid[ random(0, a_random_rooms_grid.length) ] + " " + type.charAt(0).toUpperCase() + type.slice(1);
    // create the device
    var personal_device = new Device(name, type);
    devices.push(personal_device);
    personal_devices.push(personal_device);
    // choose which connection type to make this device
    var connection_type = "wireless";
    // Connect the device to a router:
    // If not high complexity, connect personal device to any random router.
    if ( network_complexity !== "high" ) { var parent_router = routing_devices[random(0, routing_devices.length)]; }
    // If high complexity network, connect only to TV boxes, and not to Network box, to limit amount of devices on the level1.
    else { 
      var tv_boxes = $.grep(routing_devices, function(router){ 
        return router.type === "tvbox"; 
      });
      var parent_router = tv_boxes[random(0, tv_boxes.length)];
    }
    connections.push(new Connection(parent_router, personal_device, connection_type, 1));
  }

  // Create wired devices
  for ( var i = 0; i < n_wired_devices; i++ ) {
    var type = personal_device_types[ random(0, personal_device_types.length) ];
    if (type === "laptop" || type === "phone") var name = a_random_names_grid.splice( random(0, a_random_names_grid.length), 1 ) + "'s " + type.charAt(0).toUpperCase() + type.slice(1);
    if (type === "storage") var name = a_random_rooms_grid[ random(0, a_random_rooms_grid.length) ] + " " + type.charAt(0).toUpperCase() + type.slice(1);
    // create the device
    var personal_device = new Device(name, type);
    devices.push(personal_device);
    personal_devices.push(personal_device);
    // choose which connection type to make this device
    var connection_type = "wired";
   // Connect the device to a router:
    // If not high complexity, connect personal device to any random router.
    if ( network_complexity !== "high" ) { var parent_router = routing_devices[random(0, routing_devices.length)]; }
    // If high complexity network, connect only to TV boxes, and not to Network box, to limit amount of devices on the level1.
    else { 
      var tv_boxes = $.grep(routing_devices, function(router){ 
        return router.type === "tvbox"; 
      });
      var parent_router = tv_boxes[random(0, tv_boxes.length)];
    }
    connections.push(new Connection(parent_router, personal_device, connection_type, 1));
  }
  
}

// For 2 Zone layout for Wireless and Wired devices, featuring a 4-column grid.
function populateDevicesGrid() {
  // console.log('- - - - - - - - - - -');
  // console.log('populateDevicesGrid() ENTER');
  // console.log('- - - - - - - - - - -');

  // - - - - - - - - - - - - - - - SETUP - - - - - - - - - - - - - - - - - 

  resetLayouts();
  $('#container_background').show();
  var n_columns = 4;
  var a_random_names_grid = a_random_names;
  var a_random_rooms_grid = a_random_rooms;
  $('#menu li ul li a').filter(function(){ return $(this).text() === 'Toggle Connector Style';}).css("color", "#D2D2D2");       // Grey-out the Toggle Connectors menu item, it doesn't apply to this layout. This is reset in the common reset function.

  // - - - - - - - - - - - - - - - NETWORK BOX - - - - - - - - - - - - - - - - - 

  // Create the main Network Box
  $("#container").append("<div id='wired_container'></div>");
  var network_box = new Device("Network Box", "networkbox");
  devices.push(network_box);  // devices[0] is always the network box
  network_box.el.appendTo( $("#wired_container") );
  // TODO: make Net Box icon bigger.

  // - - - - - - - - - - - - - - - WIRELESS DEVICES - - - - - - - - - - - - - - - - - 

  // Wireless devices
  $("#container").append("<div id='wireless_container'></div>");
  for ( var i = 0; i < n_wireless_devices; i++ ) {
    // place items in rows, each row of the grid contains up to the number of columns. Useful for positioning the last row horizontally in the center.
    if ( i % n_columns === 0 ) {
      var cur_row = $("<div class='wireless_grid_row'></div>");
      cur_row.appendTo( $('#wireless_container') );
    }

    // create a wireless device
    var type = Math.random() < 0.5 ? "phone" : "laptop";
    var name = a_random_names_grid.splice( random(0, a_random_names_grid.length), 1 ) + "'s " + type.charAt(0).toUpperCase() + type.slice(1);
    var wireless_device = new Device(name, type );
    wireless_device.is_wireless = true;   // add custom attribute for layout positioning
    devices.push(wireless_device);
    array_wireless_devices.push(wireless_device);
    
    wireless_device.el.appendTo( cur_row );
    // wireless_device.el.appendTo( $('#wireless_container') );
    
    // connections
    var connection = new Connection(devices[0], wireless_device, "wireless", 1 );
    connection.changeShape("invisible");
    connections.push( connection );
    // dev
    // console.log(' WIRELESS --------');
    // console.log(wireless_device);
  }

  // Create the Wireless Network device/icon.
  var wireless_network = new Device("Wi-Fi Network", "wireless_network" );
  devices.push(wireless_network);
  
  // - - - - - - - - - - - - - - - WIRED DEVICES - - - - - - - - - - - - - - - - - 

  // Set height of container_background, grey background to wired devices. Harcoded for now.
  if ( network_complexity === "low" ) $("#container_background").css("height", 3 * devices[0].size.height);
  else if ( network_complexity === "average" ) $("#container_background").css("height", 3 * devices[0].size.height);
  else if ( network_complexity === "high" ) $("#container_background").css("height", 4 * devices[0].size.height);

  // WIRED - TV Boxes and TVs
  if (n_tv_boxes > 3) {
    // we need to place surplus TV Boxes in level 2
    var n_tv_boxes_level1 = 3;
    var n_tv_boxes_level2 = n_tv_boxes - 3;
  } else {
    var n_tv_boxes_level1 = n_tv_boxes;
    var n_tv_boxes_level2 = 0;
  }
  var n_remaining_slots_level1 = 4 - n_tv_boxes_level1;
  // Create Level1 TV Boxes
  for ( var i = 0; i < n_tv_boxes_level1; i++ ) {
    var name = a_random_rooms_grid.splice( random(0, a_random_rooms_grid.length), 1 ) + " TV Box";
    var box_device = new Device(name, "tvbox");
    var tv_device = new Device("TV", "tv");
    devices.push(box_device);
    routing_devices.push(box_device);
    array_level1_wired_devices.push(box_device);
    devices.push(tv_device);
    box_device.el.appendTo( $('#wired_container') );
    tv_device.el.appendTo( $('#wired_container') );
    // In advance, connect TV to TV Box (but it wont display until TV Box is connected to Network Box).
    var connection = new Connection(box_device, tv_device, "wired", 1);
    connection.changeShape("90s");
    connections.push(connection);
    // click function to collapse/uncollapse TV Box : it always starts uncollapsed, showing its TV
    box_device.el.click((function(dev) { return function() { 
      // open this clicked node
      dev.expandSubnodes(); 
      layoutDevices('grid');
    } })(box_device));
  } 
  
  // WIRED - Personal Devices and Routers
  // Create remaining Level 1 devices and their Level2 children, if any.
  var array_level2_wired_devices = [];
  $("#wired_container").append("<div id='level2'></div>");
  var n_personal_devices = 0;

  //  if there are more devices than empty slots on Level1...
  if ( n_wired_devices > n_remaining_slots_level1 ) {
    console.log("t- WIRED - Personal devices --------------- MORE THAN slots : "+ n_wired_devices);

    // need routers
    var n_cur_wired = 0;
    var n_so_far = 0;

    for (var i = 0; i < n_remaining_slots_level1; i++) {

      // Determine how many devices go in each slot.
      if (i != n_remaining_slots_level1-1) {
        n_cur_wired = Math.floor( n_wired_devices / n_remaining_slots_level1 );
      } else {
        n_cur_wired = n_wired_devices - n_so_far;
      }
      n_so_far += n_cur_wired;

      console.log("----- i = "+ i);
      console.log("n_cur_wired = "+ n_cur_wired);
      console.log("n_so_far = "+ n_so_far);

      // If this slot has more than 1 device, create a router then connect those devices to it.
      if ( n_cur_wired > 1 ) {
        var is_last_row = false;
        var routing_device = new Device("Router", "router");
        devices.push(routing_device);
        routing_devices.push(routing_device);
        array_level1_wired_devices.push(routing_device);
        routing_device.el.appendTo( $('#wired_container') );
        routing_device.expanded = false;  // Start off closed
        routing_device.el.click((function(dev) { return function() {
          // open this clicked node
          dev.expandSubnodes(); 
          layoutDevices('grid');
        } })(routing_device));
        
        // LEVEL 2 personal devices
        for ( var j = 0; j < n_cur_wired; j++ ) {
          // place items in rows, each row of the grid contains up to the number of columns. Useful for positioning the last row horizontally in the center.
          if ( j % n_columns === 0 ) {
            var cur_row = $("<div class='wired_grid_row'></div>");
            cur_row.appendTo( $('#level2') );                             // move device to level2 div container, to position them centrally in #container
            // if this is the last row, set bool to true
            if ( j + n_columns >= n_cur_wired ) is_last_row = true;
          }
          // create a personal device
          n_personal_devices++;   //unused : for sequentially numbering devices correctly below...
          var type = Math.random() < 0.5 ? "storage" : "laptop";
          if (type === "laptop") var name = a_random_names_grid.splice( random(0, a_random_names_grid.length), 1 ) + "'s " + type.charAt(0).toUpperCase() + type.slice(1);
          if (type === "storage") var name = a_random_rooms_grid.splice( random(0, a_random_rooms_grid.length), 1 ) + " " + type.charAt(0).toUpperCase() + type.slice(1);
          var personal_device_level2 = new Device(name, type );
          devices.push(personal_device_level2);
          array_level2_wired_devices.push(personal_device_level2);
          personal_device_level2.el.appendTo( cur_row );
          // create a connection to its routing device
          var connection = new Connection(routing_device, personal_device_level2, "wired", 1 );
          // if this is the last row, use a special type of connector: 90s_level2
          if (is_last_row) { 
            connection.changeShape("90s_level2");
          } else {
            connection.changeShape("90s");
          }
          connections.push( connection );
          // 
          console.log("************** j = "+ j);
          console.log(personal_device_level2);
          console.log(array_level2_wired_devices);
          console.log('New Level2 device '+ j + ': ' + type + ', on Router ' + i );
        }
        // LEVEL 2 extra tv boxes : if we have more than 3 tv boxes, place remanining ones under the last router.
        if ( n_tv_boxes_level2 > 0 ) {
          for ( var w = 0; w < n_tv_boxes_level2; w++ ) {
            var name = a_random_rooms_grid.splice( random(0, a_random_rooms_grid.length), 1 ) + " TV Box";
            var box_device = new Device(name, "tvbox");
            devices.push(box_device);
            routing_devices.push(box_device);
            array_level2_wired_devices.push(box_device);
            box_device.el.appendTo( cur_row );
            // In advance, connect TV to TV Box (but it wont display until TV Box is connected to Network Box).
            var connectionTVBox = new Connection(routing_device, box_device, "wired", 1 );
            // if this is the last row, use a special type of connector: 90s_level2
            if (is_last_row) { 
              connectionTVBox.changeShape("90s_level2");
            } else {
              connectionTVBox.changeShape("90s");
            }
            connections.push( connectionTVBox );
          }
        }
      } 
      // If only 1 device for this Level1 slot, make it a personal device, not a router.
      else {
        var type = Math.random() < 0.5 ? "storage" : "laptop";
        if (type === "laptop") var name = a_random_names_grid.splice( random(0, a_random_names_grid.length), 1 ) + "'s " + type.charAt(0).toUpperCase() + type.slice(1);
        if (type === "storage") var name = a_random_rooms_grid.splice( random(0, a_random_rooms_grid.length), 1 ) + " " + type.charAt(0).toUpperCase() + type.slice(1); 
        var wired_device_level1 = new Device(name, type);
        devices.push(wired_device_level1);
        array_level1_wired_devices.push(wired_device_level1);
        wired_device_level1.el.appendTo( $('#wired_container') );
      }
    }
  //  else, there are enough open slots for our devices in Level1...
  } else {
    // add wired devices to Level1 directly...
    // console.log("t- WIRED - Personal devices ----- LESS THAN or EQUAL to slots.");

    for ( var i = 0; i < n_wired_devices; i++ ) {
      var type = Math.random() < 0.5 ? "storage" : "laptop";
      if (type === "laptop") var name = a_random_names_grid.splice( random(0, a_random_names_grid.length), 1 ) + "'s " + type.charAt(0).toUpperCase() + type.slice(1);
      if (type === "storage") var name = a_random_rooms_grid.splice( random(0, a_random_rooms_grid.length), 1 ) + " " + type.charAt(0).toUpperCase() + type.slice(1);
      var wired_device_level1 = new Device(name, type);
      devices.push(wired_device_level1);
      array_level1_wired_devices.push(wired_device_level1);
      wired_device_level1.el.appendTo( $('#wired_container') );

    }
  }

  // Create connections for each Level1 device to Network Box.
  for ( var i = 0; i < array_level1_wired_devices.length; i++ ) {
    var connection = new Connection(devices[0], array_level1_wired_devices[i], "wired", 1);
    connection.changeShape("90s");
    connections.push(connection);
  }

  // - - - - - - - - - - - - - - - LAST - - - - - - - - - - - - - - - - - 

  // Do stuff to all devices...
  for ( var i = 0; i < devices.length; i++ ) {
    // Clicking on a device's icon display its settings panel. Stop propagation so the event doesn't go to the document.click fct in common.js which would immediately close the panel.
    if ( devices[i].type !== "router"  &&  devices[i].type !== "tv" ) {
      
        devices[i].el.find(".icon").click((function(clickedDevice) { return function(e) { 
          e.stopPropagation(); 
          
          // Doing this checking because of TV boxes. We want to show details if node is open, but expand it if node is closed.
          if (clickedDevice.expanded === true) {
            clickedDevice.showDetails(true);
          } else {
            clickedDevice.expandSubnodes(); 
            layoutDevices('grid');
          }

        } })(devices[i]));
      
    }
  }

}

// at elast 2 collapsable nodes, after that i can have single items, dont care

// Unaffected by network complexities.
function populateDevicesCollapsedNodes() {
  resetLayouts();

  // Grey-out the network Complexity menu items, they doesn't apply to this layout. This is reset in the common reset function.
  $('#menu li a').filter(function(){ return $(this).text() === 'Complexity';}).parent("li").contents().find("a").css("color", "#D2D2D2");

  devices.push(new Device("Network Box", "networkbox"));  // devices[0] is always the network box
  routing_devices.push(devices[0]);
  devices[0].mass = 100;

  var random_names = ["Ralph", "Elena", "Rex", "Mordecai", "Betty White", "Nancy", "Jamilah", "Jim", "Judy", "Francine"];
  var random_rooms = ["Office", "Poolside", "Living Room", "Bedroom", "Upstairs", "Downstairs", "Basement", "War Room"]
  var personal_device_types = ["phone", "laptop", "storage"];
  
  // var n_personal_devices = Math.round(Math.random() * 8 + 2);
  // var n_tv_devices = Math.round(Math.random() * 3);
  // var n_routers = random(1,4);
  
  // We wish to limit the number of personal devices to 4 per router (not including the Network box, although it will be getting some of these devices).
  var n_routers = random(2,4);                            // routers here means either normal routers or TV boxes.
  var n_max_devices = 4;
  var n_personal_devices = Math.round(Math.random() * (( n_routers * n_max_devices ) - 4) + 4);         // guaranteed at least 4 devices.
  // console.log(" - n_routers : "+ n_routers);
  // console.log(" - n_personal_devices : "+ n_personal_devices);


  // Create a few routers
  for(var i=0; i<n_routers; i++) {
    var is_TV = Math.random() < 0.5;
    var room = random_rooms[random(0,random_rooms.length)];
    if(!is_TV) {
      var router = new Device(room + " Router", "router");
      router.expanded = false;  // Start off closed
      router.el.parent = router;
      console.log(router.el);
      // Closures are weird. A function that returns a function is needed to make sure the context of router is correct
      router.el.click((function(dev) { return function() { dev.expandSubnodes(); layoutDevices('tree'); } })(router));
      //router.el.click(function() { router.expandSubnodes() });

      // Connect to an existing router or the Network box
      // var parent = Math.random() < 0.5 ? devices[0] : routing_devices[random(0,routing_devices.length)];
      var parent = devices[0];
      connections.push(new Connection(parent, router, "wired", 1));

      // 
      devices.push(router);
      routing_devices.push(router);
    }
    else {
      var box_device = new Device(room + " TV Box", "tvbox");
      var tv_device = new Device(room + " TV", "tv");

      box_device.expanded = false;  // Start off closed

      // Same as above. Closures are weird. Open/closede node if clicked on.
      box_device.el.click((function(dev) { return function() { dev.expandSubnodes(); layoutDevices('tree'); } })(box_device));

      devices.push(box_device);
      routing_devices.push(box_device);
      devices.push(tv_device);

      // Connect TVs to TV Box
      connections.push(new Connection(box_device, tv_device, "wired", 1));

      // Connect TV Box to Network Box
      connections.push(new Connection(devices[0], box_device, "wired", 1));
    }
  }

  // Create personal devices (phones, laptops, etc)
  for(var i=0; i<n_personal_devices; i++) {
    var type = personal_device_types[ random(0, personal_device_types.length) ];
    var propertype = type.charAt(0).toUpperCase() + type.slice(1);
    var unique_name = false;
    var name = ""; 
    while(!unique_name) {
      if (type === "laptop" || type === "phone") name = random_names[Math.round(Math.random() * (random_names.length-1))] + "'s " + propertype;
      if (type === "storage") name = random_rooms[Math.round(Math.random() * (random_rooms.length-1))] + "'s " + propertype;

      // Check all devices to see if this name is taken
      var taken = false;
      for(var j=0; j<devices.length; j++) {
        if(devices[j].name == name) taken = true;
      }
      if(!taken) unique_name = true;
    }
    
    var dev = new Device(name, type);
    devices.push(dev);
    personal_devices.push(dev);
  }

  // Connect each device to a router
  $.each(personal_devices, function(index, device) {
    
    var empty_routers = [];
    var one_child_routers = [];
    var other_routers = [];

    $.each(routing_devices, function(i, routing_device) {
      var router_children = 0;
      for(var y=0; y<routing_device.connections.length; y++) {
        if(routing_device.connections[y].a == routing_device) router_children++;
      }
      if (router_children === 0) empty_routers.push(routing_device);
      else if (router_children === 1) one_child_routers.push(routing_device);
      else other_routers.push(routing_device);
    });

    if (empty_routers.length > 0) var cur_router = empty_routers[random(0, empty_routers.length)];
    else if (one_child_routers.length > 0) var cur_router = one_child_routers[random(0, one_child_routers.length)];
    else {
      // console.log(" - - - - - - - - - * other_routers: "+ other_routers);
      var cur_router = other_routers[random(0, other_routers.length)];
    } 

    console.log("Selected router: "+ cur_router.name);

    var type = Math.random() < 0.5 ? "wired" : "wireless";
    connections.push(new Connection(cur_router, device, type, 1));  
  });

  // OLD
  // // Connect each device to a router
  // $.each(personal_devices, function(index, device) {
  //   // Start by populating empty routers, if any.
  //   var empty_routers = $.grep(routing_devices, function(router){ 
  //     var router_children = 0;
  //     for(var i=0; i<router.connections.length; i++) {
  //       if(router.connections[i].a == router) router_children++;
  //     }
  //     return router_children === 0; 
  //   });
  //   // console.log("- - - - - empty_routers: "+ empty_routers.length);

  //   // Select an empty router.
  //   if ( empty_routers.length > 0 ) {
  //     var cur_router = empty_routers[random(0, empty_routers.length)];
  //   }
  //   // Select any router that has less than 4 children, to avoid clutter.
  //   else {
  //     var potential_routers = $.grep(routing_devices, function(router){ 
  //       var router_children = 0;
  //       for(var i=0; i<router.connections.length; i++) {
  //         if(router.connections[i].a == router) router_children++;
  //       }
  //       // console.log("*** name: "+ router.name + "router_children = "+ router_children);
  //       return router_children < 4; 
  //     });
  //     // console.log(" --- --- - - - - - - - - - - - potential_routers : ");
  //     var cur_router = potential_routers[random(0, potential_routers.length)];
  //   }

  //   // console.log("Selected router: "+ cur_router.name);

  //   var type = Math.random() < 0.5 ? "wired" : "wireless";
  //   connections.push(new Connection(cur_router, device, type, 1));  
  // });

  // Expand routers with only 1 device
  $.each(routing_devices, function(index, device) {
    device.update();
    if(device.n_children <= 1) device.expanded = true;
  });

  // Force connector style
  setConnectorStyle("rounded");

}

// Unaffected by network complexities.
function populateDevicesDragAndDrop() {
  
  resetLayouts();

  // Grey-out the network Complexity menu items, they doesn't apply to this layout. This is reset in the common reset function.
  $('#menu li a').filter(function(){ return $(this).text() === 'Complexity';}).parent("li").contents().find("a").css("color", "#D2D2D2");

  $("#controller").show();

  devices.push(new Device("Network Box", "networkbox"));  // devices[0] is always the network box
  routing_devices.push(devices[0]);
  devices[0].mass = 100;

  var random_names = ["Ralph", "Elena", "Rex", "Mordecai", "Betty White", "Nancy", "Jamilah"];
  var random_rooms = ["Office", "Poolside", "Living Room", "Bedroom", "Upstairs", "Downstairs"]
  var personal_device_types = ["phone", "laptop", "storage"];
  // We wish to limit the number of total Level1 devices (direct children of Network box) to 6.
  // Start by creating a few routers, then create personal devices with number of remaining slots.
  var n_max_devices = 6;
  var n_tv_devices = Math.round(Math.random() * 3);
  var n_personal_devices = Math.round(Math.random() * ( n_max_devices - n_tv_devices - 2 ) + 2 );       // guaranteed at least 2 devices.
  // var n_personal_devices = Math.round(Math.random() * 8 + 2);
  

  // Create personal devices (phones, laptops, etc)
  for(var i=0; i<n_personal_devices; i++) {
    var type = personal_device_types[ random(0, personal_device_types.length) ];
    var propertype = type.charAt(0).toUpperCase() + type.slice(1);
    var unique_name = false;
    var name = ""; 
    while(!unique_name) {
      if (type === "laptop" || type === "phone") name = random_names[Math.round(Math.random() * (random_names.length-1))] + "'s " + propertype;
      if (type === "storage") name = random_rooms[Math.round(Math.random() * (random_rooms.length-1))] + "'s " + propertype;
      // Check all devices to see if this name is taken
      var taken = false;
      for(var j=0; j<devices.length; j++) {
        if(devices[j].name == name) taken = true;
      }
      if(!taken) unique_name = true;
    }
    
    var dev = new Device(name, type);
    devices.push(dev);
    personal_devices.push(dev);
  }

  // Create TV devices which always come in a pairs with a TV box
  for(var i=0; i<n_tv_devices; i++) {
    var room = random_rooms[Math.round(Math.random() * (random_rooms.length-1))];
    var box_device = new Device(room + " TV Box", "tvbox");
    var tv_device = new Device(room + " TV", "tv");
    devices.push(box_device);
    routing_devices.push(box_device);
    devices.push(tv_device);

    // Connect TVs to TV Box
    connections.push(new Connection(box_device, tv_device, "wired", 1));

    // Connect TV Box to Network Box
    connections.push(new Connection(devices[0], box_device, "wired", 1));
  }


  // Connect each personal device to a router : only connect them to the Network box, not to the TV boxes. This is to make sure no children of TV boxes overlap with each other, and will keep things simple.
  $.each(personal_devices, function(index, device) {
    // var router = Math.random() < 0.8 ? devices[0] : routing_devices[random(0, routing_devices.length)]; // Favor network box
    var router = devices[0];
    var type = Math.random() < 0.5 ? "wired" : "wireless";
    connections.push(new Connection(router, device, type, 1));  
  });

  // Assign drop event handler for each device
  // dev_jc_19/09/2013_c : make only personal device icons customizable by drag-n-dropping new icons over them.
  // $.each(devices, function(index, device) {
  $.each(devices, function(index, device) {
    // For all devices except Network box, have drag-n-drop events.
    device.el.mouseup((function(dev) { return function() {
      // If device DROPPED.
      if(dragging != null) {
        // If not a Network box or TV box, then drop device and change it's target's attributes.
        if (device.type !== "networkbox" && device.type !== "tvbox") {
          if($(dragging).hasClass("device"))
            dev.changeType($(dragging).data("type")); 
          else if($(dragging).hasClass("ip")) {
            dev.ip = $(dragging).text();
            dev.static_ip = true;
            dev.toggleStatus();

            //$(dragging).appendTo(dev.el.find(".ip_slot"));
            $(dragging).remove();
          }
          dev.highlight(false);
        } 
        // Else, if it is dropped on a TV or TV box, ignore the drop and remove the highlight image.
        else {
          device.el.mouseleave();
        }
      }
    } })(device));
    
    // We dont want to to allow click on Network box or TV box.
    if (device.type !== "networkbox" && device.type !== "tvbox") {
      // Click on device icon.
      device.el.find(".icon").click((function(dev) { return function(ev) {
        dev.toggleStatus();
        return true;
      }})(device));
    }
    // Hover on.
    device.el.mouseenter((function(dev) { return function(ev) {
      if(dragging != null) {
        dev.highlight(true); 
        console.log("^ ^ ^ ^ ^ ^ HILITE 1");
      }
    } })(device));
    // Hover off.
    device.el.mouseleave((function(dev) { return function(ev) {
      if(dragging != null) {
        dev.highlight(false); 
      }
    } })(device));

  });
  // Clear dragging when mouseup anywhere else
  $(document).mouseup(function() {
    $(dragging).removeAttr("style");
    $(dragging).removeClass("dragging");

    dragging = null;
    //return false;
  });

  // Assign drag handlers for icon palette items
  $.each($("#icon_palette > .device"), function(item, el) {
    $(el).mousedown(function() {
      dragging = this;
      return false;
    });   

  });

  // Assign drag handlers for static IP address items
  $.each($("#ip_palette > .ip"), function(item, el) {
    $(el).mousedown(function() {
      dragging = this;
      return false;
    });   

  });

  $(document).mousemove(function(ev) {
    if(!dragging) return true;
    else {
      var w = $(dragging).width();
      var h = $(dragging).height();
      $(dragging).offset({left: ev.pageX-w/2, top: ev.pageY-h/2});
      $(dragging).addClass("dragging");
    }
    return true;
  });

  // Force connector style
  setConnectorStyle("90s");

}
// Sam's original function
function populateDevicesOriginal() {

  // Clear out old lists. TODO: Make sure circular references are broken, too
  $.each(devices, function(index, device) {
    device.die();
  });

  $.each(connections, function(index, connection) {
      connection.die();
  });

  devices.length = 0;
  personal_devices.length = 0;
  routing_devices.length = 0;
  connections.length = 0;

  devices.push(new Device("Network Box", "networkbox"));  // devices[0] is always the network box
  routing_devices.push(devices[0]);
  devices[0].mass = 100;

  var random_names = ["Ralph", "Elena", "Rex", "Mordecai", "Betty White", "Nancy", "Jamilah", "Jim", "Judy", "Francine"];
  var random_rooms = ["Office", "Poolside", "Living Room", "Bedroom", "Upstairs", "Downstairs", "Basement", "War Room"];
  var n_personal_devices = Math.round(Math.random() * 8 + 2);
  var n_tv_devices = Math.round(Math.random() * 3);

  // Create personal devices (phones, laptops, etc)
  for(var i=0; i<n_personal_devices; i++) {
    var type = Math.random() < 0.5 ? "phone" : "laptop";
    var propertype = type.charAt(0).toUpperCase() + type.slice(1);

    var unique_name = false;
    var name = ""; 
    while(!unique_name) {
      name = random_names[Math.round(Math.random() * (random_names.length-1))] + "'s " + propertype;
      // Check all devices to see if this name is taken
      var taken = false;
      for(var j=0; j<devices.length; j++) {
        if(devices[j].name == name) taken = true;
      }
      if(!taken) unique_name = true;
    }

    var dev = new Device(name, type);
    devices.push(dev);
    personal_devices.push(dev);
  }

  // Create TV devices which always come in a pairs with a TV box
  for(var i=0; i<n_tv_devices; i++) {
    var room = random_rooms[Math.round(Math.random() * (random_rooms.length-1))];
    var box_device = new Device(room + " TV Box", "tvbox");
    var tv_device = new Device(room + " TV", "tv");
    devices.push(box_device);
    routing_devices.push(box_device);
    devices.push(tv_device);

    // Connect TVs to TV Box
    connections.push(new Connection(box_device, tv_device, "wired", 1));

    // Connect TV Box to Network Box
    connections.push(new Connection(devices[0], box_device, "wired", 1));
  }


  // Connect each device to a router
  $.each(personal_devices, function(index, device) {
    var router = Math.random() < 0.8 ? devices[0] : routing_devices[random(0, routing_devices.length)]; // Favor network box

    var type = Math.random() < 0.5 ? "wired" : "wireless";
    connections.push(new Connection(router, device, type, 1));  
  });
}
// 
 // n_tv_boxes = 6;
 //      n_wireless_devices = 10;
 //      n_wired_devices = 5;
function populateDevicesPhysics() {
  resetLayouts();

  // Create 1 Network Box
  devices.push(new Device("Network Box", "networkbox"));  // devices[0] is always the network box
  routing_devices.push(devices[0]);
  devices[0].mass = 100;
  
  // 
  var random_names = ["Ralph", "Elena", "Rex", "Mordecai", "Betty White", "Nancy", "Jamilah", "Jim", "Judy", "Francine", "Jack", "Bob", "Linda", "Sadie", "Pauline", "Jose", "Elizabeth", "Mom", "Dad", "Steve", "Kengo", "Kumar", "Sebastien", "Arnaud", "Soyeon", "Mimi"];
  var random_rooms = ["Office", "Poolside", "Living Room", "Bedroom", "Upstairs", "Downstairs", "Basement", "War Room"];
  var random_nouns = ["mollusk", "tail", "front", "thneed", "house", "corner", "plant", "ether", "tortoise", "array", "node", "square", "zone", "block", "index", "network", "freedom", "party", "date"]
  var random_adjectives = ["frothy", "angular", "slow", "limber", "lethargic", "passable", "twisted", "plastic", "jinxed", "pliable", "rotated", "tall", "ansible", "large", "needy", "anxious"];
  var n_tv_devices = n_tv_boxes;
  var personal_device_types = ["phone", "laptop", "storage"];
  var n_wifi_devices = 1;
  
  // Create a Wifi network
  var ssid = random_item(random_adjectives) + "_" + random_item(random_nouns);
  console.log("Adding wireless network '" + ssid);
  var wifi_device = new Device(ssid, "wifi");
  devices.push(wifi_device);
  routing_devices.push(wifi_device);
  connections.push(new Connection(devices[0], wifi_device, "wireless", 1));
  
  // Create TV Boxes with their TVs for Network Box.
  for ( var i = 0; i < n_tv_devices; i++ ) {
    var room = random_rooms[Math.round(Math.random() * (random_rooms.length-1))];
    var box_device = new Device(room + " TV Box", "tvbox");
    // box_device.mass = 100;         // rmeove mass to spread-out TV boxes more.
    var tv_device = new Device(room + " TV", "tv");
    devices.push(box_device);
    routing_devices.push(box_device);
    devices.push(tv_device);

    // Connect TVs to TV Box
    connections.push(new Connection(box_device, tv_device, "wired", 1));

    // Connect TV Box to Network Box
    connections.push(new Connection(devices[0], box_device, "wired", 1));
  }
  
  // Add some personal devices to Wifi network
  for ( var i = 0; i < n_wireless_devices; i++ ) {
    var device_type = personal_device_types[ random(0, personal_device_types.length) ];
    var propertype = device_type.charAt(0).toUpperCase() + device_type.slice(1);
    //  give the device a unique name
    var unique_name = false;
    var name = ""; 
    while(!unique_name) {
      if (device_type === "laptop" || device_type === "phone") name = random_names[Math.round(Math.random() * (random_names.length-1))] + "'s " + propertype;
      if (device_type === "storage") name = random_rooms[Math.round(Math.random() * (random_rooms.length-1))] + "'s " + propertype;
      // Check all devices to see if this name is taken
      var taken = false;
      for(var j=0; j<devices.length; j++) {
        if(devices[j].name == name) taken = true;
      }
      if(!taken) unique_name = true;
    }
    // create the device
    var personal_device = new Device(name, device_type);
    devices.push(personal_device);
    personal_devices.push(personal_device);
    
    // Connect Personal Device to Network Box.
    connections.push(new Connection(wifi_device, personal_device, "wireless", 1));
  }
  // console.log('A------ ' + n_tv_devices);
  // console.log('B------ ' + n_personal_devices_network_box);
  // console.log('C------ ' + (n_tv_devices + n_personal_devices_network_box));     // total should never be more than 4
  
  // Create Personal Devices for Network Box.
  for ( var i = 0; i < n_wired_devices; i++ ) {
    var device_type = personal_device_types[ random(0, personal_device_types.length) ];
    var propertype = device_type.charAt(0).toUpperCase() + device_type.slice(1);
    //  give the device a unique name
    var unique_name = false;
    var name = ""; 
    while(!unique_name) {
      if (device_type === "laptop" || device_type === "phone") name = random_names[Math.round(Math.random() * (random_names.length-1))] + "'s " + propertype;
      if (device_type === "storage") name = random_rooms[Math.round(Math.random() * (random_rooms.length-1))] + "'s " + propertype;
      // Check all devices to see if this name is taken
      var taken = false;
      for(var j=0; j<devices.length; j++) {
        if(devices[j].name == name) taken = true;
      }
      if(!taken) unique_name = true;
    }
    // create the device
    var personal_device = new Device(name, device_type);
    devices.push(personal_device);
    personal_devices.push(personal_device);
    
    // Connect Personal Device to Network Box.
    var potential_routers = $.grep(routing_devices, function(router){ 
      return ( router.type  !== "wifi" ); 
    });
    console.log(" ------- POTENTIAL ROUTERS :");
    console.log(potential_routers);
    var selected_router = potential_routers[random(0, potential_routers.length)];
    console.log(" ------- SELECTED ROUTERS : ");
    console.log(selected_router);
    connections.push(new Connection(selected_router, personal_device, "wired", 1));
  }
  
}

// function populateDevicesPhysics() {
//   resetLayouts();

//   // Create 1 Network Box
//   devices.push(new Device("Network Box", "networkbox"));  // devices[0] is always the network box
//   routing_devices.push(devices[0]);
//   devices[0].mass = 100;
  
//   // Setup children devices of the Network Box. Total maximum of Network Box devices is 4, minimum is 2.
//   var random_names = ["Ralph", "Elena", "Rex", "Mordecai", "Betty White", "Nancy", "Jamilah", "Jim", "Judy", "Francine", "Jack", "Bob", "Linda", "Sadie", "Pauline", "Jose", "Elizabeth"];
//   var random_rooms = ["Office", "Poolside", "Living Room", "Bedroom", "Upstairs", "Downstairs", "Basement", "War Room"];
//   // maximum 2 TV boxes (each with a TV)
//   var n_tv_devices = Math.round(Math.random() * max_tv_devices);
//   // number of minimum & maximum personal devices depends on amount of TV Boxes
//   if ( n_tv_devices === 0 ) var n_personal_devices_network_box = Math.round(random(2, 5));
//   if ( n_tv_devices === 1 ) var n_personal_devices_network_box = Math.round(random(1, 4));
//   if ( n_tv_devices === 2 ) var n_personal_devices_network_box = Math.round(random(1, 3));
//   // var n_personal_devices_network_box = Math.round(random( (2 - n_tv_devices) , (5 - n_tv_devices) ));      //OLD

//   // Create 0, 1, or 2 wireless networks
//   var n_wireless_networks = random(0,100) < 20 ? 2 : 1;
//   for(var k=0; k<n_wireless_networks; k++) {

//     var random_nouns = ["mollusk", "tail", "front", "thneed", "house", "corner", "plant", "ether", "tortoise", "array", "node", "square", "zone", "block", "index", "network", "freedom", "party", "date"]
//     var random_adjectives = ["frothy", "angular", "slow", "limber", "lethargic", "passable", "twisted", "plastic", "jinxed", "pliable", "rotated", "tall", "ansible", "large", "needy", "anxious"];
//     var ssid = random_item(random_adjectives) + "_" + random_item(random_nouns);
//     console.log("Adding wireless network '" + ssid + "' (" + k + "/" + n_wireless_networks + ")");
//     var wifi_device = new Device(ssid, "wifi");
//     devices.push(wifi_device);
//     routing_devices.push(wifi_device);
//     connections.push(new Connection(devices[0], wifi_device, "wireless", 1));

//     // Add some personal devices to wifi network
//     var n_wifi_connections = random(1,8);
//     for ( var i = 0; i < n_wifi_connections; i++ ) {
//       var device_type = Math.random() < 0.5 ? "phone" : "laptop";
//       var propertype = device_type.charAt(0).toUpperCase() + device_type.slice(1);
//       //  give the device a unique name
//       var unique_name = false;
//       var name = ""; 
//       while(!unique_name) {
//         name = random_names[Math.round(Math.random() * (random_names.length-1))] + "'s " + propertype;
//         // Check all devices to see if this name is taken
//         var taken = false;
//         for(var j=0; j<devices.length; j++) {
//           if(devices[j].name == name) taken = true;
//         }
//         if(!taken) unique_name = true;
//       }
//       // create the device
//       var personal_device = new Device(name, device_type);
//       devices.push(personal_device);
//       personal_devices.push(personal_device);
      
//       // Connect Personal Device to Network Box.
//       connections.push(new Connection(wifi_device, personal_device, "wireless", 1));
//     }    
//   }

//   console.log('A------ ' + n_tv_devices);
//   console.log('B------ ' + n_personal_devices_network_box);
//   console.log('C------ ' + (n_tv_devices + n_personal_devices_network_box));     // total should never be more than 4
  
//   // Create TV Boxes with their TVs for Network Box.
//   for ( var i = 0; i < n_tv_devices; i++ ) {
//     var room = random_rooms[Math.round(Math.random() * (random_rooms.length-1))];
//     var box_device = new Device(room + " TV Box", "tvbox");
//     var tv_device = new Device(room + " TV", "tv");
//     devices.push(box_device);
//     routing_devices.push(box_device);
//     devices.push(tv_device);

//     // Connect TVs to TV Box
//     connections.push(new Connection(box_device, tv_device, "wired", 1));

//     // Connect TV Box to Network Box
//     // if we have 2 TV Boxes, add the second one after all personal devices, to the right completely.
//     if ( i === 1 ) {
//       console.log('--------HELLO 1')
//       bool_add_last = true;
//     } else {
//       bool_add_last = false;
//       console.log('--------HELLO 0')
//       connections.push(new Connection(devices[0], box_device, "wired", 1));
//     }

//     // For each TV Box, create Personal Devices
//     var n_personal_devices_tv_box = Math.round(random(0, 3));      // range is 0 to 2
//     console.log('D------ ' + n_personal_devices_tv_box);
//     for ( var j = 0; j < n_personal_devices_tv_box; j++ ) {
//       var device_type = Math.random() < 0.5 ? "phone" : "laptop";
//       var propertype = device_type.charAt(0).toUpperCase() + device_type.slice(1);
//       //  give the device a unique name
//       var unique_name = false;
//       var name = ""; 
//       while(!unique_name) {
//         name = random_names[Math.round(Math.random() * (random_names.length-1))] + "'s " + propertype;
//         // Check all devices to see if this name is taken
//         var taken = false;
//         for(var w=0; w<devices.length; w++) {
//           if(devices[w].name == name) taken = true;
//         }
//         if(!taken) unique_name = true;
//       }
//       // create the device
//       var personal_device = new Device(name, device_type);
//       devices.push(personal_device);
//       personal_devices.push(personal_device);
    
//       // Connect Personal Device to TV Box.
//       connections.push(new Connection(box_device, personal_device, "wired", 1));
//     }
//   }
  
//   // Create Personal Devices for Network Box.
//   for ( var i = 0; i < n_personal_devices_network_box; i++ ) {
//     var device_type = Math.random() < 0.5 ? "phone" : "laptop";
//     var propertype = device_type.charAt(0).toUpperCase() + device_type.slice(1);
//     //  give the device a unique name
//     var unique_name = false;
//     var name = ""; 
//     while(!unique_name) {
//       name = random_names[Math.round(Math.random() * (random_names.length-1))] + "'s " + propertype;
//       // Check all devices to see if this name is taken
//       var taken = false;
//       for(var j=0; j<devices.length; j++) {
//         if(devices[j].name == name) taken = true;
//       }
//       if(!taken) unique_name = true;
//     }
//     // create the device
//     var personal_device = new Device(name, device_type);
//     devices.push(personal_device);
//     personal_devices.push(personal_device);
    
//     // Connect Personal Device to Network Box.
//     connections.push(new Connection(devices[0], personal_device, "wired", 1));
//   }
  

//   if (bool_add_last === true) {
//     console.log('--------HELLO 2')
//     connections.push(new Connection(devices[0], box_device, "wired", 1));
//   }
// }