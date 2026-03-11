# Loyiha Arxitekturasi va O'zgarishlar (O'zbekcha)

## Oxirgi Yangilanish: 2024-03-11

### 1. Kitoblar (Books) Modeli
- **Katalog tushunchasi**: `Book` modeli endi faqat katalog sifatida xizmat qiladi.
- **O'chirilgan maydonlar**: `costPrice` (tannarx) va `minStockLimit` modeldan olib tashlandi.
- **Sklad**: Kitoblar soni (`countInStock`) saqlanib qoldi, lekin u faqat `Supplies` (Приход) orqali yangilanadi.

### 2. Ta'minot (Supplies) va Yetkazib beruvchilar
- **Supplier Modeli**: Alohida `Supplier` modeli va sahifasi butunlay o'chirildi.
- **Integratsiya**: Yetkazib beruvchi ma'lumotlari (`supplierName`, `supplierPhone`) to'g'ridan-to'g'ri `Supply` (Приход) hujjatiga yoziladigan bo'ldi.
- **To'lov Statusi**: Har bir prixod uchun `paymentStatus` ('paid' yoki 'debt') va `debtAmount` (qarz miqdori) qo'shildi.
- **Qarzni uzish**: `POST /api/supplies/:id/pay` mantiqi orqali qarzni bo'lib-bo'lib yoki to'liq to'lash imkoniyati yaratildi.

### 3. Frontend O'zgarishlari
- **Books.tsx**: Kitob qo'shish modalida sklad ma'lumotlari so'ralmaydi.
- **Supplies.tsx**: Prixodlar ro'yxatida yetkazib beruvchi nomi va qarz holati ko'rinadi. Qarzni uzish uchun "CreditCard" tugmasi qo'shildi.
- **SupplyModal.tsx**: Yangi kitoblarni tezkor qo'shish (Quick Add) mantiqi yangilandi (faqat katalog ma'lumotlari bilan).
