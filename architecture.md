# Project Architecture and Decisions

## Mobile App
- **Sharing**: Integrated `React Native Share API` on the Profile screen to enable users to share the app.
- **Marketing**: Adopted Islamic marketing principles by using honest and beneficial messaging for app sharing.
- **Branch Ma'lumotlari Izolyatsiyasi (Strict Branch Data Isolation):**
  Barcha asosiy ma'lumotlar (Zakazlar, Xarajatlar, Xodimlar, Kanban Vazifalar va h.k.) qat'iy ravishda filiallar kesimida ajratilgan. Superadmin bo'lmagan foydalanuvchilar (Manager/Kassir) faqat o'zlariga biriktirilgan filial ma'lumotlarini ko'ra oladilar va tahrirlay oladilar. Backend API darajasida barcha so'rovlar foydalanuvchining `req.user.branch` parametriga ko'ra filtrlanadi.
- **UI/UX**: Maintained a consistent design language using a card-based menu system with icons and gradients.
- **Language**: The profile screen and share messages are primarily in Russian as per current project requirements.

## Context Updates
- [2026-02-26]: Added "Share App" button to `ProfileScreen`.
- [2026-03-03]: Render Deployment tayyorgarligi yakunlandi.
  - **Server (Backend)**: Web Service orqali deploy qilinadi. `FRONTEND_URL` va `MONGO_URI` env o'zgaruvchilari talab qilinadi.
  - **Admin (Frontend)**: Static Site orqali deploy qilinadi. `VITE_API_URL` env o'zgaruvchisi orqali backend bilan bog'lanadi. React Router uchun `_redirects` fayli qo'shildi.

## Deployment Details (Render)
### Backend (Web Service)
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Env Vars Required**:
  - `PORT`: 10000 (default)
  - `MONGO_URI`: MongoDB ulanish adresi.
  - `JWT_SECRET`: JWT kodlash uchun kalit.
  - `FRONTEND_URL`: Admin panelning Renderdagi static URL'i (CORS uchun).
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Rasm yuklash uchun.

### Admin (Static Site)
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Env Vars Required**:
  - `VITE_API_URL`: Backend API URL'i (masalan: `https://your-server.onrender.com/api`).
