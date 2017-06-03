var assignedClosure = null,
deliveredClosure = null;

$(document).ready(function () {

	var assignStr = "";


	// popup dialog assign order to staff on click
	$("#confirm-assign a").click(function (e) {
			e.preventDefault();

			// if staff clicked OK on assign popup dialog, proceed
			if ($(this)[0] == $("#confirm-assign a:first")[0]) {
				$.post("/staff/assign", assignStr, function(data) {
					if ($(data.assign).unwrap().html() === $("#logged-in span").text()) {
						
						socket.emit("assigned", {staff: data.assign, ID: data.ID})
						$.colorbox.close();

						$("tr td:contains('" + data.ID + "')").parent().children("td:nth-child(6)")
						.html("<a href='delivered/?" + assignStr + "' class=delivered>assigned</a>").next().html(data.assign)

						$(".delivered").on("click", deliveredClosure)
					}
				})
			}
			else {
				$.colorbox.close();
			}
		});


		assignedClosure = function(context) {
			 return function (e) {
			e.preventDefault();

			var customer = $(this).parent().siblings().eq(1).text().trim();
			assignStr = "customer=" + encodeURIComponent(customer) + "&ID=" + $(this).parent().siblings().eq(4).text().trim();
		
			// Customizing colorbox
			$("#colorbox").click(CustomizingColorbox);
			$("#confirm-assign").css("display", "flex");
			$("body").css("overflow-y", "hidden");

			// plugin colorbox upon it
			$(this).colorbox({inline: true, width: '80%', onClosed: function(){
				$("#confirm-assign").hide();
				$("body").css("overflow-y", "initial");
				}
			});

			return context;
		}
	}
		

		function CustomizingColorbox(e) {
			// remove colorbox when outside popup dialog is clicked
			if ($("#confirm-assign").has($(e.target)).length > 0 || e.target == $("#confirm-assign")[0]) {
				e.target.removeEventListener("click", CustomizingColorbox);
			}
			else {
				$("#cboxOverlay").trigger("click");
			}
							
		}
		
		// asynchronously assign order to staff
		$('.nobody').click(assignedClosure($('.nobody')).bind($('.nobody')));

		// get requests to deliver orders
		deliveredClosure = function(context) {
			 return function (e) {
			var that = $(this);

			e.preventDefault();

			$.get($(this).attr("href"), function(data) {
				if (data.customer != undefined) {
					that.html("delivered");

					socket.emit("delivered", {staff: data.assign, ID: data.ID})
				}
			});

			return context;
		}
	}

		// wrap assigned orders in class and callback on page load
		var assigned = $("td:contains('assigned')");
		assigned.each(function() {
			$(this).html(`<a href=delivered/?customer=${encodeURIComponent($(this).siblings().eq(1).text().trim())}&ID=${$(this).siblings().eq(4).text().trim()}>assigned</a>`)
		})
		.children().addClass('delivered');
		
		$('.delivered').click(deliveredClosure($('.delivered')).bind($('.delivered')));
// se fin
})