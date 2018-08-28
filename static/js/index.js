let column = data_imported.columns; // Get the column names from the dataset except throughput
let margin = {top: 120, right: 20, bottom: 0, left: 70}; // Set the margins for the svg object
let margin_result = {top: 120, right: 20, bottom: 0, left: 20}; // Set the margins for the result svg object, which is the svg in "area2" of the index.html file
let result_svg_height = 730; // Height of the svg in Area2
let result_svg_width = 100; // Width of svg in Area2
let result_bar_width = 60; // Bar width of svg in Area2
let svgHeight = 730, barPadding = 10; // Svg height and bar padding for Area1
let max_cols = data_imported['Max Cols']; // Get the maximum number of bars that are to be drawn in Area1
let barWidth = (parseFloat(document.getElementById('area1').offsetWidth)/(max_cols+column.length+7)); // Calculate bar width by dividing the width of Area1 by (max cols + number of gaps i.e. number of variables in the dataset)
let data_received = data_imported; // Data received captures the new data when user clicks on some bar or a button. Initially it is equal to original dataset but later it changes.
let colorScale = d3.scaleOrdinal(d3.schemeCategory10) // To add different colors to bars representing each variable in the dataset
    .domain(column);
let selection = []; // This array helps keep track of which bar the user clicked
let linearScale = d3.scaleLinear() // Scale to scale throughput values to the height of svg
    .domain([data_imported['Min Thp'], data_imported['Max Thp']])
    .range([svgHeight-300,0])
let button_pressed = {}; // Variable to store whether or not the button is pressed
for(let i in column){
    button_pressed[column[i]] = false;
}

function tempAlert(msg,duration){ // Function to generate an alert box for configuration doesn't exist
     var el = document.createElement("div");
     el.setAttribute("style","position:absolute;top:5%;left:40%;background-color:orange;");
     el.innerHTML = msg;
     setTimeout(function(){
      el.parentNode.removeChild(el);
     },duration);
     document.body.appendChild(el);
}

function redraw(){ // Redraws every bar when the user makes a selection
    $('#area1').empty(); // Delete every object in Area 1 to redraw everything  
    $('#area2').empty(); // Delete every object in Area 2
    
    let global_bar_translate = 0; // To draw each bar next to each other
    let global_text_translate = 0; // To write the labels for each bar underneath
    let global_line_translate = 0; // To draw the lines with the bars
    let global_hzline_translate1 = 0; // To control upper horizontal whiskers left point
    let global_hzline_translate2 = 0; // To control upper horizontal whiskers right point
    let global_hzline2_translate1 = 0; // To control lower horizontal whiskers left point
    let global_hzline2_translate2 = 0; // To control lower horizontal whiskers right point
    let global_median1 = 0; // To control the median horizontal whisker left point
    let global_median2 = 0; // To control the median whisker right point

    // Declaring the svg element in area 1
    let svg_elem = d3.select('#area1').append('svg')
        .attr("width", '100%')
        .attr("height", svgHeight)
        .attr("border",1)
        .attr("class", "main-svg")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    column = data_received.columns  // Get the column names from the dataset
    for(let i in column){
        global_bar_translate++; // To create gaps between bars of different variables
        global_text_translate++;
        global_line_translate++;
        global_hzline_translate1++;
        global_hzline_translate2++;
        global_hzline2_translate1++;
        global_hzline2_translate2++;
        global_median1++;
        global_median2++;

        let dataset = JSON.parse(data_received[column[i]]); // Each element in data_received is the throughput details about a variable in the dataset. Extracting this information in a for loop
        
        let barChart = svg_elem.append('g').selectAll("rect") // Draw the bars to the current g element inside the svg in Area1
            .data(dataset)
            .enter()
            .append("rect")
            .attr("y", function(d) {
                return linearScale(d.Max); 
            })
            .attr("height", function(d) { 
                return linearScale(d.Min) - linearScale(d.Max); 
            })
            .attr("fill", colorScale(i))
            .attr("width", barWidth - barPadding)
            .attr("opacity", function(d, j){
                let is_present = false;
                for(let k in selection){  // Check if the element is present in selection array, is yes, then plot if with opacity 0.5, otherwise plot it with opacity 1
                    if(selection[k].id == column[i]+dataset[j][column[i]]) 
                    is_present = true;
                }
                if(!is_present){
                    return 1
                }
                else{
                    return 0.2
                }
            })
            .attr("transform", function (d, j) { // Increment globar_bar_translate with each new bar drawn
                let translate = [barWidth * global_bar_translate, 0];
                global_bar_translate++; 
                return "translate("+ translate +")";
            })
            .on("click", function(d,j){
                let data_toserver;
                let is_present = false;
                let k = selection.length
                while(k--){ // Check if the current selection by the user is present in selection array
                    if(selection[k].id == column[i]+dataset[j][column[i]]){
                        is_present = true;
                        selection.splice(k,1); // Remove the element from selection array and send information to the server
                    }
                }
                if(!is_present){ // Add the element to selection array if it is not present and send the information to the server
                    selection.push({'id': column[i]+dataset[j][column[i]]});
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'off'};
                }
                else{ 
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'on'};
                }
                $.post("", data_toserver, function(data_infunc){
                    data_received = data_infunc; // The server returns new throughput values based on current user selection, update data_received with received information
                    if (data_received['No Config Exist'] == 'True'){ // Check if the selected configuration exist, if no, tell the user about it
                        selection.push({'id': column[i]+dataset[j][column[i]]});
                        tempAlert("Configuration doesn't exist",700);
                    }
                    else{
                        redraw(); // Redraw the bars based on current received information
                    }
                });
            });

        // Draw Median horizontal whiskers
        let medianLine = svg_elem.append('g').selectAll('.medianLine')
            .data(dataset)
            .enter()
            .append('line')
            .attr('x1', function () { // Increment globar_bar_translate with each new bar drawn
                let translate = barWidth * global_median1;
                global_median1++;
                return translate;
            })
            .attr('x2', function () { // Increment globar_bar_translate with each new bar drawn
                let translate = barWidth * global_median2;
                global_median2++; 
                return translate+barWidth-barPadding;
            })
            .attr('y1', function(d){
                return linearScale(d.MED)})
            .attr('y2', function(d){
                return linearScale(d.MED)})
            .attr('stroke', '#000')
            .attr('stroke-width', 1)
            .attr('fill', 'none');

        // The following code is to draw the button. In this case, buttons are drawn as rect HTML elements
        svg_elem.append('g').append('rect')
            .attr("transform", function () {
                let translate = [barWidth * (global_text_translate+((global_bar_translate - global_text_translate)/2))-45, 550]
                return "translate("+ translate +")"
            })
            .attr('width', 9*column[i].length)
            .attr('height', 20)
            .attr('fill', 'lightslategray')
            .attr('opacity', 0.5) 
            .on("click", function(){ // Handling what happens when the button is clicked
                let data_button_tosend; // Dict to send to the server  
                if(!button_pressed[column[i]]){ // Variable is turned off by the user
                    for(let k in dataset){
                        selection.push({'id': column[i]+dataset[k][column[i]]}); // Add all the categories for that variable to the selection array
                    }
                    button_pressed[column[i]] = true; // Change the value of button_pressed
                    data_button_tosend = {'column': column[i], 'value': 'all', 'switch': 'off'}; // This is the information that is sent to the server when the button is pressed to turn the variable off
                }
                else{ // When the variable is turned on
                    // Remove all the categories for that variable from the selection array
                    let k = selection.length
                    while(k--){
                        if(selection[k].id.startsWith(column[i])){
                            selection.splice(k,1); // Remove the element from selection array and send information to the server
                        }
                    }
                    button_pressed[column[i]] = false;
                    data_button_tosend = {'column': column[i], 'value': 'all', 'switch': 'on'};
                }
                $.post("", data_button_tosend, function(data_infunc){
                    data_received = data_infunc; // The server returns new throughput values based on current user selection, update data_received with received information
                    redraw(); // Redraw the bars based on current received information
                })});
        
        // Add text to the buttons drawn using the above function
        svg_elem.append('g').append('text')
            .attr("transform", function () {
                let translate = [barWidth * (global_text_translate+((global_bar_translate - global_text_translate)/2))-40, 565]
                return "translate("+ translate +")"
            })
            .text(column[i])
            .on("click", function(){ // Handling what happens when the button is clicked
                let data_button_tosend; // Dict to send to the server  
                if(!button_pressed[column[i]]){ // Variable is turned off by the user
                    for(let k in dataset){
                        selection.push({'id': column[i]+dataset[k][column[i]]}); // Add all the categories for that variable to the selection array
                    }
                    button_pressed[column[i]] = true; // Change the value of button_pressed
                    data_button_tosend = {'column': column[i], 'value': 'all', 'switch': 'off'}; // This is the information that is sent to the server when the button is pressed to turn the variable off
                }
                else{ // When the variable is turned on
                    // Remove all the categories for that variable from the selection array
                    let k = selection.length
                    while(k--){
                        if(selection[k].id.startsWith(column[i])){
                            selection.splice(k,1); // Remove the element from selection array and send information to the server
                        }
                    }
                    button_pressed[column[i]] = false;
                    data_button_tosend = {'column': column[i], 'value': 'all', 'switch': 'on'};
                }
                $.post("", data_button_tosend, function(data_infunc){
                    data_received = data_infunc; // The server returns new throughput values based on current user selection, update data_received with received information
                    redraw(); // Redraw the bars based on current received information
                })});

        let text = svg_elem.append('g').selectAll("text") // Add the text below each bar
            .data(dataset)
            .enter()
            .append("text")
            .text(function(d,j) {
                return dataset[j][column[i]];
            })
            .attr("transform", function (d, j) {
                let translate = [barWidth * global_text_translate+10, 460]
                global_text_translate++
                return "translate("+ translate +")rotate(45)";
            })
            .attr("fill", function(d, j){
                let is_present = false;
                for(let k in selection){  // Check if the element is present in selection array, is yes, then the text should be black, otherwise red
                    if(selection[k].id == column[i]+dataset[j][column[i]]) 
                    is_present = true;
                }
                if(!is_present){
                    return 'black'
                }
                else{
                    return 'red'
                }
            })
            .on("click", function(d,j){
                let data_toserver;
                let is_present = false;
                let k = selection.length
                while(k--){ // Check if the current selection by the user is present in selection array
                    if(selection[k].id == column[i]+dataset[j][column[i]]){
                        is_present = true;
                        selection.splice(k,1); // Remove the element from selection array and send information to the server
                    }
                }
                if(!is_present){ // Add the element to selection array if it is not present and send the information to the server
                    selection.push({'id': column[i]+dataset[j][column[i]]});
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'off'};
                }
                else{ 
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'on'};
                }
                $.post("", data_toserver, function(data_infunc){
                    data_received = data_infunc; // The server returns new throughput values based on current user selection, update data_received with received information
                    if (data_received['No Config Exist'] == 'True'){ // Check if the selected configuration exist, if no, tell the user about it
                        selection.push({'id': column[i]+dataset[j][column[i]]});
                        tempAlert("Configuration doesn't exist",700);
                    }
                    else{
                        redraw(); // Redraw the bars based on current received information
                    }
                })});
            
    }
    svg_elem.append('g')
        .call(d3.axisLeft(linearScale))


    // ****************************** Below is 2nd column code ******************************
    
    // Initialize the svg element in Area2
    let svg_result = d3.select('#area2').append('div').append('svg') 
        .attr("width", result_svg_width)
        .attr("height", result_svg_height)
        .attr("class", "result-svg")
        .append("g")
            .attr("transform", "translate(" + margin_result.left + "," + margin_result.top + ")");
    
    svg_result.append('g').append("rect") // Add the result bar
        .attr("y", linearScale(data_received['Max Thp']))
        .attr("height", linearScale(data_received['Min Thp']) - linearScale(data_received['Max Thp']))
        .attr("width", result_bar_width - barPadding)
        .attr("transform", function () {
            let translate = [margin_result, 0]; 
            return "translate("+ translate +")";
        })
        .attr('fill', 'palevioletred');

    // Add the median horizontal whisker
    svg_result.append('g').append('line')
        .attr('x1', margin_result)
        .attr('x2', result_bar_width-barPadding)
        .attr('y1', linearScale(data_received['MED Thp']))
        .attr('y2', linearScale(data_received['MED Thp']))
        .attr('stroke', '#000')
        .attr('stroke-width', 1)
        .attr('fill', 'none');

}

redraw(); // Call the redraw function everytime this script runs
window.addEventListener('resize',redraw); // Bootstrap will run everytime the user tries to resize the window
