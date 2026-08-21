import React, { useEffect, useMemo, useState } from "react";

type Props = { content?: string };

declare global {
  interface Window {
    katex?: any;
    markdownit?: any;
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(s);
  });
}

function loadCss(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = href;
  document.head.appendChild(l);
}

export default function MarkdownMath({ content }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // load KaTeX and markdown-it from CDN
    loadCss("https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css");
    Promise.all([
      loadScript("https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"),
      loadScript("https://cdn.jsdelivr.net/npm/markdown-it@13.0.1/dist/markdown-it.min.js"),
    ])
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, []);

  const html = useMemo(() => {
    const md = window.markdownit ? window.markdownit({ html: true }) : null;
    const raw = content ?? "";

    // First render markdown to HTML (if available)
    let rendered = md ? md.render(raw) : raw.replace(/\n/g, "<br />");

    // Replace LaTeX blocks: $$...$$ and inline $...$
    // Use a simple regex pass and let KaTeX render if available
    if (window.katex) {
      // block math
      rendered = rendered.replace(/\$\$([\s\S]+?)\$\$/g, (_m: string, tex: string) => {
        try {
          return window.katex.renderToString(tex, { displayMode: true });
        } catch (e) {
          return `<code>${tex}</code>`;
        }
      });
      // inline math
      rendered = rendered.replace(/\$([^\$]+?)\$/g, (_m: string, tex: string) => {
        try {
          return window.katex.renderToString(tex, { displayMode: false });
        } catch (e) {
          return `<code>${tex}</code>`;
        }
      });
    } else {
      // not ready: leave delimiters but wrap in code to avoid breaking
      rendered = rendered.replace(/\$\$([\s\S]+?)\$\$/g, (_m: string, tex: string) => `<pre>${tex}</pre>`);
      rendered = rendered.replace(/\$([^\$]+?)\$/g, (_m: string, tex: string) => `<code>${tex}</code>`);
    }

    return rendered;
  }, [content, ready]);

  return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
}
