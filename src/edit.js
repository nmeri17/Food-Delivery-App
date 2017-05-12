$(document).ready(function() {

	// if the available image is unavailable, serve default
	$.each($("img"), function(index){
		$(this).on("error", function() {$(this).attr("src", "/images/default.jpg")});

	})
	
	// FILTER OFF INPUTS UNRELATED TO FOOD EDITING
	var isFood = $("main > div p:empty"), fileInput = $("input[type='file']"),
	foodRelatedInputs = [isFood, fileInput.nextAll().not("[type='submit']"), fileInput.prevAll()];

	if (isFood.length) {
		for (var i = 0; i < foodRelatedInputs.length; i++) {
			foodRelatedInputs[i].remove();
		}
	}

	// PREVIEW IMAGE BEFORE UPLOAD
	$("input[type='file']").on("change", function(e) {
		var reader = new FileReader(), file = $(this)[0].files[0];
		$(reader).on("load", function() {
			$("img").attr("src", "data://" + reader.result);
		})

		reader.readAsDataURL(file)
	});

	// HANDLE FORM INPUTS

	$("form").children("input:not(:last), select").each(function() {
		var name = $(this).attr("name");
		$(this).attr("id", name);

		$(this).before($("<label/>").attr("for", name).text((name + ": ").split("_").join(" ")));
		$(this).after($("<br/>"));
	});

		$("label").after($("<br/>"));

		$("input[type='checkbox']").prev().remove();


		var stationaryTypes = ['snacks', 'soups', 'cakes', 'drinks'];

		for (var i = 0; i < stationaryTypes.length; i++) {
			$("select").attr('pattern', function () {
				return new RegExp('[^' + $('option:first').text() + ']');
			}).append($("<option/>").text(stationaryTypes[i])).children(':not(:first)')
			.each(function () {
				$(this).val($(this).text())
			})
		}

		// IF MOVING FROM REGULAR TO STATIONARY AND PRICE IS NOT SET
		$("form").on('submit', function (e) {
			
			// set default values for empty boxes
			if ($("input[name='price']").val().length <= 1) $("input[name='price']").val($("main > div p:last").text())
				
			if ($("input[name='name']").val().length <= 1) $("input[name='name']").val($("main > div p:first").text());
		});
});