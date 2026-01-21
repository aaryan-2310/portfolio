import React from 'react';
import { ImageResponse } from '@vercel/og';

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

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#181818',
                        backgroundImage: 'radial-gradient(circle at 50% 0%, #1f2937 0%, #181818 75%)',
                        fontFamily: 'Inter, sans-serif',
                    }}
                >
                    {/* Decorative Ring */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '-150px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '600px',
                            height: '600px',
                            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
                            borderRadius: '50%',
                            filter: 'blur(40px)',
                        }}
                    />

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10,
                            padding: '40px 80px',
                            textAlign: 'center',
                        }}
                    >
                        {/* Logic for subtitle Badge */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '10px 24px',
                                borderRadius: '50px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#10B981',
                                fontSize: 20,
                                fontWeight: 600,
                                marginBottom: 32,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                            }}
                        >
                            {subtitle}
                        </div>

                        {/* Main Title */}
                        <div
                            style={{
                                fontSize: 84,
                                fontWeight: 800,
                                color: 'white',
                                lineHeight: 1.1,
                                marginBottom: 24,
                                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                                letterSpacing: '-0.03em',
                                backgroundClip: 'text',
                            }}
                        >
                            {title}
                        </div>

                        {/* Highlight / Tech Stack */}
                        <div
                            style={{
                                fontSize: 32,
                                fontWeight: 500,
                                color: '#9CA3AF',
                                marginTop: 16,
                            }}
                        >
                            {highlight}
                        </div>
                    </div>

                    {/* Bottom Branding */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 40,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                background: '#10B981',
                            }}
                        />
                        <div
                            style={{
                                fontSize: 24,
                                color: '#D1D5DB',
                                fontWeight: 600,
                            }}
                        >
                            aaryan-2310
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            },
        );
    } catch (e: any) {
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
