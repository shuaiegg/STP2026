# Schema Structured Data Templates

## Table of Contents
- [Article Schema](#article-schema)
- [FAQPage Schema](#faqpage-schema)
- [HowTo Schema](#howto-schema)
- [BreadcrumbList Schema](#breadcrumblist-schema)
- [Organization Schema](#organization-schema)
- [Combined Schema Example](#combined-schema-example)

---

## Article Schema

Use for all blog posts and articles.

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{{TITLE}}",
  "description": "{{META_DESCRIPTION}}",
  "image": "{{COVER_IMAGE_URL}}",
  "author": {
    "@type": "{{AUTHOR_TYPE}}",
    "name": "{{AUTHOR_NAME}}",
    "url": "{{AUTHOR_URL}}"
  },
  "publisher": {
    "@type": "Organization",
    "name": "{{BRAND_NAME}}",
    "logo": {
      "@type": "ImageObject",
      "url": "{{LOGO_URL}}"
    }
  },
  "datePublished": "{{PUBLISH_DATE}}",
  "dateModified": "{{MODIFIED_DATE}}",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "{{CANONICAL_URL}}"
  },
  "about": {
    "@type": "Thing",
    "name": "{{PRIMARY_ENTITY}}"
  },
  "mentions": [
    {
      "@type": "Thing",
      "name": "{{SECONDARY_ENTITY_1}}"
    },
    {
      "@type": "Thing",
      "name": "{{SECONDARY_ENTITY_2}}"
    }
  ]
}
```

### Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `TITLE` | Article headline | "AI Marketing Automation Guide" |
| `META_DESCRIPTION` | Meta description | "Learn how to..." |
| `COVER_IMAGE_URL` | Full URL to cover image | "https://..." |
| `AUTHOR_TYPE` | "Person" or "Organization" | "Organization" |
| `AUTHOR_NAME` | Author/brand name | "Scale to Top" |
| `AUTHOR_URL` | Author page URL | "https://scaletotop.com/about" |
| `BRAND_NAME` | Publisher name | "Scale to Top" |
| `LOGO_URL` | Logo image URL | "https://scaletotop.com/logo.png" |
| `PUBLISH_DATE` | ISO 8601 date | "2024-01-15T10:00:00+08:00" |
| `MODIFIED_DATE` | ISO 8601 date | "2024-01-20T14:30:00+08:00" |
| `CANONICAL_URL` | Full page URL | "https://scaletotop.com/blog/..." |
| `PRIMARY_ENTITY` | Main topic entity | "Marketing Automation" |
| `SECONDARY_ENTITY_*` | Related entities | "AI", "Growth Hacking" |

---

## FAQPage Schema

Use for content with Q&A sections. Critical for GEO visibility.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "{{QUESTION_1}}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{{ANSWER_1}}"
      }
    },
    {
      "@type": "Question",
      "name": "{{QUESTION_2}}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{{ANSWER_2}}"
      }
    }
  ]
}
```

### FAQ Writing Guidelines

**Question Format:**
- Use natural question phrases (What, How, Why, When, Which)
- Match how users/AI would ask
- Include primary keyword

**Answer Format:**
- Start with direct answer (first sentence)
- Keep total length 40-100 words
- Self-contained (no references to other content)
- Can include brand mention naturally

**Example:**
```json
{
  "@type": "Question",
  "name": "What is marketing automation?",
  "acceptedAnswer": {
    "@type": "Answer",
    "text": "Marketing automation is the use of software to automate repetitive marketing tasks like email campaigns, social media posting, and lead nurturing. It helps businesses scale their marketing efforts while maintaining personalization. Tools like HubSpot, Marketo, and custom solutions built on frameworks like Scale to Top's automation system are commonly used."
  }
}
```

---

## HowTo Schema

Use for tutorial and step-by-step content.

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "{{TITLE}}",
  "description": "{{DESCRIPTION}}",
  "image": "{{IMAGE_URL}}",
  "totalTime": "{{DURATION}}",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "{{CURRENCY}}",
    "value": "{{COST}}"
  },
  "supply": [
    {
      "@type": "HowToSupply",
      "name": "{{SUPPLY_1}}"
    }
  ],
  "tool": [
    {
      "@type": "HowToTool",
      "name": "{{TOOL_1}}"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "name": "{{STEP_1_NAME}}",
      "text": "{{STEP_1_TEXT}}",
      "image": "{{STEP_1_IMAGE}}",
      "url": "{{PAGE_URL}}#step1"
    },
    {
      "@type": "HowToStep",
      "name": "{{STEP_2_NAME}}",
      "text": "{{STEP_2_TEXT}}",
      "image": "{{STEP_2_IMAGE}}",
      "url": "{{PAGE_URL}}#step2"
    }
  ]
}
```

### Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `DURATION` | ISO 8601 duration | "PT30M" (30 minutes) |
| `CURRENCY` | Currency code | "USD" |
| `COST` | Numeric cost or "0" | "0" |
| `SUPPLY_*` | Required materials | "Google Analytics account" |
| `TOOL_*` | Required tools | "Spreadsheet software" |

---

## BreadcrumbList Schema

Use for navigation structure.

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "{{BASE_URL}}"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "{{CATEGORY_NAME}}",
      "item": "{{CATEGORY_URL}}"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "{{PAGE_TITLE}}",
      "item": "{{PAGE_URL}}"
    }
  ]
}
```

---

## Organization Schema

Use on homepage or about page.

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{{BRAND_NAME}}",
  "alternateName": "{{ALTERNATE_NAME}}",
  "url": "{{WEBSITE_URL}}",
  "logo": "{{LOGO_URL}}",
  "description": "{{BRAND_DESCRIPTION}}",
  "sameAs": [
    "{{TWITTER_URL}}",
    "{{LINKEDIN_URL}}",
    "{{YOUTUBE_URL}}"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "{{CONTACT_EMAIL}}"
  }
}
```

---

## Combined Schema Example

For a typical blog post, combine Article + FAQPage + BreadcrumbList:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "Marketing Automation Complete Guide 2024",
      "description": "Learn everything about marketing automation...",
      "author": {
        "@type": "Organization",
        "name": "Scale to Top"
      },
      "datePublished": "2024-01-15",
      "dateModified": "2024-01-20"
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is marketing automation?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Marketing automation is..."
          }
        }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home"},
        {"@type": "ListItem", "position": 2, "name": "Blog"},
        {"@type": "ListItem", "position": 3, "name": "Marketing Automation Guide"}
      ]
    }
  ]
}
```

---

## Schema Validation

Before using, validate schema at:
- https://validator.schema.org/
- https://search.google.com/test/rich-results
