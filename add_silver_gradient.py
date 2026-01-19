#!/usr/bin/env python3
"""
Add a silver gradient overlay to the gold frame PNG with a blend mode
"""

from PIL import Image, ImageDraw, ImageEnhance, ImageChops
import numpy as np

def create_silver_gradient(width, height):
    """Create a silver gradient overlay with metallic shine"""
    # Create arrays for efficient numpy operations
    y_axis = np.arange(height)[:, np.newaxis]
    x_axis = np.arange(width)[np.newaxis, :]
    
    # Vertical gradient ratio (top to bottom)
    y_ratio = y_axis / height
    
    # Base silver gradient: from bright silver (240) to medium silver (160)
    base_value = 240 - (y_ratio * 80)
    
    # Add more pronounced horizontal wave variation for metallic shine
    x_wave = np.sin(x_axis / 40) * 20  # More pronounced wave pattern
    
    # Apply wave offset and create RGB channels (all same for gray/silver)
    r = np.clip(base_value + x_wave, 140, 255)
    g = np.clip(base_value + x_wave, 140, 255)
    b = np.clip(base_value + x_wave * 1.1, 140, 255)  # Slight blue tint
    
    # Stack channels and convert to uint8
    gradient_array = np.stack([r, g, b], axis=-1).astype(np.uint8)
    
    # Create image from array
    gradient = Image.fromarray(gradient_array, 'RGB')
    
    return gradient

def color_shift_to_silver(base, strength=0.75):
    """
    Directly shift colors towards silver by desaturating and shifting hue
    More aggressive version
    """
    if base.mode != 'RGBA':
        base = base.convert('RGBA')
    
    base_array = np.array(base, dtype=np.float32)
    
    # Extract RGB channels
    r = base_array[:, :, 0]
    g = base_array[:, :, 1]
    b = base_array[:, :, 2]
    a = base_array[:, :, 3]
    
    # Calculate luminance (gray value)
    # Standard formula: 0.299*R + 0.587*G + 0.114*B
    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    
    # Create silver tint - bright neutral gray with slight cool blue tint
    # Silver RGB values: around (192-220, 192-220, 200-230) for cool silver
    silver_r = luminance * 0.92  # Slightly desaturated
    silver_g = luminance * 0.92
    silver_b = luminance * 1.08  # More blue tint for cool silver
    
    # Blend original with silver tint - more aggressive
    result_r = r * (1 - strength) + silver_r * strength
    result_g = g * (1 - strength) + silver_b * strength
    result_b = b * (1 - strength) + silver_b * strength
    
    # Preserve alpha
    result_array = np.stack([result_r, result_g, result_b, a], axis=-1)
    result_array = np.clip(result_array, 0, 255).astype(np.uint8)
    
    result = Image.fromarray(result_array, 'RGBA')
    return result

def overlay_blend_mode(base, overlay, opacity=0.7):
    """
    Apply overlay blend mode - more aggressive than soft light
    """
    if base.mode != 'RGBA':
        base = base.convert('RGBA')
    if overlay.mode != 'RGBA':
        overlay = overlay.convert('RGBA')
    
    # Get pixel data as arrays
    base_array = np.array(base, dtype=np.float32) / 255.0
    overlay_array = np.array(overlay, dtype=np.float32) / 255.0
    
    # Overlay blend mode formula
    mask = base_array < 0.5
    result_array = np.zeros_like(base_array)
    
    result_array[mask] = 2 * base_array[mask] * overlay_array[mask]
    result_array[~mask] = 1 - 2 * (1 - base_array[~mask]) * (1 - overlay_array[~mask])
    
    # Blend with opacity
    result_array = base_array * (1 - opacity) + result_array * opacity
    
    # Preserve alpha channel
    result_array[:, :, 3] = base_array[:, :, 3]
    
    # Convert back to 0-255 range and to Image
    result_array = np.clip(result_array, 0, 1)
    result_array = (result_array * 255).astype(np.uint8)
    result = Image.fromarray(result_array, 'RGBA')
    
    return result

def main():
    input_path = './assets/rectangle-vintage-gold-frame-horizontal-border-oriental-style-png.png'
    output_path = './assets/rectangle-vintage-gold-frame-horizontal-border-oriental-style-png.png'
    
    print(f"Loading image from {input_path}...")
    base_image = Image.open(input_path).convert('RGBA')
    
    width, height = base_image.size
    print(f"Image size: {width} x {height}")
    
    # Method 1: Direct color shift (most effective for silver effect)
    print("Applying direct color shift to silver (strength: 0.75)...")
    result = color_shift_to_silver(base_image, strength=0.75)
    
    # Method 2: Also apply silver gradient overlay for extra metallic effect
    print("Adding silver gradient overlay (opacity: 0.6)...")
    silver_gradient = create_silver_gradient(width, height)
    result = overlay_blend_mode(result, silver_gradient, opacity=0.6)
    
    # Save the result
    print(f"Saving result to {output_path}...")
    result.save(output_path, 'PNG', optimize=True)
    print("\n✅ Done! Silver effect applied successfully.")
    print("\n📝 Note: If you don't see changes in your browser:")
    print("   1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)")
    print("   2. Clear browser cache")
    print("   3. Check the image file directly in an image viewer")
    print("\n🔧 To adjust the effect strength, modify:")
    print("   - color_shift_to_silver strength (currently 0.75, range 0-1)")
    print("   - overlay_blend_mode opacity (currently 0.6, range 0-1)")

if __name__ == '__main__':
    main()
