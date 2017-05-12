$(document).ready(function() {
	$('.log').hide();

	try {
		var contacts = JSON.parse($('#contacts').text());

		renderConstruct(contacts, $('#contacts').empty().append('<ul/>').children('ul'), $('.log'))
		$('#chat-logs').css({flex: '45%', border: $(this).next().css('border'), alignContent: 'flex-start'});
}
	catch (e) {
		$('#chat-logs').remove();
	}
	function renderConstruct(datas, target, prototype) {
		$(datas).each(function(index, data) {
			var clone = prototype.first().clone(), name = clone.show().unwrap().html().replace(/\{\{(\w+)\}\}/gi, function (match, $1) {
				if (data[$1] != void(0)) return data[$1];
				else return '';
			});
			target.append($("<li/>").html(name));
		});
	}

	// clicking on lis to fetch all my chats with them from the db
	$('#chat-logs li').click(function(e) {

		$(".active-chat").removeClass("active-chat");
		$(this).addClass('active-chat').attr('data-name', $('p:first', this).text())
	})
});

