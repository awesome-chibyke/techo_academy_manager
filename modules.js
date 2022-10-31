/*//let us define a simple function and store in a variable
var multiplier = function(x,y){
    return 'The answer is ${x*y}';
}

//export the multiplier variable so other scripts can make use of it
module.exports.multiplier = multiplier;*/
var nodemailer = require('nodemailer');

//require the db connection page
var connector = require("./db_connection");

var con = connector.dataBaseConnetion();

//require fs
var fs = require('fs');


//require the admin module
var the_module = require('./main_module');

var generics = function(){

    async function createRandomNumber(req, res, query){

        const random_number = Math.random().toString(36).substring(7);
        const data = await selectData(query, "with_params", [random_number]);

        if(data.length > 0){

            createRandomNumber(req, res,'SELECT * FROM user_tb WHERE unique_id = ? ')

        }else{

            return random_number;

        }


    }

    function createRandomNumberMain(req, res, query){

        return new Promise(function (resolve, reject) {

            const random_number = Math.random().toString(36).substring(7);

            con.query(query, [random_number], function (err, result, fields) {
                if(err){
                    reject(err);
                }else{
                    if(result.length > 0){

                        createRandomNumberMain(req, res, query);
                    }else{
                        resolve(random_number)
                    }

                }
            })

        })

    }

    //image upload 2
    function uploadImage(file_to_be_uploaded,unique_id, image_path){

        return new Promise(function(resolve,reject){

            var logo_name = unique_id+"_techo_student";
            var dir = __dirname +image_path;
            var logo_path = dir + logo_name + '.jpg';

            if(file_to_be_uploaded == ""){
                var error_code = 1;
                reject("Please Upload an Image");
            }

            // Use the mv() method to place the file somewhere on your server
            file_to_be_uploaded.mv(logo_path, function(err) {

                if(err){
                    var error_code = 1;
                    reject(err);
                }else{
                    resolve(logo_name+ '.jpg');
                }

            });

        })

    }

    //function image handling
    function handleImage(file, unique_id, image_path){

        return new Promise(function (resolve, reject) {

            //remove the 'data:image;base64'
            //var base64Image = logo.split(';base64,').pop();
            //var base64Image = logo.replace(/^data:image\/png;base64,/, "");
            var base64Image = file.replace(/^data:image\/\w+;base64,/, '');

            //let's define the path where the converted image will be saved to
            //var logo_name = name.split('.')[0].replace(/\\/g, '').replace(/ /g,'');
            var logo_name = unique_id+"_techo_student";
            var dir = __dirname +image_path;
            var logo_path = dir + logo_name + '.jpg';

            //check if file already exists and rename this file path
            if (fs.existsSync(logo_path)) {
                //file exists
                logo_name = unique_id+"_techo_student";
                logo_path = dir + logo_name + '.jpg';
            }

            //convert the base64 string to image and save to the path(logo_path)
            fs.writeFile(logo_path, base64Image, {encoding: 'base64'}, function(err) {

                if(err){
                    var error_code = 1;
                    reject(err);
                }else{
                    resolve(logo_name+ '.jpg');
                }

            });

        })


    }

    //insert function for any table
    function insert(query, values){

        return new Promise(function (resolve, reject) {

            con.query(query, [values], function (err, result, fields) {
                if(err){
                    reject(err);
                }else{
                    resolve(result)
                }
            })

        })

    }

    async function callInsert(query, values){

        const data = await insert(query, values);
        return data;

    }

    async function callSelectData(query, values, option){

        const data = await selectData(query, option, values);
        return data;

    }

    function selectData(query, option, values){

        if(option === "all_row"){

            return new Promise(function (resolve, reject) {

                con.query(query, function (err, result, fields) {
                    if(err){
                        reject(err);
                    }else{
                        resolve(result)
                    }
                })

            })

        }else if(option === "with_params"){

            return new Promise(function (resolve, reject) {

                con.query(query, values, function (err, result, fields) {
                    if(err){
                        reject(err);
                    }else{
                        resolve(result)
                    }
                })

            })

        }

    }

    async function getCompletionValues(req, res){

        const random_number = req.params.key;

        try{

            //select all the courses
            const all_courses = await selectData('SELECT * FROM course_table', "all_row", [random_number]);

            //select all the entries earlier made by this user
            const result = await selectData('SELECT * FROM user_tb WHERE unique_id = ? ', "with_params", [random_number]);


            res.render('complete_registration', {csrfToken:req.csrfToken(), full_name:result[0].sur_name+' '+result[0].first_name+' '+result[0].last_name,courses:all_courses,random_number:random_number, passport:result[0].passport, form_no:2,error_remover:"removeError(this)",error_code:0,error_array:[], values:{academic_qual:"",comp_literate:"",description:"",image_data:"",amount_paid:"", balance:"", amount_charged:""}});

        }catch(err){
            console.log(err);
        }

    }

    async function getUserData_2(req, res){

        var returned_values = req.session.returned_values;

        try{

            //select all the courses
            const all_courses = await selectData('SELECT * FROM course_table', "all_row", []);

            //insert the new value inn the returned value
            returned_values["courses"] = all_courses;
            returned_values["csrfToken"] = req.csrfToken()

            const result = await selectData('SELECT * FROM user_tb WHERE unique_id = ? ', "with_params", [returned_values.random_number]);

            //insert the new value inn the returned value
            returned_values["passport"] = result[0].passport;
            res.render('complete_registration', returned_values);

        }catch(err){
            console.log(err);
        }

    }

    async function callMailSender(mailOptions){

        const mailer = await mailSender(mailOptions)
        return mailer;
    }

    function mailSender(mailOptions){

        return new Promise(function (resolve, reject) {

            const transporter = nodemailer.createTransport({
                host: 'mail.techocraft.com',
                port: 26,
                auth: {
                    user: 'info@techocraft.com',
                    pass: 'biggerguy123$'
                }
            });

            transporter.sendMail(mailOptions, function(error, info){
                //console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                if (error) {
                    reject(error);
                } else {
                    resolve("Mail was successfully Sent");
                }
            });

        })

    }

    //async function for complete registration
    async function registrationCompletionQuery(options){

        const courses = await selectData("SELECT * FROM course_table", "all_row", []);

        //select the user details
        const user_details = await selectData('SELECT * FROM user_tb WHERE unique_id = ? ', "with_params", [options.unique_id]);

        //const image_saver = await handleImage(options.file, options.unique_id, options.image_path);
        const image_saver = await uploadImage(options.file,options.unique_id, options.image_path);

        return {courses:courses, image_saver:image_saver,user_details:user_details};

    }

    //mail body to be sent to users
    function mail_body(fullname,unique_id,theDate,title){

        message = "";
        message += '<div style="max-width: 700px; margin-left: auto; margin-right: auto;"><div style="width:100%; height:150px;"><div style="width: 100%; height: 20px; background: #571600;"></div><div style="width:100px; margin-right: auto; margin-left: auto;"><img src="http://henmechng.com/images/logo_2.jpeg" style="width: 100%; height: 100%; margin-top: 50px;"></div></div><div style="padding-left:10px; font-family:Helvetica, Arial, sans-serif; width:100%; margin-right: auto; margin-left: auto; margin-top: 20px;"><h2 style="text-align: center;">'+title+'</h2><p>You have successfully registered for IT Professional Training with Techo Craft ICT Academy. Below are your details. You will be getting a 50% discount on courses choosen. Please present this mail when you visit our office in Enugu.</p><p><strong>Full Name: </strong><span>'+fullname+'</span></p><p><strong>Unique ID: </strong><span>'+unique_id+'</span></p><p><strong>Date of regitration: </strong><span>'+theDate+'</span></p></div><div style="font-family:Helvetica, Arial, sans-serif; padding-left:10px; width:100%; height: 150px; background: #571600;"><div style="padding-top:30px; text-align: center; width: 50px; margin-left: auto;margin-right: auto; "><img src="http://henmechng.com/images/Phone-Icon.png" style="width:100%;" ></div><div style="color:white; text-align: center; ">08098862800&nbsp;&nbsp;07051162050<br>info@techocaft.com</div></div></div>';

        return message;

    }

    //process the students course only
    async function register_courses(req, res){

        const random_number = req.body.random_number;
        const amount_paid = req.body.amount_paid;
        const amount_charged = req.body.amount_charged;
        const courses = req.body.courses;
        const checker = req.body.checker;
        //const balance = parseFloat(amount_charged) - parseFloat(amount_paid);

        //declare the error handlers
        var error_array = {}; error_code = 0;

        var posts = [amount_paid, amount_charged];

        var fields = ["Amount Paid", "Amount Paid"];

        var classes = ['amount_paid', 'amount_charged'];

        //validate the datas
        for(var i = 0; i < posts.length; i++){

            if(!validateData(posts[i], 'all')){
                error_array[classes[i]] = fields[i]+" is required!";
                error_code = 1;
            }

        }

        var numbers = [amount_charged, amount_paid];
        var field_name = ["Amount Charged", "Amount Paid"];
        var class_names = ['amount_charged', 'amount_paid'];

        //validate the numbers
        for(var i = 0; i < posts.length; i++){

            if(numbers[i] !== ""){
                if(isNaN(numbers[i])){
                    error_array[class_names[i]] = field_name[i]+" must be a number!";
                    error_code = 1;
                }
            }

        }

        if(amount_paid > amount_charged){
            error_array['amount_paid'] = "Amount entered is higher than the amount charged.";
            error_code = 1;
        }

        //calculate the balanceto be paid by the student in case of incomplete payment
        const balance = parseFloat(amount_charged) - parseFloat(amount_paid);

        //check if the courses was choosen
        if (!('courses' in req.body)){
            error_array['courses'] = "Please select a course you would like to do!";
            error_code = 1;
        }

        if(('courses' in req.body) && Array.isArray(req.body.courses)){
            if(req.body.courses.length > 1){
                error_array['courses'] = "You can only select one course at a Time!";
                error_code = 1;
            }
        }

        //check if the checker button was marked
        if (!('checker' in req.body)){
            error_array['checker'] = "Please Thick the Check Box!";
            error_code = 1;
        }

        //gett the date for today
        //var theDate = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        var theDate = the_module.main_moduler.dateNowNow()

        try{
            //select from the course table
            const results = await selectData('SELECT * FROM course_table', 'all_row', '');

            //select the user details
            const user_details = await selectData('SELECT * FROM user_tb WHERE unique_id = ? ', "with_params", [random_number]);

            //arrange the values to be returned to display
            const return_to_display = {user_details:user_details[0], courses:results,random_number:random_number,form_no:2, error_remover:"removeError(this)",error_code:0,error_array:error_array,values:{amount_paid:amount_paid, amount_charged:amount_charged}};

            //check if the error code deduced to 1
            if(error_code == 1){

                return_to_display['error_code'] = 1
                return_to_display['error_array'] = error_array;

                req.session.returned_values = return_to_display;

                res.redirect('/course_registration/'+random_number);
                return;

            }

            //if the values did fail the validation, then we upload to server
            //insert the values into the table
            var course_lenght = courses.length;
            var sucChecker = 0;
            //var values = [];

            //for(var i = 0; i < courses.length; i++){

                try{
                    var enrollment_id = await createRandomNumber(req, res,'SELECT * FROM enrolled_courses WHERE enrollment_id = ? ');

                    var payment_id = await createRandomNumber(req, res,'SELECT * FROM payments WHERE payment_id = ? ');

                }catch (e){
                    console.log(e);
                }

                const  status = "in_progress";

                //state the value and sql statements
                var sql = "INSERT INTO enrolled_courses (enrollment_id, course_id, student_id, reg_date,amount, amount_paid, balance, status, type_of) VALUES ?";
                const values = [[enrollment_id, courses, random_number, theDate, amount_charged, amount_paid, balance, status, 'training']];

            //}

            //insert the values into the database
            const insert_data = await insert(sql, values);

            //assign payment status
            var payment_status = "not_completed";
            if(balance == 0){
                payment_status = "completed";
            }

            //insert values into the payment table
            var sqls = "INSERT INTO payments (payment_id, enrollment_id, course_id, student_id, amount_charged, amount_paid, balance, date_of_payment, payment_status) VALUES ?";
            const valuess = [[payment_id, enrollment_id, courses, random_number, amount_charged, amount_paid, balance, theDate, payment_status]];

            //insert the values into the database
            const insert_paymment_data = await insert(sqls, valuess);

            const course_details = await selectData('SELECT * FROM course_table WHERE course_id = ? ', "with_params", [courses]);

            const registered_course = await selectData('SELECT * FROM enrolled_courses WHERE enrollment_id = ? ', "with_params", [enrollment_id]);

            req.session.returned_values = {title:"success", success_message:"Your registration was successful, a mail was sent to your email. Please visit your email to get for more information!",random_number:random_number, user_details:user_details[0], course_details:course_details[0], registered_course:registered_course[0]};

            res.redirect('/success/'+random_number+'/'+courses+'/'+enrollment_id);
            return;

        }catch (e){
            console.log(e);
        }

    }


    async function completeRegister(req,res) {

        const body = req.body;

        const academic_qualification = body.academic_qual;
        const comp_literacy_option = body.comp_literate;
        const description = body.description;
        const courses = body.courses;
        const random_number = body.random_number;
        const full_name = body.full_name;
        const amount_paid = body.amount_paid;
        const amount_charged = body.amount_charged;

        //declare the error handlers
        var error_array = {}; error_code = 0;


        var posts = [academic_qualification, comp_literacy_option, amount_paid, amount_charged];

        var fields = ["Academic Qualification", "Literacy option", "Amount Paid","amount_charged"];

        var classes = ['academic_qual', 'comp_literate', 'amount_paid', 'amount_charged'];

        //validate the datas
        for(var i = 0; i < posts.length; i++){

            if(!validateData(posts[i], 'all')){
                error_array[classes[i]] = fields[i]+" is required!";
                error_code = 1;
            }

        }

        var numbers = [amount_charged, amount_paid];
        var field_name = ["Amount Charged", "Amount Paid"];
        var class_names = ['amount_charged', 'amount_paid'];
        //validate the numbers
        for(var i = 0; i < numbers.length; i++){

            if(numbers[i] !== ""){
                if(isNaN(numbers[i])){
                    error_array[class_names[i]] = field_name[i]+" must be a number!";
                    error_code = 1;
                }
            }

        }

        //calculate the balanceto be paid by the student in case of incomplete payment
        const balance = parseFloat(amount_charged) - parseFloat(amount_paid);

        //check if the courses was choosen
        if (!('courses' in body)){
            error_array['courses'] = "Please select a course you would like to do!";
            error_code = 1;
        }

        if(('courses' in req.body) && Array.isArray(req.body.courses)){
            if(req.body.courses.length > 1){
                error_array['courses'] = "You can only select one course at a Time!";
                error_code = 1;
            }
        }

        //check if the checker button was marked
        if (!('checker' in body)){
            error_array['checker'] = "Please Thick the Check Box!";
            error_code = 1;
        }

        //check for non selection of the select field
        var posts = [comp_literacy_option];

        var wrong = ['Are you computer Literate'];

        var corrections = ["Please specify your computer literacy status"];

        var classes = ["comp_literate"];

        for(var i = 0; i < posts.length; i++){

            if(wrong[i] == posts[i]){
                error_array[classes[i]] = corrections[i];
                error_code = 1;
            }

        }


        //gett the date for today
        //var theDate = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        var theDate = the_module.main_moduler.dateNowNow();

        try{

            const results = await selectData('SELECT * FROM course_table', 'all_row', '');

            //arrange the values to be returned to display
            const return_to_display = {full_name:full_name,courses:results,random_number:random_number,form_no:2, error_remover:"removeError(this)",error_code:0,error_array:error_array,values:{academic_qual:academic_qualification,comp_literate:comp_literacy_option,description:description, amount_paid:amount_paid, amount_charged:amount_charged}};

            //check if the error code deduced to 1
            if(error_code == 1){

                return_to_display['error_code'] = 1
                return_to_display['error_array'] = error_array;

                req.session.returned_values = return_to_display;

                res.redirect('/completion/'+random_number);
                return;

            }


            //complete the registration by updating the database with the details
            var sql = "UPDATE user_tb SET highest_academic_qualification = ? , computer_literacy = ? , additional_information = ? , date_created = ? , affirmation = ?  WHERE unique_id = ? ";

            const values_for_update = [academic_qualification, comp_literacy_option, description, theDate, body.checker, random_number];

            const result = await carryOutUpdate(sql, values_for_update);

            //insert the values into the table
            var course_lenght = courses.length;
            var sucChecker = 0;
            //var values = [];

            //for(var i = 0; i < courses.length; i++){

            try{
                var enrollment_id = await createRandomNumber(req, res,'SELECT * FROM user_tb WHERE unique_id = ? ');
            }catch (e){
                console.log(e);
            }

            const  status = "in_progress";

            //state the value and sql statements
            var sql = "INSERT INTO enrolled_courses (enrollment_id, course_id, student_id, reg_date,amount, amount_paid, balance, status, type_of) VALUES ?";

            const values = [[enrollment_id, courses, random_number, theDate, amount_charged, amount_paid, balance, status,'training']];

            //}

            //insert the values into the database
            const insert_data = await insert(sql, values);

            //assign payment status
            var payment_status = "not_completed";
            if(balance == 0){
                payment_status = "completed";
            }

            const payment_id = await createRandomNumberMain(req, res,'SELECT * FROM payments WHERE payment_id = ? ');

            //insert values into the payment table
            var sqls = "INSERT INTO payments (payment_id, enrollment_id, course_id, student_id, amount_charged, amount_paid, balance, date_of_payment, payment_status) VALUES ?";
            const valuess = [[payment_id, enrollment_id, courses, random_number, amount_charged, amount_paid, balance, theDate, payment_status]];

            //insert the values into the database
            const insert_paymment_data = await insert(sqls, valuess);

            //get the user email
            const user_details = await selectData('SELECT * FROM user_tb WHERE unique_id = ? ', "with_params", [random_number]);

            //send a mail to the user
            /*var mailOptions = {
                from: 'info@techocraft.com',
                to: user_details[0].email,
                subject: 'Successful Registration for IT Program(s) Training',
                html: mail_body(full_name,random_number,theDate,"Successful Registration")
            };*/

            //send the mail
            //const mailer = await mailSender(mailOptions);

            //select the registered courses
            const course_details = await selectData('SELECT * FROM course_table WHERE course_id = ? ', "with_params", [courses]);

            //get the registeration details for the just registered course
            const registered_course = await selectData('SELECT * FROM enrolled_courses WHERE enrollment_id = ? ', "with_params", [enrollment_id]);

            req.session.returned_values = {title:"success", success_message:"Your registration was successful, a mail was sent to your email. Please visit your email to get for more information!",random_number:random_number, user_details:user_details[0], course_details:course_details[0], registered_course:registered_course[0]};

            res.redirect('/success/'+random_number+'/'+courses+'/'+enrollment_id);
            return;


        }catch(err){

            console.log(err);

        }


    }

    async function getCourses() {
        const courses = await selectData("SELECT * FROM course_table", "all_row", []);
        return courses;
    }

    async function register(req,res){

        const body = req.body;

        const random_number = body.random_number;
        const selected_state = body.selected_state;
        const local_government = body.local_government;
        const gender = body.gender;
        const contact_address = body.contact_address;
        const phone_number = body.phone_number;
        const email_address = body.email_address;
        const middle_name = body.middle_name;
        const first_name = body.first_name
        const sur_name = body.sur_name;
        const nationality = body.nationality;

        var posts = [random_number, contact_address, phone_number, email_address, middle_name, first_name, sur_name];

        var fields = ["Random Number", "Contact Address", "Phone Number", "Email Address", "Middle Name", "First Name", "Sur Name"];

        var classes = ['random_number', 'contact_address', 'phone_number', 'email_address', 'middle_name', 'first_name', 'sur_name'];

        var error_array = {}; error_code = 0;

        //validate the datas
        for(var i = 0; i < posts.length; i++){

            if(!validateData(posts[i], 'all')){
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

        const return_to_display = {title:"index",states:getState(), getSelectedState:"getSelectedState(this)", csrfToken:req.csrfToken(),error_remover:"removeError(this)",country:getCountries(),random_number:random_number, form_no:1, values:{selected_state_value:selected_state, local_government_value:local_government, gender_value:gender, contact_address_value:contact_address, phone_number_value:phone_number, email_address_value:email_address, middle_name_value:middle_name, first_name_value:first_name, sur_name_value:sur_name,nationality_value:nationality,local_government_list:getLocalGovernment(selected_state)}};

        //check if email is a correct email address
        if(!validateData(email_address, "email")){

            error_array['email_address'] = "Please enter a valid email address!";
            error_code = 1;

        }//console.log(phone_number)

        //check if the phone number is a number
        if(!validateData(phone_number, "phone")){
            error_array['phone_number'] = "Only Number is required!";
            error_code = 1;
        }

        //if there is an empty value
        if(error_code == 1){

            return_to_display['error_code'] = 1
            return_to_display['error_array'] = error_array;

            req.session.returned_values = return_to_display;

            res.redirect('/home');
            return;
        }

        if(req.cookies[random_number] === undefined){

            //ccheck for unique email address
            const unique_email_checker = await selectData('SELECT * FROM user_tb WHERE email = ? ', "with_params", [email_address]);

            if(unique_email_checker.length > 0){

                return_to_display['error_code'] = 2;

                error_array['general_error'] = 'Email Address already exist!';

                return_to_display['error_array'] = error_array;

                req.session.returned_values = return_to_display;

                res.redirect('/home');
                return;
            }

            var sql = "INSERT INTO user_tb (unique_id, email, phone, sur_name, first_name, last_name, gender, address, local_government, state, country) VALUES ?";
            var values = [
                [random_number, email_address, phone_number, sur_name, first_name, middle_name, gender, contact_address, local_government, selected_state, nationality],
            ];

            //insert the values into the table
            const inserter = await insert(sql, values);

            req.session.returned_values = {title:"index", csrfToken:req.csrfToken(), random_number:random_number,form_no:2,error_remover:"removeError(this)",error_code:0,full_name:sur_name+" "+first_name,error_array:[],values:{academic_qual:"",comp_literate:"",description:"",image_data:""}}

            //redirect to the new page
            res.redirect('/completion/'+random_number);

        }


    }

    async function renderSuccess(req, res){

        const course_details = await selectData('SELECT * FROM course_table WHERE course_id = ? ', "with_params", [req.params.course_id]);

        const user_details = await selectData('SELECT * FROM user_tb WHERE unique_id = ? ', "with_params", [req.params.unique_id]);

        const registered_course = await selectData('SELECT * FROM enrolled_courses WHERE enrollment_id = ? ', "with_params", [req.params.course_reg_id]);

        //req.session.returned_values

         const returned_values = {title:"success", success_message:"Your registration was successful, a mail was sent to your email. Please visit your email to get for more information!",random_number:req.params.unique_id, user_details:user_details[0], course_details:course_details[0], registered_course:registered_course[0]};


        res.render('success', returned_values);

    }

    function validateData(post, field){

        if(field === "email" && post !== ""){
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(post);
        }

        if(field === "phone" && post !== ""){
            if(!isNaN(post)){
                return true;
            }
        }

        if(field === "all" && post !== ""){
            return true;
        }

        return false;

    }

    function getMonth() {
        $datam = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    }

    function getCountries(){
        const country = ['Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei Darussalam','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo','Costa Rica','C?te dIvoire','Croatia','Cuba','Cyprus','Czech Republic','Democratic Peoples Republic of Korea North Korea','Democratic Republic of the Cong','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kuwait','Kyrgyzstan','Lao Peoples Democratic Republic Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Macedonia','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia Federated States','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','Norway','Oman','Pakistan','Palau','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Republic of Korea South Korea','Republic of Moldova','Romania','Russian Federation','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Swaziland','Sweden','Switzerland','Syrian Arab Republic','Tajikistan','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates','United Kingdom of Great Britain and Northern Ireland','United Republic of Tanzania','United States of America','Uruguay','Uzbekistan','Vanuatu','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'];

        return country;
    }

    function getState() {
        return ['Abia','Adamawa','Akwaibom','Anambra','Bauchi','Bayelsa','Benue','Borno','CrossRiver','Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa','Kaduna','Kano','Kastina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara','Abuja','Other'];

    }

    function getLocalGovernment($state){

        if($state=='Abia'){
            var location1 = ['Aba North','Aba South','Arochukwu','Bende','Ikwuano','Isiala Ngwa North','Isiala Ngwa South','Isiukwuato','Obi Ngwa','Ohafia','Osisioma Ngwa','Ugwunagbo','Ukwa East','Ukwa West','Umuahia North','Umuahia South','Umunneochi'];
        }else if($state=='Adamawa'){
            var location1 = ['Demsa','Fufore','Ganaye','Gireri','Gombi','Guyuk','Hong','Jada','Lamurde','Madagali','Maiha','Mayo-Belwa','Michika','Mubi North','Mubi South','Numan','Shelleng','Song','Toungo'];
        }else if($state=='Akwaibom'){
            var location1 = ['Abak','Eastern Obolo','Eket','Esit Eket','Essien Udim','Etim Ekpo','Etinan','Ibeno','Ibesikpo Asutan','Ibiono Ibom','Ika','Ikono','Ikot Abasi','Ikot Ekpene','Ini','Itu','Mbo','Mkpat Enin','Nsit Atai','Nsit Ibom','Nsit Ubium','Obot Akara','Okobo','Onna','Oron','Oruk Anam','Udung Uko','Ukanafun','Uruan','Urue-Offong/Oruko','Uyo'];
        }else if($state=='Anambra'){
            var location1 = ['Anambra East','Anambra West','Anaocha','Awka North','Ayamelum','Dunukofia','Ekwusigo','Idemili North','Idemili south','Ihiala','Njikoka','Nnewi North','Nnewi South','Ogbaru','Onitsha North','Onitsha South','Orumba North','Orumba South','Oyi'];
        }else if($state=='Bauchi'){
            var location1 = ['Alkaleri','Bauchi','Bogoro','Damban','Darazo','Dass','Ganjuwa','Giade','Itas/Gadau','Jama’are','Katagum','Kirfi','Misau','Ningi','Shira','Tafawa-Balewa','Toro','Warji','Zaki'];
        }else if($state=='Bayelsa'){
            var location1 = ['Brass','Ekeremor','Kolokuma/Opokuma','Nembe','Ogbia','Sagbama','Southern Jaw','Yenegoa'];
        }else if($state=='Benue'){
            var location1 = ['Ado','Agatu','Apa','Buruku','Gboko','Guma','Gwer East','Gwer West','Katsina-Ala','Konshisha','Kwande','Logo','Makurdi','Obi','Ogbadibo','Oju','Okpokwu','Ohimini','Oturkpo','Tarka','Ukum','Ushongo','Vandeikya'];
        }else if($state=='Borno'){
            var location1 = ['Askira/Uba','Bama','Bayo','Biu','Chibok','Damboa','Dikwa','Gubio','Guzamala','Gwoza','Hawul','Jere','Kaga','Kala/Balge','Konduga','Kukawa','Kwaya Kusar','Mafa','Magumeri','Maiduguri','Marte','Mobbar','Monguno','Ngala','Nganzai','Shani'];
        }else if($state=='CrossRiver'){
            var location1 = ['Akpabuyo','Odukpani','Akamkpa','Biase','Abi','Ikom','Yarkur','Odubra','Boki','Ogoja','Yala','Obanliku','Obudu','Calabar South','Etung','Bekwara','Bakassi','Calabar Municipality'];
        }else if($state=='Delta'){
            var location1 = ['Oshimili','Aniocha','Aniocha South','Ika South','Ika North-East','Ndokwa West','Ndokwa East','Isoko south','Isoko North','Bomadi','Burutu','Ughelli South','Ughelli North','Ethiope West','Ethiope East','Sapele','Okpe','Warri North','Warri South','Uvwie','Udu','Warri Central','Ukwani','Oshimili North','Patani'];
        }else if($state=='Ebonyi'){
            var location1 = ['Afikpo South','Afikpo North','Onicha','Ohaozara','Abakaliki','Ishielu','lkwo','Ezza','Ezza South','Ohaukwu','Ebonyi','Ivo'];
        }else if($state=='Edo'){
            var location1 = ['Esan North-East','Esan Central','Esan West','Egor','Ukpoba','Central','Etsako Central','Igueben','Oredo','Ovia SouthWest','Ovia South-East','Orhionwon','Uhunmwonde','Etsako East','Esan South-East'];
        }else if($state=='Ekiti'){
            var location1 = ['Ado','Ekiti-East','Ekiti-West','Emure/Ise/Orun','Ekiti South-West','Ikare','Irepodun','Ijero','Ido/Osi','Oye','Ikole','Moba','Gbonyin','Efon','Ise/Orun','Ilejemeje'];
        }else if($state=='Enugu'){
            var location1 = ['Enugu South','Igbo-Eze South','Enugu North','Nkanu','Udi','Agwu','Oji-River','Ezeagu','IgboEze North','Isi-Uzo','Nsukka','Igbo-Ekiti','Uzo-Uwani','Enugu East','Aninri','Nkanu East','Udenu'];
        }else if($state=='Gombe'){
            var location1 = ['Akko','Balanga','Billiri','Dukku','Kaltungo','Kwami','Shomgom','Funakaye','Gombe','Nafada/Bajoga','Yamaltu/Delta'];
        }else if($state=='Imo'){
            var location1 = ['Aboh-Mbaise','Ahiazu-Mbaise','Ehime-Mbano','Ezinihitte','Ideato North','Ideato South','Ihitte/Uboma','Ikeduru','Isiala Mbano','Isu','Mbaitoli','Mbaitoli','Ngor-Okpala','Njaba','Nwangele','Nkwerre','Obowo','Oguta','Ohaji/Egbema','Okigwe','Orlu','Orsu','Oru East','Oru West','Owerri-Municipal','Owerri North','Owerri West'];
        }else if($state=='Jigawa'){
            var location1 = ['Aujara','Auyo','Babura','Birnin Kudu','Birniwa','Buji','Dutse','Gagarawa','Garki','Gumel','Guri','Gwaram','Gwiwa','Hadejia','kafin Hausa','Jahun','kafin Hausa','Kaugama Kazaure','Kiri Kasamma','Kiyawa','Maigatari','Malam Madori','Miga','Ringim','Roni','Sule-Tankarkar','Taura','Yankwashi'];
        }else if($state=='Kaduna'){
            var location1 = ['Birni-Gwari','Chikun','Giwa','Igabi','Ikara','jaba','Jemaa','Kachia','Kaduna North','Kaduna South','Kagarko','Kajuru','Kaura','Kauru','Kubau','Kudan','Lere','Makarfi','Sabon-Gari','Sanga','Soba','Zango-Kataf','Zaria'];
        }else if($state=='Kano'){
            var location1 = ['Ajingi','Albasu','Bagwai','Bebeji','Bichi','Bunkure','Dala','Dambatta','Dawakin Kudu','Dawakin Tofa','Doguwa','Fagge','Gabasawa','Garko','Garum','Mallam','Gaya','Gezawa','Gwale','Gwarzo','Kabo','Kano Municipal','Karaye','Kibiya','Kiru','kumbotso','Kunchi','Kura','Madobi','Makoda','Minjibir','Nasarawa','Rano','Rimin Gado','Rogo','Shanono','Sumaila','Takali','Tarauni','Tofa','Tsanyawa','Tudun Wada','Ungogo','Warawa','Wudil'];
        }else if($state=='Kastina'){
            var location1 = ['Bakori','Batagarawa','Batsari','Baure','Bindawa','Charanchi','Dandume','Danja','Dan Musa','Daura','Dutsi','Dutsin-Ma','Faskari','Funtua','Ingawa','Jibia','Kafur','Kaita','Kankara','Kankia','Katsina','Kurfi','Kusada','MaiAdua','Malumfashi','Mani','Mashi','Matazuu','Musawa','Rimi','Sabuwa','Safana','Sandamu','Zango'];
        }else if($state=='Kebbi'){
            var location1 = ['Aleiro','Arewa-Dandi','Argungu','Augie','Bagudo','Birnin Kebbi','Bunza','Dandi','Fakai','Gwandu','Jega','Kalgo','Koko/Besse','Maiyama','Ngaski','Sakaba','Shanga','Suru','Wasagu/Danko','Yauri','Zuru'];
        }else if($state=='Kogi'){
            var location1 = ['Adavi','Ajaokuta','Ankpa','Bassa','Dekina','Ibaji','Idah','Igalamela-Odolu','Ijumu','Kabba/Bunu','Kogi','Lokoja','Mopa-Muro','Ofu','Ogori/Mangongo','Okehi','Okene','Olamabolo','Omala','Yagba East','Yagba West'];
        }else if($state=='Kwara'){
            var location1 = ['Asa','Baruten','Edu','Ekiti','Ifelodun','Ilorin East','Ilorin West','Irepodun','Isin','Kaiama','Moro','Offa','Oke-Ero','Oyun','Pategi'];
        }else if($state=='Lagos'){
            var location1 = ['Agege','Ajeromi-Ifelodun','Alimosho','Amuwo-Odofin','Apapa','Badagry','Epe','Eti-Osa','Ibeju/Lekki','Ifako-Ijaye','Ikeja','Ikorodu','Kosofe','Lagos Island','Lagos Mainland','Mushin','Ojo','Oshodi-Isolo','Shomolu','Surulere'];
        }else if($state=='Nasarawa'){
            var location1 = ['Akwanga','Awe','Doma','Karu','Keana','Keffi','Kokona','Lafia','Nasarawa','Nasarawa-Eggon','Obi','Toto','Wamba'];
        }else if($state=='Niger'){
            var location1 = ['Agaie','Agwara','Bida','Borgu','Bosso','Chanchaga','Edati','Gbako','Gurara','Katcha','Kontagora','Lapai','Lavun','Magama','Mariga','Mashegu','Mokwa','Muya','Pailoro','Rafi','Rijau','Shiroro','Suleja','Tafa','Wushishi'];
        }else if($state=='Ogun'){
            var location1 = ['Abeokuta North','Abeokuta South','Ado-Odo/Ota','Egbado North','Egbado South','Ewekoro','Ifo','Ijebu East','Ijebu North','Ijebu North East','Ijebu Ode','Ikenne','Imeko-Afon','Ipokia','Obafemi-Owode','Ogun Waterside','Odeda','Odogbolu','Remo North','Shagamu'];
        }else if($state=='Ondo'){
            var location1 = ['Akoko North East','Akoko North West','Akoko South Akure East','Akoko South West','Akure North','Akure South','Ese-Odo','Idanre','Ifedore','Ilaje','Ile-Oluji','Okeigbo','Irele','Odigbo','Okitipupa','Ondo East','Ondo West','Ose','Owo'];
        }else if($state=='Osun'){
            var location1 = ['Aiyedade','Aiyedire','Atakumosa East','Atakumosa West','Boluwaduro','Boripe','Ede North','Ede South','Egbedore','Ejigbo','Ife Central','Ife East','Ife North','Ife South','Ifedayo','Ifelodun','Ila','Ilesha East','Ilesha West','Irepodun','Irewole','Isokan','Iwo','Obokun','Odo-Otin','Ola-Oluwa','Olorunda','Oriade','Orolu','Osogbo'];
        }else if($state=='Oyo'){
            var location1 = ['Afijio','Akinyele','Atiba','Atigbo','Egbeda','IbadanCentral','Ibadan North','Ibadan North West','Ibadan South East','Ibadan South West','Ibarapa Central','Ibarapa East','Ibarapa North','Ido','Irepo','Iseyin','Itesiwaju','Iwajowa','Kajola','Lagelu Ogbomosho North','Ogbmosho South','Ogo Oluwa','Oluyole','Ona-Ara','Orelope','Ori Ire','Oyo East','Oyo West','Saki East','Saki West','Surulere'];
        }else if($state=='Plateau'){
            var location1 = ['Barikin Ladi','Bassa','Bokkos','Jos East','Jos North','Jos South','Kanam','Kanke','Langtang North','Langtang South','Mangu','Mikang','Pankshin','Quaan Pan','Riyom','Shendam','Wase'];
        }else if($state=='Rivers'){
            var location1 = ['Abua/Odual','Ahoada East','Ahoada West','Akuku Toru','Andoni','Asari-Toru','Bonny','Degema','Emohua','Eleme','Etche','Gokana','Ikwerre','Khana','Obia/Akpor','Ogba/Egbema/Ndoni','Ogu/Bolo','Okrika','Omumma','Opobo/Nkoro','Oyigbo','Port-Harcourt','Tai'];
        }else if($state=='Sokoto'){
            var location1 = ['Binji','Bodinga','Dange-shnsi','Gada','Goronyo','Gudu','Gawabawa','Illela','Isa','Kware','kebbe','Rabah','Sabon birni','Shagari','Silame','Sokoto North','Sokoto South','Tambuwal','Tqngaza','Tureta','Wamako','Wurno','Yabo'];
        }else if($state=='Taraba'){
            var location1 = ['Ardo-kola','Bali','Donga','Gashaka','Cassol','Ibi','Jalingo','Karin-Lamido','Kurmi','Lau','Sardauna','Takum','Ussa','Wukari','Yorro','Zing'];
        }else if($state=='Yobe'){
            var location1 = ['Bade','Bursari','Damaturu','Fika','Fune','Geidam','Gujba','Gulani','Jakusko','Karasuwa','Karawa','Machina','Nangere','Nguru Potiskum','Tarmua','Yunusari','Yusufari'];
        }else if($state=='Zamfara'){
            var location1 = ['Anka','Bakura','Birnin Magaji','Bukkuyum','Bungudu','Gummi','Gusau','Kaura','Namoda','Maradun','Maru','Shinkafi','Talata Mafara','Tsafe','Zurmi'];
        }else if($state=='Abuja'){
            var location1 = ['Gwagwalada','Kuje','Abaji','Abuja Municipal','Bwari','Kwali'];
        }else{var location1 = ['others'];}

        return location1;

    }

    //get the datas from the data base
    function createFormSecondPhase() {

        con.connect(function(err) {
            if (err) throw err;
            con.query("SELECT * FROM user_tb", function (err, result, fields) {
                if (err) throw err;
                //console.log(result);
            });
        });

    }

    //function that creates a blob image
    function b64toBlob(b64Data, contentType, sliceSize) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;

        var byteCharacters = atob(b64Data);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        var blob = new Blob(byteArrays, {type: contentType});
        return blob;
    }

    //chck if a value is a n array
    function checkIfInArray(theValue, theArray){

        return jQuery.inArray(theValue, theArray);


    }

//return array keys
    function getArrayKey(mainArray, theValue){

        return mainArray.indexOf(theValue);

    }

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function picker(){

        const randpicker = Math.floor((Math.random() * 100) + 1);
        const pickerbox = ['RCA13','RCB12','RCC23','RCD43','RCE34','RCF56','RCG23','RCH34','RCI17','RCJ23','RCK34','RCL54','RCM56','RCN23','RCO34','RCP56','RCQ34','RCR32','RCS32','RCT34','RCU12','RCV43','RCW12','RCX34','RCY23','RCZ65','RTA76','RTB34','RTH45','RTC54','RTD65','RTE78','RTF67','RTG54','RTH34','RTI34','RTJ67','RTK12','RTL54','RTM76','RTN34','RTO87','RTP67','RTQ65','RTR34','RTS65','RTT67','RTU98','RTV78','RTW34','RTX64','RTY54','RTZ32','RPA43','RPB45','RPC34','RPD32','RPD56','RPE89','RPF87','RPG76','RPH23','RPI78','RPJ54','RPK45','RPL90','RPM43','RPN43','RPO56','RPP67','RPQ78','RPR43','RPS76','RPT34','RPU45','RPV67','RPW78','RPX56','RPY67','RPZ34','RRR09','REA90','REB56','REC54','RED67','REE78','REF54','REG','REH56','REI56','REJ34','REK87','REL56','REM54','REN45','REO43','REP78','REQ67','RER43','RES45','RET34','REU34','REV65','REW56','REX56','REY78','REZ43','RDA65','RDB67','RDC34','RDD23','RDE87',"RAA87","RBH54","RHJ65","RKK45","RWH43","RBB45","RFC67","RGC54","RHC90","RJC43","RKC67","TLC34","TZC54","TXC34","TCC34","TVC67","TBC54","TNC54","TDO56","TDT67","TTT45","TAG54","TAH34","TAS54","TAR45","TAC78","TAT67","TAZ34","TSY54","TSB54","TZX78","TQO65","TAP45"];
        const shuff = pickerbox[randpicker];

        const unique_id = uuidv4();
        const unique_id_len = unique_id.length;
        $main = shuff + unique_id.substr(1,unique_id_len/2);
        return $main;

    }

    //function that checks email availabilty
    function checkEmailAvailabilty(req, res){

        res.render('home', {error_code:0, error_remover:'removeError(this)'});

    }

    async function email_checker(req, res){

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
            if(!validateData(email, "email")){

                error_array['email_address'] = "Please supply a valid email address!";
                error_code = 1;

            }
        }

        //if there is an empty value
        if(error_code == 1){

            return_to_display['error_code'] = 1
            return_to_display['error_array'] = error_array;

            req.session.returned_values = return_to_display;

            res.redirect('/');
            return;
        }

        try{
            //if the validation is not failed we check the email against wha is in the database
            const user_details = await selectData('SELECT * FROM user_tb WHERE email = ? ', "with_params", [email]);

            if(user_details.length == 0){
                res.redirect('/home');
            }


            if(user_details.length == 1){
                const unique_id = user_details[0].unique_id
                res.redirect('/course_registration/'+unique_id);
            }


        }catch(e){
            console.log(e);
        }


    }

    //handles the course reg only option
    async function course_registration(req, res){

        //see courses to register, see
        try{

            //get the unique_id of the user
            const unique_id = req.params.key

            //select all the courses in db
            const courses = await selectData("SELECT * FROM course_table",  "all_row", [unique_id]);

            const user_details = await selectData('SELECT * FROM user_tb WHERE unique_id = ? ', "with_params", [unique_id]);

            if(user_details.length == 0){
                res.redirect('/');
            }


            if(user_details.length == 1){

                res.render('course_registration', {user_details:user_details[0], courses:courses, error_code:0, error:'', error_remover:'removeError(this)', random_number:user_details[0].unique_id, values:{amount_paid:'', amount_charged:''}});

            }

        }catch(e){
            console.log(e);
        }
    }

    //create a unique id
    function createUniqueFileName(extension){

        const theNewName = picker();

        if (fs.existsSync(__dirname+'/public/images/passport'+theNewName+'.'+extension)) {
            createUniqueFileName(extension);
        }else{
            return theNewName;
        }

    }

    function carryOutUpdate(query, values){

        return new Promise(function (resolve, reject) {

            con.query(query, values, function (err, result, fields) {
                if(err){
                    reject(err);
                }else{
                    resolve(result)
                }
            })

        })

    }

    function fileMover(theFile, theFullNewName, theNewName){

        return new Promise(function (resolve, reject) {

            theFile.mv(__dirname+'/public/images/passport/'+theFullNewName, function(err) {
                if (err)
                    return {error_code:1, error:err, success:{}};

                if(err){
                    reject(err);
                }else{
                    resolve(theFullNewName);
                }

            });



        })

    }

    async function uploadPassport(req, res) {

        if (Object.keys(req.files).length == 0) {
            return res.status(400).send('No files were uploaded.');
        }

        //create and assign values to the variables that will hold the image
        let theUserId = req.body.user_id;
        let theFile = req.files.image;
        let theImageName = req.files.passport.name;
        let theImageSize = req.files.passport.size;
        let theImageType = req.files.passport.mimetype;

        //split the image type
        const extension = theImageType.split('/');

        //do some validations
        if(theImageSize > 3000000){

            return res.json({error_code:1, error:'Image size cannot exceed 3mb!!!', success:{}});

        }

        //delete the image if a session bearing the name is already in existence
        try{
            const old_image_name = await selectData('SELECT * FROM user_tb WHERE unique_id = ? ', "with_params", [theUserId]);

            if (old_image_name[0].passport !== null) {

                try {

                    fs.unlinkSync(__dirname+'/public/images/passport/'+old_image_name[0].passport);
                    //file removed
                } catch(err) {

                    return res.json({error_code:1, error:err, success:{}})
                }
            }
        }catch(err){
            console.log(err);
            return;
        }


        //create an array of the mimetypes needed
        let required_image = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];

        //check if the mimeType rhymes with the

        if(!required_image.includes(theImageType)){

            return res.json({error_code:1, error:'Please Upload an image!!!', success:{}});

        }

        //give the file a new name
        let theNewName = createUniqueFileName(extension[1]);

        //__dirname process the image and save the image to the folder where you want it to be
        // Use the mv() method to place the file somewhere on your serve

        try {
            const theFullNewName = await fileMover(theFile, theNewName+'.'+extension[1], theNewName);

            var sql = "UPDATE user_tb SET passport = ? WHERE unique_id = ? ";
            var values = [theFullNewName, theUserId];
            var final = await carryOutUpdate(sql, values);

            return res.json({error_code:0, error:'', success:{'message':'File uploaded!', image_url:theFullNewName}});

        }catch (e){
            console.log(e);
            return;
            //res.json({error_code:1, error:e, success:{}});
        }
    }

    function formatMoney(number, decPlaces, decSep, thouSep) {
        decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces,
            decSep = typeof decSep === "undefined" ? "." : decSep;
        thouSep = typeof thouSep === "undefined" ? "," : thouSep;
        var sign = number < 0 ? "-" : "";
        var i = String(parseInt(number = Math.abs(Number(number) || 0).toFixed(decPlaces)));
        var j = (j = i.length) > 3 ? j % 3 : 0;

        return sign +
            (j ? i.substr(0, j) + thouSep : "") +
            i.substr(j).replace(/(\decSep{3})(?=\decSep)/g, "$1" + thouSep) +
            (decPlaces ? decSep + Math.abs(number - i).toFixed(decPlaces).slice(2) : "");
    }

    return{
        validateData:validateData,
        carryOutUpdate:carryOutUpdate,
        getState:getState,
        getCountries:getCountries,
        getLocalGovernment:getLocalGovernment,
        register:register,
        createRandomNumber:createRandomNumber,
        callSelectData:callSelectData,
        completeRegister:completeRegister,
        uploadPassport:uploadPassport,
        getCompletionValues:getCompletionValues,
        getUserData_2:getUserData_2,
        checkEmailAvailabilty:checkEmailAvailabilty,
        email_checker:email_checker,
        course_registration:course_registration,
        register_courses:register_courses,
        renderSuccess:renderSuccess,
        formatMoney:formatMoney,
        selectData:selectData,
        insert:insert,
        createRandomNumberMain:createRandomNumberMain
    }

}();//id 	course_id 	course_name 	no_of_students_enrolled


module.exports.generics = generics;