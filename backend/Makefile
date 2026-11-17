up:
	docker compose up -d db
migrate:
	alembic upgrade head
seed:
	python -m app.seed.run_seed
run:
	uvicorn app.main:app --reload
test:
	pytest -q

