WEBPACK = ./node_modules/.bin/webpack

.PHONY: develop dist

develop:
	@$(WEBPACK) --optimize-dedupe \
				-c -w main.js superformula.js

dist:
	@$(WEBPACK) --optimize-minimize \
				--optimize-dedupe \
				--progress -c main.js superformula.js
