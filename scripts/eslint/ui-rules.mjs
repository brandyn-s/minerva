/** UI ownership is enforced in feature code, not just documented. */
const raw = new Set(["button", "input", "textarea", "select", "summary", "svg"]);
const paint = /^(font|fontSize|fontFamily|fontWeight|color|background|backgroundColor|border|borderRadius|padding|boxShadow|strokeWidth)$/;
export const uiRules = {
  rules: {
    "shared-controls": {
      meta: { type: "problem", schema: [], messages: { raw: "Use the shared UI component for <{{name}}>.", icon: "Import functional icons from components/ui/icons.", css: "Feature styles belong in the layout layer; do not import new per-feature stylesheets.", style: "Control appearance belongs in components/ui; use a variant instead of {{name}}." } },
      create(context) {
        return {
          ImportDeclaration(node) { if (String(node.source.value).endsWith(".css") && node.source.value !== "@xyflow/react/dist/style.css" && !context.filename.endsWith("/app/layout.tsx")) context.report({node,messageId:"css"}); if (["lucide-react", "@phosphor-icons/react"].includes(node.source.value)) context.report({node, messageId:"icon"}); },
          JSXOpeningElement(node) {
            const name = node.name.name;
            if (raw.has(name)) context.report({node, messageId:"raw", data:{name}});
            if (!["Button", "IconButton", "Summary", "Input", "Textarea", "Select", "MenuItem"].includes(name)) return;
            for (const attr of node.attributes) {
              if (attr.name?.name !== "style" || attr.value?.expression?.type !== "ObjectExpression") continue;
              for (const property of attr.value.expression.properties) {
                const key = property.key?.name ?? property.key?.value;
                if (paint.test(key ?? "")) context.report({node:property, messageId:"style", data:{name:key}});
              }
            }
          },
        };
      },
    },
  },
};
