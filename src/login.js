
	$("section").load("/ #auth_form", function () {
		$(this).find("form").on("submit", function(e) {
			e.preventDefault();
			
			$.post("/login/", $(this).serialize(), function (data){

			if (data.redirectTo == "staff") {
				location.href = location.protocol + "//" + location.host + "/staff/"
			}

			else if (data.redirectTo == "admin") {
				location.href = location.protocol + "//" + location.host + "/admin/";
			}
			
			else if (data.redirectTo == "user") {
					location.href = location.protocol + "//" + location.host;
				}
			
			else {
					$(".message-text").html(data.errText);
				}
			});
		});
	})
	