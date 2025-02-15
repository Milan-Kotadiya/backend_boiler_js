const {
  TRACK_SITE_VISIT,
  MAX_VISIT_LIMIT,
  RESTRICTION_MINUTES,
  COOKIE_STORAGE,
} = require("../config/dotenv.config");
const {
  RedisGet,
  RedisSet,
  RedisDelete,
} = require("../connections/redis.connection");

// Middleware to track visits
const siteVisitMonitor = async (req, res, next) => {
  try {
    if (!TRACK_SITE_VISIT) {
      return next(); // Skip tracking if disabled
    }
    const now = Date.now();

    if (COOKIE_STORAGE == "redis") {
      const ip = req.ip === "::1" ? "127.0.0.1" : req.ip; // Identify user by IP address (can replace with a token or user ID for logged-in users)

      const redisKey = `${ip}:visit:${req.method}:${req.url}:${req.method}`;
      const redisKeyRestricted = `${ip}:restricted:${req.method}:${req.url}`;
      let restrictedUserData = await RedisGet(redisKeyRestricted);
      let userData = await RedisGet(redisKey);

      if (restrictedUserData) {
        if (restrictedUserData.restrictedUntil > now) {
          const timeLeft = Math.ceil(
            (restrictedUserData.restrictedUntil - now) / 1000 / 60
          );
          return res.status(429).json({
            message: `Too many requests. Please come back after ${timeLeft} minute(s).`,
          });
        } else {
          await RedisDelete(redisKeyRestricted);
        }
      }

      if (!userData) {
        userData = {
          visitCount: 0,
          restrictedUntil: null,
        };
      }

      userData.visitCount += 1;

      if (userData.visitCount > MAX_VISIT_LIMIT) {
        userData.restrictedUntil = now + RESTRICTION_MINUTES * 60 * 1000; // Set restriction period

        await RedisDelete(redisKey);
        await RedisSet(redisKeyRestricted, userData, RESTRICTION_MINUTES * 60);
        return res.status(429).json({
          message: `Too many requests. You are restricted for ${RESTRICTION_MINUTES} minutes.`,
        });
      }

      await RedisSet(redisKey, userData);
    } else {
      // Store in req.cookie
      const cookieKey = `visit`;
      const restrictedKey = `restricted`;
      let userData = JSON.parse(getCookie(req, cookieKey) || "{}");
      let restrictedUserData = JSON.parse(
        getCookie(req, restrictedKey) || "{}"
      );

      if (
        restrictedUserData.restrictedUntil &&
        restrictedUserData.restrictedUntil > now
      ) {
        const timeLeft = Math.ceil(
          (restrictedUserData.restrictedUntil - now) / 1000 / 60
        );
        return res.status(429).json({
          message: `Too many requests. Please come back after ${timeLeft} minute(s).`,
        });
      } else if (restrictedUserData.restrictedUntil) {
        setCookie(res, restrictedKey, "", { maxAge: 0, path: "/" }); // Clear restriction cookie
      }

      if (!userData.visitCount) {
        userData = {
          visitCount: 0,
          restrictedUntil: null,
        };
      }

      // userData.visitCount += 1;

      if (userData.visitCount > MAX_VISIT_LIMIT) {
        userData.restrictedUntil = now + RESTRICTION_MINUTES * 60 * 1000; // Restriction period
        setCookie(
          res,
          restrictedKey,
          JSON.stringify({ restrictedUntil: userData.restrictedUntil }),
          { maxAge: RESTRICTION_MINUTES * 60, path: "/" }
        );
        setCookie(res, cookieKey, "", { maxAge: 0, path: "/" }); // Clear visit count cookie
        return res.status(429).json({
          message: `Too many requests. You are restricted for ${RESTRICTION_MINUTES} minutes.`,
        });
      }

      setCookie(res, cookieKey, JSON.stringify(userData), {
        maxAge: 3600, // 1-hour expiry
        path: "/", // Make path explicit to ensure it works across different endpoints
      });
    }

    next();
  } catch (error) {
    console.log(error, "error");
  }
};

// Get a cookie by name
const getCookie = (req, name) => {
  const cookies = req.cookies || {};
  return cookies[name] || null; // Return the cookie value or null if not found
};

// Set a cookie dynamically
const setCookie = (res, key, value, options = {}) => {
  const {
    secure = false, // Default: not secure if true Only sent over HTTPS
    httpOnly = true, // Default: HttpOnly
    sameSite = "Lax", // Default: Lax for CSRF prevention
    path = "/", // Default path
    maxAge, // Expiration time in seconds (optional)
    expires, // Specific expiration date (optional)
  } = options;

  const cookieOptions = {
    httpOnly,
    secure,
    sameSite,
    path,
  };

  // Add maxAge or expires if provided
  if (maxAge) cookieOptions.maxAge = maxAge * 1000; // Convert seconds to milliseconds
  if (expires) cookieOptions.expires = new Date(expires);

  res.cookie(key, value, cookieOptions);
};

const deleteCookie = (res, name, options = {}) => {
  const {
    path = "/", // Default path for the cookie
    secure = false, // Default: not secure, only sent over HTTPS if true
    httpOnly = true, // Default: HttpOnly
    sameSite = "Lax", // Default: Lax for CSRF prevention
  } = options;

  res.cookie(name, "", {
    httpOnly,
    secure,
    sameSite,
    path,
    maxAge: 0, // Setting maxAge to 0 deletes the cookie
  });
};

module.exports = { getCookie, setCookie, deleteCookie };

/**
 * 🌟 **Cookie Management Options Documentation**
 *
 * This documentation describes the available options for setting cookies dynamically.
 * Each option provides flexibility to customize cookie behavior as per your requirements.
 *
 * ---
 *
 * 🔒 **1. `secure`**
 * - **Type**: `boolean`
 * - **Default**: `false`
 * - **Description**:
 *   If `true`, the cookie is sent **only over HTTPS** connections. This ensures secure
 *   transmission and prevents interception.
 * - **Use Case**:
 *   Use for cookies containing sensitive data on secure websites.
 * - **Example**:
 *   ```javascript
 *   secure: true
 *   ```
 *
 * ---
 *
 * 🔑 **2. `httpOnly`**
 * - **Type**: `boolean`
 * - **Default**: `true`
 * - **Description**:
 *   If `true`, the cookie is **not accessible via client-side JavaScript** (e.g.,
 *   through `document.cookie`). Helps prevent **XSS (Cross-Site Scripting)** attacks.
 * - **Use Case**:
 *   Use for session tokens or sensitive data cookies to enhance security.
 * - **Example**:
 *   ```javascript
 *   httpOnly: true
 *   ```
 *
 * ---
 *
 * ⏳ **3. `maxAge`**
 * - **Type**: `number`
 * - **Description**:
 *   The lifetime of the cookie in **seconds**. The browser automatically deletes the
 *   cookie after this duration.
 * - **Use Case**:
 *   Use for cookies that should expire after a specific time, such as session cookies
 *   or user preferences.
 * - **Example**:
 *   ```javascript
 *   maxAge: 3600 // 1 hour
 *   ```
 *
 * ---
 *
 * 📅 **4. `expires`**
 * - **Type**: `Date`
 * - **Description**:
 *   Specifies the exact date and time when the cookie expires. If both `maxAge` and
 *   `expires` are set, `expires` takes precedence.
 * - **Use Case**:
 *   Use for cookies that require precise expiration control.
 * - **Example**:
 *   ```javascript
 *   expires: new Date('2025-01-01T00:00:00Z')
 *   ```
 *
 * ---
 *
 * 🛡️ **5. `sameSite`**
 * - **Type**: `"Strict" | "Lax" | "None"`
 * - **Default**: `"Lax"`
 * - **Description**:
 *   Controls whether the cookie is sent with **cross-site requests**, helping to
 *   prevent **CSRF (Cross-Site Request Forgery)** attacks.
 *   - **`"Strict"`**: Sent only for same-site requests. Use for high-security apps.
 *   - **`"Lax"`**: Sent for same-site requests and top-level cross-site navigation
 *     (e.g., link clicks). Default for general use.
 *   - **`"None"`**: Sent for all requests, including cross-site. **Requires `secure: true`.**
 * - **Use Case**:
 *   Protect against CSRF attacks or control cookie behavior in cross-origin scenarios.
 * - **Example**:
 *   ```javascript
 *   sameSite: "Strict"
 *   ```
 *
 * ---
 *
 * 📂 **6. `path`**
 * - **Type**: `string`
 * - **Default**: `"/"`
 * - **Description**:
 *   Specifies the URL path for which the cookie is valid. The cookie is sent for
 *   requests matching this path and its subpaths.
 * - **Use Case**:
 *   Restrict cookies to specific parts of the website.
 * - **Example**:
 *   ```javascript
 *   path: "/user"
 *   ```
 *
 * ---
 *
 * 💡 **Complete Example**
 * ```javascript
 * const options = {
 *   secure: true,             // Cookie sent only over HTTPS 🔒
 *   httpOnly: true,           // Prevent client-side JavaScript access 🔑
 *   maxAge: 3600,             // Cookie expires after 1 hour ⏳
 *   sameSite: "Lax",          // Protect against CSRF attacks 🛡️
 *   path: "/",                // Cookie valid for the entire website 📂
 * };
 *
 * setCookie(res, "auth_token", "your_jwt_token", options);
 * ```
 *
 * This will set a cookie with the following characteristics:
 * - **Name**: `auth_token`
 * - **Value**: `your_jwt_token`
 * - Sent **only over HTTPS**, protected from XSS and CSRF attacks.
 * - Expires after **1 hour**.
 *
 */
