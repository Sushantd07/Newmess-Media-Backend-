  import dotenv from 'dotenv';
  dotenv.config({ path: './.env' });

  import express from 'express';
  import connectDB from './db/index.js';

  import categoryRoutes from './routes/categoryRoutes.js';
import subcategoryRoutes from './routes/subcategoryRoutes.js';
import companyPageRoutes from './routes/companyPageRoutes.js';
import tabRoutes from './routes/tabRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import structuredComplaintsRoutes from './routes/structuredComplaintsRoutes.js';
import dynamicPageRoutes from './routes/dynamicPageRoutes.js';
import contactNumbersRoutes from './routes/contactNumbersRoutes.js';

// Import all models to register them with Mongoose
import './models/Category.js';
import './models/Subcategory.js';
import './models/CompanyPage.js';
import './models/tabs/ContactNumbers.tabs.js';
import './models/tabs/Complaint.tabs.js';
import './models/tabs/QuickHelp.tabs.js';
import './models/tabs/VideoGuide.tabs.js';
import './models/tabs/OverviewTabs.js';
import './models/SeoSetting.js';
import './models/DynamicPage.js';
import './models/ContactNumbers.js';

  import cors from 'cors';
  import bodyParser from 'body-parser';
  import seoRoutes from './routes/seoRoutes.js';

  const app = express();

  // ✅ CORS Configuration for ngrok support
  const allowedOrigins = [
    "http://localhost:5173", 
    "http://localhost:5174", 
    "http://localhost:3000", 
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "https://localhost:5173",
    "https://localhost:5174",
    "https://localhost:3000",
    "https://127.0.0.1:5173",
    "https://127.0.0.1:5174",
    "https://gzd2rl1g-5173.inc1.devtunnels.ms",
    "https://ca0ad85c14cc.ngrok-free.app",
    // Production frontend domains
    "https://indiacustomerhelp.com",
    "https://www.indiacustomerhelp.com"
  ];

  // Add ngrok domains to allowed origins
  if (process.env.NGROK_URL) {
    allowedOrigins.push(process.env.NGROK_URL);
  }

  // Include FRONTEND_ORIGIN from env if provided
  if (process.env.FRONTEND_ORIGIN) {
    allowedOrigins.push(process.env.FRONTEND_ORIGIN);
  }

  // Allow all ngrok.io domains
  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow localhost and ngrok domains
      if (allowedOrigins.includes(origin) || 
          origin.includes('ngrok.io') || 
          origin.includes('ngrok-free.app') ||
          origin.includes('indiacustomerhelp.com')) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  };

  app.use(cors(corsOptions));

  // ✅ Increase request size limits for large content
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // ✅ Proxy middleware for ngrok
  app.use((req, res, next) => {
    // Trust proxy headers for ngrok
    app.set('trust proxy', 1);
    
    // Log ngrok requests
    if (req.headers['x-forwarded-proto'] === 'https') {
      console.log(`🌐 Ngrok request: ${req.method} ${req.path}`);
    }
    
    next();
  });

  // Body parsing middleware with increased limits for large content
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

  // ✅ Health check endpoint for ngrok
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      ngrok: !!req.headers['x-forwarded-proto']
    });
  });

  // ✅ Static file serving for frontend public assets
  app.use('/category-icons', express.static('../Frontend/public/category-icons'));
  app.use('/company-logos', express.static('../Frontend/public/company-logos'));

  // ✅ Routes
  app.use('/api/categories', categoryRoutes);
  app.use('/api/subcategories', subcategoryRoutes);
  app.use('/api/company-pages', companyPageRoutes);
  app.use('/api/tabs', tabRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/seo', seoRoutes);
  app.use('/api/structured-complaints', structuredComplaintsRoutes);
  app.use('/api/dynamic-pages', dynamicPageRoutes);
  app.use('/api/contact-numbers', contactNumbersRoutes);
  // Alias route under /tabs for non-coder friendly admin operations
  app.use('/tabs', contactNumbersRoutes);

  // ✅ Dynamic Sitemap.xml
  app.get('/sitemap.xml', async (req, res) => {
    try {
      // Lazy-import models to avoid circular deps on startup
      const { default: Category } = await import('./models/Category.js');
      const { default: CompanyPage } = await import('./models/CompanyPage.js');

      const siteUrl = process.env.SITE_URL || 'https://indiacustomerhelp.com';

      const [categories, companies] = await Promise.all([
        Category.find({ isActive: true }).select('slug updatedAt').lean(),
        CompanyPage.find({}).select('categoryId slug updatedAt').lean()
      ]);

      const urls = [];
      // Static core routes
      urls.push({ loc: `${siteUrl}/`, priority: '1.0' });
      urls.push({ loc: `${siteUrl}/category`, priority: '0.9' });

      // Category listing pages
      for (const c of categories) {
        urls.push({ loc: `${siteUrl}/category/${encodeURIComponent(c.slug)}`, lastmod: c.updatedAt, priority: '0.8' });
      }

      // Company pages under category/:categoryId/:companySlug
      for (const cp of companies) {
        if (!cp.categoryId || !cp.slug) continue;
        urls.push({ loc: `${siteUrl}/category/${encodeURIComponent(cp.categoryId)}/${encodeURIComponent(cp.slug)}`, lastmod: cp.updatedAt, priority: '0.7' });
      }

      const toISO = (d) => (d ? new Date(d).toISOString() : undefined);
      const xmlItems = urls.map(u => `  <url>\n    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${toISO(u.lastmod)}</lastmod>` : ''}${u.priority ? `\n    <priority>${u.priority}</priority>` : ''}\n  </url>`).join('\n');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlItems}\n</urlset>`;
      res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
      res.send(xml);
    } catch (err) {
      console.error('Failed to generate sitemap.xml:', err);
      res.status(500).type('text/plain').send('Failed to generate sitemap');
    }
  });

  // ✅ Error handling middleware
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid JSON payload' 
      });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ 
        success: false, 
        message: 'Request payload too large. Please reduce the content size.' 
      });
    }
    next(err);
  });

  // ✅ Start server after DB connection
  connectDB()
    .then(() => {
      const port = process.env.PORT || 3000;
      app.listen(port, () => {
        console.log(`🚀 Server is running on port ${port}`);
        console.log(`🌐 Local: http://localhost:${port}`);
        console.log(`🔗 Health check: http://localhost:${port}/health`);
        if (process.env.NGROK_URL) {
          console.log(`🌍 Ngrok URL: ${process.env.NGROK_URL}`);
        }
      });
    })
    .catch((err) => {
      console.error('❌ Database connection failed:', err);
    });
