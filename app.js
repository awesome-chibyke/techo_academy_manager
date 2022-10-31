var cookieParser = require('cookie-parser');

//csrf token
var csrf = require('csurf');

var express = require('express'); //import the express module

//file uploader
const fileUpload = require('express-fileupload');

//require the functions page
var modules = require("./modules");

//require the url
var url = require('url');

//require the admin functions page
var admin_modules = require("./admin_module");

//require the body-parser module
var bodyParser = require("body-parser");

// setup route middlewares
var csrfProtection = csrf({ cookie: true });

var app = express(); //create an express application

// default options
app.use(fileUpload());

//use cookie
app.use(cookieParser('euirg4t268tuyeg'));

//require session
var expressSession  = require('express-session');

//use session
app.use(expressSession({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

//use the post method for express to get the posted datas from the user side
var urlencodedParser = bodyParser.urlencoded({limit: '50mb', extended: true });

//set the folder for the templating files
//app.set('views', './views');

//make the public folder visible
//app.use("/public",express.static(__dirname + "/public"));
app.use( express.static( "public" ) );
app.use(express.static(__dirname + '/public'));


//set the templating engine
app.set('view engine', 'ejs');

app.get('/samico/:result', function (request, respond) {
    //var sent = request.params.result
    respond.send(request.params)
    console.log(request.params)
})

app.get('/getDatas', function (req, resp) {
    //select using async and await
    modules.generics.getData(req, resp);
})

app.get('/try', function (req, res) {
    res.render('trial');
})

app.get('/', function (req, res) {

    if(req.session.last_url !== undefined){
        let return_to_url = req.session.last_url;
        return res.redirect(return_to_url);
    }

    //var sent = request.params.result
    if(req.session.returned_values === undefined){

        modules.generics.checkEmailAvailabilty(req, res);


    }else{

        var returned_values = req.session.returned_values;
        delete req.session.returned_values;
        res.render('home', returned_values);

    }

});

app.get('/course_registration/:key', function (req, res) {

    //var sent = request.params.result
    if(req.session.returned_values === undefined){

        modules.generics.course_registration(req, res);


    }else{

        var returned_values = req.session.returned_values;
        delete req.session.returned_values;
        res.render('course_registration', returned_values);

    }

});

app.get('/completion/:key', csrfProtection, function (req, res) {

    //var sent = request.params.result
    if(req.session.returned_values === undefined){

        modules.generics.getCompletionValues(req, res);


    }else{

        modules.generics.getUserData_2(req, res);

    }

})

app.get('/home', csrfProtection, function (req, res) {

    if(req.session.returned_values === undefined){
        //get the states
        const states = modules.generics.getState();

        //get the country
        const country = modules.generics.getCountries();

        //create a random number
        const random_number = modules.generics.createRandomNumber(req, res, 'SELECT * FROM user_tb WHERE unique_id = ? ').then((result)=>{

            res.render('index', {title:"index",states:states, getSelectedState:"getSelectedState(this)",error_remover:"removeError(this)",country:country,random_number:result, form_no:1, error_code:0,error_array:[], csrfToken:req.csrfToken(), values:{selected_state_value:"", local_government_value:"", gender_value:"", contact_address_value:"", phone_number_value:"", email_address_value:"", middle_name_value:"", first_name_value:"", sur_name_value:"",nationality_value:""}});

        },(error)=>{
            console.log(error);
        })



    }else{

        var returned_values = req.session.returned_values;
        delete req.session.returned_values;
        res.render('index', returned_values);
    }

})

app.get('/success/:unique_id/:course_id/:course_reg_id', function (req, res) {

    if(req.session.returned_values === undefined){

        modules.generics.renderSuccess(req, res);

    }else{
        var returned_values = req.session.returned_values;
        delete req.session.returned_values;
        res.render('success', returned_values);
    }

});

app.get('/admin_success/:unique_id/:course_reg_id', function (req, res) {

    if(req.session.returned_values === undefined){

        admin_modules.admin_method.renderAdminSuccess(req, res);

    }else{
        var returned_values = req.session.returned_values;
        delete req.session.returned_values;
        res.render('admin_area/success', returned_values);
    }

});

app.get('/getLocalGovernment/:selected_state', function (req, res) {

    const state = req.params.selected_state
    const local_government = modules.generics.getLocalGovernment(state);

    res.send(local_government);
})

//Everytthg admin Get

//login req.session.returned_value
app.get('/admin_login/', csrfProtection, function (req, res) {

    let view_values = {error_code:0, error_array:{}, error_remover:'removeError(this)', themessage:''};

    if(req.session.returned_value === undefined){
        res.render('admin_area/login', {error_code:0, error_array:{}, error_remover:'removeError(this)', themessage:'', csrfToken:req.csrfToken()});
    }else{

        const returned_value = req.session.returned_value;
        delete req.session.returned_value;
        res.render('admin_area/login', returned_value);


    }



});

app.get('/admin_logout', csrfProtection, function (req, res) {

    res.clearCookie('admin_details', { path: '/' });
    delete req.session.validation_state;
    delete req.session.login_details;
    res.redirect('/admin_login');

});

//route for admin registration
app.get('/admin_register', csrfProtection, function (req, res) {

    if(req.session.return_admin === undefined){

        const options = {
            maxAge: 1000 * 60 * 15, // would expire after 15 minutes
            httpOnly: false, // The cookie only accessible by the web server
            signed: true // Indicates if the cookie should be signed
        }
        //res.cookie('ghdgdf', 'created');
        admin_modules.admin_method.showAdminRegister(req, res, req.csrfToken());

    }else{

        res.render('admin_area/signup', {error_code:0, error_array:{}, error_remover:'removeError(this)', full_name:'', email:'', csrfToken:req.csrfToken()})

    }

});

app.get('/dashboard', csrfProtection, function (req, res) {

    /*if(req.session.last_url !== undefined){
        let return_to_url = req.session.last_url;
        return res.redirect(return_to_url);
    }*/

    admin_modules.admin_method.showAdminDashboard(req, res);

});

app.get('/students', csrfProtection, function (req, res) {

    admin_modules.admin_method.showStudentEnrolled(req, res);

});

app.get('/enrolled_courses', csrfProtection, function (req, res) {

    admin_modules.admin_method.enrolled_courses(req, res);

});

app.get('/view_courses', csrfProtection, function (req, res) {

    admin_modules.admin_method.view_courses(req, res);

});

app.get('/incomes', csrfProtection, function (req, res) {

    admin_modules.admin_method.payments_displayer(req, res);

});

//go to add courses page
app.get('/go_to_add_courses', csrfProtection, function (req, res) {

    if(req.session.return_to_display === undefined){
        admin_modules.admin_method.goToAddCourses(req, res);
    }else{
        let return_to_view = req.session.return_to_display;
        delete return_to_view;
        res.render('admin_area/add_courses', return_to_view);
    }


});


app.get('/add_project_incomes', function (req, res) {

    //var sent = request.params.result
    if(req.session.returned_values === undefined){

        admin_modules.admin_method.checkProjectEmailAvailabilty(req, res);


    }else{

        var returned_values = req.session.returned_values;
        delete req.session.returned_values;
        res.render('home', returned_values);

    }

});

//check email availability for projrct addition
app.get('/add_project_incomes', csrfProtection, function (req, res) {

    admin_modules.admin_method.checkProjectEmailAvailabilty(req, res);

});

//check email availability for projrct addition
app.get('/add_project_first_page', csrfProtection, function (req, res) {


    if(req.session.returned_values === undefined){

        admin_modules.admin_method.add_project_first_page(req, res);


    }else{

        var returned_values = req.session.returned_values;
        delete req.session.returned_values;
        res.render('admin_area/add_project', returned_values);

    }

});

//render the second page for the project addition
app.get('/add_project_second_page/:key', csrfProtection, function (req, res) {

    if(req.session.returned_values === undefined){

        admin_modules.admin_method.add_project_second_page(req, res);


    }else{

        var returned_values = req.session.returned_values;
        delete req.session.returned_values;
        res.render('admin_area/add_project_2', returned_values);

    }

});

//Everthg Post

//route for admin registration form
app.post('/register_admin', urlencodedParser, csrfProtection, function(req, res){

    admin_modules.admin_method.processAdminRegistration(req, res);

});


app.post('/add_new_courses', urlencodedParser, csrfProtection, function(req, res){

    admin_modules.admin_method.add_new_courses(req, res);

});

//handle login form for the admin
app.post('/handle_login/', urlencodedParser, csrfProtection, function(req, res){

    admin_modules.admin_method.processAdminLogin(req, res);

});

app.post('/register_project', urlencodedParser, csrfProtection, function(req, res){
    admin_modules.admin_method.add_new_project(req, res);
});

//register product 2
app.post('/register_Project_2', urlencodedParser, csrfProtection, function(req, res){
    admin_modules.admin_method.register_Project_2(req, res);
});

//handle amount update
app.post('/update_payment/', urlencodedParser, function(req, res){

    admin_modules.admin_method.updatePayment(req, res);

});

app.post('/update_completion/', urlencodedParser, function(req, res){

    admin_modules.admin_method.update_completion(req, res);

});

//for checking the availability of a mail that willl be used for project reg
app.post('/check_project_availabity/', urlencodedParser, function(req, res){

    admin_modules.admin_method.project_email_checker(req, res);

});

//form submission
app.post('/check_availabity', urlencodedParser, function(req, res){
    modules.generics.email_checker(req, res);
});

//check fo remail existence
app.post('/register', urlencodedParser, csrfProtection, function(req, res){
    modules.generics.register(req, res);
});

//route for processing only the form for course registration
app.post('/register_courses', urlencodedParser, function(req, res){
    modules.generics.register_courses(req, res);
});

app.post('/imageUpload', urlencodedParser, function(req, res){

    modules.generics.uploadPassport(req, res);

});

app.post('/getIncomeDetailsBasedOnDateSelected', urlencodedParser, function(req, res){

    admin_modules.admin_method.getIncomeDetailsBasedOnDateSelected(req, res);

});


app.post('/register_2', urlencodedParser, function(req, res){
    //console.log(req.files);
    modules.generics.completeRegister(req, res);
});


/*console.log(req.cookies)

const options = {
    maxAge: 1000 * 60 * 15, // would expire after 15 minutes
    httpOnly: true, // The cookie only accessible by the web server
    signed: true // Indicates if the cookie should be signed
}

// Set cookie
res.cookie('cookieName', 'cookieValue', options) // options is optional
res.send('')*/

app.listen(8000);
console.log('listening to port 8000 with express');
