// Set the margins for the svg element
let predMargin = {top: 0, right: 300, left: 300, bottom: 10}
    , predWidth = window.innerWidth - predMargin.left - predMargin.right
    , predHeight = 50;

function display_predictions(data){
    $('#area4').empty();
    let svg = d3.select("#area4").append("svg")
    .attr("width", predWidth + predMargin.left + predMargin.right)
    .attr("height", predHeight + predMargin.top + predMargin.bottom)
    .attr("class", "pred-svg")
    .append("g")
    .attr("transform", "translate(" + predMargin.left + "," + predMargin.top + ")");

    let n = data.length;
    let x_scale = d3.scaleLinear()
        .domain([0,n]) 
        .range([1, n*200]) // Change the factor 50 to increase spacing between elements

    svg.append('g').append('text')
        .attr('class', 'heavy')
        .text("Predictions: ")
        .attr('fill', 'purple')
        .attr('transform', function(d){
            let translate = [x_scale(0), 30];
            return 'translate('+translate+')'
        })


    let text = svg.append('g').selectAll('text')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'heavy')
        .text(function(d){return d;})
        .attr('transform', function(d,j){
            let translate = [x_scale(j+1),30];
            return 'translate('+translate+')';
        })
    
}

