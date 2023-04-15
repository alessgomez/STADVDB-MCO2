$(document).ready(function(){
    $("#applyFilterBtn").on("click", ()=>{
        var attribute = $("#filter-options").val();
        var value = $("#search").val();
        console.log(attribute)
        console.log(value)

        if (value == "" || attribute == "All")
            window.location.href = "http://localhost:3000";  
        else
            window.location.href = "http://localhost:3000/search?" + attribute + "=" + value;
    })
});