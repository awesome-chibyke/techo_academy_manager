var nodemailer = require('nodemailer');

//require the db connection page
var connector = require("./db_connection");

var con = connector.dataBaseConnetion();

//require fs
var fs = require('fs');

var main_module = function(){

    //current date and time
    function dateNowNow(){

        var thedate = new Date();

        var day = thedate.getDate();
        if(day < 10){
            day = '0'+(parseFloat(thedate.getDate()));
        }

        var month = thedate.getMonth() + 1;
        if(month < 10){
            month = '0'+(parseFloat(thedate.getMonth()) + 1);
        }

        var year = thedate.getFullYear();

        return year+'-'+month+'-'+day;
    }

    function getYearDateRange(type_of){

        var thedate = new Date();

        if(type_of == 'date_for_current_month'){

            var current_month = thedate.getMonth() + 1;
            if(current_month < 10){
                current_month = '0'+(parseFloat(thedate.getMonth()) + 1);
            }

            var start_day = '01';

            var start_month = '01';

            var current_year = thedate.getFullYear();

            //get the current date
            const current_date = (parseFloat(thedate.getDate()) < 10) ? '0'+thedate.getDate() : thedate.getDate();

            //get the next month
            var next_month = parseFloat(thedate.getMonth() + 2);
            if(next_month < 10){
                next_month = '0'+ parseFloat(next_month);
            }

            //get first date of teh current month
            const first_date_of_the_current_month = current_year+'-'+current_month+'/'+1;

            //get the last date for the current month
            const last_date_of_the_current_month = substractAnyNumberFromDate(current_year+'-'+next_month+'/'+1, 1);

            //get the current date
            const current_date_set = current_year+'-'+current_month+'/'+current_date;

            return {start_date:first_date_of_the_current_month, end_date:last_date_of_the_current_month, current_date:current_date_set};

        }

        if(type_of == 'year_date_range'){

            var start_day = '01'

            var start_month = '01';

            var start_year = thedate.getFullYear();

            var end_day = '31'

            var end_month = '12';

            var end_year = thedate.getFullYear();

            return {start_date:start_year+'-'+start_month+'-'+start_day, end_date:end_year+'-'+end_month+'-'+end_day};

        }

    }

    function substractAnyNumberFromDate(main_date, number_to_be_substracted){

        var dt = new Date(main_date);
        dt.setDate( dt.getDate() - parseFloat(number_to_be_substracted) );

        let year = dt.getFullYear();

        let month = (parseFloat(dt.getMonth() + 1) < 10) ? '0'+ parseFloat(dt.getMonth() + 1) : parseFloat(dt.getMonth() + 1);

        let date = (parseFloat(dt.getDate()) < 10) ? '0'+ dt.getDate() : dt.getDate();

        return year+'-'+month+'-'+date


    }

    return {
        dateNowNow:dateNowNow,
        getYearDateRange:getYearDateRange,
        substractAnyNumberFromDate:substractAnyNumberFromDate
    }

}();

module.exports.main_moduler = main_module;