const fs = require('node:fs');
const path = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const lucide = require('lucide-react');

const icons = {
  overview: 'LayoutDashboard', notifications: 'Bell', tips: 'Lightbulb',
  greetings: 'Sun', users: 'Users', brand: 'ShieldCheck', features: 'BookOpen',
  holidays: 'CalendarDays', feedback: 'MessageSquare', diagnostics: 'TriangleAlert',
  publish: 'Send', backup: 'CloudUpload',
};
const rendered = Object.fromEntries(Object.entries(icons).map(([name, component]) => {
  if (!lucide[component]) throw new Error('Unknown Lucide icon: ' + component);
  return [name, renderToStaticMarkup(React.createElement(lucide[component], {
    className: 'admin-lucide-icon', size: '1em', strokeWidth: 1.8,
    'aria-hidden': 'true', focusable: 'false',
  }))];
}));
const output = '// Generated from lucide-react by scripts/build-admin-icons.cjs. Do not edit SVG paths.\n'
  + 'export const ADMIN_ICONS = Object.freeze(' + JSON.stringify(rendered, null, 2) + ');\n';
const target = path.resolve(__dirname, '..', 'src', 'generated-admin-icons.js');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== output) throw new Error('Admin icons are stale. Run npm run admin:build.');
} else fs.writeFileSync(target, output);
console.log('Verified Lucide admin icons: ' + Object.keys(icons).length);
