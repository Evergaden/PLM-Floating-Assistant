# Development feature permissions (2.10.75)

Home shortcuts for review, copywriting, ingredient facts and pricing open the existing development task workspace: product list on the left, selected tool on the right. They do not require a SKU selected in design mode. Switching products preserves the selected tool.

The admin user table has three independent switches: infringement review, copywriting and ingredient facts. All default to off. Grants use the authenticated PLM user's signed identity; the product name and client-supplied userName are not authorization evidence. The Worker checks each generation request, including partial copywriting updates. Full one-shot generation requires both ingredient and copywriting access. Existing permissions and saved data remain compatible.

The heartbeat refreshes grants. Refresh the PLM page after changing a user's permissions. Locked shortcuts and tabs remain clickable and open the same Paimon dialog: “前面的区域，以后再来探索吧”. The illustration is embedded as WebP so it needs no external image request.

Browser verification is reserved for the user after updating the installed script: test a user with no grants, each independent grant, product switching within each tool, ingredient template loading, and dialog dismissal with the button and Escape.

## Illustration

Built-in imagegen generated the illustration; the project copy is `assets/permission-paimon.webp`. The embedded script copy is `src/product-development/pd-permission-art.module.js`.

Prompt:

> Create a small polished chibi anime illustration of Paimon from Genshin Impact for a friendly permission-locked dialog in a productivity app. Recognizable white bob hair, peach-pink halo crown floating above her head, navy star cape and white outfit with peach details. Full body floating, one hand raised gently gesturing to stop, friendly playful expression as if saying let's explore later. Crisp expressive anime sticker style, soft shading, clear silhouette, centered isolated single character. No lettering, no text, no background. Transparent background. Square composition with generous transparent margin. Intended display about 160px tall.
