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
- [2026-03-05]: Local Development uchun API yo'naltirishlari `http://localhost:5000/api` ga o'zgartirildi (Admin paneldagi `constants.ts` va `.env` orqali). Mobile app esa Expo orqali local IP manzilni avtomatik aniqlaydigan qilib sozlandi (`mobile/services/api.ts`).
- [2026-03-05]: `Book` modeliga qo'lda kiritiladigan `barcode` maydoni qo'shildi. Admin panel (Books va Supplies Quick Add) formalarida shtrixkodni qo'lda kiritish imkoniyati yaratildi.
- [2026-03-05]: FIFO inventory system implemented. 
  - `SupplyBatch` model tracks costs per shipment.
  - `Order.totalCostPrice` stores COGS at order time.
  - Reports updated to use stored cost for accurate profit calculation.
- [2026-03-05]: POS Customer Display implemented using `BroadcastChannel API` for real-time window synchronization. New route `/pos-customer` added for client viewing.
- [2026-03-06]: CRM (Customer Relationship Management) va Sodofat (Loyalty) tizimi joriy etildi.
  - **Customer Model**: Mijozlar ismi, telefoni va umumiy xarid summasi bilan saqlanadi.
  - **POS Integration**: Kassir endi mijozni telefon raqami orqali topishi yoki yangi mijoz qo'shishi mumkin. Mijozning umumiy xarid tarixi Kassada ko'rinadi, bu esa "hurmat" chegirmasini (manual discount) berishga asos bo'ladi.
  - **Admin CRM Dashboard**: Mijozlar ro'yxati, qidiruvi va eng ko'p kitob olgan mijozlar reytingi (Top Customers) yaratildi.

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
- **SPA Routing (Refresh Fix)**:
  - Render Dashboard -> Admin Service -> **Redirects/Rewrites**
  - **Source**: `/*`
  - **Destination**: `/index.html`
  - **Action**: `Rewrite`
- **Env Vars Required**:
  - `VITE_API_URL`: Backend API URL'i (masalan: `https://your-server.onrender.com/api`).
