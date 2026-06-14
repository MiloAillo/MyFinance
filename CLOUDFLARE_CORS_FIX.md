# Cloudflare CORS Configuration Guide

## Problem
When your backend is reverse-proxied through Cloudflare, CORS headers can be stripped or modified, causing CORS errors even though your backend is configured correctly.

## Cloudflare Configuration Steps

### 1. **Allow CORS Headers Through Cloudflare**

#### Option A: Using Cloudflare Page Rules (Simple)
1. Go to **Cloudflare Dashboard** → Your Domain → **Rules** → **Page Rules**
2. Click **Create Page Rule**
3. Add a rule for: `apimyfinance.mischikomoe.web.id/*`
4. Set the action to: **Cache Level: Bypass** (this ensures headers aren't cached)

#### Option B: Using Cloudflare Workers (Advanced but Recommended)
1. Go to **Cloudflare Dashboard** → Your Domain → **Workers & Pages**
2. Create a new Worker with this code:

```javascript
export default {
  async fetch(request) {
    const response = await fetch(request);
    
    // Clone the response so we can modify headers
    const newResponse = new Response(response.body, response);
    
    // Ensure CORS headers are preserved
    newResponse.headers.set('Access-Control-Allow-Origin', 'https://myfinance.mischikomoe.web.id');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    newResponse.headers.set('Access-Control-Max-Age', '3600');
    newResponse.headers.set('Access-Control-Expose-Headers', '*');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': 'https://myfinance.mischikomoe.web.id',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
          'Access-Control-Max-Age': '3600',
        }
      });
    }
    
    return newResponse;
  }
}
```
3. Deploy the Worker and route it to `apimyfinance.mischikomoe.web.id/*`

### 2. **Disable Cloudflare "Auto Minify" for API Responses**
1. Go to **Cloudflare Dashboard** → Your Domain → **Speed** → **Optimization**
2. Turn OFF:
   - Auto Minify (JavaScript, CSS, HTML)
   - Rocket Loader
   - These can interfere with API responses

### 3. **Set Correct Caching Rules**
1. Go to **Rules** → **Cache Rules**
2. Create a rule for `/api/*` paths:
   - **If**: URI path contains `/api/`
   - **Then**: Cache Level = Bypass, Browser Cache TTL = 0
   - This prevents Cloudflare from caching API responses

### 4. **Check SSL/TLS Settings**
1. Go to **SSL/TLS** → **Overview**
2. Ensure mode is set to **"Full"** or **"Full (strict)"** (not "Flexible")
3. This ensures proper HTTPS communication between Cloudflare and your backend

### 5. **Verify Origin IP is Trusted**
1. Go to **SSL/TLS** → **Origin Server**
2. Ensure your backend server IP is correctly configured
3. If using a self-signed certificate on your backend, use "Full" mode

## Backend .env Configuration

Your **production** backend `.env` should have:

```env
APP_ENV=production
APP_DEBUG=false
FRONTEND_URL=https://myfinance.mischikomoe.web.id
CORS_ALLOWED_ORIGINS=https://myfinance.mischikomoe.web.id
```

**Important**: Make sure:
- `APP_DEBUG=false` (production mode)
- `CORS_ALLOWED_ORIGINS` matches your frontend domain exactly (with https:// protocol)
- `FRONTEND_URL` is also set correctly

## Testing CORS

Test from browser console:
```javascript
fetch('https://apimyfinance.mischikomoe.web.id/api/v1/users/profile', {
    method: 'GET',
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN',
        'Content-Type': 'application/json'
    }
})
.then(r => r.json())
.then(d => console.log(d))
.catch(e => console.error(e))
```

Check the response headers:
- `Access-Control-Allow-Origin` should be `https://myfinance.mischikomoe.web.id`
- `Access-Control-Allow-Methods` should include GET, POST, PUT, DELETE, OPTIONS
- `Access-Control-Allow-Headers` should include Authorization, Content-Type

## Common Cloudflare CORS Issues

| Issue | Solution |
|-------|----------|
| "No 'Access-Control-Allow-Origin' header" | Use Worker or enable header passthrough in Page Rules |
| CORS works in localhost but not production | Check APP_DEBUG and CORS_ALLOWED_ORIGINS in .env |
| Preflight OPTIONS requests fail | Ensure your backend allows OPTIONS method (it does in Laravel) |
| Custom headers stripped | Disable Auto Minify and Rocket Loader |
| Credentials not sent | Frontend must use `withCredentials: true` (already fixed in our apiClient) |

## What We Fixed in Your Code

1. ✅ Created `.env.production` for frontend with correct API URL
2. ✅ Updated CORS config to expose all headers
3. ✅ Set `supports_credentials: true` in backend CORS
4. ✅ Created axios instance with proper interceptors
5. ✅ Now you just need to configure Cloudflare as above

