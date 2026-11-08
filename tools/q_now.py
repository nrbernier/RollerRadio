import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 320, 'height': 180})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(sys.argv[1])
        await pg.wait_for_function("typeof Game !== 'undefined' && (Game.state === 'title' || Game.state === 'play')", timeout=240000, polling=1000)
        await pg.evaluate("document.getElementById('title').dispatchEvent(new PointerEvent('pointerdown')); G.renderer.render=()=>{}; 1")
        await pg.wait_for_timeout(1500)
        print(await pg.evaluate(open(sys.argv[2]).read()))
        for e in errs[:3]: print('ERR', e)
        await b.close()
asyncio.run(main())
