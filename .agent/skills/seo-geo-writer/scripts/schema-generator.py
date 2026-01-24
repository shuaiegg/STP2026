#!/usr/bin/env python3
"""
Schema Generator for SEO/GEO Content

Generates JSON-LD structured data for articles, FAQs, and HowTo content.

Usage:
    python schema-generator.py --type article --title "Title" --description "Desc" ...
    python schema-generator.py --type faq --input faqs.json
    python schema-generator.py --type combined --config config.json
"""

import argparse
import json
import sys
from datetime import datetime
from typing import Optional


def generate_article_schema(
    title: str,
    description: str,
    author_name: str,
    author_type: str = "Organization",
    author_url: Optional[str] = None,
    publisher_name: Optional[str] = None,
    publisher_logo: Optional[str] = None,
    image_url: Optional[str] = None,
    date_published: Optional[str] = None,
    date_modified: Optional[str] = None,
    canonical_url: Optional[str] = None,
    primary_entity: Optional[str] = None,
    secondary_entities: Optional[list] = None,
) -> dict:
    """Generate Article schema."""

    schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title[:110],  # Max 110 chars recommended
        "description": description,
    }

    # Author
    author = {"@type": author_type, "name": author_name}
    if author_url:
        author["url"] = author_url
    schema["author"] = author

    # Publisher
    if publisher_name:
        publisher = {"@type": "Organization", "name": publisher_name}
        if publisher_logo:
            publisher["logo"] = {"@type": "ImageObject", "url": publisher_logo}
        schema["publisher"] = publisher

    # Image
    if image_url:
        schema["image"] = image_url

    # Dates
    today = datetime.now().strftime("%Y-%m-%d")
    schema["datePublished"] = date_published or today
    schema["dateModified"] = date_modified or date_published or today

    # Main entity
    if canonical_url:
        schema["mainEntityOfPage"] = {"@type": "WebPage", "@id": canonical_url}

    # About/Mentions for entity relationships
    if primary_entity:
        schema["about"] = {"@type": "Thing", "name": primary_entity}

    if secondary_entities:
        schema["mentions"] = [
            {"@type": "Thing", "name": entity} for entity in secondary_entities
        ]

    return schema


def generate_faq_schema(faqs: list[dict]) -> dict:
    """
    Generate FAQPage schema.

    Args:
        faqs: List of dicts with 'question' and 'answer' keys
    """
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": faq["question"],
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq["answer"]
                }
            }
            for faq in faqs
        ]
    }


def generate_howto_schema(
    title: str,
    description: str,
    steps: list[dict],
    total_time: Optional[str] = None,
    image_url: Optional[str] = None,
    tools: Optional[list] = None,
    supplies: Optional[list] = None,
) -> dict:
    """
    Generate HowTo schema.

    Args:
        steps: List of dicts with 'name' and 'text' keys (optional: 'image', 'url')
    """
    schema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": title,
        "description": description,
        "step": [
            {
                "@type": "HowToStep",
                "name": step.get("name", f"Step {i+1}"),
                "text": step["text"],
                **({"image": step["image"]} if step.get("image") else {}),
                **({"url": step["url"]} if step.get("url") else {}),
            }
            for i, step in enumerate(steps)
        ]
    }

    if total_time:
        schema["totalTime"] = total_time

    if image_url:
        schema["image"] = image_url

    if tools:
        schema["tool"] = [{"@type": "HowToTool", "name": t} for t in tools]

    if supplies:
        schema["supply"] = [{"@type": "HowToSupply", "name": s} for s in supplies]

    return schema


def generate_breadcrumb_schema(items: list[dict]) -> dict:
    """
    Generate BreadcrumbList schema.

    Args:
        items: List of dicts with 'name' and 'url' keys
    """
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": i + 1,
                "name": item["name"],
                "item": item["url"]
            }
            for i, item in enumerate(items)
        ]
    }


def generate_combined_schema(config: dict) -> dict:
    """
    Generate combined schema with @graph for multiple types.

    Config should have keys: 'article', 'faqs', 'breadcrumbs' (all optional)
    """
    graph = []

    if "article" in config:
        graph.append(generate_article_schema(**config["article"]))

    if "faqs" in config and config["faqs"]:
        faq_schema = generate_faq_schema(config["faqs"])
        # Remove @context for graph
        del faq_schema["@context"]
        graph.append(faq_schema)

    if "breadcrumbs" in config and config["breadcrumbs"]:
        bc_schema = generate_breadcrumb_schema(config["breadcrumbs"])
        del bc_schema["@context"]
        graph.append(bc_schema)

    if "howto" in config:
        howto_schema = generate_howto_schema(**config["howto"])
        del howto_schema["@context"]
        graph.append(howto_schema)

    return {
        "@context": "https://schema.org",
        "@graph": graph
    }


def main():
    parser = argparse.ArgumentParser(description="Generate JSON-LD Schema")
    parser.add_argument(
        "--type",
        choices=["article", "faq", "howto", "breadcrumb", "combined"],
        required=True,
        help="Schema type to generate"
    )
    parser.add_argument("--config", help="JSON config file path")
    parser.add_argument("--title", help="Content title")
    parser.add_argument("--description", help="Content description")
    parser.add_argument("--author", help="Author name")
    parser.add_argument("--author-type", default="Organization", help="Author type")
    parser.add_argument("--author-url", help="Author URL")
    parser.add_argument("--publisher", help="Publisher name")
    parser.add_argument("--publisher-logo", help="Publisher logo URL")
    parser.add_argument("--image", help="Cover image URL")
    parser.add_argument("--url", help="Canonical URL")
    parser.add_argument("--date-published", help="Publish date (YYYY-MM-DD)")
    parser.add_argument("--date-modified", help="Modified date (YYYY-MM-DD)")
    parser.add_argument("--entity", help="Primary entity name")
    parser.add_argument("--secondary-entities", help="Comma-separated secondary entities")
    parser.add_argument("--input", help="Input JSON file for FAQs/steps")
    parser.add_argument("--pretty", action="store_true", help="Pretty print output")

    args = parser.parse_args()

    schema = None

    if args.type == "combined" and args.config:
        with open(args.config, "r") as f:
            config = json.load(f)
        schema = generate_combined_schema(config)

    elif args.type == "article":
        if not args.title or not args.description or not args.author:
            parser.error("article requires --title, --description, and --author")

        secondary = args.secondary_entities.split(",") if args.secondary_entities else None
        schema = generate_article_schema(
            title=args.title,
            description=args.description,
            author_name=args.author,
            author_type=args.author_type,
            author_url=args.author_url,
            publisher_name=args.publisher,
            publisher_logo=args.publisher_logo,
            image_url=args.image,
            date_published=args.date_published,
            date_modified=args.date_modified,
            canonical_url=args.url,
            primary_entity=args.entity,
            secondary_entities=secondary,
        )

    elif args.type == "faq":
        if not args.input:
            parser.error("faq requires --input with JSON file containing FAQs")
        with open(args.input, "r") as f:
            faqs = json.load(f)
        schema = generate_faq_schema(faqs)

    elif args.type == "howto":
        if not args.input or not args.title or not args.description:
            parser.error("howto requires --input, --title, and --description")
        with open(args.input, "r") as f:
            data = json.load(f)
        schema = generate_howto_schema(
            title=args.title,
            description=args.description,
            steps=data.get("steps", data),
            total_time=data.get("totalTime"),
            tools=data.get("tools"),
            supplies=data.get("supplies"),
        )

    elif args.type == "breadcrumb":
        if not args.input:
            parser.error("breadcrumb requires --input with JSON file")
        with open(args.input, "r") as f:
            items = json.load(f)
        schema = generate_breadcrumb_schema(items)

    if schema:
        indent = 2 if args.pretty else None
        print(json.dumps(schema, indent=indent, ensure_ascii=False))
    else:
        parser.error("Could not generate schema. Check arguments.")
        sys.exit(1)


if __name__ == "__main__":
    main()
