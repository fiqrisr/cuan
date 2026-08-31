import fs from 'node:fs/promises';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import path from 'node:path';

async function generateOgImage() {
  const fontReq = await fetch('https://raw.githubusercontent.com/googlefonts/opensans/main/fonts/ttf/OpenSans-SemiBold.ttf');
  const fontData = await fontReq.arrayBuffer();

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#111413',
          backgroundImage: 'radial-gradient(ellipse at 50% -20%, rgba(159, 209, 186, 0.15) 0%, transparent 60%)',
          fontFamily: 'OpenSans',
          color: '#e2e3e0',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '40px',
                marginBottom: '32px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '120px',
                      height: '120px',
                      border: '2px solid rgba(159, 209, 186, 0.15)',
                      borderRadius: '32px',
                      boxShadow: '0 24px 60px -16px rgba(159, 209, 186, 0.08), 0 8px 24px -8px rgba(0, 0, 0, 0.18)',
                      backgroundColor: 'rgba(26, 28, 27, 0.5)',
                    },
                    children: [
                      {
                        type: 'svg',
                        props: {
                          xmlns: 'http://www.w3.org/2000/svg',
                          width: '60',
                          height: '60',
                          viewBox: '0 0 24 24',
                          fill: 'none',
                          stroke: '#9fd1ba',
                          strokeWidth: '1.75',
                          strokeLinecap: 'round',
                          strokeLinejoin: 'round',
                          children: [
                            { type: 'path', props: { d: 'M12 8V4H8' } },
                            { type: 'rect', props: { width: '16', height: '12', x: '4', y: '8', rx: '2' } },
                            { type: 'path', props: { d: 'M2 14h2' } },
                            { type: 'path', props: { d: 'M20 14h2' } },
                            { type: 'path', props: { d: 'M15 13v2' } },
                            { type: 'path', props: { d: 'M9 13v2' } },
                          ],
                        }
                      }
                    ]
                  }
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '150px',
                      fontWeight: 600,
                      letterSpacing: '-0.03em',
                      color: '#e2e3e0',
                      marginTop: '-8px',
                    },
                    children: 'Cuan',
                  },
                }
              ]
            }
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: '56px',
                textAlign: 'center',
                maxWidth: '1000px',
                lineHeight: '1.4',
                color: '#8e928f',
                marginTop: '16px',
                fontWeight: 500,
              },
              children: 'Your personal AI financial assistant.',
            },
          }
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'OpenSans',
          data: fontData,
          weight: 600,
          style: 'normal',
        },
      ],
    }
  );

  const resvg = new Resvg(svg, {
    background: '#111413',
    fitTo: { mode: 'width', value: 1200 },
  });
  
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  const outPath = path.join(process.cwd(), 'public', 'og-image.png');
  await fs.writeFile(outPath, pngBuffer);
  console.log(`Generated OG Image at ${outPath}`);
}

generateOgImage().catch(console.error);
