var socket = io(), serviceWorker = new Worker('/src/worker.js');

$(document).ready(function () {

  socket.on("newOrder", function(orderForm) {
  	var row = $("<tr/>");
  	
  	for (var k = 0; k < $("th").length; k++) {
  		row.append($("<td/>"));
  	}

  	for (var l in orderForm) {
  		$("th").each(function(elIndex, el) {
  			var index;
  			// if table header text matches key, pick its index. td of that index should get that value
  			if (l == $(this).text()) {
  				index = elIndex;
  			}
  			
  			row.children("td").eq(index).html(orderForm[l])
  		})
  	}
  		$("tr:nth-child(2)").before(row);
  		$("tr:last").remove();

		// alert admin
		var firstRow = $("tr:nth-child(2)");
		serviceWorker.postMessage(`${firstRow.children(':nth-child(2)').text()} has just ordered ${firstRow.children(':first').text().split(',').length} items: ${firstRow.children(':first').text()}`);

    // rewrap item in class nobody
    var nobody = firstRow.find('td:nth-child(7) a:contains("nobody")').addClass('nobody');

      // this event should only be attached if page viewer is a staff
      if (location.href.indexOf('staff') > -1) {
       
       // asynchronously assign order to staff
       nobody.click(assignedClosure(nobody).bind(nobody));
      }

      // take the admin to his profile page so he can poke
      else nobody.attr('href', '/staff/profiles/' + $("#user_name").text());
  	});

  socket.on("assigned", function(assignedOrder) {
  	$("tr td:contains('" + assignedOrder.ID + "')").parent().children("td:nth-child(6)").html("assigned").next().html(assignedOrder.staff)
  });

 socket.on("delivered", function(deliveredOrder) {
  	$("tr td:contains('" + deliveredOrder.ID + "')").parent().children("td:nth-child(6)").html("assigned").next().html(deliveredOrder.staff)

    if (location.href.indexOf('staff') > -1) {
       var assigned = $("td:contains('assigned')");
       
       assigned.click(Closure(assigned).bind(nobody));
      }
  });


	// service worker stuff
	serviceWorker.addEventListener('message', function(e) {
		if (Notification.requestPermission()) {
			var n = new Notification('New Order', {body: e.data, icon: '/images/notif-image.jpg'});

			n.addEventListener ("click", function(e) {
				self.focus();
			});
		}
	});
  //d = new Date(), e = d.toString().substr(4).replace(/(:[0-9]{2}\s(.*))$/gi, ""); console.log(e)

  // build orders table
  currLen = 25 - $("tr").length
  for (var i = 0; i < currLen; i++) {
    var newRow = $("<tr/>").append(function (index, html) {
      var node = "";
      for (var j = 0; j < $("th").length; j++) {
        node += "<td></td>";
      }
      return node;
    })
    $("tbody").append(newRow);
  }

  // set unassigned orders aflame
  $("tr:not(first-child) td:nth-child(7) a:contains('nobody')").addClass('nobody');

// close document.ready
})