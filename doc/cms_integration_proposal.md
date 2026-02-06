# CMS Direct Publishing Proposal: WordPress Integration

**Status**: Proposal / On Hold
**Last Updated**: 2026-02-06

## Goal
Streamline the "Creation-to-Publishing" workflow by allowing users to publish generated content directly from StellarWriter to their CMS (focusing on WordPress initially). Target time reduction: 10 mins -> 5 seconds.

## Core Architecture: Client-Side Direct
Using the browser to communicate directly with the CMS API avoids storing user credentials on our servers and minimizes privacy risks.

### 1. Authentication
*   **Method**: Application Passwords (WordPress 5.6+ Standard).
*   **Storage**: Browser LocalStorage (encrypted) or session-only.
*   **CORS**: Requires user to allow CORS or use a stateless proxy (e.g., Next.js API Route) if direct browser connection fails.

### 2. Workflow & Data Mapping

#### Step 1: Configuration (UI)
User inputs:
*   `Site URL`: e.g., `https://my-blog.com`
*   `Username`: e.g., `admin`
*   `App Password`: `xxxx xxxx xxxx xxxx`

#### Step 2: Data Transformation
Map StellarWriter JSON to WordPress REST API fields:

| StellarWriter Field | WordPress Field (`POST /wp/v2/posts`) | Notes |
| :--- | :--- | :--- |
| `seoMetadata.title` | `title` | |
| `htmlContent` | `content` | Markdown must be converted to HTML first |
| `seoMetadata.slug` | `slug` | |
| `seoMetadata.description` | `excerpt` | |
| `seoMetadata.keywords` | `tags` | Requires creating tags first if they don't exist |
| `status` | `status` | Always set to `'draft'` for safety |

### 3. Image Handling Strategy (Critical) 🖼️
**Problem**: Generated articles use remote URLs (e.g., Pollinations.ai).
**Solution**: "Auto-Sideloading" (Automatic upload and replacement).

**Process**:
1.  **Scan**: Regex identifying all image URLs in the content.
2.  **Download**: Fetch image blob in the browser.
3.  **Upload**: `POST /wp/v2/media` to user's WordPress.
4.  **Replace**: Update the Image URL in the content HTML with the returned local URL.
5.  **Set Featured**: Set the first uploaded image as `featured_media`.

### 4. SEO Plugin Integration (Advanced)
Inject metadata into fields used by popular plugins:
*   **Yoast SEO**: `_yoast_wpseo_title`, `_yoast_wpseo_metadesc`
*   **RankMath**: `rank_math_title`, `rank_math_description`

## UI/UX Flow
1.  **Button**: "Publish to WordPress" in Step 3 Results.
2.  **Status**: Real-time progress bar (Connecting -> Uploading Images (1/3) -> Creating Draft).
3.  **Success**: "Draft Created! [Edit in WordPress]" link.

---
*This document serves as a blueprint for future implementation.*
