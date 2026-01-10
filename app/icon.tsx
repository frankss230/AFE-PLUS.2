import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  const blue = '#2563EB';
  const slate = '#F1F5F9';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'white',
          }}
        />

        <div
          style={{
            position: 'absolute',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: `4px solid ${slate}`,
            borderTop: `4px solid ${blue}`,
            transform: 'rotate(45deg)',
            boxSizing: 'border-box',
          }}
        />

        <div
            style={{
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
            }}
        >
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={blue}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}