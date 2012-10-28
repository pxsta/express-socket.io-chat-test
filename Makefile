all: test

app :
	NODE_ENV=production node app
	
test:
	NODE_ENV=test mocha

.PHONY: app test