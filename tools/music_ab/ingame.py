import asyncio, pathlib
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': 480, 'height': 270})
        pg.on('pageerror', lambda e: print('PAGEERROR', e, flush=True))
        pg.on('console', lambda m: print('CONSOLE', m.type, m.text[:300], flush=True) if m.type in ('error','warning') else None)
        await pg.goto('file://' + str(pathlib.Path('dist/city_debug_test.html').resolve()))
        for i in range(60):
            await pg.wait_for_timeout(1000)
            if await pg.evaluate("typeof Game!=='undefined' && Game.state==='title' && !!document.querySelector('#dbg button[data-g]')"): break
        await pg.evaluate("document.querySelector('#dbg button[data-g=\"0\"]').click()")
        await pg.wait_for_timeout(2000)
        n = await pg.evaluate("document.querySelectorAll('#dbg button[data-g=\"0\"]').length")
        for i in range(n):
            await pg.evaluate(f"document.querySelectorAll('#dbg button[data-g=\"0\"]')[{i}].click()")
            await pg.wait_for_timeout(9000)
            print(await pg.evaluate(f"document.querySelectorAll('#dbg button[data-g=\"0\"]')[{i}].textContent + ' → ' + Sound.place + ' · ' + Sound.modeName + ' · ' + Math.round(Sound.bpm) + ' bpm · ' + ((Sound.REC[Sound.place].st||{{}}).sec||'')"), flush=True)
        await b.close()
asyncio.run(main())
