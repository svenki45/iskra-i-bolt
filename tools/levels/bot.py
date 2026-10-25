import asyncio, json, sys
from playwright.async_api import async_playwright
R=lambda **k: k
SC={
 ('spark','1'):[R(dir=1,until='tx(s)>=9.2'),R(dir=1,jp=1,jump=1,frames=25),R(dir=1,until='tx(s)>=15.3'),R(dir=1,jp=1,jump=1,frames=34),
   R(dir=1,until='tx(s)>=26.3',frames=300),R(fire=1,frames=40),R(dir=1,until='tx(s)>=35.3',frames=400),R(dir=1,jp=1,jump=1,frames=16),R(dir=1,jp=1,jump=1,frames=34),R(dir=1,until='tx(s)>=58.6',frames=600)],
 ('spark','2'):[R(dir=1,until='tx(s)>=9.4'),R(dir=1,jp=1,jump=1,frames=18),R(dir=1,jp=1,jump=1,frames=40),R(dir=1,until='tx(s)>=27.2',frames=400),R(dir=1,jp=1,jump=1,frames=26),R(dir=1,until='tx(s)>=31.4'),
   R(dir=1,jp=1,jump=1,frames=18),R(dir=1,jp=1,jump=1,frames=14),R(dir=1,ap=1,frames=12),R(dir=1,frames=30),R(dir=1,until='tx(s)>=55',frames=400),R(fire=1,frames=40),R(dir=1,until='tx(s)>=68.6',frames=600)],
 ('spark','3'):[R(dir=1,until='tx(s)>=11.6'),R(dir=1,jp=1,jump=1,frames=16),R(dir=1,jp=1,jump=1,frames=14),R(dir=0,frames=20),
   # вверх по зигзагу: каждый раз прыжок к соседнему уступу
   *[x for i in range(8) for x in ([R(dir=-1 if i%2==0 else 1,until=('tx(s)<=12.4' if i%2==0 else 'tx(s)>=11.6'),frames=200),R(dir=-1 if i%2==0 else 1,jp=1,jump=1,frames=16),R(dir=-1 if i%2==0 else 1,jp=1,jump=1,frames=14),R(dir=-1 if i%2==0 else 1,frames=10),R(dir=0,frames=20)])],
   R(dir=1,until='s.keys>0',frames=200),R(dir=1,until='ty(s)>=34.9',frames=600),R(dir=1,until='tx(s)>=41.6',frames=600)],
 ('bolt','1'):[R(p=1,dir=1,until='tx(b)>=7.0'),R(p=1,dir=1,jp=1,jump=1,frames=26),R(p=1,dir=1,until='tx(b)>=11.8'),R(p=1,dir=1,jp=1,jump=1,frames=28),
   R(p=1,dir=1,until='tx(b)>=18.8'),R(p=1,dir=1,jp=1,jump=1,frames=30),R(p=1,dir=1,until='tx(b)>=30.4',frames=300),R(p=1,dir=0,jp=1,jump=1,frames=14),R(p=1,ap=1,frames=40),R(p=1,dir=1,until='tx(b)>=41.6',frames=400)],
 ('bolt','2'):[R(p=1,dir=1,until='tx(b)>=19.4',frames=900),R(p=1,dir=-1,frames=6),R(p=1,dir=1,jp=1,jump=1,frames=40),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,until='tx(b)>=34.5',frames=400),
   R(p=1,dir=1,jp=1,jump=1,frames=30),R(p=1,dir=1,fire=1,until='tx(b)>=54.6',frames=900)],
 ('bolt','3'):[R(p=1,dir=1,until='tx(b)>=18.4',frames=600),R(p=1,dir=-1,frames=10),R(p=1,dir=1,jp=1,jump=1,frames=10),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,frames=4),R(p=1,dir=1,jp=1,jump=1,frames=10),R(p=1,dir=1,until='b.onGround',frames=60),
   R(p=1,dir=1,until='tx(b)>=32.4',frames=600),R(p=1,dir=-1,frames=10),R(p=1,dir=1,jp=1,jump=1,frames=10),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,frames=4),R(p=1,dir=1,jp=1,jump=1,frames=10),R(p=1,dir=1,until='b.onGround',frames=60),
   R(p=1,dir=1,until='tx(b)>=58.6',frames=800)],
 ('duo','1'):[R(p=1,dir=1,until='tx(b)>=16.2'),R(p=0,dir=1,until='tx(s)>=24.2',frames=400),R(p=1,dir=1,until='tx(b)>=26',frames=300),R(p=0,dir=-1,frames=4),R(p=0,dir=1,fire=1,until='tx(s)>=30.8',frames=200),R(p=0,fire=1,frames=40),
   R(p=0,dir=1,until='tx(s)>=38.6',frames=300),R(p=0,dir=1,jp=1,jump=1,frames=16),R(p=0,dir=1,jp=1,jump=1,frames=30),R(p=0,dir=1,until='s.keys>0',frames=200),R(p=0,dir=1,until='tx(s)>=50.6',frames=400),R(p=0,dir=1,frames=40),
   R(p=1,dir=1,until='tx(b)>=60.0',frames=900),R(p=0,dir=1,until='tx(s)>=60.4',frames=400)],
 ('duo','2'):[R(p=1,dir=1,until='tx(b)>=29.6',frames=600),R(p=0,dir=1,until='tx(s)>=26',frames=600),R(p=0,dir=1,jp=1,jump=1,frames=12),R(p=0,dir=1,until='s.onGround&&ty(s)<16.5',frames=120),R(p=0,dir=0,frames=10),
   R(p=1,ap=1,frames=4),R(p=0,dir=1,frames=26),R(p=0,dir=1,until='s.onGround',frames=120),R(p=0,dir=1,until='tx(s)>=35.3',frames=80),R(p=0,dir=0,frames=6),
   R(p=1,dir=1,also=dict(p=0,dir=0),until='tx(b)>=39',frames=300),R(p=0,dir=1,until='ty(s)>=16.9',frames=200),
   R(p=0,dir=1,until='tx(s)>=48.4',frames=400),R(p=0,dir=1,jp=1,jump=1,frames=14),R(p=0,dir=1,jp=1,jump=1,frames=24),R(p=0,dir=1,until='tx(s)>=54.3',frames=300),R(p=0,dir=0,frames=20),
   R(p=1,dir=1,until='tx(b)>=64.0',frames=900),R(p=0,dir=1,until='tx(s)>=64.6',frames=400)],
 ('duo','3'):[R(p=0,dir=1,until='tx(s)>=4.6'),R(p=0,dir=1,jp=1,jump=1,frames=14),R(p=0,dir=1,until='s.onGround',frames=60),R(p=0,dir=1,until='tx(s)>=8.0',frames=100),R(p=0,dir=1,jp=1,jump=1,frames=12),R(p=0,dir=1,jp=1,jump=1,frames=8),R(p=0,dir=0,until='s.onGround',frames=60),
   R(p=0,dir=1,until='tx(s)>=10.9',frames=100),R(p=0,dir=1,jp=1,jump=1,frames=12),R(p=0,dir=1,jp=1,jump=1,frames=8),R(p=0,dir=1,until='s.onGround',frames=60),
   R(p=0,dir=1,until='tx(s)>=28.1',frames=400),R(p=0,dir=0,frames=6),R(p=1,dir=1,also=dict(p=0,dir=0),until='tx(b)>=40.2',frames=600),R(p=1,dir=0,frames=4),
   R(p=0,dir=1,until='tx(s)>=35',frames=300),R(p=0,fire=1,also=dict(p=1,dir=0),frames=40),R(p=0,dir=1,also=dict(p=1,dir=0),until='tx(s)>=47',frames=400),
   R(p=1,dir=1,fire=1,until='tx(b)>=66.0',frames=900),R(p=0,dir=1,until='tx(s)>=66.6',frames=600)],
}
async def main(keys):
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        res={}
        for (mode,num) in keys:
            pg=await b.new_page(viewport={'width':960,'height':540}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.goto('file:///tmp/claude-0/bwww/index.html'); await pg.wait_for_timeout(2500)
            diff=DIFF
            await pg.evaluate("(x)=>__T.go(x)", f"(setMode({'false' if mode=='duo' else 'true'},'{mode if mode!='duo' else 'spark'}'), (run.diff='{diff}'), startGame({int(num)-1}))")
            for _ in range(40):
                await pg.wait_for_timeout(250)
                if await pg.evaluate("(x)=>__T.go(x)","state")=='play': break
            info=await pg.evaluate("(x)=>__T.go(x)","JSON.stringify({name:getLevel(levelIdx).name,rows:grid.length,cols:COLS,ob:openBottom})")
            if NOEN: await pg.evaluate("(x)=>__T.go(x)","(enemies.length=0,1)")
            r=await pg.evaluate("(c)=>RUNLEVEL(c)", SC[(mode,num)])
            await pg.evaluate("(x)=>__T.go(x)","draw()"); await pg.screenshot(path=f'/tmp/claude-0/lv/shot_{mode}{num}.png')
            ok=r['state']=='done'
            print(mode,num,info,'=>',r['state'],'frames',r['frames'],'OK' if ok else 'FAIL', errs[:2])
            if not ok:
                for l in r['log']: print('   ',l)
            await pg.close()
        await b.close()
DIFF='normal'; NOEN=False
args=sys.argv[1:]
if args and args[0]=='noen': NOEN=True; args=args[1:]
if args and args[0].startswith('diff='): DIFF=args[0][5:]; args=args[1:]
keys=[tuple(a.split(':')) for a in args] if args else list(SC.keys())
asyncio.run(main(keys))
