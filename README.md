# CLEVERPACK
> Virtual rooms for CodeReview sessions (and smthng more)

![](docs/Picture1.png?raw=true)

- Login with Google creds
- Sync ACE code editor (https://ace.c9.io/)
- Sync Room chat
- Sync whiteboard

### Update `config.json`
```json
    "db": {
		"username": "YOUR NAME",
		"password": "YOUR PASS",
		"host": "YOUR HOST",
		"port": "YOUR PORT",
		"name": "mean-chat"
    },    
    "redis": {
		"host": "REDISLABS SERVER",
		"port": "PORT",
		"password": "PASSWORD"
    },
    "google": {
		"clientID": "ID",
		"clientSecret": "SECRET",
		"callbackURL": "/auth/google/callback",
		"profileFields": [
			"id",
			"displayName",
			"picture"
		]
	},
```

## Deploy own in Heroku
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/aslepenkov/cleverpack)

## Try now! https://cleverpack.herokuapp.com/
