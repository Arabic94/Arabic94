# Arabic Reader — Backend (Node.js + Express + Neon Postgres)

## إعداد Neon
1. سجّل حساب مجاني على [neon.tech](https://neon.tech)
2. أنشئ Project جديد (بيعمل قاعدة بيانات افتراضية تلقائيًا)
3. من لوحة التحكم → **Connection Details** → انسخ الـ connection string، شكله:
   ```
   postgresql://<user>:<password>@<endpoint>.neon.tech/<dbname>?sslmode=require
   ```

## تشغيل محلي
```bash
npm install
cp .env.example .env   # حط DATABASE_URL و JWT_SECRET
npm run migrate        # ينشئ جدول students على قاعدة Neon
npm start
```

## النشر (deploy)
1. ارفع هذا المجلد على GitHub repo.
2. انشره على [Render](https://render.com) أو [Railway](https://railway.app):
   - Build command: `npm install && npm run migrate`
   - Start command: `npm start`
   - Environment variables: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`
3. بعد النشر رح ياخدوك رابط زي `https://your-app.onrender.com` — هاد هو `API_BASE` اللي بتحطه بأول ملف الأرتيفاكت (`ArabicReaderAPI.jsx`).

## بنية الجدول (`db/schema.sql`)
جدول واحد `students` فيه: الاسم، العمر، كلمة مرور مشفّرة (bcrypt)، الأفتار، آخر مجموعة مفتوحة، ومصفوفة نتائج كل مجموعة (`batch_passed boolean[]`).

## Endpoints
نفس الـ endpoints تمامًا زي نسخة MongoDB:

| Method | Path                    | Auth | Body                            | Notes |
|--------|-------------------------|------|----------------------------------|-------|
| POST   | /api/register           | ❌   | `{name, age, password, avatar}` | يرجع `{token, student}` |
| POST   | /api/login              | ❌   | `{name, password}`              | يرجع `{token, student}` |
| GET    | /api/student/me          | ✅   | –                                 | بيانات الطالب الحالي |
| PUT    | /api/student/avatar      | ✅   | `{avatar}`                       | تحديث الأفتار |
| PUT    | /api/student/progress    | ✅   | `{batchIndex, passed}`           | السيرفر يتحقق من `batchIndex` قبل ما يتقدم |

Auth header: `Authorization: Bearer <token>`

## ملاحظات
- كلمات المرور مشفّرة فعليًا بـ bcrypt.
- Neon فيها فري تير (0.5 GB تخزين، compute محدود) كافي جدًا لهذا المشروع.
- الفرونت اند (`ArabicReaderAPI.jsx`) ما بيحتاج أي تعديل — نفس شكل الـ API تمامًا زي نسخة MongoDB.
