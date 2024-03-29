SYLPH = target/debug/sylph

WITH_ENV=env $$(xargs < .env)

build: build-ui build-backend

build-ui:
	cd ui && npm run build

build-backend:
	cargo build

serve-ui:
	cd ui && npm run serve

serve-backend:
	$(WITH_ENV) cargo run

serve-backend-and-ui: build-ui serve-backend

test: test-ui

test-ui:
	cd ui && npm test
	cd ui && $(WITH_ENV) npx cypress run

test-ui-live:
	cd ui && $(WITH_ENV) npx cypress open

clean:
	rm -fr ui/dist

psql:
	psql -d sylph

pgcli:
	pgcli -d sylph

lint:
	cargo clippy

format:
	cd ui && zsh -c 'npx prettier --write * types/**/* src/**/*'

db: build-backend
	@dropdb --if-exists sylph
	@createdb sylph
	@psql -v ON_ERROR_STOP=1 -d sylph < db.sql > /dev/null
	$(SYLPH) --load-ebird-species
	$(SYLPH) --load-ebird-hotspots
	$(SYLPH) --load-ebird-hotspot-species

fetch-ebird-data: fetch-ebird-species fetch-ebird-hotspots

fetch-ebird-species:
	$(SYLPH) --fetch-ebird-species

fetch-ebird-hotspots:
	for region in CO-AMA CO-CAQ; do \
		$(SYLPH) --fetch-ebird-hotspots $$region; \
	done

# --fetch-ebird-hotspot-species requires that the hotspots are in the
# db (so that it can query for the locIds).
fetch-and-load-hotspot-species:
	$(SYLPH) --load-ebird-hotspots
	$(SYLPH) --fetch-ebird-hotspot-species
	$(SYLPH) --load-ebird-hotspot-species

.venv:
	python -m venv .venv
	.venv/bin/pip install requests beautifulsoup4 html5lib

fetch-species-image-urls: .venv
	@echo "select json_agg(distinct es.sciname) from ebird_species es \
inner join ebird_hotspot_species ehs ON ehs.species = es.speciescode \
left outer join species_image si ON si.speciescode = es.speciescode \
where si.speciescode is null;" \
	| psql --tuples-only -d sylph \
	| .venv/bin/python bin/fetch_wikipedia_image_urls.py

load-species-image-urls:
	$(SYLPH) --load-species-images

describe-db:
	@echo "SELECT relname as table, n_live_tup as rows FROM pg_stat_user_tables ORDER BY n_live_tup DESC;" \
	| psql -d sylph
