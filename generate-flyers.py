"""
Tonight App — Instagram Flyer Generator
Uses OpenAI DALL-E 3 to generate 6 IG-ready flyers (1024x1024)
Run: python generate-flyers.py
Requires: pip install openai requests
Set your API key: set OPENAI_API_KEY=sk-...
"""

import os
import requests
from openai import OpenAI

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

OUTPUT_DIR = "flyers-output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── 6 Flyer Concepts for Tonight App ──────────────────────────────────────────

FLYERS = [
    {
        "filename": "flyer-1-discover.png",
        "concept": "Discovery / App Intro",
        "prompt": (
            "Instagram flyer for a nightlife app called 'Tonight'. "
            "Dark moody background showing a vibrant Southeast Asian cityscape at night with neon signs, "
            "bokeh lights, and a crowd silhouette. "
            "Bold white title text 'TONIGHT' at the top in large Bebas Neue style font. "
            "Subtitle text: 'Discover Events & Nightlife Across Southeast Asia'. "
            "Bottom tagline: 'Download Free — Available Now'. "
            "Color palette: deep navy #0a0b14, electric gold #f5c842, white. "
            "Clean modern design, luxury feel, 1:1 square format. "
            "No watermarks, no borders, professional social media quality."
        ),
    },
    {
        "filename": "flyer-2-events.png",
        "concept": "Event Discovery Feature",
        "prompt": (
            "Square Instagram flyer for 'Tonight App' — a nightlife event discovery app. "
            "Background: dramatic overhead shot of a packed nightclub or festival in Southeast Asia, "
            "colorful stage lighting, laser beams, crowd energy. "
            "Overlay: semi-transparent dark gradient from bottom. "
            "Main text in bold uppercase: 'FIND YOUR NIGHT'. "
            "Sub-text: 'Events. Clubs. Parties. All in one app.' "
            "Small pill badge at bottom: 'Tonight App — Southeast Asia'. "
            "Colors: neon purple, electric blue, white text. "
            "Professional IG post design, striking and bold."
        ),
    },
    {
        "filename": "flyer-3-clubs.png",
        "concept": "Club Scene / Atmosphere",
        "prompt": (
            "Luxury Instagram flyer for 'Tonight' nightlife app. "
            "Full bleed photo of an upscale rooftop bar or nightclub in a Southeast Asian city — "
            "Bangkok, Ho Chi Minh City, or Bali style — glowing city lights in background, "
            "well-dressed crowd, cocktails, neon ambient lighting. "
            "Text overlay: 'THE BEST CLUBS' in massive bold font at top. "
            "Below: 'Curated venues. Exclusive nights.' "
            "Bottom bar: 'Tonight — Book Your Table'. "
            "Color mood: deep blacks, warm gold highlights, white typography. "
            "Sleek, premium, aspirational aesthetic."
        ),
    },
    {
        "filename": "flyer-4-free-entry.png",
        "concept": "Free / No Cover Feature",
        "prompt": (
            "Eye-catching Instagram square flyer for 'Tonight App'. "
            "Background: energetic nightclub dance floor with colorful strobe lights, "
            "crowd having fun, Southeast Asian setting. "
            "Centered bold text: 'FREE ENTRY NIGHTS' in bright neon pink or green. "
            "Sub-text: 'Find free events near you every night of the week.' "
            "Small app badge: 'Download Tonight — It's Free'. "
            "Color palette: hot pink #ff3b5c, electric green #00d084, dark background. "
            "Vibrant, fun, social media-optimized design."
        ),
    },
    {
        "filename": "flyer-5-qr-scan.png",
        "concept": "Scan & Get In / QR Tickets",
        "prompt": (
            "Modern Instagram flyer for 'Tonight App' — nightlife ticketing feature. "
            "Split design: left half shows a stylized phone screen with a QR code glowing in neon, "
            "right half shows a nightclub entrance with velvet rope and city lights. "
            "Bold heading: 'SCAN IN. NO QUEUE.' "
            "Subtext: 'Get your digital pass. Walk straight in.' "
            "Footer: 'Tonight App — Southeast Asia Nightlife'. "
            "Dark background with electric blue and gold accents. "
            "Tech-forward, clean, premium feel."
        ),
    },
    {
        "filename": "flyer-6-download-cta.png",
        "concept": "Download CTA / Final Push",
        "prompt": (
            "High-impact Instagram call-to-action flyer for 'Tonight App'. "
            "Full dramatic nightlife background: festival crowd, fireworks or confetti above, "
            "stage lights, Southeast Asian city skyline silhouette. "
            "Large centered headline: 'YOUR NIGHT STARTS HERE' in massive white bold font. "
            "Below: 'Discover • Book • Experience'. "
            "Bottom section with dark overlay: 'Download Tonight App — Free' "
            "with App Store and Google Play badge icons implied. "
            "Color palette: deep navy, electric gold, white. "
            "Maximum visual impact, designed for Instagram feed posts."
        ),
    },
]

# ── Generate Each Flyer ────────────────────────────────────────────────────────

def generate_flyer(flyer: dict, index: int):
    print(f"\n[{index+1}/6] Generating: {flyer['concept']}...")
    print(f"       Output: {flyer['filename']}")

    response = client.images.generate(
        model="dall-e-3",
        prompt=flyer["prompt"],
        size="1024x1024",      # Square — perfect for IG feed
        quality="hd",          # HD quality
        style="vivid",         # Vivid = more dramatic, better for nightlife
        n=1,
    )

    image_url = response.data[0].url

    # Download and save the image
    img_data = requests.get(image_url, timeout=30).content
    output_path = os.path.join(OUTPUT_DIR, flyer["filename"])
    with open(output_path, "wb") as f:
        f.write(img_data)

    print(f"       Saved → {output_path}")
    return output_path


def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("\nERROR: OPENAI_API_KEY environment variable not set.")
        print("Run:  set OPENAI_API_KEY=sk-your-key-here")
        print("Get a key at: https://platform.openai.com/api-keys\n")
        return

    print("=" * 55)
    print("  Tonight App — Instagram Flyer Generator")
    print("  6 flyers × DALL-E 3 HD = ~$0.24 total cost")
    print("=" * 55)

    saved_files = []
    for i, flyer in enumerate(FLYERS):
        try:
            path = generate_flyer(flyer, i)
            saved_files.append(path)
        except Exception as e:
            print(f"  ERROR on flyer {i+1}: {e}")

    print("\n" + "=" * 55)
    print(f"  Done! {len(saved_files)}/6 flyers saved to ./{OUTPUT_DIR}/")
    print("=" * 55)
    for f in saved_files:
        print(f"  {f}")


if __name__ == "__main__":
    main()
