<!DOCTYPE html>
<html>
<head>
	<link rel="stylesheet" type="text/css" href="/stylesheets/profile.css">
	<script src="/jquery.js"> </script>
	<script src="/socket.io/socket.io.js"></script>

	<!--<link href='https://fonts.googleapis.com/css?family=News+Cycle' rel='stylesheet' type='text/css'>
	<link href='https://fonts.googleapis.com/css?family=Josefin+Sans' rel='stylesheet' type='text/css'>
	<link href='https://fonts.googleapis.com/css?family=Raleway' rel='stylesheet' type='text/css'>
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css">-->


	<title>{{username}}'s Profile -- Five Star</title>
</head>
<body>
	<header>
		<h1 class="header"> FIVE STAR </h1>
		<div id="logged-in" class="header">sign out(<span id="user_name">{{page_viewer}}</span>)</div>
	</header>

	<div class="nav-anim">
		<hr>
		<hr>
	</div>

<h3> {{username}}'s Profile </h3>

<main>

<div class="staff">
	<img src=/images/profiles/{{username_search}}.jpg>
	<span>Orders completed:<p>{{ordersCompleted}}</p></span>
	<span><a href="http://localhost:1717/edit?staff={{username_search}}">Edit</a></span>
</div>

<div id="chat-logs">
	<span id="chat-tab-switch">
		<p class="active">contacts</p>
		<p>recents</p>
	</span>

	<div>
		<div id="contacts" class="active-window">{{contacts}}</div>

		<div id="recent-chats">

			<ul>
				{{recentChats}}
			</ul>
		</div>
	</div>
</div>

<div id="chat-container">
	<span>
	
	</span>
	<form method="post">
		<input type="text" name="message" placeholder="enter your message here" required="required">
		<input type="hidden" name="recipient">
		<input type="submit" name="submit" value="send">
	</form>
</div>
</main>

<script src="/src/profile.js"></script>
<script src="/src/messages.js"></script>

<footer>

	&copy; Copyright five star foods and restaurants onitsha 2016
</footer>

	<div class="log">
		<p>{{contact_name}}</p>

		<span><img src="{{contact_image}}"></span>
		<p>{{last_text}}</p>
	</div>

</body>
</html>