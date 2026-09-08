[English](README.en.md) · [Castellano](README.md)

# ático · Visual identity

Part of **Javier Armesto / Open Engineering Notebook**. This identity represents the connection between the standard Business Central MCP and Copilot Cowork.

## Visual idea

An open roof and its accent identify **ático**. Document sheets represent business context and the cyan line represents its connection with the work conversation. The artwork is an editorial metaphor, not a technical architecture diagram or a feature claim.

| Asset | Use |
|---|---|
| [atico-cover.en.png](atico-cover.en.png) / [atico-cover.png](atico-cover.png) | English/Spanish README covers; preserve the full image and margins. |
| [color.svg](color.svg) | Editable color symbol, 192 × 192 canvas. |
| [outline.svg](outline.svg) | Simplified white/transparent symbol, 32 × 32. |
| [Native icons](../native/appPackage/icons/) | PNG exports for the plugin package. |

| Color | Value | Meaning |
|---|---|---|
| Paper | `#F8F7F3` | Warm notebook background. |
| Ink | `#111827` | Main text and titles. |
| Navy | `#25235F` | Structure, symbol and package accent. |
| Cyan | `#25C8D8` | Connection and context flow. |
| Magenta | `#C02B84` | Human judgment and meaningful annotations. |

Use a fine grid, restrained editorial typography and monospaced metadata. Reserve magenta for a human observation; it is not decoration for the icon. Avoid gradients, robots, brains and glossy volume.

Edit SVG sources first, then export PNGs at their original dimensions. Color icons have an opaque background; outlines contain white and transparency only. Update the PNGs in `native/appPackage/icons/` in the same change and keep the manifest template accent color aligned with navy.

The Spanish cover was created with Open Engineering Visual Assets; the English version localizes its labels using the built-in image generator. Production brief: warm technical paper, open roof and context sheets, cyan connection, and a human-judgment annotation. The image does not describe the plugin's technical contract.

Icons are included when rebuilding the package. Preserve an installed app ID and increase its package version for updates. See [license and brand usage](BRAND-USAGE.md).

**Engineering systems, visibly reasoned.**
