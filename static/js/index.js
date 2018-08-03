let column = data_imported.columns;
let result_svg_height = 500;
let result_svg_width = 130;
let result_bar_width = 120;
let svgHeight = 300, barPadding = 25;


function readBody(xhr) {
    let text;
    if (!xhr.responseType || xhr.responseType === "text") {
        text = xhr.responseText;
    } else if (xhr.responseType === "document") {
        text = xhr.responseXML;
    } else {
        text = xhr.response;
    }
    return text;
}

let xhr = new XMLHttpRequest();
xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
        console.log(readBody(xhr));
        $("html").html(readBody(xhr));
    }
}


function redraw(){

    $('#area1').empty();   
    $('#area2').empty();

    for(let i in column){
        // Finding the max throughput for the given variable
        let dataset = JSON.parse(data_imported[column[i]]);
        let max_thp = dataset.map(function(o){return o.Max});
        
        // Main code to create plots using the data
        let selection = [];
        
        let linearScale = d3.scaleLinear()
            .domain([0, d3.max(max_thp)])
            .range([0,svgHeight-25]);

        let svg_elem = d3.select('#area1').append('div').append('svg')
            .attr("width", '80%')
            .attr("height", svgHeight);
        
        let max_cols = data_imported['Max Cols'];
        let barWidth = (parseFloat(svg_elem.style('width'))/max_cols);    

        let barChart = svg_elem.selectAll("rect")
            .data(dataset)
            .enter()
            .append("rect")
            .attr("y", function(d) {
                return svgHeight - linearScale(d.Max - d.Min) 
            })
            .attr("height", function(d) { 
                return linearScale(d.Max - d.Min); 
            })
            .attr("width", barWidth - barPadding)
            .attr("transform", function (d, i) {
                let translate = [barWidth * i, 0]; 
                return "translate("+ translate +")";
            })
            .on("click", function(d,j){
                let data_toserver;
                if(selection.indexOf(d) == -1){
                    selection.push(d);
                    d3.select(this).style("opacity", 0.5);
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'off'};
                }
                else{
                    selection.splice(selection.indexOf(d),1);
                    d3.select(this).style("opacity", 1);
                    data_toserver = {'column': column[i], 'value': dataset[j][column[i]], 'switch': 'on'};
                }
                $.post("", data_toserver, function(){})
                xhr.open('GET', '', true);
                xhr.send('');
            });

        let text = svg_elem.selectAll("text")
            .data(dataset)
            .enter()
            .append("text")
            .text(function(d) {
                return Math.round(d.Max - d.Min);
            })
            .attr("y", function(d, i) {
                return svgHeight - linearScale(d.Max - d.Min) - 2;
            })
            .attr("x", function(d, i) {
                return barWidth * i;
            })
            .attr("fill", "#A64C38");
            
        let pressed1 = false;

        let form1 = d3.select('#area1').append('div').append("form")    
        
        form1.append("input")
            .attr("type", "button")
            .attr("name", "toggle")
            .attr("value", column[i])
            .on("click", function(event){
                let data_button_tosend;
                if(!pressed1){
                    barChart.style("opacity", 0.5)
                    pressed1 = true;
                    data_button_tosend = {'column': column[i], 'switch': 'off'};
                }
                else{
                    barChart.style("opacity", 1)
                    pressed1 = false;
                    data_button_tosend = {'column': column[i], 'switch': 'on'};
                }
                $.post("button", data_button_tosend, function(){});
            });
    }

    // ****************************** Below is 2nd column code ******************************

    let resultsLinearScale = d3.scaleLinear()
        .domain([0, data_imported['Max Thp']])
        .range([0, result_svg_height-25]);

    let svg_result = d3.select('#area2').append('div').append('svg')
        .attr("width", result_svg_width)
        .attr("height", result_svg_height);
    
    let resultBarChart = svg_result.selectAll("rect")
        .data([data_imported['Max Thp'] - data_imported['Min Thp']])
        .enter()
        .append("rect")
        .attr("y", function(d) {
            return result_svg_height - resultsLinearScale(d); 
        })
        .attr("height", function(d) { 
            return resultsLinearScale(d); 
        })
        .attr("width", result_bar_width - barPadding)
        .attr("transform", function (d, i) {
            let translate = [result_bar_width * i, 0]; 
            return "translate("+ translate +")";
        });
        

    let resultText = svg_result.selectAll("text")
        .data([data_imported['Max Thp'] - data_imported['Min Thp']])
        .enter()
        .append("text")
        .text(function(d) {
            return d;
        })
        .attr("y", function(d, i) {
            return result_svg_height - resultsLinearScale(d) - 2;
        })
        .attr("x", function(d, i) {
            return result_bar_width * i;
        })
        .attr("fill", "#A64C38");

}

redraw();

window.addEventListener('resize',redraw);













// let dataset = data_fs;
// let dataset_dev = data_device;

// // Finding the max value in the Max column
// let max_thp = dataset.map(function(o){return o.Max});

// // let dataset = [8000, 10000, 5006, 12000, 18000, 3000, 4000, 12000, 16000];

// let selection = [];



// // 2nd part

// // max_thp = dataset_dev.map(function(o){return o.Max});

// // // let dataset_dev = [8000, 10000, 5006, 12000, 18000, 3000, 4000, 12000, 16000];

// //  svgWidth = 500, svgHeight = 300, barPadding = 10;
// //  barWidth = (svgWidth / dataset_dev.length);

// //  linearScale = d3.scaleLinear()
// //     .domain([0, d3.max(max_thp)])
// //     .range([0,svgHeight-25]);

// //  svg = d3.select('svg.var2')
// //     .attr("width", svgWidth)
// //     .attr("height", svgHeight);
    
// //  barChart = svg.selectAll("rect")
// //     .data(dataset_dev)
// //     .enter()
// //     .append("rect")
// //     .attr("y", function(d) {
// //          return svgHeight - linearScale(d.Max - d.Min) 
// //     })
// //     .attr("height", function(d) { 
// //         return linearScale(d.Max - d.Min); 
// //     })
// //     .attr("width", barWidth - barPadding)
// //     .attr("transform", function (d, i) {
// //         let translate = [barWidth * i, 0]; 
// //         return "translate("+ translate +")";
// //     })
// //     .on("click", function(d){
// //         if(selection.indexOf(d) == -1){
// //             selection.push(d);
// //             d3.select(this).style("opacity", 0.5);
// //         }
// //         else{
// //             selection.splice(selection.indexOf(d),1);
// //             d3.select(this).style("opacity", 1);
// //         }
// //     });

//  text = svg.selectAll("text")
//     .data(dataset_dev)
//     .enter()
//     .append("text")
//     .text(function(d) {
//         return Math.round(d.Max - d.Min);
//     })
//     .attr("y", function(d, i) {
//         return svgHeight - linearScale(d.Max - d.Min) - 2;
//     })
//     .attr("x", function(d, i) {
//         return barWidth * i;
//     })
//     .attr("fill", "#A64C38");

let pressed1 = false;

let form1 = d3.select("#options1")
    .append("form")    

form1.append("input")
    .attr("type", "button")
    .attr("name", "toggle")
    .attr("value", "FileSystem")
    .on("click", function(){
        console.log("pressed");
        if(!pressed1){
            barChart.style("opacity", 0.5)
            pressed1 = true;
        }
        else{
            barChart.style("opacity", 1)
            pressed1 = false;
        }
    }); 

