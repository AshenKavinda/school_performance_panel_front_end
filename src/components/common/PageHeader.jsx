/**
 * PageHeader — consistent section header used at the top of every admin page.
 * Props:
 *   title      (string) — main heading
 *   subtitle   (string?) — smaller description line
 *   action     (ReactNode?) — optional button / CTA rendered on the right
 */
const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
    <div>
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

export default PageHeader;
