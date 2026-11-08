import sys, json, time, base64, asyncio
from playwright.async_api import async_playwright

URL = "file://" + str(__import__("pathlib").Path(__file__).resolve().parent.parent / "dist") + "/city_test.html" + (sys.argv[4] if len(sys.argv) > 4 else "")
OUT = './'

async def main():
    script = sys.argv[1] if len(sys.argv) > 1 else ''
    w, h = (int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else (1280, 720)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': w, 'height': h})
        logs = []
        pg.on('console', lambda m: logs.append(f'[{m.type}] {m.text}'))
        pg.on('pageerror', lambda e: logs.append(f'[pageerror] {e}'))
        t0 = time.time()
        await pg.goto(URL)
        try:
            await pg.wait_for_function("typeof Game !== 'undefined' && (Game.state === 'title' || Game.state === 'play')", timeout=240000, polling=1000)
        except Exception as e:
            logs.append('TIMEOUT waiting for title: ' + str(e))
        logs.append(f'loaded in {time.time()-t0:.1f}s')
        if script:
            steps = json.loads(open(script).read()) if script.endswith('.json') else [{'eval': script}]
            for st in steps:
                if 'eval' in st:
                    try:
                        r = await pg.evaluate(st['eval'])
                        if r is not None: logs.append('eval -> ' + str(r)[:2000])
                    except Exception as e:
                        logs.append('eval error: ' + str(e)[:500])
                if 'wait' in st: await pg.wait_for_timeout(st['wait'])
                if 'shot' in st: await pg.screenshot(path=OUT + st['shot'])
                if 'top' in st:
                    x0, z0, x1, z1 = st["top"][:4]; px = st.get("px", 1000)
                    url = await pg.evaluate(f'window.debugTopDown({x0},{z0},{x1},{z1},{px})')
                    open(OUT + st['name'], 'wb').write(base64.b64decode(url.split(',')[1]))
        else:
            await pg.wait_for_timeout(1500)
            await pg.screenshot(path=OUT + 'title.png')
        for l in logs: print(l)
        await b.close()

asyncio.run(main())
