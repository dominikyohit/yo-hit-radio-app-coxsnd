import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import sharp from 'sharp';

const IMAGE_WIDTH = 2048;
const IMAGE_HEIGHT = 2048;
const BACKGROUND_COLOR = '#4B1E78';
const TEXT_COLOR = '#F7D21E';
const LOGO_WIDTH = Math.round(IMAGE_WIDTH * 0.4); // ~820px
const LOGO_MARGIN_BOTTOM = 70; // gap between logo and text
const LOGO_URL = 'https://yohitradio.com/wp-content/uploads/2024/12/logo-192-1.png';
const TEXT = 'La radio des hits';

export function registerSplashRoutes(app: App) {
  // POST /api/generate-splash - generate splash screen image
  app.fastify.post(
    '/api/generate-splash',
    {
      schema: {
        description: 'Generate a splash screen image (2048x2048 PNG)',
        tags: ['splash'],
        body: {
          type: 'object',
        },
        response: {
          200: {
            type: 'string',
            format: 'binary',
            description: 'PNG image binary data',
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      app.logger.info('Generating splash screen image');

      try {
        // Fetch the logo image
        let logoBuffer: Buffer;
        try {
          const logoResponse = await fetch(LOGO_URL);
          if (logoResponse.ok) {
            logoBuffer = Buffer.from(await logoResponse.arrayBuffer());
            app.logger.debug('Logo fetched successfully');
          } else {
            throw new Error('Logo fetch failed with status ' + logoResponse.status);
          }
        } catch (logoError) {
          app.logger.warn(
            { err: logoError },
            'Failed to fetch logo, using placeholder'
          );
          // Create a simple placeholder if logo fetch fails
          logoBuffer = await sharp({
            create: {
              width: LOGO_WIDTH,
              height: LOGO_WIDTH,
              channels: 3,
              background: BACKGROUND_COLOR,
            },
          })
            .png()
            .toBuffer();
        }

        // Resize logo to fit within 40% of image width
        const resizedLogo = await sharp(logoBuffer)
          .resize(LOGO_WIDTH, LOGO_WIDTH, {
            fit: 'contain',
            background: { r: 75, g: 30, b: 120, alpha: 0 }, // transparent background
          })
          .png()
          .toBuffer();

        // Create text image using SVG (more reliable text rendering)
        const textSvg = `
          <svg width="${IMAGE_WIDTH}" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="${IMAGE_WIDTH}" height="300" fill="${BACKGROUND_COLOR}"/>
            <text
              x="${IMAGE_WIDTH / 2}"
              y="170"
              font-family="Arial, sans-serif"
              font-size="140"
              font-weight="bold"
              fill="${TEXT_COLOR}"
              text-anchor="middle"
            >${TEXT}</text>
          </svg>
        `;

        const textImage = await sharp(Buffer.from(textSvg))
          .png()
          .toBuffer();

        // Calculate positions
        const logoTopPosition = Math.round(
          (IMAGE_HEIGHT - LOGO_WIDTH - 300 - LOGO_MARGIN_BOTTOM) / 2
        );
        const textTopPosition = logoTopPosition + LOGO_WIDTH + LOGO_MARGIN_BOTTOM;

        // Create base image with background color
        const baseImage = await sharp({
          create: {
            width: IMAGE_WIDTH,
            height: IMAGE_HEIGHT,
            channels: 3,
            background: BACKGROUND_COLOR,
          },
        })
          .png()
          .toBuffer();

        // Compose final image: base + logo + text
        const finalImage = await sharp(baseImage)
          .composite([
            {
              input: resizedLogo,
              left: Math.round((IMAGE_WIDTH - LOGO_WIDTH) / 2),
              top: logoTopPosition,
            },
            {
              input: textImage,
              left: 0,
              top: textTopPosition,
            },
          ])
          .png()
          .toBuffer();

        app.logger.info(
          { size: finalImage.length },
          'Splash screen image generated successfully'
        );

        // Set response headers
        reply.header('Content-Type', 'image/png');
        reply.header(
          'Content-Disposition',
          'inline; filename="splash-screen.png"'
        );

        // Send the image buffer
        return reply.send(finalImage);
      } catch (error) {
        app.logger.error(
          { err: error },
          'Failed to generate splash screen image'
        );
        throw error;
      }
    }
  );
}
