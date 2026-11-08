import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 320, 'height': 180})
        pg.on('pageerror', lambda e: print('PAGEERROR', e, flush=True))
        pg.on('console', lambda m: print('CONSOLE', m.type, m.text[:300], flush=True) if m.type in ('error','warning') else None)
        await pg.goto(sys.argv[1])
        for i in range(int(sys.argv[2]) if len(sys.argv)>2 else 40):
            await pg.wait_for_timeout(1000)
            st = await pg.evaluate("typeof Game!=='undefined' ? Game.state : 'nogame'")
            if st in ('title','play'): print('state', st, i); break
        await b.close()
asyncio.run(main())
