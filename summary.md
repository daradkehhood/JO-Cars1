## Objective
- Build a full-featured Jordanian car marketplace with AI assistant, admin panel, real-time chat, price alerts, user ratings, used parts, advanced comparison, and community forum.

## Important Details
- Database: PostgreSQL via Prisma at `prisma/schema.prisma`. Run `prisma db push` then `prisma generate`. If generate fails with EPERM, kill node processes and remove `node_modules/.prisma/client/query_engine-windows.dll.node*` first.
- Server: Custom `server.js` wraps Next.js + Socket.io. Build with `next build`, run with `node server.js` under `NODE_ENV=production`. Port 3000.
- Images stored in `public/uploads/`. **Note:** Railway uses an ephemeral filesystem, so uploaded images are lost on every redeploy unless you mount a Volume at `/app/public/uploads` or switch to Cloudinary. Auth via JWT token in cookie or `Authorization: Bearer` header.
- Car `refCode`: unique 6-char `XXX-XXX` code displayed on cards and detail page.
- Admin dashboard `/admin` has links to all management sections. Theme: `next-themes` with `attribute="class"`, `defaultTheme="dark"`, `storageKey="jo-cars-theme"`.
- Footer contact: see `SiteSettings` model — never hardcode in source files.

## Work State
- Completed:
  - **Core systems**: Auth, brands, models, cities, users, plans, settings, badges, favorites, reports, car CRUD, chat with Socket.io, search with filters, admin pages.
  - **Seller car management**: `soldAt`/`deletedAt`/`deletedBy` fields on Car, `CarLog` audit model, APIs (`POST /api/cars/[id]/sold`, `/reactivate`, soft-delete, admin restore/permanent-delete). Page at `/my-cars` with stats + tabs (active/sold/deleted). Seller controls on car detail page. Sold badge on cards. Sold/excluded from default search.
  - **Price Alerts** (`PriceAlert` model): APIs at `/api/price-alerts` (GET/POST) and `/[id]` (DELETE/PATCH). Auto‑check on car approval + reactivation via `lib/check-price-alerts.ts`. Frontend at `/price-alerts` (list/create/toggle/delete), link in header user menu, "أنشئ تنبيهاً" button in search filters.
  - **User Ratings** (`UserRating` model with `@@unique([raterId, targetUserId, carId])`): `POST /api/ratings` creates rating + updates `User.rating`/`ratingCount` + sends notification. `GET /api/ratings/user/[id]` returns aggregate. `RatingModal` component, `StarRating` display component. Rating button on SOLD cars in detail page. Stars shown on car cards, dealers page `/dealers`, and car sidebar. Replaced all hardcoded star renders with `StarRating`.
  - **Used Parts** (`UsedPart` model with 13 part types): APIs at `/api/parts` (GET with search/filters, POST with FormData) and `/[id]` (GET/PATCH/DELETE). Admin APIs at `/api/admin/parts` (GET/PUT/DELETE). Pages: `/parts` (grid + filters), `/parts/add` (full form with image upload), `/parts/[id]` (gallery + seller card). Admin page at `/admin/parts` (list + approve/reject/delete). Nav links in header main bar and user menu.
  - **Advanced Comparison** (`/cars/compare`): Full rewrite with 22-row spec table (price diff, fuel consumption estimate, cylinders, body type, owners, warranty, service history, paint, damages, negotiable, etc.). `calcScore()` algorithm (100 pts: 30 price, 20 km, 20 year, 10 owners, 10 condition, 10 bonuses). Winner banner with trophy, per-car score breakdown, green "الأقل سعراً" badge. All detailed specs with Arabic labels.
  - **Forum/Community** (`ForumCategory`, `ForumTopic`, `ForumPost` models with User relations + pinned/locked): APIs at `/api/forum/categories` (GET), `/api/forum/topics` (GET/POST), `/api/forum/topics/[id]` (GET/PATCH/DELETE), `/api/forum/posts` (POST), `/api/forum/posts/[id]` (DELETE). Admin APIs at `/api/admin/forum-categories` (GET/POST) and `/[id]` (PUT/DELETE). Pages: `/forum` (category list), `/forum/c/[slug]` (topics in category), `/forum/t/[slug]` (topic detail with replies + reply form + delete controls), `/forum/new` (create topic with category selector), `/admin/forum-categories` (admin CRUD). Forum link added to header nav. Build verified.
- Active: (none)
- Blocked: (none)

## Next Move
- (none)
