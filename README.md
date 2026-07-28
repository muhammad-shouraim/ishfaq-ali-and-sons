# ISHFAQ ALI & SONS - Luxury Jewelry eCommerce

Full-stack eCommerce website built with Node.js, Express.js, MySQL, and EJS.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express.js 4 |
| Frontend | Server-side rendered EJS templates + Vanilla JS |
| Database | MySQL (via Sequelize ORM) |
| Images | Cloudinary (cloud storage) |
| Auth | JWT (httpOnly cookies) + bcrypt + Google OAuth |
| Payments | Manual (COD, Bank Transfer, Easypaisa, JazzCash) |

## Prerequisites

- **Node.js** >= 18.x
- **MySQL** >= 8.x (or Hostinger MySQL)
- A **Cloudinary** account (free tier)
- npm or yarn

## Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd ishfaq-ali-and-sons

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Then edit .env with your actual credentials

# 4. Start the server
npm run dev
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and fill in all values:

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Server port (default: 5000) |
| `NODE_ENV` | Yes | `development` or `production` |
| `MYSQL_HOST` | Yes | MySQL host (Hostinger provides this) |
| `MYSQL_PORT` | Yes | MySQL port (default: 3306) |
| `MYSQL_DATABASE` | Yes | Database name |
| `MYSQL_USER` | Yes | MySQL username |
| `MYSQL_PASSWORD` | Yes | MySQL password |
| `JWT_SECRET` | Yes | Random secure string for token signing |
| `JWT_EXPIRE` | Yes | Token expiry (e.g., `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Yes | From Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | Yes | From Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | Yes | From Cloudinary Dashboard |
| `SITE_NAME` | Yes | Website name |
| `SITE_URL` | Yes | Website URL |
| `CONTACT_EMAIL` | Yes | Contact email |
| `CONTACT_PHONE` | Yes | Contact phone |
| `GOOGLE_CLIENT_ID` | No | For Google OAuth login |
| `GOOGLE_CLIENT_SECRET` | No | For Google OAuth login |
| `CORS_ORIGIN` | No | Frontend domain (default: `*`) |
| `ADMIN_PANEL_PATH` | Yes | Secret admin path (e.g., `/ishfaq-control-panel-x7k9`) |

### MySQL Setup

1. Create a MySQL database (via Hostinger hPanel or locally)
2. Update the `MYSQL_*` variables in `.env`
3. Run `npm start` — Sequelize auto-creates all tables

### Cloudinary Setup

1. Sign up at [Cloudinary](https://cloudinary.com) (free)
2. Go to Dashboard → copy Cloud name, API Key, API Secret
3. Add them to `.env`

## Scripts

```bash
npm run dev     # Development with auto-restart (nodemon)
npm start       # Production start
```

## Folder Structure

```
├── app.js                    # Express app setup
├── server.js                 # Entry point
├── config/
│   ├── sequelize.js          # MySQL connection
│   ├── cloudinary.js         # Cloudinary config
│   ├── constants.js          # Site constants
│   └── passport.js           # Google OAuth strategy
├── models/                   # 15 Sequelize models
├── controllers/              # 27 route controllers
├── routes/                   # 9 route files
├── middleware/
│   ├── auth.js               # JWT protect, requireAuth
│   ├── adminAuth.js          # Admin role middleware
│   ├── upload.js             # Cloudinary multer upload
│   ├── validation.js         # Express validators
│   └── errorHandler.js       # Global error handler
├── views/
│   ├── partials/             # Shared templates (header, navbar, footer)
│   ├── pages/                # Customer-facing pages
│   └── admin/pages/          # Admin panel pages
├── public/
│   ├── css/                  # Stylesheets
│   ├── js/                   # Client JS files
│   └── uploads/              # Legacy local uploads
├── config/logger.js          # Winston logger
└── logs/                     # Log files (auto-created)
```

## Deployment

### Hostinger Business Web Hosting

**This project requires a Node.js-compatible hosting environment.**

**Option 1: Hostinger VPS** (Recommended)
1. Deploy code via Git or SCP
2. Install Node.js + MySQL
3. Set up PM2: `npm install -g pm2 && pm2 start server.js`
4. Point domain to VPS IP
5. Set up SSL via Let's Encrypt

**Option 2: Hostinger Business with Node.js**
- Check if hPanel has "Node.js Selector"
- If available, select Node.js version, set entry point to `server.js`
- Set environment variables in hPanel

**Option 3: Alternative Platforms**
- **Render** — Connect GitHub repo, set start command `npm start`
- **Railway** — Auto-deploys from GitHub
- **DigitalOcean App Platform** — Click to deploy

### Database

Use Hostinger's **phpMyAdmin** or **Remote MySQL**:
1. Create database in Hostinger hPanel
2. Get MySQL host/port/user/password
3. Update `.env` with these values

### Images

All product images are stored on **Cloudinary**. Ensure your `.env` has valid Cloudinary credentials.

## Admin Panel

The admin panel uses a **secret path** configured via `ADMIN_PANEL_PATH` in `.env`.
Set it to a hard-to-guess string (e.g., `/ishfaq-control-panel-x7k9`). The old `/admin` routes are blocked and redirect to the homepage.

| `ADMIN_PANEL_PATH` Variable | Description |
|---|---|
| Set in `.env` | Custom secret path for admin access |

Available sub-routes once you reach the secret path:

| Route | Description |
|---|---|
| `/` | Dashboard with stats and charts |
| `/products` | Product CRUD |
| `/categories` | Category management |
| `/orders` | Order management with status workflow |
| `/customers` | Customer list and details |
| `/coupons` | Discount coupons |
| `/reviews` | Review moderation |
| `/media` | Media library (Cloudinary) |
| `/pages` | CMS pages |
| `/promotions` | Promotion banners |
| `/blogs` | Blog posts |
| `/settings` | General + payment settings |

## API Routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/products` | Product listing API |
| GET | `/api/admin/media` | Media library API |
| POST | `/api/cart/*` | Cart operations |
| POST | `/api/wishlist/*` | Wishlist operations |
| GET | `/api/search` | Product search |

## Troubleshooting

### Database Connection Error
- Ensure MySQL is running
- Verify `MYSQL_*` env vars are correct
- Check if MySQL allows remote connections (Hostinger: enable Remote MySQL)
- Run `npm start` again after fixing

### Images Not Uploading
- Check `CLOUDINARY_*` env vars
- Ensure Cloudinary account is active
- Check file size (max 10MB)
- Allowed formats: jpeg, jpg, png, gif, webp, svg

### Port Already in Use
```bash
# Change PORT in .env or kill existing process
npx kill-port 5000
```

### Google OAuth Not Working
- Get credentials from [Google Cloud Console](https://console.cloud.google.com)
- Set authorized redirect URI: `http://localhost:5000/auth/google/callback`
- Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
