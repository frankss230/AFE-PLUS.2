# 🏥 Smart Watch Monitoring System

ระบบติดตามสุขภาพผู้สูงอายุผ่าน Smart Watch และ LINE Notification

## 🚀 Features

- ✅ Admin Dashboard สำหรับผู้ดูแลระบบ
- ✅ LINE LIFF Integration สำหรับลงทะเบียน
- ✅ Real-time Location Tracking
- ✅ Health Monitoring (Heart Rate, Temperature)
- ✅ Fall Detection Alert
- ✅ Safezone Management
- ✅ LINE Notifications

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL
- LINE Developer Account
- LINE Bot & LIFF App

## 🔧 Installation

1. Clone the repository
\`\`\`bash
git clone <repository-url>
cd smart-watch-project
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Setup environment variables
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Configure `.env.local`:
\`\`\`env
DATABASE_URL="postgresql://user:password@localhost:5432/smartwatch_db"
LINE_CHANNEL_ID="your_channel_id"
LINE_CHANNEL_SECRET="your_channel_secret"
LINE_CHANNEL_ACCESS_TOKEN="your_access_token"
NEXT_PUBLIC_LIFF_ID="your_liff_id"
JWT_SECRET="your-secret-key-minimum-32-characters"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
\`\`\`

5. Setup Prisma
\`\`\`bash
npx prisma generate
npx prisma db push
npx prisma db seed
\`\`\`

6. Run development server
\`\`\`bash
npm run dev
\`\`\`

## 📱 LINE Setup

1. Create LINE Bot at https://developers.line.biz/console/
2. Create LIFF App
3. Set Webhook URL: `https://yourdomain.com/api/line/webhook`
4. Set LIFF Endpoint URL: `https://yourdomain.com/register`

## 🔑 Default Admin Login

- Username: `admin`
- Password: `admin123`

## 📂 Project Structure

\`\`\`
smart-watch-project/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Protected admin pages
│   ├── admin/             # Auth pages
│   ├── api/               # API routes
│   └── register/          # LIFF pages
├── components/            # React components
├── lib/                   # Utilities & integrations
├── services/              # Business logic
├── store/                 # Zustand stores
├── types/                 # TypeScript types
└── prisma/                # Database schema
\`\`\`

## 🧪 Testing

\`\`\`bash
npm run test
\`\`\`

## 📝 License

MIT

## 👥 Contributors

- Your Team
\`\`\`

---

## 📁 **22. Package Scripts (เพิ่มใน package.json)**
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push",
    "prisma:seed": "prisma db seed",
    "prisma:studio": "prisma studio",
    "prisma:reset": "prisma migrate reset"
  }
}
```

---

## 🎉 **สรุป - โครงสร้างไฟล์ทั้งหมด**