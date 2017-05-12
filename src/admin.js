$(document).ready(function () {
  	// hide templates
	$("[class$='-proto']").hide();

	// point unassigned orders to admin page 
	$("tr:not(first-child) td:nth-child(7) a:contains('nobody')").addClass('nobody')
	.attr('href', '/staff/profiles/' + $("#user_name").text());

  
	$(document).scroll(function() {
		if ($("html body")[0].scrollTop > 480) {
			$(".header").addClass("fix");
		}
		else {
			$(".header").removeClass("fix");
		}
	});

	$("nav ul li").append($(".nav-anim"));

	$("nav ul li").click(function() {
		var tabToDisplay = $(this).data("name");
		history.pushState({currTab: tabToDisplay}, "", "?tab=" + tabToDisplay);
		displayActive(tabToDisplay);
	});

	// this is fired every time we press back button. 
	window.addEventListener("popstate", function(e) {
		if (e.state != null) {
			displayActive(e.state.currTab);
		} else displayActive("orders");
	});

	function displayActive (changeTo) {
		$(".active-tab").removeClass("active-tab");
		$("#" + changeTo).addClass("active-tab");

		// chrome takes you to prev div but not active nav so fix that
		$(".active-nav-item").removeClass("active-nav-item");
		
		$(`li[data-name='${changeTo}']`).addClass("active-nav-item");
	}


	// fetch pagination links here
	/*
			$.get("/admin/order/", "page=0", function(data) {
				
				//forEach index in the returned data, transpose it on the corresponding index on the table
			})*/

	// new food + upload logic
	$("#dnd").on("dragover", function (e) {
	e.preventDefault();
	$(this).css({opacity: ".5"});
	}).on("drop", function(e) {
	e.preventDefault();
	var dt = e.originalEvent.dataTransfer, form = new FormData();

	form.append("food_image", dt.files[0]);
	form.append("foodName", $("input[name='foodName']").val());
	form.append("price", $("input[name='price']").val());

	$.ajax({url: "/admin/foods/", processData: false, data: form, contentType: false, method: "POST", xhr: function() {
	var xhr = new XMLHttpRequest();

		// listen to the 'progress' event
	xhr.upload.addEventListener('progress', function(e) {

			if (e.lengthComputable) {
			// calculate the percentage of upload completed
			var percentComplete = e.loaded / e.total;
			console.log(e.loaded, e.total, percentComplete);
			percentComplete = parseInt(percentComplete * 100);

			$('#text-indicator').text(percentComplete + '%');
			$('#progress-parent div').css("width", percentComplete + '%');
		}
		else console.log(e)});

		return xhr;
	},
	success: function(data) {

		setTimeout(function() {

		$(this).css({opacity: "initial"});
		$("#available input").val('');
		$('#text-indicator').html('0%');
		$('#progress-parent div').css("width", '0%');
		}, 3000);
	}
	});
	}).on("dragend", function(e) {
	e.dataTransfer.clearData();
	});

	// content handler on tabs switch
	$("nav li").one("click", function() {

	var contentHandling = {
		foods: function() {
				$.get("/admin/foods/", function(datas) {
								
					renderConstruct(datas, $("#foods ul"), $(".foods-proto"));
				})
			},
		available: function() {
				$.get("/admin/available/", function(datas) {

					renderConstruct(datas, $("#available aside ul"), $(".result-proto"));
					$("#available aside li").on("click", AvailableAsideLi);
				})
			},
		staff: function() {
				$.get("/admin/staffs", function(datas) {

					renderConstruct(datas, $("#staff ul"), $(".staff-proto"))
					// code for demote button on staff thumbnails
					$(".demote").click(Demote)
				})}
	},
	endsWith = location.search.match(/=+?(\w+)+$/)[1];

	// pick out what string the href ends with and serve content
	contentHandling[endsWith]();

	});


	$(".search-input").submit(function(e) {
	e.preventDefault();
	}).on("input", function(e) {
	var that = $(this);

	$.get("/search", $(this).serialize(), function(matches) {
		$("#search-results").remove();

		that.parent().append($("<div/>").attr("id", "search-results"));

		if(matches !== null && matches.length > 0) {
			$("#search-results").append($("<ul/>"));

			// set default image for user search
			for (var i = 0; i < matches.length; i++) {
				if (matches[i].username !== undefined) {
					matches[i].user_image = "/images/profiles/" + matches[i].username + ".jpg"
				}
				else if (matches.name !== undefined) {
					matches[i].food_image = "/images/food/" + matches[i].name.split(' ').join('-') + ".jpg";
				}
			}
			

			renderConstruct(matches, $("#search-results ul"), $(".result-proto"));

			if ($("#staff").has(that).length > 0) {
				activateEvent("staff");
			}
			else {
				activateEvent("available");
			}
		}
		else $("#search-results").text("no results found.");
	});
	}).on("blur", function() {
	setTimeout(function() {
	$("#search-results").hide("fast");
	}, 2000)
	});

	// this listener is wrapped in the `activateEvent` function to be bound later since the objects do not exist at runtime

	function activateEvent (flag) {
	var flagsObj = {
		available: function () {
			$("#search-results li").click(function(e) {
				var that = $(this);

				$.post("available/", "add=" + $(this).children("p").text(), function(res) {
					if (res === true) {
						$("#available aside ul").prepend(that);

						// reattach handler so the new elements can be inducted in the event loop
						$("#available aside li").off("click", AvailableAsideLi).on("click", AvailableAsideLi);
					}
				})
			});
		},
		staff: function () {
			
			// promote staff
			$("#search-results li").click(function(e) {
				var insertText = $(this).children("p").text().trim();

				$.post("/staff/level", "promote=" + insertText, function(res) {
					if (res == 'true') {
						renderConstruct({username: insertText, ordersCompleted: 0}, $("#staff ul"), $(".staff-proto"));
						$(".demote").click(Demote)
					}
				})
			});
		}

	}
	flagsObj[flag]();
	}


	function renderConstruct(datas, target, prototype) {
	$(datas).each(function(index, data) {
		var clone = prototype.first().clone(), name = clone.show().unwrap().html().replace(/\{\{(\w+)\}\}/gi, function (match, $1) {
			
			// resetting the value of `username_search` to `username`
			if (data["username"] !== undefined) {
				data["username_search"] = data["username"];
			}

			// pick image for food search
			if (data.name !== undefined) {
				data.food_image = "/images/food/" + data.name.split(' ').join('-') + ".jpg";
			}

			if (data[$1] != undefined) {
				return data[$1];
			}
				return "";
			});
			target.append($("<li/>").html(name));
	});


	// if the available image is unavailable, serve default
	$.each($("img", target), function(index){
		$(this).on("error", function() {$(this).attr("src", "/images/default.jpg")});

		/* alternatively, you could use naturalHeight property to check. if that property is = 0, then image is
		not available*/
	})

	}

	function AvailableAsideLi(event) {
	var that = $(this);

	$.post("available/", "remove=" + $(this).children("p").text().trim(), function(res) {
		if (res === true) {
			that.remove()
		}
	})
	}

	function Demote(e) {
	e.preventDefault();

	var insertText = $(this).parent().siblings("p:first").text().trim(), that = $(this);

		$.post("/staff/level", "demote=" + insertText, function(res) {
			if (res == "true") {
				that.parentsUntil("li").hide("slow");
			}
		})
	}

// close document.ready
})