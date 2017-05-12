$(document).ready(function(){
	var scrollTop,
	elTop = $("#how-it-works")[0].getBoundingClientRect().top,
	elHeight = $("#how-it-works")[0].clientHeight,
	elBottom = $("#how-it-works")[0].getBoundingClientRect().bottom - 200,
	end = $("div[role='main']")[0].getBoundingClientRect().bottom - 250; // let it disappear 15px before the end of the main available container


	$(document).on("scroll", function() {
		scrollTop = $("html body")[0].scrollTop;

		// use waypoints. jquery `one` cast
		if (scrollTop > 630) { // appear when element scrolled halfway through
			$(".how").css("margin-top", "initial");
		}


		if (scrollTop > elTop + 35) {
			$(".header").addClass("fix");
		}
		else {
			$(".header").removeClass("fix");
		}

		// categories display					
		if (scrollTop > 1020 && scrollTop < 1600)  {
			$("#food-cats").show(200);
		}
		else {
			$("#food-cats").hide("slow");
		}
	});


	// HOVER EFFECT FOR STATIONARY FOODS ICONS
	var color;
	$(".how .how-img").hover(
		function(){
			color = $(this).css("color");
			$(this).addClass("how-anim").css("background", color).parent().addClass("how-anim-parent").css("border-color", color)
			.parent().css("margin-top", "-4px");
		},

		function(){
			$(this).removeClass("how-anim").css("background", "none").parent().removeClass("how-anim-parent").parent().css("margin-top", "initial");
		}
	);

  	// HIDE TEMPLATES
	$(".food-menu:last, .frequent:last").hide();

	$("#location-div form").on('submit', function(e){
		e.preventDefault();

		var idCode = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", str ="",
		submitForm = new FormData($("#formDataSubmit")[0]), selectedFoods = [], socketForm = {};
		orderSuccessCb = function(data) {

			try{

				/* the problem here is that jquery impedes redirect orders from the server. instead of redirecting
				* from the script and function/page, it recursively follows the redirect to wherever it may lead,
				* and returns that response here.
				* so since the server returns ticketID only if user is signed in and otherwise redirects to login,
				* check for the value
				**/

				if (data.ticketId === undefined) throw new Error();

				$("#ticket-id").html(data.ticketId);

				if (data.deliveryTime > 0) {
					$("#delivery-time").html(`in about ${data.deliveryTime} minutes`);
					socketForm['estimated delivery time'] = `${data.deliveryTime} minutes`
				}
				else $("#delivery-time").html("soon");

				$("#order-placed").show(180);

				for(var fields of submitForm) {
					var key = fields[0], value = fields[1];
						socketForm[key] = value;
				}

				socket.emit("newOrder", socketForm);

			}
			catch (e) {
					// you are not signed in
					$("nav li a:first").trigger("click");
					$(".message-text").html("Error: User not logged in.");
			}

			/*} this should be the closing bracket for condition checking if user has pending order
				else {
					$("#order-placed span").html("unable to make new order while your last order has not delivered");
				}*/
		}; // end ajax submit callback;

		for (var i = 0; i < 8; i++) {
			str += idCode[parseInt(Math.random() * idCode.length)]
		}

		$(".checked").each(function() {
			selectedFoods.push($(this).siblings("p").first().html().trim());
		});

		submitForm.append("customer", $("#recipient").val());
		submitForm.append("location", $("#location").val());
		submitForm.append("price", $("#amount span").text());
		submitForm.append("food", selectedFoods);
		submitForm.set("ID", str);
		submitForm.set("orderPlaced", new Date());
					
		$.ajax({url: "/admin/order", data: submitForm, method: "POST", processData: false, contentType: false, success: orderSuccessCb})

	}); // end all about order form submit

	$("#order-placed").hide();


	// FIRE UP FOOD IMAGES WITH COLORBOX
	function fireColorbox() {
		$(".food-menu:not(:contains('{{')) img").wrap("<a></a>").each(function(){
			var that = $(this), parent = that.parent();

			that.attr("id", that.attr("src").split("/").slice(-1).pop().split(".")[0]).parent().

			attr("href", "#" + that.attr("id")).on("click", function() { $("body").css("overflow-y", "hidden")}).

			colorbox({inline: true, onClosed: function() {
				$("body").css("overflow-y", "initial")
			}});
		});
	}
	
	fireColorbox();

	$("#food-lists .fa-check-circle, .food-menu > span, #catHolder .fa-check-circle").click(AddToCart);

	// SOCKET STUFF
  	var socket = io();

 	socket.on("availableToday", function(data) {})

	var backButton = null;

	$("[class^='icon-']").click(function(){
		if (backButton == null) backButton = {currentContent: $("#food-lists ul").html(), header: $("div[role='main'] h4")};

		socket.emit("stationaryOn", {type: $(this).parent().text().trim()})
	});


	socket.on("stationaryOn", function(typeObj) {
		renderConstruct(typeObj, $("#food-lists ul"), $(".food-menu"));
		$("div[role='main'] h4").replaceWith($("<h4 id=goBack> GO BACK <i class='fa fa-arrow-left-circle' aria-hidden='true'></i></h4>"));

		$("#goBack").on("click", function(){
			$("#food-lists ul").html(backButton.currentContent)
			$("#goBack").replaceWith(backButton.header);
			$("#food-lists .fa-check-circle, .food-menu > span, #catHolder .fa-check-circle").click(AddToCart);
			backButton = null;
		});
	});

	function renderConstruct(datas, target, prototype) {
		
		target.empty();

		$(datas).each(function(index, data) {
			var clone = prototype.last().clone(), name = clone.prop("outerHTML").replace(/\{\{(\w+)\}\}/gi, function (match, $1) {
				return data[$1];
			});
			target.append($("<li/>").html(name));
		});

		target.find(".food-menu").fadeIn(700).children('span').click(AddToCart);
		fireColorbox()
	}

	function AddToCart () {
		$(this).toggleClass("checked");

		// Logic for calculating food price
		function total(curr) {
			var tot = 0, prevVal = parseInt($("#amount span").text());

			if (prevVal > 0) tot = prevVal;

			curr.each(function(){
			tot += parseInt($(this).prev().html().trim()/*.substr(1)*/); // unhide when there is a  naira sign preceding it
			});
			return tot;
		}
	
		// animation to push out aside on select. Runs once
		$("#frequent").css("transform", "rotatey(180deg)");

		setTimeout(function() {$("#combination").css("z-index", "initial");}, 500);

		// Update total amount
		$("#amount span").text(total($(".checked")));
	}

});