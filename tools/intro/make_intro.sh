#!/bin/bash
# Склейка вступления: scene1..3.mp4 (можно подставить апскейленные, одинакового размера) + title.png -> intro.mp4
# Переходы: затемнение 0.9 с, старт из чёрного 1.6 с, название на ~24.8 с, уход в чёрное в конце.
cd "$(dirname "$0")"
ffmpeg -y -i scene1.mp4 -i scene2.mp4 -i scene3.mp4 -loop 1 -t 30 -i title.png -filter_complex "
[0:v]fps=24,format=yuv420p[a];[1:v]fps=24,format=yuv420p[b];[2:v]fps=24,format=yuv420p[c];
[a][b]xfade=transition=fadeblack:duration=0.9:offset=9.225[ab];
[ab][c]xfade=transition=fadeblack:duration=0.9:offset=18.45[abc];
[3:v]scale=iw*0.377:-1,format=rgba,fade=t=in:st=24.8:d=1.0:alpha=1[ti];
[abc][ti]overlay=x=(W-w)/2:y='55-14*(1-min(1,max(0,(t-24.8)/0.9)))':format=auto:shortest=1,
fade=t=in:st=0:d=1.6,fade=t=out:st=27.7:d=0.87[v];
[0:a][1:a]acrossfade=d=0.9[a1];[a1][2:a]acrossfade=d=0.9,afade=t=in:st=0:d=1.6,afade=t=out:st=27.1:d=1.4[aud]" -map "[v]" -map "[aud]" -c:v libx264 -crf 20 -preset veryfast -c:a aac -b:a 128k -movflags +faststart intro.mp4
# title.png 1858 px шириной масштабируется под кадр 864 px (0.377 => 700 px); для кадра 1728 px ставь 0.754
