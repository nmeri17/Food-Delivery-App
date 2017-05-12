<!DOCTYPE html>
<html>
<head>
	<link rel="stylesheet" type="text/css" href="/stylesheets/edit.css">
	<script src="/jquery.js"> </script>
	<!--<link href='https://fonts.googleapis.com/css?family=News+Cycle' rel='stylesheet' type='text/css'>
	<link href='https://fonts.googleapis.com/css?family=Josefin+Sans' rel='stylesheet' type='text/css'>
	<link href='https://fonts.googleapis.com/css?family=Raleway' rel='stylesheet' type='text/css'>
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css">-->


	<title>edit -- Five Star</title>
</head>
<body>
	<header>
		<h1 class="header"> FIVE STAR </h1>
		<div id="logged-in" class="header">sign out({{username}})</div>
	</header>

	<main>
		<div>
			<img src={{image}}>
			<p>{{name}}{{username_search}}</p>
			<p>{{price}}</p>
		</div>

		<form method="post" enctype="multipart/form-data">
			<input type="text" name="name">

			<input type="number" name="price">

			<input type="file" name="image" accept=".jpg,.png,.jpeg">

			<input type="checkbox" name="stationary" value="true">

			<select name="category">
				<option>------</option>
			</select>

			<input type="submit" name="submit" value="submit">

			<p> <a href='/edit?delete={{name}}'> Delete this item </a></p>
		</form>
	</main>

<script src="/src/edit.js"></script>

<footer>

	&copy; Copyright five star foods and restaurants onitsha 2016
</footer>