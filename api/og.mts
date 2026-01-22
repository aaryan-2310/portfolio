import { ImageResponse } from '@vercel/og';
import { html } from 'satori-html';

export const config = {
    runtime: 'edge',
};

export default function handler(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        // Dynamic params
        const title = searchParams.get('title') || 'Portfolio';
        const subtitle = searchParams.get('subtitle') || 'Senior Software Engineer';
        const highlight = searchParams.get('highlight') || 'Angular • Node.js • Cloud';

        const template = html`
            <div
                style="height: 100%; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #181818; background-image: radial-gradient(circle at 50% 0%, #1f2937 0%, #181818 75%); font-family: 'Inter', sans-serif;"
            >
                <!-- Decorative Ring -->
                <div
                    style="position: absolute; top: -150px; left: 50%; transform: translateX(-50%); width: 600px; height: 600px; background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%); border-radius: 50%; filter: blur(40px);"
                ></div>

                <div
                    style="display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; padding: 40px 80px; text-align: center;"
                >
                    <!-- Logic for subtitle Badge -->
                    <div
                        style="display: flex; align-items: center; padding: 10px 24px; border-radius: 50px; background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #10B981; font-size: 20px; font-weight: 600; margin-bottom: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);"
                    >
                        ${subtitle}
                    </div>

                    <!-- Main Title -->
                    <div
                        style="font-size: 84px; font-weight: 800; color: white; line-height: 1.1; margin-bottom: 24px; text-shadow: 0 2px 10px rgba(0,0,0,0.3); letter-spacing: -0.03em; background-clip: text;"
                    >
                        ${title}
                    </div>

                    <!-- Highlight / Tech Stack -->
                    <div style="font-size: 32px; font-weight: 500; color: #9CA3AF; margin-top: 16px;">
                        ${highlight}
                    </div>
                </div>

                <!-- Bottom Branding -->
                <div style="position: absolute; bottom: 40px; display: flex; align-items: center; gap: 12px;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: #10B981;"></div>
                    <div style="font-size: 24px; color: #D1D5DB; font-weight: 600;">aaryan-2310</div>
                </div>
            </div>
        `;

        return new ImageResponse(template as any, {
            width: 1200,
            height: 630,
        });
    } catch (e: any) {
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
