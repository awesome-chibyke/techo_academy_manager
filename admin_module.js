var nodemailer = require('nodemailer');

//require the db connection page
var connector = require("./db_connection");

var con = connector.dataBaseConnetion();

//require fs
var fs = require('fs');

//require the url
var url = require('url');

var user_module = require('./modules');
var main_module = require('./main_module');

var admin_module = function(){

    async function showAdminRegister(req, res, token){

        res.render('admin_area/signup', {error_code:0, error_array:{}, error_remover:'removeError(this)', full_name:'', email:'', csrfToken:token})

    }

    function dateNow(){
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

    async function processAdminRegistration(req, res) {

        //extract the values from the form
        const full_name = req.body.full_name;
        const email = req.body.email;
        const password = req.body.password;
        const con_password = req.body.con_password;

        //build arrays for validation
        const post_array = [full_name, email, password, con_password];
        const field_array = ['Full Name', 'Email', 'Password', 'Con Password'];
        const class_array = ['full_name', 'email', 'password', 'con_password'];

        //initialize th error_code to 1
        let error_code = 0; let error_array = {};

        for(var i = 0; i < post_array.length; i++){

            if(!user_module.generics.validateData(post_array[i], 'all')){
                error_array[class_array[i]] = field_array[i]+" is required!";
                error_code = 1;
            }

        }

        //validate the email
        if(email !== ""){
            if(!user_module.generics.validateData(email, "email")){

                error_array['email_address'] = "Please supply a valid email address!";
                error_code = 1;

            }
        }

        if(password !== "" && con_password !== ""){
            if(password !== con_password){

                error_array['con_password'] = "Passwords does not match!";
                error_code = 1;

            }
        }

        //check if the email already exist in the database
        try{

            if(error_code != 1){
                const email_details = await user_module.generics.selectData('SELECT email FROM yeah_yeah WHERE email = ? ', "with_params", [email]);

                if(email_details.length > 0){

                    error_array['email'] = "Email address already exists!!!";
                    error_code = 1;

                }


            }

            //create the obj to be returned to view
            let return_to_view = {error_code:1, error_array:{}, error_remover:'removeError(this)', full_name:full_name, email:email, csrfToken:req.csrfToken()};


            //return the user to view if the user failed the validation
            if(error_code == 1){
                return_to_view['error_code'] = 1;
                return_to_view['error_array'] = error_array;
                res.render('admin_area/signup', return_to_view);
                return;
            }

            //check if the number of registered members have crossed 4
            const admin_deatails = await user_module.generics.selectData('SELECT * FROM yeah_yeah', "all_row", []);


            if(admin_deatails.length > 3){

                error_array['general_error'] = 'Only four accounts can be created from this medium!!!';

                return_to_view['error_code'] = 2;
                return_to_view['error_array'] = error_array;
                res.render('admin_area/signup', return_to_view);
                return;
            }


            //if the validations were passed, we process and submit the form
            const unique_id = await user_module.generics.createRandomNumber(req, res, 'SELECT * FROM yeah_yeah WHERE unique_id = ? ');

            //gett the date for today
            //var theDate = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            var theDate = dateNow();

            var sqls = "INSERT INTO yeah_yeah (unique_id, email, full_name, pass, status, admin_type, date, secret_code, check_on) VALUES ? ";
            const values = [[unique_id, email, full_name, password, '0', 'main', theDate, '', '0']];

            //insert the values into the database
            const insert_data = await user_module.generics.insert(sqls, values);


            if(insert_data.affectedRows > 0){
                let return_to_view = {error_code:0, error_array:{}, error_remover:'removeError(this)', themessage:'Account was successfully created', csrfToken:req.csrfToken()};
                req.session.returned_value = return_to_view;
                res.redirect('/admin_login/');
            }

        }catch(e){
            console.log(e)
        }


    }

    //handle the admin login
    async function processAdminLogin(req, res){

        //get the values from the body parser
        const email = req.body.email;
        const password = req.body.password;

        //build arrays for validation
        const post_array = [email, password];
        const field_array = ['Email', 'Password'];
        const class_array = ['email', 'password'];

        //initialize th error_code to 1
        let error_code = 0; let error_array = {};

        for(var i = 0; i < post_array.length; i++){

            if(!user_module.generics.validateData(post_array[i], 'all')){
                error_array[class_array[i]] = field_array[i]+" is required!";
                error_code = 1;
            }

        }

        //validate the email address
        if(!user_module.generics.validateData(email, "email")){

            error_array['email_address'] = "Please enter a valid email address!";
            error_code = 1;

        }

        //get the return to view obj
        let return_to_view = {error_code:0, themessage:'', error_array:{}, error_remover:'removeError(this)', csrfToken:req.csrfToken()};

        if(error_code == 1){

            return_to_view['error_code'] = 1;
            return_to_view['error_array'] = error_array;
            req.session.returned_value = return_to_view;
            res.redirect('/admin_login');
            return;

        }

        //validation  passed
        //run a select to know if the email and password
        try {

            const check_login = await user_module.generics.selectData('SELECT * FROM yeah_yeah WHERE email = ? AND pass = ? ', "with_params", [email, password]);

            if(check_login.length == 1){

                //check if the user has been blocked
                if(check_login[0].status == 1){

                    req.session.returned_value = return_to_view;

                    return_to_view['error_code'] = 2;
                    error_array['general_error'] = 'Your account has been blocked!!!';
                    return_to_view['error_array'] = error_array;
                    req.session.returned_value = return_to_view;
                    res.redirect('/admin_login');
                    return;

                }

                //set up cookies to show user has passed validations
                req.session.validation_state = 'validation passed';
                req.session.login_details = {user_details:check_login[0]}

                //redirect the guy to dashboard area
                res.redirect('/dashboard');


            }else{

                req.session.returned_value = return_to_view;

                return_to_view['error_code'] = 2;
                error_array['general_error'] = 'Invalid Username or Password!!';
                return_to_view['error_array'] = error_array;
                req.session.returned_value = return_to_view;
                res.redirect('/admin_login');
                return;

            }

        }catch(e){
            console.log(e)
        }


    }

    async function showStudentEnrolled(req, res){

        try{

            //check if the cookie is present if not redirect user to login page
            if(req.signedCookies.admin_details === undefined){

                req.session.returned_value = {error_remover:'removeError(this)',error_code:2, error_array:{general_error:'Please Login first'}, themessage:'', csrfToken:req.csrfToken()};

                return res.redirect('/admin_login');

            }

            //res.clearCookie('admin_details', { path: '/' });
            //select the neccessary details to be sent to admin dashboard
            const user_details = await user_module.generics.selectData('SELECT * FROM user_tb', "all_row", []);

            //get the admin details
            const details = await user_module.generics.selectData('SELECT * FROM yeah_yeah WHERE unique_id = ? ', "with_params", [req.signedCookies.admin_details.admin_unique_id]);

            //unique_id email phone sur_name first_name last_name gender address local_government state country passport highest_academic_qualification 	computer_literacy additional_information date_created affirmation

            //req.signedCookies.admin_details.admin_email , {admin_details:details, user_details:user_details, counter:0}
            res.render('admin_area/students', {admin_details:details[0], user_details:user_details, counter:0});

        }catch(e){

            console.log(e)

        }

    }

    async function showAdminDashboard(req, res){

        if(req.session.validation_state === undefined){

            try{

                //check if the cookie is present if not redirect user to login page
                if(req.signedCookies.admin_details === undefined){

                    req.session.returned_value = {error_remover:'removeError(this)',error_code:2, error_array:{general_error:'Please Login first'}, themessage:'', csrfToken:req.csrfToken()};

                    return res.redirect('/admin_login');

                }

                //res.clearCookie('admin_details', { path: '/' });
                //select the neccessary details to be sent to admin dashboard
                const user_details = await user_module.generics.selectData('SELECT * FROM user_tb', "all_row", []);

                //get the admin details
                const details = await user_module.generics.selectData('SELECT * FROM yeah_yeah WHERE unique_id = ? ', "with_params", [req.signedCookies.admin_details.admin_unique_id]);

                //get all the income for the year

                //first the date range for the year
                var current_year_date_range = main_module.main_moduler.getYearDateRange('year_date_range')

                const current_year_income = await user_module.generics.selectData('SELECT * FROM payments WHERE date_of_payment BETWEEN ? AND ? ', "with_params", [current_year_date_range.start_date, current_year_date_range.end_date]);

                //create a variable to hold the
                let current_year_income_sum = 0, current_year_enrollment_id_array = [], current_year_income_balance = 0;
                for(let i in current_year_income){

                    //the sum for the current year
                    current_year_income_sum += parseFloat(current_year_income[i].amount_paid);

                    //run as select using the enrollment id to get the balance sum
                    if(!current_year_enrollment_id_array.includes(current_year_income[i].enrollment_id)){

                        //then insert the id into the array
                        current_year_enrollment_id_array.push(current_year_income[i].enrollment_id);
                        //run a select to get the balence fpr this particular enrollment id
                        let current_year_income_query = await user_module.generics.selectData('SELECT * FROM enrolled_courses WHERE enrollment_id = ? ', "with_params", [current_year_income[i].enrollment_id]);

                        console.log(current_year_income[i].enrollment_id);
                        current_year_income_balance += parseFloat(current_year_income_query[0].balance);

                    }


                }

                //get the all the time income value
                const all_income = await user_module.generics.selectData('SELECT * FROM payments', "all_row", []);

                //create a variable to hold the
                let all_income_sum = 0, all_income_enrollment_id_array = [], all_income_balance = 0;
                for(let i in all_income){

                    //the sum for the current year
                    all_income_sum += parseFloat(all_income[i].amount_paid);

                    //run as select using the enrollment id to get the balance sum
                    if(!all_income_enrollment_id_array.includes(all_income[i].enrollment_id)){

                        //then insert the id into the array
                        all_income_enrollment_id_array.push(all_income[i].enrollment_id);

                        //run a select to get the balence fpr this particular enrollment id
                        let all_income_query = await user_module.generics.selectData('SELECT * FROM enrolled_courses WHERE enrollment_id = ? ', "with_params", [all_income[i].enrollment_id]);

                        all_income_balance += parseFloat(all_income_query[0].balance);

                    }


                }

                //select all the income for the current month //get the date for the current month
                var current_month_date_range = main_module.main_moduler.getYearDateRange('date_for_current_month');

                const current_month_income = await user_module.generics.selectData('SELECT * FROM payments WHERE date_of_payment BETWEEN ? AND ? ', "with_params", [current_month_date_range.start_date, current_month_date_range.end_date]);

                //create a variable to hold the
                let current_month_income_sum = 0, current_month_income_enrollment_id_array = [], current_month_income_balance = 0;
                for(let i in current_month_income){

                    //the sum for the current year
                    current_month_income_sum += parseFloat(current_month_income[i].amount_paid);

                    //run as select using the enrollment id to get the balance sum
                    if(!current_month_income_enrollment_id_array.includes(current_month_income[i].enrollment_id)){

                        //then insert the id into the array
                        current_month_income_enrollment_id_array.push(current_month_income[i].enrollment_id);

                        //run a select to get the balence fpr this particular enrollment id
                        let current_month_income_query = await user_module.generics.selectData('SELECT * FROM enrolled_courses WHERE enrollment_id = ? ', "with_params", [current_month_income[i].enrollment_id]);

                        current_month_income_balance += parseFloat(current_month_income_query[0].balance);

                    }


                }

                //get the current day income
                const current_day_income = await user_module.generics.selectData('SELECT * FROM payments WHERE date_of_payment = ? ', "with_params", [current_month_date_range.current_date]);

                //create a variable to hold the
                let current_day_income_sum = 0, current_day_income_enrollment_id_array = [], current_day_income_balance = 0;
                for(let i in current_day_income){

                    //the sum for the current year
                    current_day_income_sum += parseFloat(current_day_income[i].amount_paid);

                    //run as select using the enrollment id to get the balance sum
                    if(!current_day_income_enrollment_id_array.includes(current_day_income[i].enrollment_id)){

                        //then insert the id into the array
                        current_day_income_enrollment_id_array.push(current_day_income[i].enrollment_id);

                        //run a select to get the balence fpr this particular enrollment id
                        let current_day_income_query = await user_module.generics.selectData('SELECT * FROM enrolled_courses WHERE enrollment_id = ? ', "with_params", [current_day_income[i].enrollment_id]);

                        current_day_income_balance += parseFloat(current_day_income_query[0].balance);

                    }


                }

                res.render('admin_area/index', {admin_details:details[0], current_year_income:current_year_income[0], all_income:all_income[0], current_month_income:current_month_income[0], current_day_income:current_day_income[0], counter:0, current_day_income_sum:current_day_income_sum, current_day_income_balance:current_day_income_balance, current_month_income_balance:current_month_income_balance, current_month_income_sum:current_month_income_sum, all_income_sum:all_income_sum, all_income_balance:all_income_balance, current_year_income_sum:current_year_income_sum, current_year_income_balance:current_year_income_balance});

                //req.signedCookies.admin_details.admin_email , {admin_details:details, user_details:user_details, counter:0}
                //res.render('admin_area/index', {admin_details:details[0], user_details:user_details, counter:0});

            }catch(e){

                console.log(e)

            }

        }else{

            if(req.session.validation_state !== 'validation passed'){
                res.redirect('/admin_login');
                return;
            }
            const details = req.session.login_details;
            delete req.session.login_details;
            delete req.session.validation_state;

            //create the session
            const options = {
                maxAge: 1000 * 60 * 30, // would expire after 15 minutes
                httpOnly: true, // The cookie only accessible by the web server
                signed: true // Indicates if the cookie should be signed
            }

            // Set cookie
            res.cookie('admin_details', {admin_logged:true, admin_email:details.user_details.email, admin_unique_id:details.user_details.unique_id}, options);

            try{

                //get all the income for the year

                //first the date range for the year
                var current_year_date_range = main_module.main_moduler.getYearDateRange('year_date_range')

                const current_year_income = await user_module.generics.selectData('SELECT * FROM payments WHERE date_of_payment BETWEEN ? AND ? ', "with_params", [current_year_date_range.start_date, current_year_date_range.end_date]);

                //create a variable to hold the
                let current_year_income_sum = 0, current_year_enrollment_id_array = [], current_year_income_balance = 0;
                for(let i in current_year_income){

                    //the sum for the current year
                    current_year_income_sum += parseFloat(current_year_income[i].amount_paid);

                    //run as select using the enrollment id to get the balance sum
                    if(!current_year_enrollment_id_array.includes(current_year_income[i].enrollment_id)){

                        //then insert the id into the array
                        current_year_enrollment_id_array.push(current_year_income[i].enrollment_id);
                        //run a select to get the balence fpr this particular enrollment id
                        let current_year_income_query = await user_module.generics.selectData('SELECT * FROM enrolled_courses WHERE enrollment_id = ? ', "with_params", [current_year_income[i].enrollment_id]);

                        console.log(current_year_income[i].enrollment_id);
                        current_year_income_balance += parseFloat(current_year_income_query[0].balance);

                    }


                }

                //get the all the time income value
                const all_income = await user_module.generics.selectData('SELECT * FROM payments', "all_row", []);

                //create a variable to hold the
                let all_income_sum = 0, all_income_enrollment_id_array = [], all_income_balance = 0;
                for(let i in all_income){

                    //the sum for the current year
                    all_income_sum += parseFloat(all_income[i].amount_paid);

                    //run as select using the enrollment id to get the balance sum
                    if(!all_income_enrollment_id_array.includes(all_income[i].enrollment_id)){

                        //then insert the id into the array
                        all_income_enrollment_id_array.push(all_income[i].enrollment_id);

                        //run a select to get the balence fpr this particular enrollment id
                        let all_income_query = await user_module.generics.selectData('SELECT * FROM enrolled_courses WHERE enrollment_id = ? ', "with_params", [all_income[i].enrollment_id]);

                        all_income_balance += parseFloat(all_income_query[0].balance);

                    }


                }

                //select all the income for the current month //get the date for the current month
                var current_month_date_range = main_module.main_moduler.getYearDateRange('date_for_current_month');

                const current_month_income = await user_module.generics.selectData('SELECT * FROM payments WHERE date_of_payment BETWEEN ? AND ? ', "with_params", [current_month_date_range.start_date, current_month_date_range.end_date]);

                //create a variable to hold the
                let current_month_income_sum = 0, current_month_income_enrollment_id_array = [], current_month_income_balance = 0;
                for(let i in current_month_income){

                    //the sum for the current year
                    current_month_income_sum += parseFloat(current_month_income[i].amount_paid);

                    //run as select using the enrollment id to get the balance sum
                    if(!current_month_income_enrollment_id_array.includes(current_month_income[i].enrollment_id)){

                        //then insert the id into the array
                        current_month_income_enrollment_id_array.push(current_month_income[i].enrollment_id);

                        //run a select to get the balence fpr this particular enrollment id
                        let current_month_income_query = await user_module.generics.selectData('SELECT * FROM enrolled_courses WHERE enrollment_id = ? ', "with_params", [current_month_income[i].enrollment_id]);

                        current_month_income_balance += parseFloat(current_month_income_query[0].balance);

                    }


                }

                //get the current day income
                const current_day_income = await user_module.generics.selectData('SELECT * FROM payments WHERE date_of_payment = ? ', "with_params", [current_month_date_range.current_date]);

                //create a variable to hold the
                let current_day_income_sum = 0, current_day_income_enrollment_id_array = [], current_day_income_balance = 0;
                for(let i in current_day_income){

                    //the sum for the current year
                    current_day_income_sum += parseFloat(current_day_income[i].amount_paid);

                    //run as select using the enrollment id to get the balance sum
                    if(!current_day_income_enrollment_id_array.includes(current_day_income[i].enrollment_id)){

                        //then insert the id into the array
                        current_day_income_enrollment_id_array.push(current_day_income[i].enrollment_id);

                        //run a select to get the balence fpr this particular enrollment id
                        let current_day_income_query = await user_module.generics.selectData('SELECT * FROM enrolled_courses WHERE enrollment_id = ? ', "with_params", [current_day_income[i].enrollment_id]);

                        current_day_income_balance += parseFloat(current_day_income_query[0].balance);

                    }


                }

                res.render('admin_area/index', {admin_details:details.user_details, current_year_income:current_year_income[0], all_income:all_income[0], current_month_income:current_month_income[0], current_day_income:current_day_income[0], counter:0, current_day_income_sum:current_day_income_sum, current_day_income_balance:current_day_income_balance, current_month_income_balance:current_month_income_balance, current_month_income_sum:current_month_income_sum, all_income_sum:all_income_sum, all_income_balance:all_income_balance, current_year_income_sum:current_year_income_sum, current_year_income_balance:current_year_income_balance});

            }catch(e){
                console.log(e)
            }



        }

    }

    async function getIncomeDetailsBasedOnDateSelected(req, res){

        //get the values
        let from_date = req.body.from_date
        let to_date = req.body.to_date

        if(from_date === "" || to_date === ""){
            res.json({error_code:1, error:'Please make sure you have selected the two dates required!!!', success:[]});
        }

        const selected_date_income = await user_module.generics.selectData('SELECT * FROM payments WHERE date_of_payment BETWEEN ? AND ? ', "with_params", [from_date, to_date]);

        //create a variable to hold the
        let selected_date_income_sum = 0, selected_date_income_enrollment_id_array = [], selected_date_income_balance = 0;
        for(let i in selected_date_income){

            //the sum for the current year
            selected_date_income_sum += parseFloat(selected_date_income[i].amount_paid);

            //run as select using the enrollment id to get the balance sum
            if(!selected_date_income_enrollment_id_array.includes(selected_date_income[i].enrollment_id)){

                //then insert the id into the array
                selected_date_income_enrollment_id_array.push(selected_date_income[i].enrollment_id);

                //run a select to get the balence fpr this particular enrollment id
                let selected_date_income_query = await user_module.generics.selectData('SELECT * FROM enrolled_courses WHERE enrollment_id = ? ', "with_params", [selected_date_income[i].enrollment_id]);

                selected_date_income_balance += parseFloat(selected_date_income_query[0].balance);

            }


        }

        res.json({error_code:0, error:'', success:{message:'Query was sucessfully passed!!!', sum:selected_date_income_sum, balance:selected_date_income_balance}});

    }


    async function delinquent_students(req, res){

        //get the  enrolled_courses
        try{

            //check if the cookie is present if not redirect user to login page
            if(req.signedCookies.admin_details === undefined){

                req.session.returned_value = {error_remover:'removeError(this)',error_code:2, error_array:{general_error:'Please Login first'}, themessage:'', csrfToken:req.csrfToken()};

                return res.redirect('/admin_login');

            }

            //get all the enrolled courses
            const enrolled_courses = await user_module.generics.selectData('SELECT * FROM enrolled_courses WHERE balance != ?', 'with_params', [0]);

            //create an array of that will carry the returns from the returned values of courses
            var course_names = []; var student_names = [];

            //using the cours_id in the enrolled courses, get the an array of cousre name
            for(i = 0; i < enrolled_courses.length; i++){

                if(enrolled_courses[i].type_of === 'training'){

                    const courses = await user_module.generics.selectData('SELECT * FROM course_table WHERE course_id = ? ', "with_params", [enrolled_courses[i].course_id]);

                    //add the value of the course name to the array of courses names
                    course_names.push(courses[0].course_name);

                }else{
                    //add the value of the course name to the array of courses names
                    course_names.push(enrolled_courses[i].course_id);
                }


                const user_details = await user_module.generics.selectData('SELECT * FROM user_tb WHERE unique_id = ? ', "with_params", [enrolled_courses[i].student_id]);

                //add the value of the course name to the array of courses names
                student_names.push(user_details[0].sur_name+' '+user_details[0].first_name+' '+user_details[0].last_name);


            }

            //get the admin details
            const details = await user_module.generics.selectData('SELECT * FROM yeah_yeah WHERE unique_id = ? ', "with_params", [req.signedCookies.admin_details.admin_unique_id]);

            //after building these values, push them to the front end.
            res.render('admin_area/courses', {enrolled_courses:enrolled_courses.reverse(), course_names:course_names.reverse(), student_names:student_names.reverse(), counter:0, counter_main:0, admin_details:details[0]});

        }catch(e){

            console.log(e)

        }

    }

    async function enrolled_courses(req, res){

        //get the  enrolled_courses
        try{

            //check if the cookie is present if not redirect user to login page
            if(req.signedCookies.admin_details === undefined){

                req.session.returned_value = {error_remover:'removeError(this)',error_code:2, error_array:{general_error:'Please Login first'}, themessage:'', csrfToken:req.csrfToken()};

                return res.redirect('/admin_login');

            }

            //get all the enrolled courses
            const enrolled_courses = await user_module.generics.selectData('SELECT * FROM enrolled_courses', 'all_row', []);

            //create an array of that will carry the returns from the returned values of courses
            var course_names = []; var student_names = [];

            //using the cours_id in the enrolled courses, get the an array of cousre name
            for(i = 0; i < enrolled_courses.length; i++){

                if(enrolled_courses[i].type_of === 'training'){

                    const courses = await user_module.generics.selectData('SELECT * FROM course_table WHERE course_id = ? ', "with_params", [enrolled_courses[i].course_id]);

                    //add the value of the course name to the array of courses names
                    course_names.push(courses[0].course_name);

                }else{
                    //add the value of the course name to the array of courses names
                    course_names.push(enrolled_courses[i].course_id);
                }


                const user_details = await user_module.generics.selectData('SELECT * FROM user_tb WHERE unique_id = ? ', "with_params", [enrolled_courses[i].student_id]);

                //add the value of the course name to the array of courses names
                student_names.push(user_details[0].sur_name+' '+user_details[0].first_name+' '+user_details[0].last_name);


            }

            //get the admin details
            const details = await user_module.generics.selectData('SELECT * FROM yeah_yeah WHERE unique_id = ? ', "with_params", [req.signedCookies.admin_details.admin_unique_id]);

            //after building these values, push them to the front end.
            res.render('admin_area/courses', {enrolled_courses:enrolled_courses.reverse(), course_names:course_names.reverse(), student_names:student_names.reverse(), counter:0, counter_main:0, admin_details:details[0]});

        }catch(e){

            console.log(e)

        }

    }

    async function view_courses(req, res) {

        //get the  enrolled_courses
        try{

            //check if the cookie is present if not redirect user to login page
            if(req.signedCookies.admin_details === undefined){

                req.session.returned_value = {error_remover:'removeError(this)',error_code:2, error_array:{general_error:'Please Login first'}, themessage:'', csrfToken:req.csrfToken()};

                return res.redirect('/admin_login');

            }

            //get all the enrolled courses
            const courses = await user_module.generics.selectData('SELECT * FROM course_table ORDER BY id DESC', 'all_row', []);

            //get the admin details
            const details = await user_module.generics.selectData('SELECT * FROM yeah_yeah WHERE unique_id = ? ', "with_params", [req.signedCookies.admin_details.admin_unique_id]);

            //after building these values, push them to the front end. courses
            res.render('admin_area/view_courses', {courses:courses, counter:0, counter_main:0, admin_details:details[0]});

        }catch(e){

            console.log(e)

        }

    }


    async function payments_displayer(req, res){

        //get the  enrolled_courses
        try{

            //check if the cookie is present if not redirect user to login page
            if(req.signedCookies.admin_details === undefined){

                req.session.returned_value = {error_remover:'removeError(this)',error_code:2, error_array:{general_error:'Please Login first'}, themessage:'', csrfToken:req.csrfToken()};

                return res.redirect('/admin_login');

            }

            //get all the enrolled courses
            const payments = await user_module.generics.selectData('SELECT * FROM payments ORDER BY id DESC', 'all_row', []);

            //create an array of that will carry the returns from the returned values of courses
            var course_names = []; var student_names = []; var enrollment_details = [];

            //using the cours_id in the enrolled courses, get the an array of cousre name
            for(i = 0; i < payments.length; i++){

                if(payments[i].type_of === 'training'){

                    const courses = await user_module.generics.selectData('SELECT * FROM course_table WHERE course_id = ? ', "with_params", [payments[i].course_id]);

                    //add the value of the course name to the array of courses names
                    course_names.push(courses[0].course_name);


                }else{

                    //add the value of the course name to the array of courses names
                    course_names.push(payments[i].course_id);

                }

                const user_details = await user_module.generics.selectData('SELECT * FROM user_tb WHERE unique_id = ? ', "with_params", [payments[i].student_id]);

                //add the value of the course name to the array of courses names
                student_names.push(user_details[0].sur_name+' '+user_details[0].first_name+' '+user_details[0].last_name);

//get the enrollment information
                const enrollment_query = await user_module.generics.selectData('SELECT * FROM enrolled_courses WHERE enrollment_id = ? ', "with_params", [payments[i].enrollment_id]);

                enrollment_details.push(enrollment_query[0]);


            }

            //get the admin details
            const details = await user_module.generics.selectData('SELECT * FROM yeah_yeah WHERE unique_id = ? ', "with_params", [req.signedCookies.admin_details.admin_unique_id]);

            //after building these values, push them to the front end.
            res.render('admin_area/inome', {payments:payments, course_names:course_names, student_names:student_names, counter:0, counter_main:0, admin_details:details[0],enrollment_details:enrollment_details});

        }catch(e){

            console.log(e)

        }

    }

    async function update_completion(req, res) {
        //get the vakues sent from the user side
        const enrollment_id = req.body.enrollment_id;

        if(enrollment_id == ""){
            return res.json({error_code:1, error:'Please refresh page and try again!', success:{}});
        }

        var sql = "UPDATE enrolled_courses SET status = ? WHERE enrollment_id = ?";

        const values_for_update = ['completed',enrollment_id];

        const result = await user_module.generics.carryOutUpdate(sql, values_for_update);

        res.json({error_code:0, error:'', success:{message:'Selected Service has been updated as complete!!!'}});
    }

    async function updatePayment(req, res){

        //get the vakues sent from the user side
        const enrollment_id = req.body.enrollment_id;
        const amount_paid = req.body.amount_paid;

        if(amount_paid == ""){
            console.log('i got here')
            return res.json({error_code:1, error:'Please provide an amount!', success:{}});
        }
        if(enrollment_id == ""){
            return res.json({error_code:1, error:'Please refresh page and try again!', success:{}});
        }
        if(isNaN(amount_paid)){
            return res.json({error_code:1, error:'Amount must be a number!', success:{}});
        }

//check if the cookie is present if not redirect user to login page
        checkForCookieExistence(req, res);
        /*if(req.signedCookies.admin_details === undefined){

            return res.redirect('/admin_login');

        }*/


        try{

            //select the last payment from the payment table
            const last_payment = await user_module.generics.selectData('SELECT * FROM payments WHERE enrollment_id = ? ORDER BY id DESC LIMIT 1', "with_params", [enrollment_id]);

            if(last_payment[0].balance == 0){
                return res.json({error_code:1, error:'User has already finished making payment for this course!!!'});
            }

            if(amount_paid > last_payment[0].balance){
                return res.json({error_code:1, error:'Amount entered is greater than Available balance!!!'});
            }

            //get the new balance
            const new_balance = last_payment[0].balance - amount_paid;
            const amount_charged = last_payment[0].amount_charged;
            //return res.json({error_code:1, error:parseFloat(amount_paid)+' '+parseFloat(last_payment[0].balance), success:{}});
            if(parseFloat(amount_paid) > parseFloat(last_payment[0].balance)){
                return res.json({error_code:1, error:'Amount entered is greater than user`s balance', success:{}});
            }

            //gett the date for today
            //var theDate = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            var theDate = dateNow();

            const payment_id = await user_module.generics.createRandomNumberMain(req, res,'SELECT * FROM payments WHERE payment_id = ? ');

            var  payment_status = 'not_completed';
            if(parseFloat(new_balance) == parseFloat(0)){
                payment_status = 'completed';
            }

            //insert a new row into the payment table
            var sqls = "INSERT INTO payments (payment_id, enrollment_id, course_id, student_id, amount_charged, amount_paid, balance, date_of_payment, payment_status) VALUES ?";
            const valuess = [[payment_id, enrollment_id, last_payment[0].course_id, last_payment[0].student_id, amount_charged, amount_paid, new_balance, theDate, payment_status]];

            //insert the values into the database
            const insert_paymment_data = await user_module.generics.insert(sqls, valuess);

            //calculate the totalamount paid so far and update the main enrollment table with the balance, and total payment so far
            const all_payment = await user_module.generics.selectData('SELECT * FROM payments WHERE enrollment_id = ? ', "with_params", [enrollment_id]);

            //loop through the result and sum all the amount paid so far
            var amount_paid_so_far = parseFloat(0);

            for(i = 0; i < all_payment.length; i++){

                amount_paid_so_far += parseFloat(all_payment[i].amount_paid)

            }

            //update the enrollment table
            //complete the registration by updating the database with the details
            var sql = "UPDATE enrolled_courses SET amount_paid = ? , balance = ?, last_update = ? WHERE enrollment_id = ? ";

            const values_for_update = [amount_paid_so_far, new_balance, theDate, enrollment_id];

            const result = await user_module.generics.carryOutUpdate(sql, values_for_update);

            res.json({error_code:0, error:'', success:{message:'User`s Payment was updated successfully'}});


        }catch(e){
            console.log(e);
        }

    }

    function paymentStatus(balance) {
        if(parseFloat(balance) == parseFloat(0)){
            return 'not_completed';
        }else{
            return 'completed';
        }
    }

    //checks if the email for project register is already registered
    async function checkProjectEmailAvailabilty(req, res){

        //check if the cookie is present if not redirect user to login page
        checkForCookieExistence(req, res);
        /*if(req.signedCookies.admin_details === undefined){

            return res.redirect('/admin_login');

        }*/

        //get the admin details
        const details = await user_module.generics.selectData('SELECT * FROM yeah_yeah WHERE unique_id = ? ', "with_params", [req.signedCookies.admin_details.admin_unique_id]);

        res.render('admin_area/income_email_check',{error_code:0, error:'', success_message:'', admin_details:details[0], error_remover:'removeError(this)'});


    }

    async function project_email_checker(req, res){

        //check if the cookie is present if not redirect user to login page
        checkForCookieExistence(req, res);
        /*if(req.signedCookies.admin_details === undefined){

            return res.redirect('/admin_login');

        }*/

        //run a select and check for the existence of the email
        const email = req.body.email;

        //declare the object to be returned to display
        let return_to_display = {error_code:0, error_remover:'removeError(this)'}

        //declare an obj to hold the error
        let error_array = {}; error_code = 0;

        if(email == ""){
            error_array['email'] = 'email is required!!!';
            error_code = 1;
        }

        if(email == ""){
            if(!user_module.generics.validateData(email, "email")){

                error_array['email_address'] = "Please supply a valid email address!";
                error_code = 1;

            }
        }

        //if there is an empty value
        if(error_code == 1){

            return_to_display['error_code'] = 1
            return_to_display['error_array'] = error_array;

            req.session.returned_values = return_to_display;

            res.redirect('/add_project_incomes');
            return;
        }

        try{
            //if the validation is not failed we check the email against wha is in the database
            const user_details = await user_module.generics.selectData('SELECT * FROM user_tb WHERE email = ? ', "with_params", [email]);

            if(user_details.length == 0){
                res.redirect('/add_project_first_page');
            }


            if(user_details.length == 1){
                const unique_id = user_details[0].unique_id
                res.redirect('/add_project_second_page/'+unique_id);
            }


        }catch(e){
            console.log(e);
        }


    }

    async function add_project_first_page(req, res){

        //check if the cookie is present if not redirect user to login page
        checkForCookieExistence(req, res);
        /*if(req.signedCookies.admin_details === undefined){

            return res.redirect('/admin_login');

        }*/

        try{

            //create the random number
            const random_number = await user_module.generics.createRandomNumberMain(req, res, 'SELECT * FROM user_tb WHERE unique_id = ? ');


            //get the admin details
            const details = await user_module.generics.selectData('SELECT * FROM yeah_yeah WHERE unique_id = ? ', "with_params", [req.signedCookies.admin_details.admin_unique_id]);

            res.render('admin_area/add_project', {csrfToken:req.csrfToken(),error_code:0, error_remover:'removeError(this)', form_no:'1', error_array:{}, title:"Addition of a new Product", getSelectedState:"getSelectedState(this)", states:user_module.generics.getState(),country:user_module.generics.getCountries(), random_number:random_number, admin_details:details[0], values:{sur_name_value:"", first_name_value:"", middle_name_value:"", email_address_value:"", phone_number_value:"", gender_value:"", contact_address_value:"", selected_state_value:"", local_government_value:"", nationality_value:""}});

        }catch(e){
            console.log(e);
        }

    }

    //get the full url
    function fullUrl(req) {
        return url.format({
            protocol: req.protocol,
            host: req.get('host'),
            pathname: req.originalUrl
        });
    }

    //still pending
    async function add_new_project(req, res){

        //console.log(fullUrl(req)); return;
        //check if the cookie is present if not redirect user to login page
        checkForCookieExistence(req, res);
        /*if(req.signedCookies.admin_details === undefined){

            req.session.last_url = req.rawHeaders[19];
            return res.redirect('/admin_login');

        }*/

        const random_number = req.body.random_number;
        const nationality = req.body.nationality;
        const local_government = req.body.local_government;
        const selected_state = req.body.selected_state;
        const phone_number = req.body.phone_number;
        const middle_name = req.body.middle_name;
        const first_name = req.body.first_name;
        const sur_name = req.body.sur_name;
        const email_address = req.body.email_address;
        const contact_address = req.body.contact_address;
        const gender = req.body.gender;

        //check for empty values
        var posts = [random_number, contact_address, phone_number, email_address, middle_name, first_name, sur_name];

        var fields = ["Random Number", "Contact Address", "Phone Number", "Email Address", "Middle Name", "First Name", "Sur Name"];

        var classes = ['random_number', 'contact_address', 'phone_number', 'email_address', 'middle_name', 'first_name', 'sur_name'];

        var error_array = {}; error_code = 0;

        //validate the datas
        for(var i = 0; i < posts.length; i++){

            if(!user_module.generics.validateData(posts[i], 'all')){
                error_array[classes[i]] = fields[i]+" is required!";
                error_code = 1;
            }

        }

        //check for non selection of the select field
        var posts = [selected_state, local_government, gender,nationality];

        var wrong = ['Select Your State','Select Local Government','Choose Your Gender','Select Your Nationality']

        var corrections = ["Please Select a State", "Please Select Local Government", "Please Select Gender","Please Select Nationality"];

        var classes = ["selected_state", "local_government", "gender", "nationality"];

        for(var i = 0; i < posts.length; i++){

            if(wrong[i] == posts[i]){
                error_array[classes[i]] = corrections[i];
                error_code = 1;
            }

        }

        //check if email is a correct email address
        if(!user_module.generics.validateData(email_address, "email")){

            error_array['email_address'] = "Please enter a valid email address!";
            error_code = 1;

        }//console.log(phone_number)

        //check if the phone number is a number
        if(!user_module.generics.validateData(phone_number, "phone")){
            error_array['phone_number'] = "Only Number is required!";
            error_code = 1;
        }


        try{
            //create an object of what will be returned to view
            //get the admin details
            const details = await user_module.generics.selectData('SELECT * FROM yeah_yeah WHERE unique_id = ? ', "with_params", [req.signedCookies.admin_details.admin_unique_id]);


            //check for unique email address
            const unique_email_checker = await user_module.generics.selectData('SELECT * FROM user_tb WHERE email = ? ',"with_params", [email_address]);

            if(unique_email_checker.length > 0){
                error_array['email_address'] = "Please provide a unique email address!!!";
                error_code = 1;
            }

            //get the values to be returned to the view
            var return_to_display = retrurn_to_view_holder('register_project');

            //if there is an empty value
            if(error_code == 1){

                return_to_display['error_code'] = 1;
                return_to_display['error_array'] = error_array;
                return_to_display['admin_details'] = details[0];
                return_to_display['values']['phone_number_value'] = phone_number;
                return_to_display['values']['gender_value'] = gender;
                return_to_display['values']['contact_address_value'] = contact_address;
                return_to_display['values']['email_address_value'] = email_address;
                return_to_display['values']['middle_name_value'] = middle_name;
                return_to_display['values']['sur_name_value'] = sur_name;
                return_to_display['values']['first_name_value'] = first_name;
                return_to_display['values']['nationality_value'] = nationality;
                return_to_display['random_number'] = random_number;
                return_to_display['csrfToken'] = req.csrfToken();

                req.session.returned_values = return_to_display;

                res.redirect('/add_project_first_page');
                return;
            }

            //if the error code was not turned to 1

            //we insert the values into the db

            var sql = "INSERT INTO user_tb (unique_id, email, phone, sur_name, first_name, last_name, gender, address, local_government, state, country) VALUES ?";
            var values = [
                [random_number, email_address, phone_number, sur_name, first_name, middle_name, gender, contact_address, local_government, selected_state, nationality],
            ];

            const insert_prject_details = await user_module.generics.insert(sql, values);

            //get the values  to be returned to display
            let return_to_view = retrurn_to_view_holder('register_project');

            //first define the values for the fields neccessary for the new page
            return_to_view['random_number'] = random_number;
            return_to_view['full_name'] = sur_name+" "+first_name;
            return_to_view['form_no'] = 2;
            return_to_display['admin_details'] = details[0];
            return_to_view['csrfToken'] = req.csrfToken();

            req.session.returned_values = return_to_view;

            //redirect to the new page
            res.redirect('/add_project_second_page/'+random_number);

        }catch(e){

            console.log(e);

        }

    }

    //render the second page for the addition of the project
    async function add_project_second_page(req, res){

        checkForCookieExistence(req, res);

        //get the admin details
        const details = await user_module.generics.selectData('SELECT * FROM yeah_yeah WHERE unique_id = ? ', "with_params", [req.signedCookies.admin_details.admin_unique_id]);

        //get the random key
        let unque_id = req.params.key;

//sur_name+" "+first_name
        let retrurn_to_display = retrurn_to_view_holder('register_project_2');

        //get the result for the user detaiks from the database
        let result = await user_module.generics.selectData('SELECT * FROM user_tb WHERE unique_id = ? ','with_params', [unque_id]);

        //give values to some of the propertir=es to be sent to view
        retrurn_to_display['random_number'] = unque_id;
        retrurn_to_display['values']['full_name'] = result[0].first_name+' '+result[0].last_name;
        retrurn_to_display['csrfToken'] = req.csrfToken();
        retrurn_to_display['values']['amount_paid'] = "";
        retrurn_to_display['values']['amount_charged'] = "";
        retrurn_to_display['values']['project_title'] = "";
        retrurn_to_display['admin_details'] = details[0];

        //add_project_second_page
        res.render('admin_area/add_project_2', retrurn_to_display);

    }

    //function for processing the second phase of the project registration
    async function register_Project_2(req, res){

        checkForCookieExistence(req, res);

        let project_title = req.body.project_title;
        let amount_charged = req.body.amount_charged;
        let amount_paid = req.body.amount_paid;
        let random_number = req.body.random_number;
        let description = req.body.description;
        let full_name = req.body.full_name;

        //check for rmpty values
        var posts = [project_title, amount_charged, amount_paid, random_number, description];

        var fields = ["Title of Project", "Amount charged", "Amount Paid", "Random Number", "Project Decription"];

        var classes = ['project_title', 'amount_charged', 'amount_paid', 'random_number', 'description'];

        var error_array = {}; error_code = 0;

        //validate the datas
        for(var i = 0; i < posts.length; i++){

            if(!user_module.generics.validateData(posts[i], 'all')){
                error_array[classes[i]] = fields[i]+" is required!";
                error_code = 1;
            }

        }

        if(amount_paid > amount_charged){
            error_array['amount_paid'] = "Amount entered is higher than the amount charged.";
            error_code = 1;
        }

        //get the values to be returned to the view
        var return_to_display = retrurn_to_view_holder('register_project_2');

        //get the admin details
        const details = await user_module.generics.selectData('SELECT * FROM yeah_yeah WHERE unique_id = ? ', "with_params", [req.signedCookies.admin_details.admin_unique_id]);

        //if there is an empty value
        if(error_code == 1){

            return_to_display['error_code'] = 1;
            return_to_display['error_array'] = error_array;
            return_to_display['values']['project_title'] = project_title;
            return_to_display['values']['amount_charged'] = amount_charged;
            return_to_display['values']['amount_paid'] = amount_paid;
            return_to_display['values']['description'] = description;
            return_to_display['values']['full_name'] = full_name;
            return_to_display['random_number'] = random_number;
            return_to_display['csrfToken'] = req.csrfToken();

            req.session.returned_values = return_to_display;

            res.redirect('/add_project_second_page/'+random_number);
            return;
        }

        //process the values and add to tables

        //gett the date for today
        //var theDate = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        var theDate = dateNow();

        //calculate the balanceto be paid by the student in case of incomplete payment
        const balance = parseFloat(amount_charged) - parseFloat(amount_paid);

        try{

            var enrollment_id = await user_module.generics.createRandomNumber(req, res,'SELECT * FROM enrolled_courses WHERE enrollment_id = ? ');

            const  status = "in_progress";

            //state the value and sql statements
            var sql = "INSERT INTO enrolled_courses (enrollment_id, course_id, student_id, reg_date,amount, amount_paid, balance, status, type_of, description) VALUES ?";
            const values = [[enrollment_id, project_title, random_number, theDate, amount_charged, amount_paid, balance, status, 'project', description]];

            //insert the values into the database
            const insert_data = await user_module.generics.insert(sql, values);

            //assign payment status
            var payment_status = "not_completed";
            if(balance == 0){
                payment_status = "completed";
            }

            const payment_id = await user_module.generics.createRandomNumberMain(req, res,'SELECT * FROM payments WHERE payment_id = ? ');

            //insert values into the payment table
            var sqls = "INSERT INTO payments (payment_id, enrollment_id, course_id, student_id, amount_charged, amount_paid, balance, date_of_payment, payment_status) VALUES ?";

            const valuess = [[payment_id, enrollment_id, project_title, random_number, amount_charged, amount_paid, balance, theDate, payment_status]];

            //insert the values into the database
            const insert_paymment_data = await user_module.generics.insert(sqls, valuess);

            //select the user details
            const user_details = await user_module.generics.selectData('SELECT * FROM user_tb WHERE unique_id = ? ', "with_params", [random_number]);

            const registered_course = await user_module.generics.selectData('SELECT * FROM enrolled_courses WHERE enrollment_id = ? ', "with_params", [enrollment_id]);


            req.session.returned_values = {title:"success", success_message:"A new project has been created succesfully",random_number:random_number, user_details:user_details[0], registered_course:registered_course[0], admin_details:details[0]};

            res.redirect('/admin_success/'+random_number+'/'+enrollment_id);

        }catch (e){
            console.log(e);
        }



    }

    async function renderAdminSuccess(req, res){

        checkForCookieExistence(req, res);

        try{

            //get the admin details
            const details = await user_module.generics.selectData('SELECT * FROM yeah_yeah WHERE unique_id = ? ', "with_params", [req.signedCookies.admin_details.admin_unique_id]);

            const random_number = req.params.unique_id;

            const course_reg_id = req.params.course_reg_id;

            const registered_course = await user_module.generics.selectData('SELECT * FROM enrolled_courses WHERE enrollment_id = ? ', "with_params", [course_reg_id]);

            //select the user details
            const user_details = await user_module.generics.selectData('SELECT * FROM user_tb WHERE unique_id = ? ', "with_params", [random_number]);
            console.log(details);

            res.render('admin_area/success', {title:"success", success_message:"A new project has been created succesfully",random_number:random_number, user_details:user_details[0], registered_course:registered_course[0], admin_details:details[0]});


        }catch(e){

            console.log(e)

        }

    }

    //add the new courses
    async function add_new_courses(req, res) {

        //grab the course name
        const course_name = req.body.course_name;

        //loop through the course name and check if there is atleast a single value that is not empty

        var error_code = 0, counter = []; let error_array = {}
        for(var i = 0; i < course_name.length; i++){

            if(course_name[i] === ""){

                counter++;

            }

        }

        if(counter == 5){
            error_array['general_error'] = 'Please provide atleast one value for course name';
            error_code = 2;
        }

        if(error_code == 2){

            let return_to_view = retrurn_to_view_holder('go_to_add_courses');
            return_to_view['error_code'] = 2
            return_to_view['error_array'] = error_array;
            return_to_view['csrfToken'] = req.csrfToken();
            return_to_view['themessage'] = "";
            return_to_view['values']['course_name'] = req.body.course_name;
            //console.log(return_to_view); return;
            req.session.return_to_display = return_to_view;
            res.redirect('/go_to_add_courses');
            return;

        }

        //do the insertion
        let values_to_be_inserted = [];
        for(let i = 0; i < course_name.length; i++){

            if(course_name[i] !== ""){

                //create an unique key for each of the
                let unique_key = await user_module.generics.createRandomNumberMain(req, res, 'SELECT * FROM course_table WHERE course_id = ? ');

                //insert the value into the database
                values_to_be_inserted.push([unique_key, course_name[i]]);

            }

        }

        var sqls = "INSERT INTO course_table (course_id, course_name) VALUES ?";;

        //insert the values into the database
        const insert_paymment_data = await user_module.generics.insert(sqls, values_to_be_inserted);

        //get the admin details
        const details = await user_module.generics.selectData('SELECT * FROM yeah_yeah WHERE unique_id = ? ', "with_params", [req.signedCookies.admin_details.admin_unique_id]);

        //return the
        let return_to_view = retrurn_to_view_holder('go_to_add_courses');
        return_to_view['themessage'] = "Course(s) was inserted successfuly";
        return_to_view['values']['course_name'] = ['', '', '', '', ''];
        return_to_view['admin_details'] = details[0];
        req.session.return_to_display = return_to_view;
        return_to_view['csrfToken'] = req.csrfToken();
        res.redirect('/go_to_add_courses');

    }

    async function goToAddCourses(req, res){

        checkForCookieExistence(req, res);

        let return_to_view = retrurn_to_view_holder('go_to_add_courses');

        //get the admin details
        const details = await user_module.generics.selectData('SELECT * FROM yeah_yeah WHERE unique_id = ? ', "with_params", [req.signedCookies.admin_details.admin_unique_id]);

        return_to_view['csrfToken'] = req.csrfToken();
        return_to_view['admin_details'] = details[0];
        return_to_view['themessage'] = "";
        return_to_view['values']['course_name'] = ["","","","",""];
        res.render('admin_area/add_courses', return_to_view);

    }

    function retrurn_to_view_holder(option = 'home'){

        if(option === 'register_project'){
            var view_value = {error_code:0, error_remover:'removeError(this)', form_no:'1', error_array:{}, title:"Addition of a new Product", getSelectedState:"getSelectedState(this)", states:user_module.generics.getState(),country:user_module.generics.getCountries(), random_number:"", admin_details:"", values:{sur_name_value:"", first_name_value:"", middle_name_value:"", email_address_value:"", phone_number_value:"", gender_value:"", contact_address_value:"", selected_state_value:"", local_government_value:"", nationality_value:""}};
        }

        if(option === 'register_project_2'){
            var view_value =  {title:"index",random_number:"",form_no:2,error_remover:"removeError(this)",error_code:0,full_name:"",error_array:[],values:{academic_qual:"",comp_literate:"",description:"",image_data:""}};
        }

        if(option === 'go_to_add_courses'){
            var view_value =  {title:"index",random_number:"",error_remover:"removeError(this)",error_code:0,full_name:"",error_array:[],values:{academic_qual:"",comp_literate:"",description:"",image_data:""}};
        }

        return view_value;

    }

    //function that will check for session existence
    function checkForCookieExistence(req, res) {

        if(req.signedCookies.admin_details === undefined){

            req.session.last_url = req.rawHeaders[19];
            return res.redirect('/admin_login');

        }
    }

    return{
        showAdminRegister:showAdminRegister,
        processAdminRegistration:processAdminRegistration,
        processAdminLogin:processAdminLogin,
        showAdminDashboard:showAdminDashboard,
        showStudentEnrolled:showStudentEnrolled,
        enrolled_courses:enrolled_courses,
        updatePayment:updatePayment,
        payments_displayer:payments_displayer,
        add_new_project:add_new_project,
        checkProjectEmailAvailabilty:checkProjectEmailAvailabilty,
        project_email_checker:project_email_checker,
        add_project_first_page:add_project_first_page,
        add_project_second_page:add_project_second_page,
        register_Project_2:register_Project_2,
        renderAdminSuccess:renderAdminSuccess,
        dateNow:dateNow,
        getIncomeDetailsBasedOnDateSelected:getIncomeDetailsBasedOnDateSelected,
        update_completion:update_completion,
        goToAddCourses:goToAddCourses,
        add_new_courses:add_new_courses,
        view_courses:view_courses,
        delinquent_students:delinquent_students
    }

}()

module.exports.admin_method = admin_module;