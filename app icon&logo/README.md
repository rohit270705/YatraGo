# YatraGo App Icon Package

Generated from your final icon (Y/G monogram with road, bus, car, bike).
Background removed, full Android + Windows size sets generated, adaptive
icon safe-zone verified.

## What's inside

### android/legacy/
Drop these `mipmap-*` folders directly into `app/src/main/res/` in your
Android project, replacing the existing `ic_launcher.png` and
`ic_launcher_round.png` files of the same name. Covers mdpi through
xxxhdpi (48px-192px).

### android/adaptive_foreground/ + android/adaptive_background/
For modern Android (API 26+) adaptive icons. The foreground layer has been
scaled and centered so it survives being clipped into a circle, squircle,
or rounded square by different phone manufacturers' launchers — this was
checked and corrected (initial pass had the Y's tip and the ribbon edge
sitting outside the safe zone and at risk of being clipped on some
devices). Background layer is solid white. Reference both in your
`ic_launcher.xml` adaptive icon definition:

```xml
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

### android/play_store/
512x512, flattened onto white (Play Console doesn't accept transparency
for the store listing icon). Upload this in Play Console under
Store presence > Main store listing > App icon.

### windows/app_icon.ico
Single multi-resolution .ico file (embeds 16/24/32/48/64/128/256px in one
file, the standard Windows format). Set this as your app's icon in your
project's executable/manifest settings.

### windows/msix_assets/
If you're packaging via MSIX/UWP for Microsoft Store distribution, these
match the standard required logo slots (Square44x44, Square150x150, etc).
Reference them in your `Package.appxmanifest`.

### universal/
Plain PNGs at common sizes (16 to 1024px) plus the full-resolution
transparent master (1254x1254). Useful for splash screens, README headers,
website favicons, or anywhere outside the Android/Windows packaging
pipelines above.

## Known limitation — read before shipping

At the smallest real-world Android sizes (48px on mdpi devices, and the
44px Windows taskbar size), the bus/car/bike detail on the road
essentially disappears into a small gray blur. The Y, G, and road shape
remain clearly legible at every size, but the vehicle illustrations
that distinguish this design only read clearly from roughly 96px and up.

This means: Play Store listing, splash screen, and marketing materials
will show the full detailed design correctly. The actual home-screen
launcher icon on many phones will effectively read as "Y road G" with
the vehicles barely visible.

This is a property of the source artwork's detail level versus how small
launcher icons render, not a flaw introduced in this pipeline. If this
matters to you, the practical fix is commissioning a simplified
launcher-only variant (same Y/G/road, no vehicle silhouettes) used solely
for the small Android legacy + adaptive sizes, while this full version
stays in use everywhere else (Play Store, splash, web, marketing).
