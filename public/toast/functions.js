//define the base_url
	var returnFunctions = function() {

        function capitalizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        //chck if a value is a n array
        function checkIfInArray(theValue, theArray){

            return jQuery.inArray(theValue, theArray);


        }

//return array keys
        function getArrayKey(mainArray, theValue){

            return mainArray.indexOf(theValue);

        }

		function getClassSubjectMethod(url){

			//split the url
			var splitted_url = url.split('/');

			//get the teacher_id from the splitted url
			var teacher_id = splitted_url[12];

			//get the value of the selected values
			var session = $(".session_select").val().trim();

			//check if the session is is equal to a particular value

			if(session === "Select Academic Year"){

				return {error_code:1, error:'Please select an option for Academic Year', data:[]}

			}else{

				//get the value of the term
				var term = $(".term_select").val().trim();

				if(term == "Select Term"){

					return {'error_code':1, error:'Please select an option for Term!', data:[]};

				}

				return {error_code:0, error:"", data:[{"teacher_id":teacher_id, "session":session, "term":term, "splitted_url":splitted_url}]}

			}


		}

		function performSwitch(base_url,page_name,url){

			var particular_class_id = $(".class_select").val().trim();
			var particular_subject_id = $(".subject_select").val().trim()
			var particular_school_year_id = $(".session_select").val().trim()
			var particular_term_id = $(".term_select").val().trim()
			var assigned_class_unique_id = $(".assigned_class_unique_id").val().trim()
			var teacher_id = $(".teacher_id_holder").val().trim();

			if(particular_subject_id === "Select Subject"){

				return {error_code:1, error:'Please select an option for Subject', data:[]}

			}

			if(particular_class_id === "Select Class"){

				return {error_code:1, error:'Please select an option for Class', data:[]}

			}

			//check if the url has a  view section and also a is pointing to view assessment page
			if(url.includes("view") && url.includes("view_assessment")){

                window.location.href = base_url +'central/'+page_name+'/'+assigned_class_unique_id+'/'+particular_subject_id+'/'+particular_term_id+'/'+particular_class_id+'/'+particular_school_year_id+'/'+particular_term_id+'/'+teacher_id+'/view/1';
                return;
            }

            //check if the url has a  view section and also a is pointing to view assessment page
            if(url.includes("edit") && url.includes("view_assessment")){

                window.location.href = base_url +'central/'+page_name+'/'+assigned_class_unique_id+'/'+particular_subject_id+'/'+particular_term_id+'/'+particular_class_id+'/'+particular_school_year_id+'/'+particular_term_id+'/'+teacher_id+'/edit/1';
                return;
            }

			window.location.href = base_url +'central/'+page_name+'/'+assigned_class_unique_id+'/'+particular_subject_id+'/'+particular_term_id+'/'+particular_class_id+'/'+particular_school_year_id+'/'+particular_term_id+'/'+teacher_id;

		}

		function printSelectedDiv({divId, title}) {
			let mywindow = window.open('', 'PRINT', 'height=650,width=900,top=100,left=150');

			mywindow.document.write(`<html><head><title>${title}</title>`);
			mywindow.document.write('</head><body >');
			mywindow.document.write(document.getElementById(divId).innerHTML);
			mywindow.document.write('</body></html>');

			mywindow.document.close(); // necessary for IE >= 10
			mywindow.focus(); // necessary for IE >= 10*/

			mywindow.print();
			mywindow.close();

			return true;
		}

        function showSuccessToaster(message, tooastType){

            if(tooastType == "warning"){

                $.toast({
                    text: message,
                    heading: 'Note',
                    icon: 'warning',
                    showHideTransition: 'slide',
                    allowToastClose: true,
                    hideAfter: 8000,
                    stack: 5,
                    position: 'top-right',

                    textAlign: 'left',
                    loader: true,
                    loaderBg: '#9ec600',
                    beforeShow: function () {},
                    afterShown: function () {},
                    beforeHide: function () {},
                    afterHidden: function () {}
                });

            }else if(tooastType == "success"){
                $.toast({
                    text: message,
                    heading: 'Note',
                    icon: 'success',
                    showHideTransition: 'slide',
                    allowToastClose: true,
                    hideAfter: 8000,
                    stack: 5,
                    position: 'top-right',

                    textAlign: 'left',
                    loader: true,
                    loaderBg: '#9ec600',
                    beforeShow: function () {},
                    afterShown: function () {},
                    beforeHide: function () {},
                    afterHidden: function () {}
                });
            }


        }

        //chck if a value is a n array
        function checkIfInArray(theValue, theArray){

            return jQuery.inArray(theValue, theArray);


        }

//return array keys
        function getArrayKey(mainArray, theValue){

            return mainArray.indexOf(theValue);

        }

		return {
			getClassSubjectMethod:getClassSubjectMethod,
			performSwitch:performSwitch,
			printSelectedDiv:printSelectedDiv,
            showSuccessToaster:showSuccessToaster,
            checkIfInArray:checkIfInArray,
            getArrayKey:getArrayKey,
            checkIfInArray:checkIfInArray,
            getArrayKey:getArrayKey,
            capitalizeFirstLetter:capitalizeFirstLetter

		}

	}();




