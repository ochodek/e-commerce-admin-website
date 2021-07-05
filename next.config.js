module.exports = {
  reactStrictMode: true,
  images: {
    deviceSizes: [320, 420, 768, 1024, 1200],
    // iconSizes: [],
    domains: [
      '127.0.0.1:80',
      '127.0.0.1:3000',
      '127.0.0.1',
      'dropgala.com',
      'media.dropgala.com',
      'dropgala-test.fra1.digitaloceanspaces.com'
    ],
    path: '/_next/image',
    loader: 'default'
  },
  env: {
    JWT_KEY: '',
    GTAG_MEASUREMENT_ID: '',
    FB_APPID: '',
    NEXT_PUBLIC_LOGROCKET_ID: '',
    SENTRY_DSN: 'https://37ded038a57b4b9fb298ff89015192ef@o912422.ingest.sentry.io/5849453'
  }
};
