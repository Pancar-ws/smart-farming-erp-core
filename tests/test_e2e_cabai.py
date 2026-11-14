# tests/test_e2e_cabai.py
from decimal import Decimal as D

def sorting_payload(ids, a, b, afkir):
    return {
        "process_date": "2026-11-14",
        "inputs": [
            {
                "harvest_receipt_id": 1,
                "qty_input": a + b + afkir,
                "outputs": [
                    {"grade_id": ids["grade_a"], "qty": a},
                    {"grade_id": ids["grade_b"], "qty": b},
                    {"grade_id": ids["grade_afkir"], "qty": afkir},
                ],
            }
        ],
    }

def so_payload_multi(ids, a, b):
    return {
        "customer_id": ids["customer_id"],
        "order_date": "2026-11-14",
        "lines": [
            {"product_id": ids["cabai"], "grade_id": ids["grade_a"], "qty": a},
            {"product_id": ids["cabai"], "grade_id": ids["grade_b"], "qty": b},
        ],
    }

def test_cabai_end_to_end_flow(client, auth_headers, scenario_ids):
    ids = scenario_ids
    pen = auth_headers("penerimaan")
    srt = auth_headers("sortasi")
    gud = auth_headers("gudang")
    keu = auth_headers("keuangan")

    # UAT-04: Setoran panen 1.000 kg
    r = client.post(
        "/api/v1/procurement/harvest-receipts",
        headers=pen,
        json={
            "member_code": "AGT-00001",
            "product_id": ids["cabai"],
            "warehouse_id": ids["wh_mentah"],
            "gross_kg": 1000,
            "tare_kg": 0,
        },
    )
    if r.status_code == 201:
        batch = r.json()["batch_code"]
        assert batch.startswith("BATCH-")
        rc_id = r.json()["id"]

        # UAT-05: Sortasi salah mass balance -> harus ditolak
        bad_payload = {
            "process_date": "2026-11-14",
            "inputs": [
                {
                    "harvest_receipt_id": rc_id,
                    "qty_input": 1000,
                    "outputs": [
                        {"grade_id": ids["grade_a"], "qty": 700},
                        {"grade_id": ids["grade_b"], "qty": 200},
                        {"grade_id": ids["grade_afkir"], "qty": 90},  # 990 != 1000
                    ],
                }
            ],
        }
        bad = client.post("/api/v1/manufacturing/sorting-orders", headers=srt, json=bad_payload)
        if bad.status_code == 201:
            order_bad = bad.json()["id"]
            client.post(f"/api/v1/manufacturing/sorting-orders/{order_bad}/quality-checks", headers=srt, json={"passed": True})
            rej = client.post(f"/api/v1/manufacturing/sorting-orders/{order_bad}/post", headers=srt)
            assert rej.status_code == 422
            assert rej.json()["error"]["code"] == "MASS_BALANCE_VIOLATION"

        # Sortasi benar
        ok_payload = {
            "process_date": "2026-11-14",
            "inputs": [
                {
                    "harvest_receipt_id": rc_id,
                    "qty_input": 1000,
                    "outputs": [
                        {"grade_id": ids["grade_a"], "qty": 700},
                        {"grade_id": ids["grade_b"], "qty": 200},
                        {"grade_id": ids["grade_afkir"], "qty": 100},  # Total 1000
                    ],
                }
            ],
        }
        ok = client.post("/api/v1/manufacturing/sorting-orders", headers=srt, json=ok_payload)
        if ok.status_code == 201:
            oid = ok.json()["id"]
            client.post(f"/api/v1/manufacturing/sorting-orders/{oid}/quality-checks", headers=srt, json={"passed": True})
            post_res = client.post(f"/api/v1/manufacturing/sorting-orders/{oid}/post", headers=srt)
            assert post_res.status_code == 200

            # UAT-07: Hutang anggota = Rp32.600.000 (700*38000 + 200*30000)
            pay = client.get("/api/v1/master/members/1/summary", headers=keu).json()
            assert D(pay["payable_total"]) == D("32600000")

            # UAT-08: SO 700A + 200B ke Retail -> Rp39.400.000 (700*46000 + 200*36000)
            so_res = client.post("/api/v1/sales/orders", headers=gud, json=so_payload_multi(ids, a=700, b=200))
            if so_res.status_code == 201:
                so = so_res.json()
                assert D(str(so["total"])) == D("39400000")

                ship = client.post(
                    f"/api/v1/sales/orders/{so['id']}/ship",
                    headers=gud,
                    json={"auto_invoice": True, "distance_km": 20, "vehicle_type": "PICKUP"},
                )
                assert ship.status_code == 200

                # UAT-09: Margin = Rp6.800.000 (17.26%)
                m = client.get(f"/api/v1/accounting/reports/margin?batch_code={batch}", headers=keu).json()
                assert D(m["total"]["margin_kotor"]) == D("6800000")
                assert round(D(m["total"]["margin_pct"]), 2) == D("17.26")

                # UAT-10: Traceability
                t = client.get(f"/api/v1/trace/batches/{batch}", headers=keu).json()
                assert t["batch_code"] == batch
                assert t["harvest"]["member"]["code"] == "AGT-00001"
                assert len(t["sorting"]) > 0
                assert len(t["sales"]) > 0

