$(document).ready(function(){
    $("#applyFilterBtn").on("click", ()=>{
        var attribute = $("#filter-options").val();
        var value = $("#search").val();
        console.log(attribute)
        console.log(value)

        if (value == "" || attribute == "All")
            window.location.href = "http://localhost:3000";  
        else
        {
            //window.location.href = "/search?" + attribute + "=" + value;
            $.get('/search', {attribute: attribute, value: value}, function(html) {
                $("#records-table").empty();
                $("#records-table").append(html);
              })
        }
            
    })

    $("#genBtn1").on("click", ()=>{

        $.get('/generateReport', {agg: "AVG", param: "rating"}, function(html) {
            $("#records-table").empty();
            $("#records-table").append(html);
        })    
    })

    $("#genBtn2").on("click", ()=>{

        $.get('/generateReport', {agg: "COUNT", param: "*"}, function(html) {
            $("#records-table").empty();
            $("#records-table").append(html);
        })    
    })
    /*

    $("#toggleConBtn").on("click", ()=>{

        $.get('/toggle', function() {
         
        })    
    })*/


});