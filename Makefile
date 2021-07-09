test-cov: istanbul

istanbul:
	npx nyc  node ./node_modules/mocha/bin/_mocha -- -R spec test --recursive

coveralls:
	cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js

mocha_test:
	cp ./node_modules/mocha/mocha.js test_html
	cp ./node_modules/mocha/mocha.css test_html
	cp ./node_modules/should/should.js test_html


releaseIt:
	npx release-it
	npx bower register serialijse  https://github.com/erossignon/serialijse.git