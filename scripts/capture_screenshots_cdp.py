import os
import time
import json
import base64
import subprocess
import asyncio
import tempfile
import requests
import websockets

CHROME_PATH = r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
OUT_DIR = os.path.abspath("doc/screenshots")
os.makedirs(OUT_DIR, exist_ok=True)

# 1. Authenticate to get token
res = requests.post('http://localhost:8000/api/v1/auth/login', json={'username': 'superadmin', 'password': 'password123'})
data = res.json()
access_token = data['access_token']
refresh_token = data['refresh_token']
user_json = json.dumps(data['user'])

print("Successfully authenticated as superadmin")

async def run_cdp():
    temp_dir = tempfile.mkdtemp()
    chrome_proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9222",
        "--remote-allow-origins=*",
        "--disable-extensions",
        f"--user-data-dir={temp_dir}",
        "--disable-gpu",
        "--window-size=1400,880",
        "http://localhost:5173/login"
    ])
    
    time.sleep(2.5)
    
    try:
        pages = requests.get("http://127.0.0.1:9222/json/list").json()
        target_ws = [p['webSocketDebuggerUrl'] for p in pages if 'login' in p.get('url', '')][0]
        print("Connected to WebSocket:", target_ws)
        
        async with websockets.connect(target_ws, origin="http://127.0.0.1:9222") as ws:
            msg_id = 0
            
            async def send_cmd(method, params=None):
                nonlocal msg_id
                msg_id += 1
                payload = {"id": msg_id, "method": method}
                if params:
                    payload["params"] = params
                await ws.send(json.dumps(payload))
                while True:
                    resp = json.loads(await ws.recv())
                    if resp.get("id") == msg_id:
                        return resp.get("result", {})
                    
            await send_cmd("Page.enable")
            await send_cmd("Runtime.enable")
            
            # 1. Capture Login Page
            print("Capturing 01_login_page.png...")
            await asyncio.sleep(1.5)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(OUT_DIR, "01_login_page.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("Saved 01_login_page.png")
                
            # 2. Inject localStorage and Navigate to Dashboard
            print("Injecting authentication and redirecting to /dashboard...")
            js_login = f"""
                localStorage.setItem('erp_sf_access_token', '{access_token}');
                localStorage.setItem('erp_sf_refresh_token', '{refresh_token}');
                localStorage.setItem('erp_sf_user', JSON.stringify({user_json}));
                window.location.href = 'http://localhost:5173/dashboard';
            """
            await send_cmd("Runtime.evaluate", {"expression": js_login})
            await asyncio.sleep(3.0) # wait for page mount and data loading
            
            # List of authenticated pages to capture
            pages_to_capture = [
                ("02_dashboard_eksekutif.png", "http://localhost:5173/dashboard"),
                ("03_master_data_petani.png", "http://localhost:5173/master/members"),
                ("04_penerimaan_panen.png", "http://localhost:5173/procurement/harvest"),
                ("05_sortasi_grading_qc.png", "http://localhost:5173/manufacturing/sorting"),
                ("06_manajemen_stok_gudang.png", "http://localhost:5173/inventory/stock"),
                ("07_penjualan_sales_orders.png", "http://localhost:5173/sales/orders"),
                ("08_kasir_keuangan.png", "http://localhost:5173/accounting"),
                ("09_laporan_traceability.png", "http://localhost:5173/reports/esg"),
            ]
            
            for filename, url in pages_to_capture:
                print(f"Navigating to {url}...")
                await send_cmd("Runtime.evaluate", {"expression": f"window.location.href = '{url}';"})
                await asyncio.sleep(2.5) # allow full render & API data fetch
                shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
                filepath = os.path.join(OUT_DIR, filename)
                with open(filepath, "wb") as f:
                    f.write(base64.b64decode(shot["data"]))
                print(f"Captured: {filename} ({os.path.getsize(filepath)} bytes)")
                
    finally:
        chrome_proc.terminate()
        print("Done capturing all screenshots.")

if __name__ == "__main__":
    asyncio.run(run_cdp())
