$(document).ready(function (){
	// nav links animation
	$("nav ul li").append($(".nav-anim"));

	$("nav a").click(function() {
		$(".active-nav-item").removeClass("active-nav-item");
		$(this).addClass("active-nav-item");
	});


	var globalUsr = "";
	setTimeout(function(){
		$("#skip-to-order").css({"transition": "all .6s ease-in", "bottom": "7%"}).click(function(){
			$("html body").animate({scrollTop: $("div[role='main']")[0].getBoundingClientRect().top}, 450);
			$("div[role='main'] input[type='search']").focus();
		});
		setTimeout(function(){
			$("#skip-to-order").css({"transition": "none", "animation": "skip-to-content 1s ease-in-out infinite"});
		}, 2000);
	}, 300);

	// Display nav only when user is not signed in
	if ($("#logged-in").html().match(/\W|undefined/)) {
		$("header")[0].insertBefore($("header nav")[0], $("main section #amount")[0]);
	}
	else {
		$("main section nav").replaceWith($("#logged-in").show().css("margin-left", "25%").html("sign out (" + $("#logged-in").html() + ")"));
		$("title").html($("#logged-in").html().slice(10, -1) + " -- Five Star")

		/* why doesnt this work??
		* $("title").html($("#logged-in").html().slice(this.indexOf("sign out ("), -1) + " -- Five Star")
		*/
	}


	// Init input fields if user attempted sign in before
	$("#email").val(localStorage.getItem("_ml"));
	$("#password").val(localStorage.getItem("_pwd"));

	// Fire up login button with colorbox
	var who;
	$("nav ul li a").click(function(e){
		e.preventDefault();
		who = $(this)[0]; // assign what form to show. Data attributes would work too

		// Customizing colorbox
		$("#cboxWrapper").click(function customize(e) {
			var target = e.target, formEl = $("#auth_form, #email, #password, #auth_form input[type='submit'], #auth_form label");
			if (formEl.index(target) == -1) {
				$("#cboxOverlay").trigger("click");
			}
			else {
				target.removeEventListener("click", customize);
			}
							
			});

			if (e.target == $("#register")[0]) {
				$("#auth_form input[type='submit']").val("Register");
			}
			else $("#auth_form input[type='submit']").val("Login");

			$("#auth_form").show();
			$("body").css("overflow-y", "hidden");
			history.pushState({username: undefined}, "", "/" + $(e.target).attr("id") + "/");
	}).colorbox({inline: true, width: '65%', onClosed: function(){
			$("#auth_form").hide();
			$("body").css("overflow-y", "initial");

			$(".active-nav-item").removeClass("active-nav-item");

			if ($("section").has("nav").length && globalUsr == "") { // if user is not signed in but closes colorbox, go back to home url
				history.back();
			}
		}
	});

	// login logic. if auth user, remove form
	$("#auth_form form").on("submit", function(e) {
		e.preventDefault();

	// persist entered details
	localStorage.setItem("_ml", $("#email").val());
	localStorage.setItem("_pwd", $("#password").val());

	// handle login
	if (who == $("#login")[0]) {
		$.post("/login/", $("#auth_form form").serialize(), function (data){

			if (data.redirectTo == "staff") {
				location.replace(location.protocol + "//" + location.host + "/staff/")
			}

			else if (data.redirectTo == "admin") {
				location.replace(location.protocol + "//" + location.host + "/admin/")
			}

			else if (data.errText !== "") {
				$(".message-text").html(data.errText);
			}
			else {
				globalUsr = data.sessName;
				history.replaceState({username: globalUsr}, "", "/users/" + globalUsr);
				$("title").html(globalUsr + " -- Five Star")
				$("nav").replaceWith($("#logged-in").show().css("margin-left", "25%").html("sign out (" + globalUsr + ")"));
				$.colorbox.close();
			}
		});
	}

	// handle register
	else if (who == $("#register")[0]) {
		$.post("/register/", $("#auth_form form").serialize(), function (data){
			var confirm = document.createElement("INPUT");
			data = JSON.parse(data);
			$(confirm).attr({name: "confirm", id: "confirm"});

			if (data.confirmState) {
				$("#auth_form form")[0].insertBefore($(confirm)[0], $("#auth_form input[type='submit']")[0]);
			}
			else {
				$(".message-text").html(data.errText);
				console.log("didnt works")
			}
		});
	}
});
});

window.onpopstate = function () {
	$.colorbox.close();
};
