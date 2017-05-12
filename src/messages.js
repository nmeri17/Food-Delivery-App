$(document).ready(function() {
	var socket = io(), serviceWorker = new Worker('/src/worker.js');


	$('#chat-container form').submit(function(e) {
		e.preventDefault();
	
		receiver = $('.active-chat').data('name') || location.pathname.split('/').slice(-1);

		$('input[name="recipient"]').val(receiver);

		// handle posting to socket
  		socket.emit("newMessage", {sender: $("#user_name").text(), receiver: receiver, message: $('input[name="message"').val()});

		// handle posting to db via ajax
		/*$.post("/staff/messages", $(this).serialize(), function(res) {
			//
		})*/
	})

	// chat tabs
	$("#chat-tab-switch p").click(function(e) {
		$(".active-window").removeClass("active-window");
		$(".active").removeClass("active");

		$(this);
		$('#chat-logs > div > div').eq($(this).addClass('active').index()).addClass("active-window");
	});


	// if the available image is unavailable, serve default
	$.each($("img:not(:last)"), function(index){
		$(this).on("error", function() {$(this).attr("src", "/images/default.jpg")});

	})

	socket.on("newMessageToRoom", function(newMsg) {
		var myMsg = false, domElem = $('<div/>').html(newMsg.message);

		if (newMsg.sender == $("#user_name").text()) domElem.addClass('my-texts');

		domElem.appendTo('#chat-container span');

		serviceWorker.postMessage(newMsg);
		
	});

	// clicking on lis to fetch all my chats with them from the db
	$('#chat-logs li').click(function(e) {

		$(".active-chat").removeClass("active-chat");
		$(this).addClass('active-chat').attr('data-name', $('p:first', this).text())
	})

	serviceWorker.addEventListener('message', function(e) {
		if (Notification.requestPermission()) {
		var n = new Notification(e.data.sender, {body: e.data.message, icon: '/images/notif-image.jpg'});

		n.addEventListener ("click", function(e) {
			self.focus();
		});
	}
	})
});