$(document).ready(function () {
    //dropdown
    $(".dropdown-trigger").dropdown();

    //side bar
    $('.sidenav').sidenav();

    //slider
    $('.slider').slider({indicators:false,height:500,duration:1000});

    //parallax
    $('.parallax').parallax();
})