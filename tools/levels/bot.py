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
   R(p=1,dir=1,until='tx(b)>=36',frames=400),R(p=0,dir=1,until='tx(s)>=38.0',frames=300),R(p=0,dir=0,jp=1,jump=1,frames=14),R(p=0,dir=1,jp=1,jump=1,frames=30),R(p=0,dir=1,until='s.keys>0',frames=200),R(p=0,dir=1,until='tx(s)>=50.6',frames=400),R(p=0,dir=1,frames=40),
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

 ('spark','4'):[R(dir=1,until='tx(s)>=13.5'),R(dir=0,until='ty(s)>=16.9',frames=200),R(dir=1,until='s.keys>0',frames=500),R(dir=1,until='tx(s)>=40.5',frames=300),
   R(jump=1,until='ty(s)<=11.9',frames=200),R(dir=1,jump=1,until='tx(s)>=46.5',frames=200),R(dir=1,jp=1,jump=1,frames=30),R(dir=1,until='tx(s)>=55.3',frames=300),R(dir=1,until='tx(s)>=64.6',frames=400)],
 ('spark','5'):[R(dir=1,until='tx(s)>=12.4'),R(dir=1,jp=1,jump=1,frames=28),R(dir=1,until='tx(s)>=18.6',frames=200),R(dir=1,jp=1,jump=1,frames=28),R(dir=1,until='tx(s)>=29.4',frames=300),
   R(dir=1,jp=1,jump=1,frames=30),R(dir=1,until='tx(s)>=38.6',frames=300),R(fire=1,frames=40),R(dir=1,until='tx(s)>=50.4',frames=400),R(dir=1,jp=1,jump=1,frames=34),
   R(dir=1,until='tx(s)>=58.4',frames=300),R(dir=1,jp=1,jump=1,frames=12),R(dir=1,jp=1,jump=1,frames=24),R(dir=1,fire=1,until='tx(s)>=78.6',frames=700)],
 ('spark','6'):[*[x for i in range(9) for x in (R(dir=1,until='tx(s)>=C[0].x/40-0.9',frames=200),R(dir=1,ap=1,frames=12),R(dir=0,frames=24))],
   R(dir=-1,frames=10),R(dir=1,jp=1,jump=1,frames=12),R(dir=1,jp=1,jump=1,frames=40),R(dir=1,until='tx(s)>=27.5',frames=300),
   *[x for i in range(6) for x in (R(dir=1,until='tx(s)>=C[1].x/40-0.9',frames=300),R(dir=1,ap=1,frames=12),R(dir=0,frames=24))],
   R(dir=-1,frames=14),R(dir=1,jp=1,jump=1,frames=26),R(dir=0,until='s.onGround&&ty(s)<16.5',frames=60),R(dir=0,jp=1,jump=1,frames=12),R(dir=1,jp=1,jump=1,frames=30),R(dir=1,until='tx(s)>=64.6',frames=500)],
 ('spark','7'):[R(dir=1,until='tx(s)>=12.5',frames=300),R(dir=1,until='tx(s)>=15.4',frames=100),R(dir=1,jp=1,jump=1,frames=12),R(dir=1,jp=1,jump=1,frames=20),R(dir=1,until='s.onGround',frames=60),
   R(dir=1,until='tx(s)>=19.4',frames=100),R(dir=1,until='tx(s)>=22.4',frames=100),R(dir=1,jp=1,jump=1,frames=12),R(dir=1,jp=1,jump=1,frames=16),R(dir=1,until='s.onGround',frames=60),
   R(dir=-1,until='tx(s)<=26.5',frames=100),R(dir=0,frames=10),R(dir=1,fire=1,until='tx(s)>=43.2',frames=900),R(dir=1,jp=1,jump=1,frames=12),R(dir=1,jp=1,jump=1,frames=24),R(dir=1,fire=1,until='tx(s)>=64.4',frames=900),R(dir=1,jp=1,jump=1,frames=34),R(dir=1,fire=1,until='tx(s)>=76.6',frames=600)],
 ('spark','8'):[R(dir=1,until='ty(s)>=11.9',frames=200),R(dir=1,until='tx(s)>=22.4',frames=200),R(dir=1,jp=1,jump=1,frames=28),R(dir=1,until='ty(s)>=17.9',frames=300),
   R(dir=-1,until='tx(s)<=30.6',frames=200),R(dir=-1,jp=1,jump=1,frames=28),R(dir=-1,until='ty(s)>=23.9',frames=400),R(dir=1,until='ty(s)>=34.9',frames=300),R(dir=1,fire=1,until='tx(s)>=46.6',frames=600)],
 ('spark','9'):[R(dir=1,until='tx(s)>=7.4'),R(dir=1,jp=1,jump=1,frames=28),R(dir=1,until='tx(s)>=16.5',frames=200),R(dir=0,until='ty(s)>=16.9',frames=200),R(dir=1,until='s.keys>0',frames=400),
   R(dir=1,until='tx(s)>=33.5',frames=300),R(jump=1,until='ty(s)<=12.9',frames=200),R(dir=1,jump=1,until='tx(s)>=34.6',frames=100),R(dir=1,jp=1,jump=1,frames=30),R(dir=1,until='tx(s)>=44.6',frames=300),R(fire=1,frames=40),
   R(dir=1,until='tx(s)>=51.4',frames=200),R(dir=1,jp=1,jump=1,frames=18),R(dir=1,jp=1,jump=1,frames=14),R(dir=1,ap=1,frames=12),R(dir=1,frames=30),R(dir=1,until='tx(s)>=70.4',frames=300),R(dir=1,jp=1,jump=1,frames=30),
   R(dir=1,until='tx(s)>=79.3',frames=300),R(dir=1,until='tx(s)>=86.4',frames=300),R(dir=1,jp=1,jump=1,frames=12),R(dir=1,jp=1,jump=1,frames=30),R(dir=1,fire=1,until='tx(s)>=104.6',frames=700)],

 ('bolt','4'):[R(p=1,dir=1,until='tx(b)>=12.6'),R(p=1,dir=0,until='ty(b)>=16.9',frames=200),R(p=1,dir=1,until='b.keys>0',frames=500),R(p=1,jump=1,until='ty(b)<=11.2',frames=200),R(p=1,dir=1,jump=1,until='tx(b)>=45.0',frames=300),
   R(p=1,dir=1,jp=1,jump=1,frames=40),R(p=1,dir=1,until='tx(b)>=54.3',frames=300),R(p=1,dir=1,until='tx(b)>=63.6',frames=400)],
 ('bolt','5'):[R(p=1,dir=1,until='tx(b)>=21.9',frames=500),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,until='tx(b)>=24.4',frames=60),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,until='tx(b)>=27.4',frames=60),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),
   R(p=1,dir=1,until='tx(b)>=30.4',frames=60),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,until='tx(b)>=58.6',frames=600),R(p=1,dir=1,fire=1,until='tx(b)>=67.6',frames=500)],
 ('bolt','6'):[R(p=1,dir=1,until='tx(b)>=11.3'),R(p=1,dir=1,jp=1,jump=1,frames=30),R(p=1,dir=1,fire=1,until='tx(b)>=17.0',frames=200),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,fire=1,until='tx(b)>=22.0',frames=100),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),
   R(p=1,dir=1,fire=1,until='tx(b)>=29.8',frames=200),R(p=1,dir=1,jp=1,jump=1,frames=30),R(p=1,dir=1,fire=1,until='tx(b)>=39.3',frames=300),R(p=1,dir=1,jp=1,jump=1,frames=30),
   R(p=1,dir=1,fire=1,until='tx(b)>=44.6',frames=200),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,fire=1,until='tx(b)>=53.3',frames=200),R(p=1,dir=1,jp=1,jump=1,frames=30),
   R(p=1,dir=1,fire=1,until='tx(b)>=58.6',frames=200),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,fire=1,until='tx(b)>=72.6',frames=700)],
 ('bolt','7'):[R(p=1,dir=1,until='tx(b)>=20.5',frames=300),R(p=1,dir=0,jp=1,jump=1,frames=14),R(p=1,ap=1,frames=60),R(p=1,dir=1,fire=1,until='b.keys>0',frames=400),R(p=1,dir=1,fire=1,until='tx(b)>=40.6',frames=300),
   R(p=1,dir=0,until='M[0].y/40>=23.9',frames=1500),R(p=1,dir=1,jp=1,jump=1,frames=20),R(p=1,dir=0,until='b.onGround',frames=40),R(p=1,dir=0,until='M[0].y/40<=12.1',frames=1500),R(p=1,dir=1,fire=1,until='tx(b)>=58.6',frames=500)],
 ('bolt','8'):[R(p=1,dir=1,until='tx(b)>=7.0'),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,until='tx(b)>=11.0',frames=60),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,until='tx(b)>=14.4',frames=60),R(p=1,dir=0,until='M[0].y/40>=31.9',frames=1500),
   R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=0,frames=10),R(p=1,dir=1,until='tx(b)>=18.0',frames=30),R(p=1,dir=0,until='M[0].y/40<=19.1',frames=1500),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),
   R(p=1,dir=1,fire=1,until='tx(b)>=31.6',frames=300),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,until='tx(b)>=35.6',frames=60),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,until='tx(b)>=39.6',frames=60),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,until='tx(b)>=41.8',frames=60),
   R(p=1,dir=0,until='M[1].y/40>=12.9',frames=1500),R(p=1,dir=1,until='tx(b)>=44.0',frames=40),R(p=1,dir=0,frames=10),R(p=1,dir=0,until='M[1].y/40<=8.1',frames=1500),R(p=1,dir=-1,jp=1,jump=1,frames=22),R(p=1,dir=-1,until='b.onGround',frames=60),R(p=1,dir=-1,until='tx(b)<=33.3',frames=400)],
 ('bolt','9'):[R(p=1,dir=1,until='C[0].x/40>=16.95',frames=600),R(p=1,dir=-1,frames=10),R(p=1,dir=1,jp=1,jump=1,frames=40),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,fire=1,until='tx(b)>=30.6',frames=400),
   R(p=1,dir=1,jp=1,jump=1,frames=30),R(p=1,dir=1,until='tx(b)>=37.0',frames=200),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,until='tx(b)>=38.4',frames=30),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,until='tx(b)>=51.6',frames=300),
   R(p=1,dir=0,until='ty(b)>=16.9',frames=200),R(p=1,dir=1,until='b.keys>0',frames=400),R(p=1,dir=1,until='tx(b)>=71.4',frames=300),R(p=1,jump=1,until='ty(b)<=14.2',frames=200),R(p=1,dir=1,jump=1,until='tx(b)>=72.5',frames=60),
   R(p=1,dir=1,jp=1,jump=1,frames=30),R(p=1,dir=1,until='tx(b)>=79.4',frames=200),R(p=1,dir=0,jp=1,jump=1,frames=14),R(p=1,ap=1,frames=60),R(p=1,dir=1,fire=1,until='tx(b)>=96.6',frames=500),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,fire=1,until='tx(b)>=106.6',frames=500)],

 ('duo','4'):[R(p=1,dir=1,until='tx(b)>=10.0'),R(p=0,dir=1,also=dict(p=1,dir=0),until='tx(s)>=14.6',frames=300),R(p=0,dir=0,until='ty(s)>=16.9',frames=200),R(p=0,dir=1,until='s.keys>0',frames=600),
   R(p=0,dir=-1,until='tx(s)<=22.6',frames=400),R(p=0,jump=1,until='ty(s)<=11.9',frames=200),R(p=0,dir=1,jump=1,until='tx(s)>=23.2',frames=60),R(p=0,dir=1,jp=1,jump=1,frames=30),R(p=0,dir=1,until='tx(s)>=27',frames=100),
   R(p=1,dir=1,until='tx(b)>=14.6',frames=300),R(p=1,dir=1,jump=1,until='tx(b)>=22.9',frames=400),R(p=1,dir=1,jp=1,jump=1,frames=34),R(p=1,dir=1,until='tx(b)>=33.2',frames=200),
   R(p=0,dir=1,until='tx(s)>=35.2',frames=200),R(p=0,dir=0,frames=20),R(p=0,jump=1,until='ty(s)<=11.9',frames=200),R(p=0,dir=1,jump=1,until='tx(s)>=46.3',frames=400),R(p=0,dir=1,jp=1,jump=1,frames=30),R(p=0,dir=1,until='tx(s)>=55.4',frames=300),
   R(p=1,dir=1,until='tx(b)>=35.3',frames=300),R(p=1,dir=0,frames=20),R(p=1,jump=1,until='ty(b)<=11.4',frames=200),R(p=1,dir=1,jump=1,until='tx(b)>=45.6',frames=400),R(p=1,dir=1,jp=1,jump=1,frames=40),
   R(p=1,dir=1,until='tx(b)>=66.0',frames=500),R(p=0,dir=1,until='tx(s)>=66.6',frames=400)],
 ('duo','5'):[R(p=1,dir=1,until='tx(b)>=11.3'),R(p=1,dir=1,jp=1,jump=1,frames=30),R(p=0,dir=1,until='tx(s)>=11.3',frames=200),R(p=0,dir=1,jp=1,jump=1,frames=30),R(p=0,dir=1,until='s.onGround',frames=60),
   R(p=1,dir=1,until='tx(b)>=30.6',frames=600),R(p=0,dir=1,until='tx(s)>=27',frames=600),R(p=0,dir=1,jp=1,jump=1,frames=12),R(p=0,dir=1,until='s.onGround&&ty(s)<16.5',frames=120),R(p=0,dir=0,frames=10),
   R(p=1,ap=1,frames=4),R(p=0,dir=1,frames=26),R(p=0,dir=1,until='s.onGround',frames=120),R(p=0,dir=1,until='tx(s)>=37.3',frames=80),R(p=0,dir=0,frames=6),
   R(p=1,dir=1,also=dict(p=0,dir=0),until='tx(b)>=41',frames=300),R(p=0,dir=1,until='ty(s)>=16.9',frames=200),
   R(p=1,dir=1,until='tx(b)>=43.3',frames=100),R(p=1,dir=1,jp=1,jump=1,frames=30),R(p=0,dir=1,until='tx(s)>=43.3',frames=100),R(p=0,dir=1,jp=1,jump=1,frames=30),
   R(p=1,dir=1,until='tx(b)>=50.6',frames=200),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=0,dir=1,until='tx(s)>=50.6',frames=200),R(p=0,dir=1,jp=1,jump=1,frames=22),R(p=0,dir=1,until='s.onGround',frames=60),R(p=1,dir=1,until='tx(b)>=61.3',frames=200),R(p=1,dir=1,jp=1,jump=1,frames=30),
   R(p=0,dir=1,until='tx(s)>=61.3',frames=200),R(p=0,dir=1,jp=1,jump=1,frames=30),R(p=0,dir=1,until='tx(s)>=65.6',frames=200),R(p=0,fire=1,frames=30),R(p=0,dir=0,jp=1,jump=1,frames=6),R(p=0,fire=1,jump=1,frames=20),R(p=0,dir=0,until='s.onGround',frames=60),R(p=0,dir=0,jp=1,jump=1,frames=5),R(p=0,fire=1,jump=1,frames=20),
   R(p=1,dir=1,fire=1,until='tx(b)>=74.0',frames=500),R(p=0,dir=1,until='tx(s)>=74.6',frames=300)],
 ('duo','6'):[R(p=1,dir=1,until='C[0].x/40>=18.95',frames=600),R(p=1,dir=-1,frames=10),R(p=1,dir=1,jp=1,jump=1,frames=40),R(p=1,dir=1,until='b.onGround',frames=60),
   R(p=0,dir=1,until='tx(s)>=17.0',frames=400),R(p=0,dir=1,jp=1,jump=1,frames=12),R(p=0,dir=1,jp=1,jump=1,frames=30),R(p=0,dir=1,until='s.onGround',frames=60),
   R(p=1,dir=1,until='tx(b)>=29.3',frames=300),R(p=1,dir=1,jp=1,jump=1,frames=30),R(p=0,dir=1,until='tx(s)>=29.3',frames=300),R(p=0,dir=1,jp=1,jump=1,frames=30),
   R(p=0,dir=1,until='tx(s)>=34.6',frames=200),R(p=0,fire=1,frames=30),R(p=0,dir=0,jp=1,jump=1,frames=5),R(p=0,fire=1,jump=1,frames=20),R(p=0,dir=0,until='s.onGround',frames=60),R(p=0,dir=0,jp=1,jump=1,frames=5),R(p=0,fire=1,jump=1,frames=20),R(p=0,dir=0,until='s.onGround',frames=60),
   R(p=1,dir=1,until='tx(b)>=37.0',frames=300),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,until='tx(b)>=39.0',frames=60),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,until='tx(b)>=41.2',frames=60),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,until='tx(b)>=48.5',frames=300),R(p=1,dir=0,jp=1,jump=1,frames=14),R(p=1,ap=1,frames=60),
   R(p=0,dir=1,until='tx(s)>=37.2',frames=200),R(p=0,dir=1,jp=1,jump=1,frames=22),R(p=0,dir=1,until='s.onGround',frames=60),R(p=0,dir=1,until='tx(s)>=39.2',frames=60),R(p=0,dir=1,jp=1,jump=1,frames=22),R(p=0,dir=1,until='s.onGround',frames=60),R(p=0,dir=1,until='tx(s)>=41.3',frames=60),R(p=0,dir=1,jp=1,jump=1,frames=22),R(p=0,dir=1,until='s.onGround',frames=60),R(p=0,dir=1,until='ty(s)>=16.9',frames=400),
   R(p=1,dir=1,fire=1,until='tx(b)>=62.6',frames=400),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,fire=1,until='tx(b)>=74.0',frames=400),R(p=0,dir=1,until='tx(s)>=62.6',frames=400),R(p=0,dir=1,jp=1,jump=1,frames=22),R(p=0,dir=1,until='s.onGround',frames=60),R(p=0,dir=1,until='tx(s)>=74.6',frames=400)],
 ('duo','7'):[R(p=0,dir=1,until='tx(s)>=9.0'),R(p=0,dir=0,frames=6),R(p=0,dir=0,jp=1,jump=1,frames=14),R(p=0,dir=1,jp=1,jump=1,frames=14),R(p=0,dir=0,until='s.onGround',frames=60),R(p=0,dir=1,until='tx(s)>=12.4',frames=60),
   R(p=0,dir=1,until='ty(s)>=16.9',frames=200),R(p=0,dir=1,until='tx(s)>=18.4',frames=200),R(p=0,dir=1,until='tx(s)>=24.4',frames=200),R(p=0,dir=0,frames=10),
   R(p=1,dir=1,fire=1,until='tx(b)>=34.0',frames=600),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,fire=1,until='tx(b)>=44.0',frames=300),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),
   R(p=0,dir=1,fire=1,until='tx(s)>=34.0',frames=300),R(p=0,dir=1,jp=1,jump=1,frames=22),R(p=0,dir=1,until='s.onGround',frames=60),R(p=0,dir=1,fire=1,until='tx(s)>=44.0',frames=300),R(p=0,dir=1,jp=1,jump=1,frames=22),R(p=0,dir=1,until='s.onGround',frames=60),
   R(p=1,dir=1,fire=1,until='tx(b)>=55.3',frames=300),R(p=1,dir=1,jp=1,jump=1,frames=34),R(p=0,dir=1,fire=1,until='tx(s)>=55.5',frames=300),R(p=0,dir=1,jp=1,jump=1,frames=34),
   R(p=1,dir=1,fire=1,until='tx(b)>=62.6',frames=300),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,until='tx(b)>=74.0',frames=300),R(p=0,dir=1,until='tx(s)>=62.6',frames=300),R(p=0,dir=1,jp=1,jump=1,frames=22),R(p=0,dir=1,until='s.onGround',frames=60),R(p=0,dir=1,until='tx(s)>=74.6',frames=300)],
 ('duo','8'):[R(p=1,dir=1,until='tx(b)>=10.4'),R(p=0,dir=1,until='tx(s)>=9.0',frames=200),R(p=1,dir=0,until='M[0].y/40>=32.9',frames=1500),
   R(p=1,dir=1,jp=1,jump=1,frames=20),R(p=0,dir=1,jp=1,jump=1,also=dict(p=1,dir=0),frames=24),R(p=0,dir=0,until='s.onGround&&b.onGround',frames=60),
   R(p=0,dir=0,until='M[0].y/40<=9.05',frames=1500),R(p=1,dir=1,also=dict(p=0,dir=1),until='tx(b)>=18&&tx(s)>=17',frames=120),
   R(p=1,dir=1,until='tx(b)>=22.0',frames=200),R(p=0,dir=1,also=dict(p=1,dir=0),until='tx(s)>=29.0',frames=300),R(p=1,dir=1,also=dict(p=0,dir=0),until='tx(b)>=31.0',frames=300),
   R(p=1,dir=1,until='tx(b)>=34.3',frames=100),R(p=1,dir=1,jp=1,jump=1,frames=30),R(p=1,dir=1,fire=1,until='tx(b)>=45.0',frames=300),R(p=0,dir=1,until='tx(s)>=34.3',frames=100),R(p=0,dir=1,jp=1,jump=1,frames=30),R(p=0,dir=1,until='tx(s)>=45.6',frames=300)],
 ('duo','9'):[R(p=1,dir=1,until='tx(b)>=12.0'),R(p=0,dir=1,also=dict(p=1,dir=0),until='tx(s)>=22.0',frames=300),R(p=1,dir=1,also=dict(p=0,dir=0),until='tx(b)>=24.3',frames=300),R(p=1,dir=1,jp=1,jump=1,frames=30),
   R(p=0,dir=1,until='tx(s)>=24.3',frames=100),R(p=0,dir=1,jp=1,jump=1,frames=30),R(p=1,dir=1,until='tx(b)>=31.6',frames=300),R(p=0,dir=1,until='tx(s)>=28',frames=300),R(p=0,dir=1,jp=1,jump=1,frames=12),R(p=0,dir=1,until='s.onGround&&ty(s)<16.5',frames=120),R(p=0,dir=0,frames=10),
   R(p=1,ap=1,frames=4),R(p=0,dir=1,frames=24),R(p=0,dir=1,until='s.onGround',frames=120),R(p=0,dir=1,until='s.keys>0',frames=120),R(p=0,dir=-1,until='ty(s)>=16.9',frames=300),
   R(p=1,dir=1,until='tx(b)>=38.6',frames=200),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,until='tx(b)>=40.3',frames=60),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=0,dir=1,until='tx(s)>=38.6',frames=200),R(p=0,dir=1,jp=1,jump=1,frames=22),R(p=0,dir=1,until='s.onGround',frames=60),R(p=0,dir=1,until='tx(s)>=40.3',frames=60),R(p=0,dir=1,jp=1,jump=1,frames=22),R(p=0,dir=1,until='s.onGround',frames=60),
   R(p=1,dir=1,until='tx(b)>=44.6',frames=100),R(p=1,jump=1,dir=1,until='tx(b)>=62.0',frames=600),R(p=1,dir=1,jp=1,jump=1,frames=40),R(p=1,dir=1,until='tx(b)>=64.5',frames=100),
   R(p=0,dir=1,until='tx(s)>=44.6',frames=100),R(p=0,jump=1,dir=1,until='tx(s)>=62.3',frames=600),R(p=0,dir=1,jp=1,jump=1,frames=30),R(p=0,dir=1,until='tx(s)>=64.5',frames=100),
   R(p=1,dir=1,fire=1,until='C[0].x/40>=79.95',frames=600),R(p=1,dir=-1,frames=10),R(p=1,dir=1,jp=1,jump=1,frames=40),R(p=1,dir=1,until='b.onGround',frames=60),
   R(p=0,dir=1,until='tx(s)>=78.0',frames=400),R(p=0,dir=1,jp=1,jump=1,frames=12),R(p=0,dir=1,jp=1,jump=1,frames=30),R(p=0,dir=1,fire=1,until='tx(s)>=92.4',frames=400),
   R(p=1,dir=1,fire=1,until='tx(b)>=96.0',frames=400),R(p=1,dir=1,jp=1,jump=1,frames=22),R(p=1,dir=1,until='b.onGround',frames=60),R(p=1,dir=1,fire=1,until='tx(b)>=104.0',frames=400),R(p=0,dir=1,until='tx(s)>=96.0',frames=200),R(p=0,dir=1,jp=1,jump=1,frames=22),R(p=0,dir=1,until='s.onGround',frames=60),R(p=0,dir=1,until='tx(s)>=104.6',frames=300)],
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
            ok=r['state']=='done' and not r.get('tele')
            if r.get('tele'): print('   ТЕЛЕПОРТ:',r['tele'][:3])
            if VERB: print('EX',await pg.evaluate("(x)=>__T.go(x)","JSON.stringify({ex:exitRect,lock:exitLocked,inE:players.map(p=>[p.inExit,p.down,p.absent,p.dead])})"))
            if VERB: print('PZ',await pg.evaluate("(x)=>__T.go(x)","JSON.stringify(pzList.map(z=>({t:z.type,o:z.order,prog:z.prog,lit:z.lit,done:z.done})))"))
            print(mode,num,info,'=>',r['state'],'frames',r['frames'],'OK' if ok else 'FAIL', errs[:2])
            if not ok or VERB:
                for l in r['log']: print('   ',l)
            await pg.close()
        await b.close()
DIFF='normal'; NOEN=False; VERB=False
args=sys.argv[1:]
if args and args[0]=='noen': NOEN=True; args=args[1:]
if args and args[0]=='v': VERB=True; args=args[1:]
if args and args[0].startswith('diff='): DIFF=args[0][5:]; args=args[1:]
keys=[tuple(a.split(':')) for a in args] if args else list(SC.keys())
asyncio.run(main(keys))
